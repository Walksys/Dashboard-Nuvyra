const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');
const config = require('../config/config');

const os = require('os');

function getNodeLiveStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const cpus = os.cpus();
  let totalTick = 0;
  let idleTick = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    idleTick += cpu.times.idle;
  });
  const cpuPercent = Math.min(100, Math.max(2, Math.round((1 - idleTick / totalTick) * 100)));
  const loadAvg = os.loadavg();

  return {
    cpu_percent: cpuPercent,
    load_avg: loadAvg[0].toFixed(2),
    ram_used_mb: Math.round(usedMem / (1024 * 1024)),
    ram_total_mb: Math.round(totalMem / (1024 * 1024)),
    ram_percent: memPercent,
    uptime_hours: (os.uptime() / 3600).toFixed(1),
    cores: cpus.length,
    status: cpuPercent > 90 || memPercent > 90 ? 'warning' : 'optimal'
  };
}

// List Nodes (with Node Usage Status v1.0.2 metrics)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const nodes = await query.all(`
      SELECT n.*, l.name as location_name, l.short_code as location_code,
             COUNT(DISTINCT s.id) as server_count,
             COUNT(DISTINCT a.id) as total_allocations,
             SUM(CASE WHEN a.assigned = 1 THEN 1 ELSE 0 END) as assigned_allocations
      FROM nodes n
      LEFT JOIN locations l ON n.location_id = l.id
      LEFT JOIN servers s ON s.node_id = n.id
      LEFT JOIN allocations a ON a.node_id = n.id
      GROUP BY n.id
      ORDER BY n.id ASC
    `);

    const liveStats = getNodeLiveStats();
    const enrichedNodes = nodes.map(n => ({
      ...n,
      usage: liveStats
    }));

    res.json({ success: true, nodes: enrichedNodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Node Usage Status Endpoint
router.get('/:id/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const liveStats = getNodeLiveStats();
    res.json({ success: true, stats: liveStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Node
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, fqdn, daemon_port, sftp_port, memory_mb, disk_mb, location_id } = req.body;
    if (!name || !fqdn) {
      return res.status(400).json({ success: false, error: 'Node name and FQDN/IP are required.' });
    }

    const result = await query.run(`
      INSERT INTO nodes (name, fqdn, daemon_port, sftp_port, memory_mb, disk_mb, location_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      fqdn,
      parseInt(daemon_port || config.PORT_API, 10),
      parseInt(sftp_port || config.PORT_SFTP, 10),
      parseInt(memory_mb || 16384, 10),
      parseInt(disk_mb || 102400, 10),
      location_id || null
    ]);

    logActivity(req.user.id, null, 'NODE_CREATE', `Created node: ${name}`, req);

    res.json({ success: true, nodeId: result.lastID, message: 'Node created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Node Details
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const node = await query.get(`
      SELECT n.*, l.name as location_name
      FROM nodes n
      LEFT JOIN locations l ON n.location_id = l.id
      WHERE n.id = ?
    `, [req.params.id]);

    if (!node) return res.status(404).json({ success: false, error: 'Node not found.' });

    const allocations = await query.all('SELECT * FROM allocations WHERE node_id = ? ORDER BY port ASC', [req.params.id]);
    const servers = await query.all('SELECT id, name, server_type, status, memory_mb FROM servers WHERE node_id = ?', [req.params.id]);

    res.json({ success: true, node, allocations, servers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Node
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const nodeId = req.params.id;
    const { name, fqdn, daemon_port, sftp_port, memory_mb, disk_mb, location_id } = req.body;

    await query.run(`
      UPDATE nodes SET
        name = ?,
        fqdn = ?,
        daemon_port = ?,
        sftp_port = ?,
        memory_mb = ?,
        disk_mb = ?,
        location_id = ?
      WHERE id = ?
    `, [name, fqdn, daemon_port, sftp_port, memory_mb, disk_mb, location_id, nodeId]);

    logActivity(req.user.id, null, 'NODE_UPDATE', `Updated node ID: ${nodeId}`, req);

    res.json({ success: true, message: 'Node updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Node
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const nodeId = req.params.id;
    const serverCount = await query.get('SELECT COUNT(id) as count FROM servers WHERE node_id = ?', [nodeId]);
    if (serverCount && serverCount.count > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete node with active servers. Reassign or delete servers first.' });
    }

    await query.run('DELETE FROM nodes WHERE id = ?', [nodeId]);
    logActivity(req.user.id, null, 'NODE_DELETE', `Deleted node ID: ${nodeId}`, req);

    res.json({ success: true, message: 'Node deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Allocations: Add single or range of ports
router.post('/:id/allocations', authenticate, requireAdmin, async (req, res) => {
  try {
    const nodeId = req.params.id;
    const { ip, ports, startPort, endPort } = req.body;
    const targetIp = ip || '127.0.0.1';

    let portsToAdd = [];
    if (startPort && endPort) {
      const start = parseInt(startPort, 10);
      const end = parseInt(endPort, 10);
      for (let p = start; p <= end; p++) {
        portsToAdd.push(p);
      }
    } else if (ports) {
      if (Array.isArray(ports)) {
        portsToAdd = ports.map(p => parseInt(p, 10));
      } else {
        portsToAdd = ports.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
      }
    }

    if (portsToAdd.length === 0) {
      return res.status(400).json({ success: false, error: 'Please specify port range or comma-separated ports.' });
    }

    let addedCount = 0;
    for (const p of portsToAdd) {
      const existing = await query.get('SELECT id FROM allocations WHERE node_id = ? AND ip = ? AND port = ?', [nodeId, targetIp, p]);
      if (!existing) {
        await query.run('INSERT INTO allocations (node_id, ip, port, assigned) VALUES (?, ?, ?, 0)', [nodeId, targetIp, p]);
        addedCount++;
      }
    }

    logActivity(req.user.id, null, 'ALLOCATION_CREATE', `Added ${addedCount} port allocations to node ${nodeId}`, req);

    res.json({ success: true, message: `Successfully added ${addedCount} port allocations.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Allocations: Delete allocation
router.delete('/:id/allocations/:allocId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id, allocId } = req.params;
    const alloc = await query.get('SELECT * FROM allocations WHERE id = ? AND node_id = ?', [allocId, id]);
    if (!alloc) return res.status(404).json({ success: false, error: 'Allocation not found.' });

    if (alloc.assigned) {
      return res.status(400).json({ success: false, error: 'Cannot delete an assigned port allocation. Unassign from server first.' });
    }

    await query.run('DELETE FROM allocations WHERE id = ?', [allocId]);
    res.json({ success: true, message: 'Port allocation deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

