const path = require('path');
require('dotenv').config();

module.exports = {
  // Ports
  PORT_WEB: parseInt(process.env.PORT_WEB || '3001', 10),
  PORT_API: parseInt(process.env.PORT_API || '3003', 10),
  PORT_SFTP: parseInt(process.env.PORT_SFTP || '3004', 10),

  // Secrets & JWT
  JWT_SECRET: process.env.JWT_SECRET || 'mpanel_super_secure_jwt_secret_key_2026_x892!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Storage Paths
  BASE_DIR: path.resolve(__dirname, '../../'),
  DATA_DIR: path.resolve(__dirname, '../../data'),
  SERVERS_DIR: path.resolve(__dirname, '../../mpanel/servers'),
  BACKUPS_DIR: path.resolve(__dirname, '../../mpanel/backups'),
  UPLOADS_DIR: path.resolve(__dirname, '../../public/uploads'),

  // SQLite DB Path
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../../data/mpanel.sqlite'),

  // Panel Defaults
  DEFAULT_PANEL_NAME: 'Mpanel',
  DEFAULT_THEME: {
    transparency: 18, // 0 - 100%
    blur: 16,        // 0 - 40px
    wallpaper: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    wallpaperCategory: 'black-dark',
    logo: '/assets/mpanel-logo.png',
    favicon: '/assets/favicon.png',
    musicUrl: '',
    musicTitle: 'Default Chill Synth',
    musicEnabled: false,
    musicVolume: 30
  }
};

