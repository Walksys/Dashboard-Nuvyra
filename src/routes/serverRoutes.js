const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2, 15) };
const config = require('../config/config');
const { query } = require('../database/db');
const { authenticate, requireAdmin, requireServerAccess } = require('../middleware/auth');
const runnerService = require('../services/runnerService');
const mcjarsService = require('../services/mcjarsService');
const dockerService = require('../services/dockerService');
const { logActivity } = require('../services/activityService');
const imagesConfig = require('../config/images');

// List Servers
router.get('/', authenticate, async (req, res) => {
  try {
    let servers = [];
    if (req.user.role === 'admin') {
      servers = await query.all(`
        SELECT s.*, u.username as owner_username, u.email as owner_email,
               a.ip, a.port, n.name as node_name
        FROM servers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN allocations a ON s.allocation_id = a.id
        LEFT JOIN nodes n ON s.node_id = n.id
        ORDER BY s.id DESC
      `);
    } else {
      // User's own servers + subuser servers
      servers = await query.all(`
        SELECT s.*, u.username as owner_username, u.email as owner_email,
               a.ip, a.port, n.name as node_name,
               sub.permissions as subuser_permissions
        FROM servers s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN allocations a ON s.allocation_id = a.id
        LEFT JOIN nodes n ON s.node_id = n.id
        LEFT JOIN subusers sub ON (sub.server_id = s.id AND sub.user_id = ?)
        WHERE s.user_id = ? OR sub.id IS NOT NULL
        ORDER BY s.id DESC
      `, [req.user.id, req.user.id]);
    }

    // Attach runtime live status to servers
    const enriched = servers.map(s => {
      const isRunning = runnerService.isServerRunning(s.id);
      return {
        ...s,
        status: isRunning ? (s.status === 'starting' ? 'starting' : 'running') : 'offline'
      };
    });

    res.json({ success: true, servers: enriched });
  } catch (err) {
    console.error('List servers error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve servers.' });
  }
});

// Create Server
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      description,
      server_type,
      docker_image,
      startup_cmd,
      memory_mb,
      cpu_limit,
      disk_mb,
      user_id,
      node_id,
      allocation_id,
      env_vars,
      mc_jar_type,
      mc_jar_version
    } = req.body;

    if (!name || !server_type) {
      return res.status(400).json({ success: false, error: 'Server name and server type are required.' });
    }

    const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : req.user.id;
    const targetNodeId = node_id || 1;

    // Pick or allocate port
    let allocId = allocation_id;
    if (!allocId) {
      const freeAlloc = await query.get('SELECT id FROM allocations WHERE assigned = 0 AND node_id = ? LIMIT 1', [targetNodeId]);
      if (freeAlloc) {
        allocId = freeAlloc.id;
      }
    }

    // Determine default image & command if not provided
    let defaultImg = docker_image;
    let defaultCmd = startup_cmd;

    if (server_type === 'minecraft') {
      if (!defaultImg && mc_jar_version) {
        defaultImg = mcjarsService.getRecommendedJavaImage(mc_jar_version);
      }
      defaultImg = defaultImg || imagesConfig.minecraft[1].value; // Java 21
      defaultCmd = defaultCmd || 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui';
    } else if (server_type === 'nodejs') {
      defaultImg = defaultImg || imagesConfig.nodejs[5].value; // Node 20
      defaultCmd = defaultCmd || 'if [ -f package.json ]; then npm install; fi; npm start';
    } else if (server_type === 'python') {
      defaultImg = defaultImg || imagesConfig.python[1].value; // Python 3.12
      defaultCmd = defaultCmd || 'if [ -f requirements.txt ]; then pip install -r requirements.txt; fi; python3 app.py';
    }

    const serverUuid = uuidv4();

    const insertResult = await query.run(`
      INSERT INTO servers (
        uuid, name, description, user_id, node_id, allocation_id,
        server_type, docker_image, startup_cmd, memory_mb, cpu_limit,
        disk_mb, status, env_vars, jar_type, jar_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'offline', ?, ?, ?)
    `, [
      serverUuid,
      name,
      description || '',
      targetUserId,
      targetNodeId,
      allocId || null,
      server_type,
      defaultImg,
      defaultCmd,
      parseInt(memory_mb || 1024, 10),
      parseInt(cpu_limit || 100, 10),
      parseInt(disk_mb || 5120, 10),
      typeof env_vars === 'object' ? JSON.stringify(env_vars) : (env_vars || '{}'),
      mc_jar_type || null,
      mc_jar_version || null
    ]);

    const newServerId = insertResult.lastID;

    // Mark allocation as assigned and determine assigned port
    let assignedPort = 25565;
    if (allocId) {
      await query.run('UPDATE allocations SET server_id = ?, assigned = 1 WHERE id = ?', [newServerId, allocId]);
      try {
        const allocRow = await query.get('SELECT port FROM allocations WHERE id = ?', [allocId]);
        if (allocRow && allocRow.port) {
          assignedPort = allocRow.port;
        }
      } catch (e) {}
    }

    // Initialize server directory on disk: ./mpanel/servers/server<id>
    const serverDir = path.join(config.SERVERS_DIR, `server${newServerId}`);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    // Seed default template files based on server type
    if (server_type === 'minecraft') {
      runnerService.syncMinecraftProperties(serverDir, assignedPort);
      
      // Auto-install jar if specified
      if (mc_jar_type && mc_jar_version) {
        mcjarsService.installJarToServer(newServerId, mc_jar_type, mc_jar_version).catch(e => console.warn('Async jar install warning:', e.message));
      }
    } else if (server_type === 'nodejs') {
      const samplePkg = {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        main: 'index.js',
        scripts: { start: 'node index.js' },
        dependencies: { express: '^4.21.2' }
      };
      fs.writeFileSync(path.join(serverDir, 'package.json'), JSON.stringify(samplePkg, null, 2), 'utf8');
      fs.writeFileSync(path.join(serverDir, 'index.js'), `// Mpanel Node.js Application\nconst http = require('http');\nconst port = process.env.PORT || 3000;\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('Hello from Mpanel Node.js Server! Port: ' + port);\n});\n\nserver.listen(port, () => {\n  console.log('App running on port ' + port);\n});\n`, 'utf8');
    } else if (server_type === 'python') {
      fs.writeFileSync(path.join(serverDir, 'requirements.txt'), '# Add your Python dependencies here\nflask\n', 'utf8');
      fs.writeFileSync(path.join(serverDir, 'app.py'), `# Mpanel Python Application\nimport os\nfrom http.server import HTTPServer, BaseHTTPRequestHandler\n\nport = int(os.environ.get('PORT', 5000))\n\nclass Handler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        self.send_response(200)\n        self.send_header('Content-type', 'text/plain')\n        self.end_headers()\n        self.wfile.write(b'Hello from Mpanel Python App!')\n\nprint(f"Starting Python server on port {port}...")\nhttpd = HTTPServer(('0.0.0.0', port), Handler)\nhttpd.serve_forever()\n`, 'utf8');
    }

    logActivity(req.user.id, newServerId, 'SERVER_CREATE', `Created server ${name} (${server_type})`, req);

    res.json({
      success: true,
      serverId: newServerId,
      uuid: serverUuid,
      message: 'Server created successfully!'
    });
  } catch (err) {
    console.error('Server creation error:', err);
    res.status(500).json({ success: false, error: `Failed to create server: ${err.message}` });
  }
});

// Get Server Details
router.get('/:id', authenticate, requireServerAccess('view'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = await query.get(`
      SELECT s.*, u.username as owner_username, u.email as owner_email,
             a.ip, a.port, n.name as node_name, n.fqdn as node_fqdn,
             n.sftp_port
      FROM servers s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN allocations a ON s.allocation_id = a.id
      LEFT JOIN nodes n ON s.node_id = n.id
      WHERE s.id = ?
    `, [serverId]);

    if (!server) {
      return res.status(404).json({ success: false, error: 'Server not found.' });
    }

    server.status = runnerService.isServerRunning(server.id) ? (server.status === 'starting' ? 'starting' : 'running') : 'offline';
    server.is_running = runnerService.isServerRunning(server.id);
    server.sftp_username = `${req.user.username}.${server.id}`;
    server.sftp_host = server.node_fqdn || '127.0.0.1';
    server.sftp_port = server.sftp_port || config.PORT_SFTP;

    res.json({
      success: true,
      server,
      permissions: req.permissions,
      isOwner: req.isOwner
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve server details.' });
  }
});

// Update Server (Details, Build Configuration, Startup)
router.put('/:id', authenticate, requireServerAccess('settings.edit'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const {
      name,
      description,
      docker_image,
      startup_cmd,
      memory_mb,
      cpu_limit,
      disk_mb,
      allocation_id,
      user_id,
      env_vars
    } = req.body;

    const current = req.server;

    // If changing user or build resources, require admin
    const isAdmin = req.user.role === 'admin';
    const targetUserId = (isAdmin && user_id) ? user_id : current.user_id;
    const newMemory = (isAdmin && memory_mb) ? parseInt(memory_mb, 10) : current.memory_mb;
    const newCpu = (isAdmin && cpu_limit) ? parseInt(cpu_limit, 10) : current.cpu_limit;
    const newDisk = (isAdmin && disk_mb) ? parseInt(disk_mb, 10) : current.disk_mb;

    let newAllocId = current.allocation_id;
    if (isAdmin && allocation_id && allocation_id !== current.allocation_id) {
      // Release old allocation
      if (current.allocation_id) {
        await query.run('UPDATE allocations SET server_id = NULL, assigned = 0 WHERE id = ?', [current.allocation_id]);
      }
      // Assign new allocation
      await query.run('UPDATE allocations SET server_id = ?, assigned = 1 WHERE id = ?', [serverId, allocation_id]);
      newAllocId = allocation_id;

      // Immediately sync server.properties if Minecraft
      try {
        const allocRow = await query.get('SELECT port FROM allocations WHERE id = ?', [allocation_id]);
        if (allocRow && allocRow.port) {
          const sDir = path.join(config.SERVERS_DIR, `server${serverId}`);
          runnerService.syncMinecraftProperties(sDir, allocRow.port);
        }
      } catch (e) {}
    }

    await query.run(`
      UPDATE servers SET
        name = ?,
        description = ?,
        docker_image = ?,
        startup_cmd = ?,
        memory_mb = ?,
        cpu_limit = ?,
        disk_mb = ?,
        user_id = ?,
        allocation_id = ?,
        env_vars = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || current.name,
      description !== undefined ? description : current.description,
      docker_image || current.docker_image,
      startup_cmd || current.startup_cmd,
      newMemory,
      newCpu,
      newDisk,
      targetUserId,
      newAllocId,
      env_vars ? (typeof env_vars === 'object' ? JSON.stringify(env_vars) : env_vars) : current.env_vars,
      serverId
    ]);

    logActivity(req.user.id, serverId, 'SERVER_UPDATE', 'Updated server settings/build configuration', req);

    res.json({ success: true, message: 'Server updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update server.' });
  }
});

// Power Action (Start, Stop, Restart, Kill)
router.post('/:id/power', authenticate, requireServerAccess('power.control'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const { action } = req.body;

    if (!['start', 'stop', 'restart', 'kill'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid power action.' });
    }

    let result;
    if (action === 'start') {
      result = await runnerService.startServer(serverId);
    } else if (action === 'stop') {
      result = await runnerService.stopServer(serverId);
    } else if (action === 'restart') {
      result = await runnerService.restartServer(serverId);
    } else if (action === 'kill') {
      result = await runnerService.killServer(serverId);
    }

    logActivity(req.user.id, serverId, `SERVER_${action.toUpperCase()}`, `Triggered ${action}`, req);

    res.json({ success: true, action, result });
  } catch (err) {
    console.error('Power action error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Console Command
router.post('/:id/command', authenticate, requireServerAccess('console.write'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command string is required.' });
    }

    runnerService.sendCommand(serverId, command);
    logActivity(req.user.id, serverId, 'SERVER_COMMAND', command, req);

    res.json({ success: true, message: 'Command sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reinstall Server
router.post('/:id/reinstall', authenticate, requireServerAccess('settings.edit'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = req.server;

    // Stop server if running
    if (runnerService.isServerRunning(serverId)) {
      await runnerService.stopServer(serverId);
    }

    if (server.server_type === 'minecraft' && server.jar_type && server.jar_version) {
      await mcjarsService.installJarToServer(serverId, server.jar_type, server.jar_version);
    }

    logActivity(req.user.id, serverId, 'SERVER_REINSTALL', 'Reinstalled server base files', req);

    res.json({ success: true, message: 'Server reinstalled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change Server Minecraft Version & Engine
router.post('/:id/change-version', authenticate, requireServerAccess('settings.edit'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = req.server;
    const { jar_type, jar_version, jar_build, docker_image, delete_old_files } = req.body;

    if (!jar_type || !jar_version) {
      return res.status(400).json({ success: false, error: 'Jar software type and version are required.' });
    }

    // Determine target docker image if not supplied
    let targetImage = docker_image;
    if (!targetImage) {
      targetImage = mcjarsService.getRecommendedJavaImage(jar_version);
    }

    // Stop server if running
    const wasRunning = runnerService.isServerRunning(serverId);
    if (wasRunning) {
      await runnerService.stopServer(serverId);
    }

    const serverDir = path.join(config.SERVERS_DIR, `server${serverId}`);

    // If requested, clean up old jar and build caches to prevent conflicts between engines
    if (delete_old_files && fs.existsSync(serverDir)) {
      try {
        const oldJar = path.join(serverDir, 'server.jar');
        if (fs.existsSync(oldJar)) fs.unlinkSync(oldJar);

        // Remove paper/purpur cache folders if present
        const cacheFolders = ['.paper-remapped', 'cache', 'bundler', '.fabric', '.forge'];
        for (const cf of cacheFolders) {
          const cPath = path.join(serverDir, cf);
          if (fs.existsSync(cPath)) {
            fs.rmSync(cPath, { recursive: true, force: true });
          }
        }
      } catch (cleanErr) {
        console.warn('Notice: Error cleaning old cache files during version change:', cleanErr.message);
      }
    }

    // Download and install new jar
    const installResult = await mcjarsService.installJarToServer(serverId, jar_type, jar_version, jar_build || 'latest');

    // Update database record with new jar_type, jar_version, jar_build, and docker_image
    await query.run(
      `UPDATE servers 
       SET jar_type = ?, jar_version = ?, jar_build = ?, docker_image = COALESCE(?, docker_image), updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [jar_type, jar_version, jar_build || 'latest', targetImage, serverId]
    );

    logActivity(req.user.id, serverId, 'SERVER_VERSION_CHANGE', `Changed server software to ${jar_type} ${jar_version} (${targetImage})`, req);

    res.json({
      success: true,
      message: `Successfully switched server to ${jar_type} ${jar_version}!`,
      details: {
        jar_type,
        jar_version,
        docker_image: targetImage,
        wasRunning,
        installResult
      }
    });
  } catch (err) {
    console.error('Change version error:', err);
    res.status(500).json({ success: false, error: `Failed to change server version: ${err.message}` });
  }
});

// Delete Server
router.delete('/:id', authenticate, requireServerAccess('settings.delete'), async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = req.server;

    // Stop server
    if (runnerService.isServerRunning(serverId)) {
      await runnerService.killServer(serverId);
    }

    // Clean up Docker container if available
    if (dockerService.isAvailable) {
      await dockerService.removeContainer(serverId, server.uuid);
    }

    // Release allocation
    if (server.allocation_id) {
      await query.run('UPDATE allocations SET server_id = NULL, assigned = 0 WHERE id = ?', [server.allocation_id]);
    }

    // Remove server files on disk
    const serverDir = path.join(config.SERVERS_DIR, `server${serverId}`);
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }

    // Delete DB record (cascades subusers, backups, schedules)
    await query.run('DELETE FROM servers WHERE id = ?', [serverId]);

    logActivity(req.user.id, serverId, 'SERVER_DELETE', `Deleted server ${server.name}`, req);

    res.json({ success: true, message: 'Server deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete server.' });
  }
});

module.exports = router;

