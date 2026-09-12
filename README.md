# 🎮 Mpanel - Full Node.js Game & App Server Web Management Panel

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Version](https://img.shields.io/badge/release-v2.1.0-blue.svg)](https://github.com/nobita329/Mpanel/releases/tag/v2.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Theme: Full Black](https://img.shields.io/badge/Theme-Full%20Black%20OLED-black.svg)](#-theme--customization-engine)

**Mpanel** is a high-performance, full-featured game and application server web management panel built entirely in **Node.js**. Designed as a modern, lightweight, and blazingly fast alternative to Pterodactyl, Mpanel features real-time terminal streaming, deep Minecraft server management (Live Player Manager, Addon Marketplace, World Installer, Version Changer), an embedded SFTP server, and a fully customizable Glassmorphic Full Black OLED theme engine.

---

## 🚀 Port Configuration

| Service | Port | Description |
| :--- | :--- | :--- |
| **Web UI** | `3001` | Main Web Panel Interface & Live Terminal WebSocket (`http://localhost:3001`) |
| **Panel / Daemon API** | `3003` | REST API for external integrations (WHMCS, Discord Bots, Billing) |
| **Embedded SFTP Server** | `3004` | Built-in SFTP server for FileZilla, WinSCP, Cyberduck (`sftp://localhost:3004`) |

---

## ✨ Key Features & Capabilities

### 1. 👥 Minecraft Player Manager (Full Live Monitoring)
- **Live Player Roster**: View all online players with real-time ping, health, food level, gamemode, and XP levels.
- **🎒 Interactive Live Inventory Viewer**: Inspect player armor slots, offhand, main inventory, and hotbar with live item icons, stack counts, and damage values.
- **📊 Detailed Player Statistics**: In-depth tracking of mob kills, blocks mined, total playtime, distance traveled, and deaths.
- **🏆 Advancements & Achievements Tracker**: Complete advancement progress tracking across dimensions.
- **⚡ Real-time Moderation Actions**: Instant Kick, Ban, Pardon, OP, and DEOP directly with one click.

### 2. 🧩 Multi-Source Addon Marketplace & World Management (A to Z)
- **🌐 3 Universal Web Providers (A to Z)**:
  1. **Modrinth** (`https://modrinth.com`): High-speed direct downloads for modern Minecraft mods, plugins, datapacks, resource packs, and modpacks.
  2. **CurseForge** (`https://www.curseforge.com`): Full ecosystem integration with custom API key (`CURSEFORGE_API_KEY`) and base URL (`https://api.curseforge.com/v1`) covering plugins, mods, worlds/maps, and modpacks.
  3. **SpigotMC** (`https://www.spigotmc.org`): Integrated via the official open Spiget v2 REST API (`api.spiget.org/v2`), giving access to 90,000+ Bukkit, Spigot, and Paper plugins with version compatibility lists and 1-click `.jar` installation.
- **🎮 Minecraft Version Filtering (A to Z)**:
  - Comprehensive dropdown selector covering every release series from **Minecraft 1.21 Tricky Trials** all the way down to **1.5.2** (grouped with release titles). Automatically filters plugins, mods, datapacks, resource packs, and worlds across all three providers.
- **📂 8 Distinct Categories ("Sab Alg Alg")**:
  - **Plugins**: Bukkit, Spigot, Paper, Purpur, Folia, Velocity, BungeeCord plugins with version filtering.
  - **Mods**: Fabric, Forge, NeoForge, Quilt mods with loader badges and 1-click download to `mods/`.
  - **Datapacks**: Vanilla game extensions deployed into `world/datapacks/`.
  - **Resource Packs**: Server-side and client resource packs deployed into `resourcepacks/`.
  - **Modpacks**: CurseForge and Modrinth complete modpack packages.
  - **World Management (A to Z)**:
    - *Server Worlds Roster*: Inspect active and standby worlds, disk size, and dimensions (Overworld, Nether, The End).
    - *1-Click Active World Switcher*: Updates `server.properties` `level-name` instantly.
    - *World Creation*: Custom seed, generator preset (Normal, Superflat, Large Biomes, Amplified, Buffet), gamemode, difficulty, structures, and hardcore permadeath.
    - *World Cloning & Reset*: Duplicate or wipe region files with 1 click.
    - *Import & Export*: 1-click `.zip` backup download and `.zip` archive upload.
    - *CurseForge Worlds & Maps Store*: Live search and 1-click install from CurseForge (`classId: 17`).
    - *Modrinth World Maps*: Adventure and exploration maps from Modrinth.
    - *Curated Fast Maps*: Instant deployment for Skyblock, OneBlock, Clean Void World, Parkour Spiral, Bedwars 8-Teams, Medieval Hub.
    - *Direct URL (.zip) Installer*: Download and unpack from any web link.
  - **Properties UI**: Visual `server.properties` editor with live in-game MOTD preview (supports Minecraft `§` and `&` color codes), category cards (Gameplay, World, Performance, Security), and dual Visual Form / Raw Editor.
  - **Server Tools**: 1-click essential server utility suite (ViaVersion, ViaBackwards, GeyserMC, Floodgate, Spark Profiler, Chunky, LuckPerms, SkinsRestorer), Aikar's JVM performance flags, Playit.gg tunnel manager, and server log cleaner.

### 3. 🔄 Minecraft Version Changer (MCJars Engine)
- Switch server software and Minecraft versions with a single click.
- Supported server cores:
  - **Paper**, **Purpur**, **Spigot**, **Vanilla**, **Fabric**, **Forge**, **NeoForge**, **BungeeCord**, **Velocity**, and **Bedrock Dedicated Server**.
- Automatic server jar backup, download verification, and configuration adjustments.

### 4. 🎨 Theme & Customization Engine (Full Black Edition)
- **🖤 Default Theme: Full Black OLED**:
  - Pure pitch black background (`#000000`), deep black frosted glass cards, and high-contrast neon accents.
  - One-click Light / Dark mode toggle with adapted frosted-glass styling.
- **🖼️ Integrated 4K Wallpapers Browser ([4kwallpapers.com](https://4kwallpapers.com/))**:
  - **36 Categories**: Black & Dark, Space, Gaming, Anime, Abstract, Cars, Nature, Sci-Fi, Minimal, CGI, and more.
  - **Search & Pagination**: Full pagination (Next / Previous, direct page jump) and instant keyword search.
  - **1-Click Apply**: Set any 4K wallpaper across the panel immediately.
  - **Favorites**: Bookmark favorite wallpapers with instant heart toggle saved to local storage.
  - **Download**: Direct link to full 4K UHD resolutions.
- **📹 Custom Media Backgrounds**:
  - Upload custom high-res images (`JPG, PNG, WEBP, GIF`) or looping background videos (`MP4, WEBM` up to 100MB).
  - Custom media URL input with real-time format detection and "Test & Live Preview".
- **🎚️ Real-Time Transparency Slider (`0% ---------|--------- 100%`)**:
  - Dynamic opacity control across all glass panels with instantaneous CSS variable updates.
- **✨ Real-Time Blur Slider (`0px ---------|---------- 40px`)**:
  - Frosted glassmorphism using CSS `backdrop-filter: blur()` working over both image and video backgrounds.
- **Auto-Save & Reset**:
  - Debounced auto-save on slider dragging and a one-click **"Reset to Default"** action.

### 5. 🌐 Playit.gg Zero-Port Tunnel Integration
- **Addon Marketplace 1-Click Install**: Installs the latest official `playit-minecraft-plugin.jar` automatically into `plugins/` (Paper, Purpur, Spigot, Velocity) or `mods/` (Fabric, Forge, NeoForge).
- **Live Status & Address Detection**: Scans logs to detect claim URLs and public player connection domains (e.g. `*.gl.joinmc.link`).
- **Secret Key Binding**: Configures `secret_key` directly into `playit.toml`.
- **Native Linux System Daemon (playit CLI)**:
  ```bash
  curl -SsL https://packages.playit.gg/keys/playit.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/playit.gpg >/dev/null
  sudo chmod 0644 /usr/share/keyrings/playit.gpg
  sudo curl -fsSL -o /etc/apt/sources.list.d/playit.list https://packages.playit.gg/repo-files/playit-debian.list
  sudo apt update
  sudo apt install -y playit
  ```
  Or 1-click via Mpanel CLI: `./menu.sh playit` (or interactive `menu.sh` Option 8).

---

## 📦 Supported Runtimes & Environments

### 1. 🎮 Minecraft (Java & Bedrock)
- **Java Versions**:
  - `Java 25`, `Java 21`, `Java 17`, `Java 16`, `Java 11`, `Java 8` (`ghcr.io/pterodactyl/yolks:java_*`)

### 2. ⚡ Node.js Apps & Discord Bots
- **Node.js Versions**:
  - `Nodejs 25`, `24`, `23`, `22`, `21`, `20`, `19`, `18`, `16`, `14`, `12` (`ghcr.io/ptero-eggs/yolks:nodejs_*`)

### 3. 🐍 Python Apps & Bots
- **Python Versions**:
  - `Python 3.13`, `3.12`, `3.11`, `3.10`, `3.9`, `3.8`, `3.7`, `2.7` (`ghcr.io/ptero-eggs/yolks:python_*`)

---

## 🛠️ Installation & Quick Start

### 1. 🚀 1-Click Auto Install & Auto Setup (`menu.sh`)
Run the full automated setup (installs Node.js 20 LTS, PM2, dependencies, generates `.env`, seeds database, and starts PM2 with boot autostart):
```bash
./menu.sh auto -y
# or interactive
./menu.sh auto
# or via npm
npm run setup
```

### 2. Interactive Management Menu (`menu.sh`)
```bash
./menu.sh
# or
bash menu.sh
# or
npm run menu
```

Direct shortcuts available:
- `./menu.sh auto` / `./menu.sh setup` - 1-Click Auto Install, Setup, Database Seeding & PM2 Launch
- `./menu.sh update` - 1-Click Auto Update (Git pull, DB migrations, dependencies & PM2 restart)
- `./menu.sh usercreate` - Create new admin or normal user
- `./menu.sh pm2` - PM2 Process Management menu (Start, Stop, Restart, Logs, Autostart)
- `./menu.sh status` - Check port listening status (`3001`, `3003`, `3004`) and database
- `./menu.sh playit` - Install native Playit.gg zero-port tunnel CLI
- `./menu.sh uninstall` - Safely remove or clean Mpanel

### 3. Manual CLI Setup
```bash
# Clone the repository
git clone https://github.com/nobita329/Mpanel.git
cd Mpanel

# Install dependencies
npm install

# Run automated directory, .env & database setup
npm run setup

# Create Administrator Account (if custom required)
npm run createuser

# Launch with PM2 (Recommended for Production)
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
│   │   └── style.css        # Full Black OLED Glassmorphic styles & sliders
│   └── js/
│       ├── app.js           # Core router, API requester & toasts
│       ├── auth.js          # Authentication, 2FA TOTP & profile
│       ├── settings.js      # Customization engine, 4K wallpapers, transparency & blur
│       ├── marketplace.js   # CurseForge & Modrinth Addon Marketplace
│       ├── playerManager.js # Minecraft Live Player Manager & Inventory Viewer
│       ├── worldManager.js  # Minecraft World Installer & Dimension Manager
│       ├── versionChanger.js# MCJars Version & Core switcher
│       ├── console.js       # xterm.js terminal & server management suite
│       ├── filemanager.js   # Sandboxed file manager & Ace code editor
│       └── admin.js         # Server wizard, nodes, allocations, users, API
├── src/
│   ├── index.js             # Main server launcher (Ports 3001, 3003, 3004)
│   ├── config/
│   │   ├── config.js        # Global app settings, ports & default theme
│   │   └── images.js        # Docker image presets (Minecraft, Node, Python)
│   ├── database/
│   │   ├── db.js            # SQLite database promise client & schema
│   │   └── seed.js          # Default settings, locations, nodes, allocations
│   ├── middleware/
│   │   ├── auth.js          # JWT & role permission middlewares
│   │   └── upload.js        # Multer upload handlers (100MB media limit)
│   ├── services/
│   │   ├── dockerService.js # Dockerode container lifecycle
│   │   ├── runnerService.js # Dual container / native process runner
│   │   ├── mcjarsService.js # MCJars.app integration & core switcher
│   │   ├── wallpaperService.js # 4KWallpapers scraper, cache & category engine
│   │   ├── playerService.js # Minecraft player NBT/JSON parser & RCON actions
│   │   ├── worldService.js  # World generation, dimensions & zip archives
│   │   ├── marketplaceService.js # CurseForge addon downloader
│   │   ├── fileManagerService.js # Sandboxed filesystem operations
│   │   ├── backupService.js # Zip backup creation & restoration
│   │   ├── scheduleService.js # Cron scheduled tasks
│   │   └── activityService.js # System-wide audit logging
│   ├── sftp/
│   │   └── sftpServer.js    # Embedded SSH2 SFTP Server on port 3004
│   ├── routes/              # Express REST API routes
│   └── websocket/
│       └── consoleWs.js     # Real-time WebSocket terminal & stats
└── ecosystem.config.js      # PM2 clustering configuration
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
- **Login URL**: `http://localhost:3001`

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).