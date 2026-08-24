module.exports = {
  apps: [
    {
      name: 'mpanel',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT_WEB: 3001,
        PORT_API: 3003,
        PORT_SFTP: 3004
      }
    }
  ]
};

