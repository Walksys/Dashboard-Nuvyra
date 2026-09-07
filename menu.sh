#!/usr/bin/env bash

# ==============================================================================
#                      🎮 MPANEL MANAGEMENT SCRIPT (menu.sh)
#         Supports: Install, Uninstall, Update, User Create, PM2 Manager
# ==============================================================================

# Text Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Determine current directory
MPANEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MPANEL_DIR" || exit 1

# Display Banner
show_banner() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}            🎮  MPANEL - NODE.JS MANAGEMENT SUITE             ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  • Web Panel UI:    ${GREEN}http://localhost:3001${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  • Daemon/API Port: ${GREEN}http://localhost:3003${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  • SFTP Port:       ${GREEN}sftp://localhost:3004${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 1. Install Mpanel
install_mpanel() {
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}           🚀 Installing Mpanel Dependencies          ${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️ Node.js is not installed.${NC}"
        echo -e "${CYAN}Installing Node.js 20.x LTS...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        NODE_VER=$(node -v)
        echo -e "${GREEN}✅ Node.js detected: ${NODE_VER}${NC}"
    fi

    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️ Installing PM2 process manager globally...${NC}"
        npm install -g pm2
    else
        echo -e "${GREEN}✅ PM2 detected.${NC}"
    fi

    # Install NPM Dependencies
    echo -e "${CYAN}📦 Installing project dependencies (npm install)...${NC}"
    npm install

    # Build and initialize directories
    echo -e "${CYAN}🔨 Building directories and database schema...${NC}"
    npm run build

    echo ""
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${GREEN}  🎉 Mpanel installed successfully!                   ${NC}"
    echo -e "${GREEN}======================================================${NC}"
    echo ""
    read -p "Do you want to create an admin user now? (y/n): " create_admin_choice
    if [[ "$create_admin_choice" =~ ^[Yy]$ ]]; then
        create_user
    fi
}

# 2. Create User
create_user() {
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}             👤 Create Mpanel User                   ${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""
    node bin/createuser.js
    echo ""
    read -n 1 -s -r -p "Press any key to return to menu..."
}

# 3. Update Mpanel
update_mpanel() {
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}             🔄 Updating Mpanel                       ${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""

    if [ -d ".git" ]; then
        echo -e "${CYAN}📥 Pulling latest git updates...${NC}"
        git pull
    else
        echo -e "${YELLOW}ℹ️ Not a git repository, skipping git pull.${NC}"
    fi

    echo -e "${CYAN}📦 Updating dependencies...${NC}"
    npm install

    echo -e "${CYAN}🔨 Verifying build directories...${NC}"
    npm run build

    # Check if running under PM2
    if pm2 list 2>/dev/null | grep -q "mpanel"; then
        echo -e "${CYAN}🔄 Restarting Mpanel under PM2...${NC}"
        pm2 restart mpanel
    fi

    echo ""
    echo -e "${GREEN}✅ Mpanel updated successfully!${NC}"
    read -n 1 -s -r -p "Press any key to return to menu..."
}

# 4. PM2 Management Submenu
pm2_menu() {
    while true; do
        clear
        echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${PURPLE}║${WHITE}                 ⚡ PM2 PROCESS MANAGER                       ${PURPLE}║${NC}"
        echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  ${CYAN}[1]${NC} Start Mpanel in Background (PM2)"
        echo -e "  ${CYAN}[2]${NC} Stop Mpanel (PM2)"
        echo -e "  ${CYAN}[3]${NC} Restart Mpanel (PM2)"
        echo -e "  ${CYAN}[4]${NC} View PM2 Status"
        echo -e "  ${CYAN}[5]${NC} View Live Logs (pm2 logs)"
        echo -e "  ${CYAN}[6]${NC} Enable Autostart on Server Boot (pm2 startup & save)"
        echo -e "  ${CYAN}[0]${NC} Back to Main Menu"
        echo ""
        read -p "Select an option [0-6]: " pm2_opt

        case $pm2_opt in
            1)
                echo -e "${CYAN}Starting Mpanel via PM2...${NC}"
                pm2 start ecosystem.config.js
                read -n 1 -s -r -p "Press any key to continue..."
                ;;
            2)
                echo -e "${YELLOW}Stopping Mpanel...${NC}"
                pm2 stop mpanel
                read -n 1 -s -r -p "Press any key to continue..."
                ;;
            3)
                echo -e "${CYAN}Restarting Mpanel...${NC}"
                pm2 restart mpanel
                read -n 1 -s -r -p "Press any key to continue..."
                ;;
            4)
                echo -e "${CYAN}PM2 Status:${NC}"
                pm2 status
                read -n 1 -s -r -p "Press any key to continue..."
                ;;
            5)
                echo -e "${CYAN}Opening PM2 Logs (Press Ctrl+C to return)...${NC}"
                pm2 logs mpanel
                ;;
            6)
                echo -e "${CYAN}Configuring system startup...${NC}"
                pm2 startup
                pm2 save
                echo -e "${GREEN}✅ Autostart on boot configured!${NC}"
                read -n 1 -s -r -p "Press any key to continue..."
                ;;
            0)
                break
                ;;
            *)
                echo -e "${RED}Invalid option.${NC}"
                sleep 1
                ;;
        esac
    done
}

# 5. Start in Foreground (Debug Mode)
start_foreground() {
    echo -e "${CYAN}Starting Mpanel in foreground (Press Ctrl+C to stop)...${NC}"
    node src/index.js
}

# 6. Status & Port Check
status_check() {
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}             📊 Mpanel Service Status                 ${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""

    echo -e "Directory: ${GREEN}$MPANEL_DIR${NC}"
    
    # Check Ports
    echo ""
    echo -e "${WHITE}Port Status:${NC}"
    for port in 3001 3003 3004; do
        if ss -tuln 2>/dev/null | grep -q ":$port " || netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e " • Port ${CYAN}$port${NC}: ${GREEN}ACTIVE (Listening)${NC}"
        else
            echo -e " • Port ${CYAN}$port${NC}: ${RED}INACTIVE (Closed)${NC}"
        fi
    done

    echo ""
    # Database
    if [ -f "data/mpanel.sqlite" ]; then
        DB_SIZE=$(du -h data/mpanel.sqlite | awk '{print $1}')
        echo -e "Database: ${GREEN}data/mpanel.sqlite (${DB_SIZE})${NC}"
    else
        echo -e "Database: ${RED}Not initialized${NC}"
    fi

    echo ""
    # PM2 Process check
    if command -v pm2 &> /dev/null; then
        pm2 list
    fi

    echo ""
    read -n 1 -s -r -p "Press any key to return to menu..."
}

# 7. Uninstall Mpanel
uninstall_mpanel() {
    echo -e "${RED}======================================================${NC}"
    echo -e "${RED}⚠️  DANGER: UNINSTALL MPANEL                           ${NC}"
    echo -e "${RED}======================================================${NC}"
    echo ""
    echo -e "${YELLOW}This action can stop and delete Mpanel files.${NC}"
    read -p "Are you absolutely sure you want to uninstall Mpanel? (type 'YES' to confirm): " confirm_uninstall

    if [ "$confirm_uninstall" == "YES" ]; then
        echo -e "${YELLOW}Stopping PM2 processes...${NC}"
        if command -v pm2 &> /dev/null; then
            pm2 delete mpanel 2>/dev/null
            pm2 save 2>/dev/null
        fi

        read -p "Do you want to delete server files and database too? (y/n): " delete_data
        if [[ "$delete_data" =~ ^[Yy]$ ]]; then
            echo -e "${RED}Removing data and server files...${NC}"
            rm -rf data mpanel node_modules
        else
            echo -e "${CYAN}Preserving data and server files. Removing node_modules only...${NC}"
            rm -rf node_modules
        fi

        echo ""
        echo -e "${GREEN}✅ Mpanel has been uninstalled.${NC}"
    else
        echo -e "${GREEN}Uninstall cancelled.${NC}"
    fi
    echo ""
    read -n 1 -s -r -p "Press any key to return to menu..."
}

# 8. Install Playit.gg System Tunnel (playit CLI)
install_playit_cli() {
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}      🌐 Installing Playit.gg System CLI (Native)     ${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""

    if command -v playit &> /dev/null; then
        PLAYIT_VER=$(playit version 2>/dev/null || echo "installed")
        echo -e "${GREEN}✅ Playit CLI is already installed (${PLAYIT_VER})!${NC}"
        echo ""
        read -p "Do you want to reinstall/update Playit CLI? (y/n): " reinstall_choice
        if [[ ! "$reinstall_choice" =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    echo -e "${CYAN}🔑 1/4 Adding Playit.gg GPG Keyring...${NC}"
    curl -SsL https://packages.playit.gg/keys/playit.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/playit.gpg >/dev/null
    sudo chmod 0644 /usr/share/keyrings/playit.gpg

    echo -e "${CYAN}📦 2/4 Adding Playit APT Repository...${NC}"
    sudo curl -fsSL -o /etc/apt/sources.list.d/playit.list https://packages.playit.gg/repo-files/playit-debian.list

    echo -e "${CYAN}🔄 3/4 Updating Package Lists...${NC}"
    sudo apt update

    echo -e "${CYAN}🚀 4/4 Installing Playit.gg CLI...${NC}"
    sudo apt install -y playit

    if command -v playit &> /dev/null; then
        echo ""
        echo -e "${GREEN}======================================================${NC}"
        echo -e "${GREEN}  🎉 Playit CLI installed successfully!               ${NC}"
        echo -e "${GREEN}  Version: $(playit version 2>/dev/null || echo 'Latest')                      ${NC}"
        echo -e "${GREEN}======================================================${NC}"
        echo -e "${WHITE}Usage commands:${NC}"
        echo -e " • Run agent:    ${CYAN}playit${NC}"
        echo -e " • Start daemon: ${CYAN}playit start${NC}"
        echo -e " • Check status: ${CYAN}playit status${NC}"
    else
        echo -e "${RED}❌ Failed to install Playit CLI. Please check your system logs.${NC}"
    fi

    echo ""
    read -n 1 -s -r -p "Press any key to return to menu..."
}

# Main Interactive Menu Loop
main_menu() {
    while true; do
        show_banner
        echo -e "  ${CYAN}[1]${NC} 🚀 Install Mpanel (Dependencies & Setup)"
        echo -e "  ${CYAN}[2]${NC} 👤 Create User / Admin (usercreate)"
        echo -e "  ${CYAN}[3]${NC} ⚡ PM2 Process Manager (Start/Stop/Restart/Logs)"
        echo -e "  ${CYAN}[4]${NC} 🔄 Update Mpanel (Git pull & Build)"
        echo -e "  ${CYAN}[5]${NC} 🐞 Start in Foreground (Debug Mode)"
        echo -e "  ${CYAN}[6]${NC} 📊 Check System & Port Status"
        echo -e "  ${CYAN}[7]${NC} 🗑️  Uninstall Mpanel"
        echo -e "  ${CYAN}[8]${NC} 🌐 Install Playit.gg System Tunnel (playit CLI)"
        echo -e "  ${CYAN}[0]${NC} 🚪 Exit"
        echo ""
        read -p "Please select an option [0-8]: " choice

        case $choice in
            1) install_mpanel ;;
            2) create_user ;;
            3) pm2_menu ;;
            4) update_mpanel ;;
            5) start_foreground ;;
            6) status_check ;;
            7) uninstall_mpanel ;;
            8) install_playit_cli ;;
            0)
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid selection. Please choose 0-8.${NC}"
                sleep 1
                ;;
        esac
    done
}

# Direct CLI flags or interactive menu
if [ "$1" == "install" ]; then
    install_mpanel
elif [ "$1" == "uninstall" ]; then
    uninstall_mpanel
elif [ "$1" == "update" ]; then
    update_mpanel
elif [ "$1" == "usercreate" ] || [ "$1" == "usercrate" ] || [ "$1" == "createuser" ]; then
    create_user
elif [ "$1" == "pm2" ]; then
    pm2_menu
elif [ "$1" == "status" ]; then
    status_check
elif [ "$1" == "playit" ] || [ "$1" == "playit-cli" ]; then
    install_playit_cli
else
    main_menu
fi

