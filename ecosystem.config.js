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
        PORT_SFTP: 3004,
        CURSEFORGE_API_KEY: '$2a$10$iZYWa6jrmyz7hN69sfmInes1FAqrn2ycR.ZdrKKrtOpz/Tn9ETMcK'
      }
    }
  ]
};

