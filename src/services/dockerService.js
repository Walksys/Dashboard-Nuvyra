const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class DockerService {
  constructor() {
    this.docker = null;
    this.isAvailable = false;
    this.init();
  }

  async init() {
    try {
      // Connect to default local docker socket
      const socketPath = process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
      if (process.platform !== 'win32' && !fs.existsSync(socketPath)) {
        console.log('ℹ️ Docker socket not found at /var/run/docker.sock. Running in process runner mode.');
        this.isAvailable = false;
        return;
      }

      this.docker = new Docker({ socketPath });
      await this.docker.ping();
      this.isAvailable = true;
      console.log('🐳 Docker service connected successfully.');
    } catch (err) {
      console.log('ℹ️ Docker unavailable:', err.message, '- Falling back to native process runner.');
      this.isAvailable = false;
    }
  }

  async pullImageIfNeeded(imageName) {
    if (!this.isAvailable || !this.docker) return;
    try {
      const images = await this.docker.listImages();
      const exists = images.some(img => img.RepoTags && img.RepoTags.includes(imageName));
      if (!exists) {
        console.log(`🐳 Pulling Docker image: ${imageName}...`);
        await new Promise((resolve, reject) => {
          this.docker.pull(imageName, (err, stream) => {
            if (err) return reject(err);
            this.docker.modem.followProgress(stream, onFinished, onProgress);
            function onFinished(err, output) {
              if (err) return reject(err);
              resolve(output);
            }
            function onProgress(event) {}
          });
        });
        console.log(`🐳 Successfully pulled ${imageName}`);
      }
    } catch (err) {
      console.warn(`Docker pull failed for ${imageName}:`, err.message);
    }
  }

  async createOrStartContainer(server, port, startupCmd, onDataCallback) {
    if (!this.isAvailable) {
      throw new Error('Docker is not available on this host.');
    }

    const serverDir = path.join(config.SERVERS_DIR, `server${server.id}`);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    const containerName = `mpanel-server-${server.id}-${server.uuid.substring(0, 8)}`;
    
    // Check if container already exists
    try {
      const existingContainer = this.docker.getContainer(containerName);
      const data = await existingContainer.inspect();
      if (data.State && data.State.Running) {
        return existingContainer;
      }
      // Clean up stopped container so it's recreated with fresh ports, environment, and image
      try {
        await existingContainer.remove({ force: true });
      } catch (e) {}
    } catch (err) {
      // Container doesn't exist yet, continue to create
    }

    // Pull image if not local
    await this.pullImageIfNeeded(server.docker_image);

    // Check if this is a VM / LumenVM server
    const isVmServer = server.server_type === 'lumenvm' || 
                       server.server_type === 'vm' || 
                       (server.docker_image && (server.docker_image.includes('aerovm') || server.docker_image.includes('lumenvm')));

    const hostBinds = [`${serverDir}:/home/container:rw`];

    // Check for KVM acceleration
    const devices = [];
    if (fs.existsSync('/dev/kvm')) {
      devices.push({
        PathOnHost: '/dev/kvm',
        PathInContainer: '/dev/kvm',
        CgroupPermissions: 'rwm'
      });
    }

    // For VM containers, mount our universal start script
    const vmStartScript = path.resolve(__dirname, '../templates/vm/start.sh');
    if (isVmServer && fs.existsSync(vmStartScript)) {
      hostBinds.push(`${vmStartScript}:/start.sh:ro`);
      hostBinds.push(`${vmStartScript}:/lumenvm:ro`);
    }

    // Prepare port bindings
    const exposedPorts = {};
    const portBindings = {};
    if (port) {
      exposedPorts[`${port}/tcp`] = {};
      exposedPorts[`${port}/udp`] = {};
      portBindings[`${port}/tcp`] = [{ HostPort: `${port}` }];
      portBindings[`${port}/udp`] = [{ HostPort: `${port}` }];
    }

    // Parse command
    let finalCmd = startupCmd;
    if (isVmServer && (!finalCmd || finalCmd.includes('nogui') || finalCmd.includes('npm start') || finalCmd.includes('app.py') || finalCmd === '#Powered by LumenVM')) {
      finalCmd = '/start.sh';
    }
    const cmdParts = ['/bin/sh', '-c', finalCmd];

    // Environment variables
    let envArray = ['TERM=xterm-256color', `SERVER_PORT=${port || 25565}`, `SERVER_MEMORY=${server.memory_mb || 1024}`];
    let parsedEnv = {};
    try {
      parsedEnv = JSON.parse(server.env_vars || '{}');
      for (const [k, v] of Object.entries(parsedEnv)) {
        envArray.push(`${k}=${v}`);
      }
    } catch (e) {}

    if (isVmServer) {
      envArray.push('LICENSE=UNLOCKED_NO_LICENSE_NEEDED');
      if (!parsedEnv.SERVER_PORT) envArray.push(`SERVER_PORT=${port || 2222}`);
      if (!parsedEnv.VM_RAM_MB) envArray.push(`VM_RAM_MB=${Math.round((server.memory_mb || 2048) * 0.8)}`);
      if (!parsedEnv.VM_DISK_GB) envArray.push(`VM_DISK_GB=${Math.round((server.disk_mb || 10240) / 1024 * 0.8) || 10}`);
      if (!parsedEnv.DISPLAY_MODE) envArray.push('DISPLAY_MODE=ssh');
    }

    const container = await this.docker.createContainer({
      name: containerName,
      Image: server.docker_image,
      WorkingDir: '/home/container',
      Cmd: cmdParts,
      Env: envArray,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      ExposedPorts: exposedPorts,
      HostConfig: {
        Binds: hostBinds,
        PortBindings: portBindings,
        Devices: devices,
        CapAdd: isVmServer ? ['NET_ADMIN'] : [],
        Memory: (server.memory_mb || 1024) * 1024 * 1024,
        NanoCPUs: (server.cpu_limit || 100) * 10000000,
        RestartPolicy: { Name: 'no' }
      }
    });

    await container.start();
    return container;
  }

  async removeContainer(serverId, uuid) {
    if (!this.isAvailable || !this.docker) return;
    try {
      const containerName = `mpanel-server-${serverId}-${(uuid || '').substring(0, 8)}`;
      const container = this.docker.getContainer(containerName);
      try {
        await container.stop({ t: 2 });
      } catch (e) {}
      await container.remove({ force: true });
      console.log(`🐳 Successfully removed container ${containerName}`);
    } catch (e) {}
  }
}

module.exports = new DockerService();

