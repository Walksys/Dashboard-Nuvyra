const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2, 15) };
const { query } = require('./db');
const config = require('../config/config');
const os = require('os');

async function resolveNodeAddress() {
  const configured = process.env.NODE_IP || process.env.PUBLIC_IP || process.env.NODE_FQDN;
  if (configured && configured !== '127.0.0.1' && configured !== 'localhost') return configured;
  try {
    const response = await fetch('https://api.ipify.org?format=text', { signal: AbortSignal.timeout(2500) });
    const ip = (await response.text()).trim();
    if (ip && ip.length < 128) return ip;
  } catch (_) {}
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return '127.0.0.1';
}

async function seedDatabase() {
  console.log('🌱 Checking seed data...');

  // Default Settings
  const defaultSettings = [
    { key: 'panel_name', value: 'Casa', description: 'Application display name' },
    { key: 'panel_logo', value: '', description: 'Panel Logo image URL or uploaded file path' },
    { key: 'favicon_name', value: 'Casa', description: 'Favicon tab title' },
    { key: 'favicon_logo', value: '', description: 'Favicon icon URL or uploaded path' },
    { key: 'panel_bg', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=3840&q=90', description: 'Panel Background Image or Video URL' },
    { key: 'panel_bg_type', value: 'image', description: 'image or video' },
    { key: 'panel_bg_category', value: 'black-dark', description: 'Selected 4k wallpapers preset category' },
    { key: 'theme_mode', value: 'dark', description: 'Default UI theme mode (dark or light)' },
    { key: 'panel_music_url', value: '', description: 'Background Music MP3 URL or YouTube Audio URL' },
    { key: 'panel_music_title', value: 'Cyber Lounge Vibe', description: 'Music track title' },
    { key: 'panel_music_enabled', value: '0', description: 'Whether background music player is enabled by default' },
    { key: 'panel_music_volume', value: '30', description: 'Default background music volume (0-100)' },
    { key: 'transparency_bar', value: '18', description: 'Card Transparency level (0 to 100)' },
    { key: 'blur_bar', value: '16', description: 'Backdrop Blur filter radius in pixels (0 to 40)' },
    { key: 'registration_enabled', value: '1', description: 'Allow public user self-registration' },
    { key: 'default_language', value: 'en', description: 'Default UI language' },
    { key: 'discord_webhook_url', value: '', description: 'Discord webhook for registration and server creation notifications' },
    { key: 'free_server_enabled', value: '0', description: 'Enable Create Server Free for normal users' },
    { key: 'free_minecraft_ram_mb', value: '2048', description: 'Free Minecraft RAM in MB' },
    { key: 'free_minecraft_cpu', value: '100', description: 'Free Minecraft CPU percentage' },
    { key: 'free_minecraft_disk_mb', value: '5120', description: 'Free Minecraft disk in MB' },
    { key: 'free_proxy_ram_mb', value: '1024', description: 'Free proxy RAM in MB' },
    { key: 'free_proxy_disk_mb', value: '1024', description: 'Free proxy disk in MB' },
    { key: 'free_app_ram_mb', value: '512', description: 'Free Node.js, Python and Java RAM in MB' },
    { key: 'free_app_cpu', value: '50', description: 'Free Node.js, Python and Java CPU percentage' },
    { key: 'free_app_disk_mb', value: '1024', description: 'Free Node.js, Python and Java disk in MB' },
  ];

  for (const s of defaultSettings) {
    const existing = await query.get('SELECT `key` FROM settings WHERE `key` = ?', [s.key]);
    if (!existing) {
      await query.run(
        'INSERT INTO settings (`key`, `value`, `description`) VALUES (?, ?, ?)',
        [s.key, s.value, s.description]
      );
    }
  }

  // Default Location
  const existingLoc = await query.get('SELECT id FROM locations LIMIT 1');
  let locationId = 1;
  if (!existingLoc) {
    const locRes = await query.run(
      'INSERT INTO locations (short_code, name, description) VALUES (?, ?, ?)',
      ['local-01', 'Default Local Location', 'Local Host Environment']
    );
    locationId = locRes.lastID;
    console.log('✅ Created default location:', 'local-01');
  } else {
    locationId = existingLoc.id;
  }

  // Default Node
  const nodeAddress = await resolveNodeAddress();
  const existingNode = await query.get('SELECT id FROM nodes LIMIT 1');
  let nodeId = 1;
  if (!existingNode) {
    const nodeRes = await query.run(
      'INSERT INTO nodes (name, fqdn, daemon_port, sftp_port, memory_mb, disk_mb, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Local Node', nodeAddress, config.PORT_API, config.PORT_SFTP, 16384, 102400, locationId]
    );
    nodeId = nodeRes.lastID;
    console.log('✅ Created default node:', 'Local Node');

    // Generate Default Allocations (e.g. 25565 - 25575 for Minecraft, 3000-3010 for Node, 5000-5010 for Python)
    const ports = [
      25565, 25566, 25567, 25568, 25569, 25570,
      3000, 3002, 3005, 3006, 3010,
      5000, 5001, 5002, 5003, 5005,
      8080, 8081, 8082
    ];
    for (const port of ports) {
      await query.run(
        'INSERT INTO allocations (node_id, ip, port, assigned) VALUES (?, ?, ?, 0)',
        [nodeId, nodeAddress, port]
      );
    }
    console.log(`✅ Generated ${ports.length} default port allocations for Local Node at ${nodeAddress}.`);
  } else {
    await query.run(`UPDATE nodes SET fqdn = ? WHERE id = ? AND (fqdn = '127.0.0.1' OR fqdn = 'localhost' OR fqdn IS NULL)`, [nodeAddress, existingNode.id]);
    await query.run(`UPDATE allocations SET ip = ? WHERE node_id = ? AND assigned = 0 AND (ip = '127.0.0.1' OR ip = 'localhost')`, [nodeAddress, existingNode.id]);
    nodeId = existingNode.id;
  }

  // Check if admin user exists, if not create default admin: admin / admin123
  const existingAdmin = await query.get('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!existingAdmin) {
    const defaultPassword = 'admin';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const adminUuid = uuidv4();
    await query.run(
      'INSERT INTO users (uuid, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [adminUuid, 'admin', 'admin@casa.local', passwordHash, 'admin']
    );
    console.log('👑 Default Admin User created: username: "admin", password: "admin"');
  }

  console.log('🌱 Database seeding completed.');
}

module.exports = { seedDatabase };
