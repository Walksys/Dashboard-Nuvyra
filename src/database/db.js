const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Ensure data directory exists
if (!fs.existsSync(config.DATA_DIR)) {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}
if (!fs.existsSync(config.SERVERS_DIR)) {
  fs.mkdirSync(config.SERVERS_DIR, { recursive: true });
}
if (!fs.existsSync(config.BACKUPS_DIR)) {
  fs.mkdirSync(config.BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(config.UPLOADS_DIR)) {
  fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
}

const db = new sqlite3.Database(config.DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', config.DB_PATH);
  }
});

// Enable WAL mode and foreign keys for high concurrency & safety
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');
});

// Promisified helper methods
const query = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

async function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      type TEXT DEFAULT 'string',
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user', -- 'admin' | 'user'
      two_factor_secret TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      suspended INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      fqdn TEXT NOT NULL,
      daemon_port INTEGER DEFAULT 3003,
      sftp_port INTEGER DEFAULT 3004,
      memory_mb INTEGER DEFAULT 8192,
      disk_mb INTEGER DEFAULT 51200,
      location_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id INTEGER NOT NULL,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL,
      server_id INTEGER,
      assigned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      user_id INTEGER NOT NULL,
      node_id INTEGER NOT NULL,
      allocation_id INTEGER,
      server_type TEXT NOT NULL, -- 'minecraft' | 'python' | 'nodejs'
      docker_image TEXT NOT NULL,
      startup_cmd TEXT NOT NULL,
      memory_mb INTEGER DEFAULT 1024,
      cpu_limit INTEGER DEFAULT 100,
      disk_mb INTEGER DEFAULT 5120,
      status TEXT DEFAULT 'offline', -- 'offline' | 'starting' | 'running' | 'stopping'
      env_vars TEXT DEFAULT '{}',
      jar_type TEXT,
      jar_version TEXT,
      jar_build TEXT,
      container_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS subusers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      permissions TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(server_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      path TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      action_type TEXT NOT NULL, -- 'restart' | 'command' | 'backup' | 'start' | 'stop'
      payload TEXT,
      is_active INTEGER DEFAULT 1,
      last_run_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_token TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT DEFAULT '["*"]',
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      server_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query.exec(schema);
  console.log('✅ SQLite Schema initialized successfully.');
}

module.exports = {
  db,
  query,
  initDatabase
};

