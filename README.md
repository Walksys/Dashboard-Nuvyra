# 🎮 Mpanel - Full Node.js Game & App Server Web Management Panel

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Version](https://img.shields.io/badge/release-v2.5.0-blue.svg)](https://github.com/nobita329/Mpanel/releases/tag/v2.5.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Theme: Full Black](https://img.shields.io/badge/Theme-Full%20Black%20OLED-black.svg)](#-theme--customization-engine)
[![Auto-Updater](https://img.shields.io/badge/Auto--Updater-Live%20Terminal-cyan.svg)](#-system-updates--live-terminal-engine)

**Mpanel** is a high-performance, full-featured game and application server web management panel built entirely in **Node.js**. Designed as a modern, lightweight, and blazingly fast alternative to Pterodactyl, Mpanel features real-time terminal streaming, deep Minecraft server management (Live Player Manager, Addon Marketplace, World Installer, Version Changer), an embedded SFTP server, automated GitHub release detection with a live update terminal, interactive auto-tutorials, and multi-theme personalization (Full Black OLED, PteroX V2, LiquidX, Arix).

---

## 🚀 Port Configuration

| Service | Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Web UI & Console WS** | `3001` | HTTP / WS | Main Web Panel Interface & Live Terminal WebSocket (`http://localhost:3001`) |
| **Panel / Daemon API** | `3003` | HTTP / WS | REST API for external integrations (WHMCS, Discord Bots, Billing, CLI) |
| **Embedded SFTP Server** | `3004` | SFTP (SSH) | Built-in SFTP server for FileZilla, WinSCP, Cyberduck (`sftp://localhost:3004`) |
| **MariaDB Server Engine** | `27017` | MySQL / TCP | High-speed dedicated relational database container for Minecraft & App databases |

---

## ✨ What's New in v2.5.0

### 1. 🔄 System Updates & Auto-Detection Engine
- **GitHub Releases Auto-Detection**: Real-time checking against [nobita329/Mpanel/releases](https://github.com/nobita329/Mpanel/releases) with semver comparison.
- **Dedicated Updates Dashboard (`#admin-updates`)**:
  - Displays Installed Version vs Latest Release tag.
  - Formatted Markdown Changelog reader and Release History accordion.
  - Instant **"Check for Updates"** manual refresh button.
- **Interactive Live Update Terminal ("live update tarmil")**:
  - Full-featured embedded `xterm.js` terminal with cyber styling, auto-scrolling, clear screen, and log copying.
  - Streams update execution line-by-line in real-time over WebSocket (`/ws/admin/updates`).
  - **6-Step Pipeline Visualizer**: Pre-flight Verification ➔ Git Sync ➔ Dependencies (npm install) ➔ Database Migration ➔ PM2 Reload ➔ Health Verification.
  - Action buttons: "Start System Update (Full Auto)", "Sync Dependencies & Schema", "Check Git Status".
- **Global System Overview Integration (`#admin-overview`)**:
  - Titlebar Version Pill (`v2.5.0`) & dynamic Update Status Pill (`Up-to-Date` or `Update Available`).
  - High-visibility **Mpanel Release & Update Status Banner** with 1-click update actions.
  - Sidebar navigation notification badge (`UPDATE`).

### 2. 🎓 Interactive Auto Tutorials Engine (No Static Pages)
- **Auto-Guided Spotlight Tours (`public/js/autoTutorial.js`)**:
  - Focused backdrop lighting with pulsing highlight rings around active UI controls.
  - 7-second countdown auto-progression bar, pause/resume, audio chimes, and keyboard navigation (`Esc`, arrow keys, `Space`).
  - Includes **Client Portal Tour (`panel-tour`)** and **Server Console Tour (`server-tour`)**.
- **Live Configuration Simulators (`public/js/knowledge.js`)**:
  - **SFTP URI Generator**: Instant connection strings and commands for FileZilla & Cyberduck on Port `3004`.
  - **Minecraft Aikar GC RAM Calculator**: Interactive slider (1GB–64GB) calculating heap and GC flags dynamically.
  - **MariaDB Configuration YAML Generator**: Dynamic database config snippet generator for Port `27017`.
- **Admin ON/OFF Controls**:
  - Toggle Tutorials portal visibility in Admin Settings.
  - Toggle automatic first-login tour for new users with an instant admin "Test Tour" button.
- **Pure Naming**: Zero references to "Knowledge Base" across all user-facing UI, database settings, and modals.

### 3. 🎨 PteroX V2.0.2 Theme Suite
- **Complete Visual Assets**: High-resolution branding logos, status illustrations, and server card banners.
- **New Customer Portals**: Billing & Subscriptions portal (`#billing`) with multi-tier pricing plans, wallet balance, and invoice receipts.
- **Theme Palette & Layouts**: Deep space dark mode (`#111525`), primary cyan (`#23aeea`), and accent orange (`#ff5108`).

---

## 🔑 Core Features & Capabilities

### 1. 👥 Minecraft Player Manager (Live Monitoring & Offline Roster)
- **Live Player Roster**: Connected players with live ping, gamemode, health, food bar, XP level, and UUID.
- **🎒 Interactive Live Inventory Viewer**: Inspect armor slots, offhand, main inventory, and ender chest with item icons, stack counts, and durability.
- **📊 Detailed Player Statistics**: In-depth tracking of mob kills, blocks mined, items crafted, and distance traveled.
- **🏆 Advancements & Achievements Tracker**: Complete advancement tree tracking across Story, Nether, The End, Adventure, and Husbandry.
- **⚡ Live Moderation Actions**: Instant Kick, Ban, Pardon, IP-Ban, OP (Levels 1–4), and DEOP.
- **🛡️ Full Offline Support**: Add/remove Whitelist entries, manage Operators, and ban/unban players even when the server is powered down.
- **🚀 1-Click Server Startup**: Direct power launch button inside Player Manager when the server is offline.

### 2. 🧩 Addon Marketplace (Consolidated A to Z Suite)
- **🌐 3 Universal Web Providers**:
  1. **Modrinth** (`https://modrinth.com`): Modern mods, plugins, datapacks, resource packs, and modpacks.
  2. **CurseForge** (`https://www.curseforge.com`): Full ecosystem integration via `CURSEFORGE_API_KEY` covering plugins, mods, worlds/maps, and modpacks.
  3. **SpigotMC** (`https://www.spigotmc.org`): Access to 90,000+ Bukkit, Spigot, and Paper plugins with version compatibility lists and 1-click `.jar` installation.
- **🎮 Minecraft Version Filtering (A to Z)**:
  - Comprehensive dropdown selector covering every release from **Minecraft 1.21 Tricky Trials** down to **1.5.2**, plus interactive quick version selector pills.
- **📂 Consolidated Categories**:
  - **Version Changer**: 1-click server core and engine switcher (Paper, Purpur, Spigot, Fabric, Forge, NeoForge, Velocity, BungeeCord).
  - **Player Manager**: Complete live and offline player moderation suite with inventory inspections.
  - **World Manager**: World creation, dimension management, CurseForge/Modrinth world store, instant generator profiles (Void, Superflat, Amplified, Large Biomes), and ZIP archive import/export.
  - **Plugins / Mods / Datapacks / Resource Packs / Modpacks**: 1-click deployment to appropriate folders.
  - **Properties UI**: Visual `server.properties` editor with dedicated **`[ 🟢 ON ]` `[ ⚪ OFF ]`** segmented switchers, live color-coded MOTD preview (`§` and `&` codes), and a **"Restart to Apply"** quick reboot button.
  - **Server Tools**: 1-click essential utility suite (ViaVersion, GeyserMC, Floodgate, Spark Profiler, Chunky, LuckPerms), Aikar's JVM performance flags, and Playit.gg tunnel manager.

### 3. 🔄 Minecraft Version Changer (MCJars Engine)
- Switch server software and Minecraft versions with a single click.
- Supported server cores:
  - **Paper**, **Purpur**, **Spigot**, **Vanilla**, **Fabric**, **Forge**, **NeoForge**, **BungeeCord**, **Velocity**, and **Bedrock Dedicated Server**.
- Automatic server jar backup, download verification, and configuration adjustments.

### 4. 🎨 Theme & Customization Engine
- **🖤 Full Black OLED**: Pure pitch black background (`#000000`), deep black frosted glass cards, and high-contrast neon accents.
- **🌌 PteroX V2**: High-tech deep space dark mode (`#111525`), primary cyan (`#23aeea`), and accent orange (`#ff5108`).
- **🌟 LiquidX**: Polished glassmorphism with custom gold and emerald accents.
- **💎 Arix**: Modern streamlined layout with deep blue palette.
- **🖼️ Integrated 4K Wallpapers Browser ([4kwallpapers.com](https://4kwallpapers.com/))**:
  - 36 categories, search, pagination, and 1-click apply across the panel.
- **📹 Custom Media Backgrounds**:
  - Upload custom high-res images (`JPG, PNG, WEBP, GIF`) or looping background videos (`MP4, WEBM` up to 100MB).
- **🎚️ Real-Time Sliders**: Dynamic opacity (0% to 100%) and blur (0px to 40px) sliders with debounced auto-save.

### 5. 🌐 Playit.gg Zero-Port Tunnel Integration
- **Addon Marketplace 1-Click Install**: Installs the latest official `playit-minecraft-plugin.jar` automatically into `plugins/` or `mods/`.
- **Live Status & Address Detection**: Scans logs to detect claim URLs and public player connection domains (`*.gl.joinmc.link`).
- **Native Linux System Daemon (playit CLI)**:
  - Accessible via `./menu.sh playit` or interactive `menu.sh` Option 8.

---

## 📦 Supported Runtimes & Environments

### 1. 🎮 Minecraft (Java & Bedrock)
- `Java 25`, `Java 21`, `Java 17`, `Java 16`, `Java 11`, `Java 8` (`ghcr.io/pterodactyl/yolks:java_*`)

### 2. ⚡ Node.js Apps & Discord Bots
- `Nodejs 25`, `24`, `23`, `22`, `21`, `20`, `19`, `18`, `16`, `14`, `12` (`ghcr.io/ptero-eggs/yolks:nodejs_*`)

### 3. 🐍 Python Apps & Bots
- `Python 3.13`, `3.12`, `3.11`, `3.10`, `3.9`, `3.8`, `3.7`, `2.7` (`ghcr.io/ptero-eggs/yolks:python_*`)

---

## 🛠️ Installation & Quick Start

### 1. 🚀 1-Click Universal Auto Install (`menu.sh`)
Run the full automated installer directly from the web or locally:
```bash
# Instant One-Liner from GitHub
bash <(curl -sSL https://raw.githubusercontent.com/nobita329/Mpanel/main/menu.sh)

# Or locally
./menu.sh auto -y
# or interactive
./menu.sh auto
```

### 2. Interactive Management Menu (`menu.sh`)
```bash
./menu.sh
# or
bash menu.sh
```

Direct shortcuts:
- `./menu.sh auto` / `./menu.sh setup` - 1-Click Auto Install, Setup, Database Seeding & PM2 Launch
- `./menu.sh update` - 1-Click Auto Update (Git pull, DB migrations, dependencies & PM2 restart)
- `./menu.sh usercreate` - Create new admin or normal user
- `./menu.sh pm2` - PM2 Process Management menu (Start, Stop, Restart, Logs, Autostart)
- `./menu.sh status` - Check port listening status (`3001`, `3003`, `3004`, `27017`) and database
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

# Launch with PM2
npm run pm2:start
npm run pm2:logs
```

---

## 📁 Directory Structure

```
/
├── bin/
│   ├── setup.js             # Automated setup, directory creator & database seeder
│   ├── createuser.js        # Interactive CLI user creation script
│   ├── migrate.js           # Database migration runner
│   └── build.js             # Directory verification & preparation script
├── mpanel/
│   ├── servers/             # Sandboxed server directories (server1, server2, ...)
│   └── backups/             # Server snapshot .zip archives
├── public/
│   ├── index.html           # Main SPA HTML structure
│   ├── css/
│   │   └── style.css        # Multi-theme palettes & glassmorphic styling
│   └── js/
│       ├── app.js           # Core router, auth UI & toast notifications
│       ├── updates.js       # Auto-detect updates engine & live xterm.js terminal
│       ├── autoTutorial.js  # Spotlight guided walkthrough engine
│       ├── knowledge.js     # Tutorials Hub & live configuration generators
│       ├── billing.js       # Billing, pricing tiers & wallet receipt portal
│       ├── admin.js         # Global System Overview, servers, users, telemetry
│       ├── settings.js      # Themes, 4K wallpapers, feature toggles
│       ├── marketplace.js   # CurseForge, Modrinth & SpigotMC marketplace
│       ├── playerManager.js # Minecraft Live Player Manager & Inventory Viewer
│       ├── worldManager.js  # Minecraft World Installer & Dimension Manager
│       ├── versionChanger.js# MCJars Version & Core switcher
│       ├── console.js       # Real-time xterm.js terminal & server controls
│       └── filemanager.js   # Sandboxed file manager & code editor
├── src/
│   ├── index.js             # Main server launcher (Ports 3001, 3003, 3004)
│   ├── config/              # App configurations & image presets
│   ├── database/
│   │   ├── db.js            # MariaDB / MySQL connection pool & queries
│   │   └── seed.js          # Database seeders
│   ├── middleware/          # JWT auth, admin permissions & file uploads
│   ├── routes/
│   │   ├── adminUpdateRoutes.js  # System updates API & git tracking
│   │   ├── adminRoutes.js        # Global telemetry & cluster administration
│   │   ├── adminSettingsRoutes.js# Settings & feature toggles
│   │   └── serverRoutes.js       # Server lifecycle & management
│   ├── services/
│   │   ├── updateService.js      # GitHub Releases auto-detect & pipeline runner
│   │   ├── runnerService.js      # Server process execution
│   │   └── wallpaperService.js   # 4KWallpapers scraper & category cache
│   ├── sftp/
│   │   └── sftpServer.js    # Embedded SSH2 SFTP Server on port 3004
│   └── websocket/
│       └── consoleWs.js     # Real-time WebSocket terminal & update streams
└── ecosystem.config.js      # PM2 clustering configuration
```

---

## 🔒 SFTP Connection Details

Connect using any SFTP client (FileZilla, WinSCP, Cyberduck):
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