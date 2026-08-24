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
      if (data.State.Running) {
        return existingContainer;
      } else {
        await existingContainer.start();
        return existingContainer;
      }
    } catch (err) {
      // Container doesn't exist yet, continue to create
    }

    // Pull image if not local
    await this.pullImageIfNeeded(server.docker_image);

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
    const cmdParts = ['/bin/sh', '-c', startupCmd];

    // Environment variables
    let envArray = ['TERM=xterm-256color', `SERVER_PORT=${port || 25565}`, `SERVER_MEMORY=${server.memory_mb || 1024}`];
    try {
      const parsedEnv = JSON.parse(server.env_vars || '{}');
      for (const [k, v] of Object.entries(parsedEnv)) {
        envArray.push(`${k}=${v}`);
      }
    } catch (e) {}

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
        Binds: [`${serverDir}:/home/container:rw`],
        PortBindings: portBindings,
        Memory: (server.memory_mb || 1024) * 1024 * 1024,
        NanoCPUs: (server.cpu_limit || 100) * 10000000,
        RestartPolicy: { Name: 'unless-stopped' }
      }
    });

    await container.start();
    return container;
  }
}

module.exports = new DockerService();

