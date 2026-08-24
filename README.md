# 🎮 Mpanel - Full Node.js Game & App Server Web Management Panel

**Mpanel** is a full-featured, ultra-fast game and application server web management panel built entirely in **Node.js**. It provides an integrated alternative to Pterodactyl with real-time interactive terminal streaming, MCJars.app software installer, embedded SFTP server, customizable Glassmorphic theme engine (4K wallpapers, background audio player, transparency and blur sliders), nodes & port allocation manager, 2FA security, and PM2 clustering support.

---

## 🚀 Port Configuration

| Service | Port | Description |
| :--- | :--- | :--- |
| **Web UI** | `3001` | Main Web Panel Interface & Live Terminal WebSocket (`http://localhost:3001`) |
| **Panel / Daemon API** | `3003` | REST API for external integrations (WHMCS, Discord Bots, Billing) |
| **Embedded SFTP Server** | `3004` | Built-in SFTP server for FileZilla, WinSCP, Cyberduck (`sftp://localhost:3004`) |

---

## 📦 Supported Servers & Environments

### 1. 🎮 Minecraft (Java & Bedrock)
- **MCJars.app Integration**: One-click install for **Paper**, **Purpur**, **Fabric**, **Forge**, **Vanilla**, **Spigot**, **Velocity**, **BungeeCord**, **Folia**, and **Bedrock Dedicated Server**.
- **Java Versions**:
  - `Java 25` (`ghcr.io/pterodactyl/yolks:java_25`)
  - `Java 21` (`ghcr.io/pterodactyl/yolks:java_21`)
  - `Java 17` (`ghcr.io/pterodactyl/yolks:java_17`)
  - `Java 16` (`ghcr.io/pterodactyl/yolks:java_16`)
  - `Java 11` (`ghcr.io/pterodactyl/yolks:java_11`)
  - `Java 8` (`ghcr.io/pterodactyl/yolks:java_8`)

### 2. ⚡ Node.js Apps & Bots
- **Node.js Versions**:
  - `Nodejs 25`, `24`, `23`, `22`, `21`, `20`, `19`, `18`, `17`, `16`, `14`, `12` (`ghcr.io/ptero-eggs/yolks:nodejs_*`)

### 3. 🐍 Python Apps & Bots
- **Python Versions**:
  - `Python 3.13`, `3.12`, `3.11`, `3.10`, `3.9`, `3.8`, `3.7`, `2.7` (`ghcr.io/ptero-eggs/yolks:python_*`)

---

## 🎨 Theme & Admin Customization Engine

Accessible under **Admin Dashboard > Admin Settings**:
- **Panel Name & Favicon Title**: Change display title dynamically.
- **Panel Logo & Favicon**: URL input or direct file upload with live preview.
- **4K Wallpapers & Backgrounds**:
  - Direct presets from **4kwallpapers.com**:
    - `cute-kawaii-wallpapers`
    - `ultrawide-monitor-hd-wallpapers`
    - `cool-wallpapers`
    - `black-dark`
    - `aesthetic-wallpapers`
    - `space`
    - `cr7-wallpapers`
    - `cyberpunk`
    - `gaming`
  - Custom image URL or MP4/WebM video background upload.
- **Background Music Player**:
  - MP3 upload / audio stream URL / YouTube audio stream.
  - Floating mini-player with play/pause, volume slider, and track title.
- **Glassmorphism Sliders**:
  - **Transparency Bar** (`-------|------`): Adjust card glass transparency from 0% to 95%.
  - **Backdrop Blur Bar** (`-------|----------`): Adjust background blur filter from 0px to 40px with real-time preview.

---

## 🛠️ CLI Commands & Quick Start

### 1. Install Dependencies
```bash
npm install
### 1. Interactive Management Menu (`menu.sh`)
```bash
./menu.sh
# or
bash menu.sh
# or
npm run menu
```

Direct shortcuts available:
- `./menu.sh install` - Install Node.js, dependencies, and build directories
- `./menu.sh usercreate` - Create new admin or normal user
- `./menu.sh pm2` - PM2 Process Management menu (Start, Stop, Restart, Logs, Autostart)
- `./menu.sh update` - Git pull and rebuild dependencies
- `./menu.sh status` - Check port listening status (3001, 3003, 3004) and database
- `./menu.sh uninstall` - Safely remove or clean Mpanel

### 2. Manual CLI Commands
```bash
# Install dependencies
npm install

# Build & Check directories
npm run build

# Create Administrator / User
npm run createuser

# Start in foreground
npm start

# Start in background with PM2
npm run pm2:start
npm run pm2:logs
```

---

## 📁 Directory Structure

```
/
├── bin/
│   ├── createuser.js        # Interactive CLI user creation script
│   └── build.js             # Directory verification & preparation script
├── data/
│   └── mpanel.sqlite        # SQLite database (WAL mode enabled)
├── mpanel/
│   ├── servers/             # Sandboxed server directories (server1, server2, ...)
│   └── backups/             # Server snapshot .zip archives
├── public/
│   ├── index.html           # Main SPA HTML structure
│   ├── css/
│   │   └── style.css        # Glassmorphic Cyberpunk styles & sliders
│   └── js/
│       ├── app.js           # Core router, API requester & toasts
│       ├── auth.js          # Authentication, 2FA TOTP & profile
│       ├── settings.js      # Theme engine, 4kwallpapers, transparency & blur
│       ├── music.js         # Floating audio player module
│       ├── console.js       # xterm.js terminal & server management suite
│       ├── filemanager.js   # Sandboxed file manager & Ace code editor
│       └── admin.js         # Server wizard, nodes, allocations, users, API
├── src/
│   ├── index.js             # Main server launcher (Ports 3001, 3003, 3004)
│   ├── config/
│   │   ├── config.js        # Global app settings & ports
│   │   └── images.js        # Docker image presets (Minecraft, Node, Python)
│   ├── database/
│   │   ├── db.js            # SQLite database promise client & schema
│   │   └── seed.js          # Default settings, locations, nodes, allocations
│   ├── middleware/
│   │   ├── auth.js          # JWT & role permission middlewares
│   │   └── upload.js        # Multer upload handlers
│   ├── services/
│   │   ├── dockerService.js # Dockerode container lifecycle
│   │   ├── runnerService.js # Dual container / native process runner
│   │   ├── mcjarsService.js # MCJars.app integration & jar downloader
│   │   ├── fileManagerService.js # Sandboxed filesystem operations
│   │   ├── backupService.js # Zip backup creation & restoration
│   │   ├── scheduleService.js # Cron scheduled tasks
│   │   └── activityService.js # System-wide audit logging
│   ├── sftp/
│   │   └── sftpServer.js    # Embedded SSH2 SFTP Server on port 3004
│   ├── routes/              # Express REST API routes
│   ├── websocket/
│   │   └── consoleWs.js     # Real-time WebSocket terminal & stats
│   └── api/
│       └── daemonServer.js  # Port 3003 Daemon API
└── ecosystem.config.js      # PM2 configuration
```

---

## 🔒 SFTP Connection Details

Connect using any SFTP client (e.g., FileZilla, WinSCP, Cyberduck):
- **Host**: `localhost` (or server IP)
- **Port**: `3004`
- **Username**: `<username>.<server_id>` (e.g. `admin.1` for Server #1)
- **Password**: Your Mpanel account password

---

## 🛡️ Default Credentials
- **Username**: `admin`
- **Password**: `admin`