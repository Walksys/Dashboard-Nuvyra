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
  CURSEFORGE_API_KEY: process.env.CURSEFORGE_API_KEY || '$2a$10$2LouREiMl.mx0kVBK.RlK.nloje4XS3oF8uSw809VZr07O.0A5cLq',
  CURSEFORGE_BASE_URL: process.env.CURSEFORGE_BASE_URL || 'https://api.curseforge.com/v1',

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
    wallpaper: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=3840&q=90', // Full pitch black minimalist OLED
    wallpaperCategory: 'black-dark',
    logo: '/assets/mpanel-logo.svg',
    favicon: '/assets/favicon.svg',
    themeMode: 'dark',
    musicUrl: '',
    musicTitle: 'Default Chill Synth',
    musicEnabled: false,
    musicVolume: 30
  }
};

