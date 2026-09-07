// Mpanel Minecraft Player Manager Module
class PlayerManager {
  constructor() {
    this.currentServerId = null;
    this.serverData = null;
    this.activeTab = 'online'; // 'online', 'whitelist', 'ops', 'banned', 'banned-ips', 'all'
    this.searchQuery = '';
    this.data = null;
    this.isLoading = false;
    this.refreshTimer = null;
    this.inspectorTimer = null;
    this.liveAutoSync = true;

    // Detailed inspector state
    this.inspectorPlayer = null;
    this.inspectorTab = 'inventory'; // 'inventory', 'stats', 'advancements'
    this.inventoryView = 'player';   // 'player' or 'ender'
    this.statsCategory = 'mined';    // 'mined', 'killed', 'crafted', 'used'
    this.advCategory = 'story';      // 'story', 'nether', 'end', 'adventure', 'husbandry'
  }

  /**
   * Main entry point called by serverConsole.switchSubTab('players')
   */
  async renderPlayerManagerTab(container, serverId, serverData) {
    this.currentServerId = serverId;
    this.serverData = serverData || {};

    container.innerHTML = `
      <div id="player-manager-root" class="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <!-- Top Title & Overview Banner -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2.5">
              <span class="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <i data-lucide="users" class="w-5 h-5"></i>
              </span>
              Minecraft Player Manager
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Live real-time online player controls, inventory inspections, gameplay statistics, advancements, whitelist, operators & bans.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Full Live Status Badge -->
            <span id="pm-live-badge" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span id="pm-live-text">LIVE SYNC (3s)</span>
            </span>
            <button id="pm-live-toggle-btn" onclick="playerManager.toggleLiveAutoSync()" class="px-3 py-1.5 rounded-xl text-xs font-semibold glass-btn text-slate-300 hover:text-white transition flex items-center gap-1.5">
              <i data-lucide="pause" id="pm-live-toggle-icon" class="w-3.5 h-3.5 text-amber-400"></i> Pause
            </button>
            <button onclick="playerManager.loadData(true)" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold glass-btn text-slate-200 hover:text-white flex items-center gap-1.5 transition">
              <i data-lucide="refresh-cw" id="pm-refresh-icon" class="w-3.5 h-3.5"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="pm-stats-grid">
          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Online Players</span>
              <span id="pm-online-dot" class="w-2 h-2 rounded-full bg-slate-500"></span>
            </div>
            <p id="pm-stat-online" class="text-2xl font-black text-white font-mono">0 / 0</p>
            <p id="pm-stat-server-status" class="text-[11px] text-slate-400">Loading...</p>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Whitelist Status</span>
              <i data-lucide="shield" class="w-3.5 h-3.5 text-cyan-400"></i>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span id="pm-stat-whitelist-badge" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">Loading</span>
              <button id="pm-whitelist-toggle-btn" onclick="playerManager.toggleWhitelist()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition">
                Toggle
              </button>
            </div>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Server Operators</span>
              <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
            </div>
            <p id="pm-stat-ops" class="text-2xl font-black text-amber-400 font-mono">0</p>
            <p class="text-[11px] text-slate-400">Staff / Administrators</p>
          </div>

          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Banned Accounts / IPs</span>
              <i data-lucide="ban" class="w-3.5 h-3.5 text-rose-400"></i>
            </div>
            <p id="pm-stat-bans" class="text-2xl font-black text-rose-400 font-mono">0 / 0</p>
            <p class="text-[11px] text-slate-400">Active disciplinary bans</p>
          </div>
        </div>

        <!-- Sub Tabs & Action Bar -->
        <div class="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <!-- Navigation Tabs -->
          <div class="flex flex-wrap gap-1">
            <button onclick="playerManager.switchTab('online')" id="pm-tab-online" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <i data-lucide="radio" class="w-3.5 h-3.5"></i>
              Online Players
              <span id="pm-count-online" class="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/30 text-cyan-200">0</span>
            </button>
            <button onclick="playerManager.switchTab('whitelist')" id="pm-tab-whitelist" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
              Whitelist
              <span id="pm-count-whitelist" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">0</span>
            </button>
            <button onclick="playerManager.switchTab('ops')" id="pm-tab-ops" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              Operators (OPs)
              <span id="pm-count-ops" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">0</span>
            </button>
            <button onclick="playerManager.switchTab('banned')" id="pm-tab-banned" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
              <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
              Banned Players
              <span id="pm-count-banned" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">0</span>
            </button>
            <button onclick="playerManager.switchTab('banned-ips')" id="pm-tab-banned-ips" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
              <i data-lucide="globe-2" class="w-3.5 h-3.5"></i>
              Banned IPs
              <span id="pm-count-banned-ips" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">0</span>
            </button>
            <button onclick="playerManager.switchTab('all')" id="pm-tab-all" class="pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              All Players Cache
              <span id="pm-count-all" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">0</span>
            </button>
          </div>

          <!-- Search & Contextual Action Button -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1 md:w-56">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"></i>
              <input type="text" id="pm-search-input" oninput="playerManager.handleSearch(this.value)" placeholder="Filter players..." class="w-full glass-input pl-9 pr-3 py-1.5 rounded-xl text-xs">
            </div>
            <div id="pm-primary-action-container"></div>
          </div>
        </div>

        <!-- Dynamic Tab Content View -->
        <div id="pm-content-view" class="space-y-4">
          <div class="text-center py-16 text-slate-400">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
            <p class="text-xs">Fetching player profiles & server data...</p>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.loadData();
    this.startLiveAutoSync();
  }

  startLiveAutoSync() {
    this.stopLiveAutoSync();
    this.liveAutoSync = true;
    this.refreshTimer = setInterval(() => {
      const root = document.getElementById('player-manager-root');
      if (!root) {
        this.stopLiveAutoSync();
        return;
      }
      // Only background sync if modal is not actively open
      const modal = document.getElementById('modal-container');
      const hasModal = modal && modal.innerHTML.trim() !== '';
      if (!this.isLoading && !hasModal) {
        this.loadData(false);
      }
    }, 3000);
  }

  stopLiveAutoSync() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  toggleLiveAutoSync() {
    if (this.liveAutoSync) {
      this.stopLiveAutoSync();
      this.liveAutoSync = false;
      const badge = document.getElementById('pm-live-badge');
      if (badge) {
        badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-1.5';
        const txt = document.getElementById('pm-live-text');
        if (txt) txt.innerText = 'PAUSED';
      }
      const btn = document.getElementById('pm-live-toggle-btn');
      if (btn) btn.innerHTML = '<i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i> Resume';
    } else {
      this.liveAutoSync = true;
      this.startLiveAutoSync();
      const badge = document.getElementById('pm-live-badge');
      if (badge) {
        badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10';
        const txt = document.getElementById('pm-live-text');
        if (txt) txt.innerText = 'LIVE SYNC (3s)';
      }
      const btn = document.getElementById('pm-live-toggle-btn');
      if (btn) btn.innerHTML = '<i data-lucide="pause" class="w-3.5 h-3.5 text-amber-400"></i> Pause';
    }
    if (window.lucide) lucide.createIcons();
  }

  async loadData(manual = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    const icon = manual ? document.getElementById('pm-refresh-icon') : null;
    if (icon) icon.classList.add('animate-spin');

    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/players`);
      if (res && res.success) {
        this.data = res;
        this.updateHeaderStats();
        // Do not recreate active search input
        const searchInput = document.getElementById('pm-search-input');
        const isSearching = searchInput && document.activeElement === searchInput;
        if (!isSearching) {
          this.renderCurrentTab();
        }
      }
    } catch (err) {
      console.error('[PlayerManager] Load error:', err);
      if (manual) app.showToast('Failed to load player data: ' + err.message, 'error');
    } finally {
      this.isLoading = false;
      if (icon) icon.classList.remove('animate-spin');
    }
  }

  updateHeaderStats() {
    if (!this.data) return;

    const { serverRunning, playerCounts, ops, whitelist, whitelistEnabled, bannedPlayers, bannedIps, allPlayers } = this.data;

    const onlineEl = document.getElementById('pm-stat-online');
    if (onlineEl) onlineEl.innerText = `${playerCounts.online} / ${playerCounts.max}`;

    const dotEl = document.getElementById('pm-online-dot');
    if (dotEl) {
      dotEl.className = serverRunning
        ? 'w-2 h-2 rounded-full bg-emerald-400 pulse-green'
        : 'w-2 h-2 rounded-full bg-rose-500';
    }

    const srvStatEl = document.getElementById('pm-stat-server-status');
    if (srvStatEl) {
      srvStatEl.innerHTML = serverRunning
        ? '<span class="text-emerald-400 font-semibold">Server Running</span>'
        : '<span class="text-rose-400 font-semibold">Server Offline</span>';
    }

    const wlBadge = document.getElementById('pm-stat-whitelist-badge');
    const wlBtn = document.getElementById('pm-whitelist-toggle-btn');
    if (wlBadge && wlBtn) {
      if (whitelistEnabled) {
        wlBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        wlBadge.innerText = 'ENABLED';
        wlBtn.innerText = 'Turn Off';
        wlBtn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition';
      } else {
        wlBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30';
        wlBadge.innerText = 'DISABLED';
        wlBtn.innerText = 'Turn On';
        wlBtn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition';
      }
    }

    const opsEl = document.getElementById('pm-stat-ops');
    if (opsEl) opsEl.innerText = (ops || []).length;

    const bansEl = document.getElementById('pm-stat-bans');
    if (bansEl) bansEl.innerText = `${(bannedPlayers || []).length} / ${(bannedIps || []).length}`;

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.innerText = count;
    };
    setBadge('pm-count-online', (this.data.onlinePlayers || []).length);
    setBadge('pm-count-whitelist', (whitelist || []).length);
    setBadge('pm-count-ops', (ops || []).length);
    setBadge('pm-count-banned', (bannedPlayers || []).length);
    setBadge('pm-count-banned-ips', (bannedIps || []).length);
    setBadge('pm-count-all', (allPlayers || []).length);
  }

  switchTab(tabKey) {
    this.activeTab = tabKey;

    document.querySelectorAll('.pm-subtab-btn').forEach(btn => {
      btn.className = 'pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition';
    });

    const activeBtn = document.getElementById(`pm-tab-${tabKey}`);
    if (activeBtn) {
      activeBtn.className = 'pm-subtab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
    }

    this.renderCurrentTab();
  }

  handleSearch(val) {
    this.searchQuery = (val || '').toLowerCase().trim();
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    const container = document.getElementById('pm-content-view');
    const actionContainer = document.getElementById('pm-primary-action-container');
    if (!container || !this.data) return;

    if (actionContainer) {
      actionContainer.innerHTML = this.getPrimaryActionHtml();
    }

    switch (this.activeTab) {
      case 'online':
        this.renderOnlineTab(container);
        break;
      case 'whitelist':
        this.renderWhitelistTab(container);
        break;
      case 'ops':
        this.renderOpsTab(container);
        break;
      case 'banned':
        this.renderBannedPlayersTab(container);
        break;
      case 'banned-ips':
        this.renderBannedIpsTab(container);
        break;
      case 'all':
        this.renderAllPlayersTab(container);
        break;
    }

    if (window.lucide) lucide.createIcons();
  }

  getPrimaryActionHtml() {
    switch (this.activeTab) {
      case 'whitelist':
        return `
          <button onclick="playerManager.showAddWhitelistModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Whitelist
          </button>
        `;
      case 'ops':
        return `
          <button onclick="playerManager.showAddOpModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Operator
          </button>
        `;
      case 'banned':
        return `
          <button onclick="playerManager.showBanPlayerModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-rose-500/20">
            <i data-lucide="ban" class="w-3.5 h-3.5"></i> Ban Player
          </button>
        `;
      case 'banned-ips':
        return `
          <button onclick="playerManager.showBanIpModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-rose-500/20">
            <i data-lucide="globe-lock" class="w-3.5 h-3.5"></i> Ban IP
          </button>
        `;
      default:
        return '';
    }
  }

  /**
   * 1. Online Players Tab
   */
  renderOnlineTab(container) {
    const isRunning = this.data.serverRunning;
    let list = this.data.onlinePlayers || [];

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(this.searchQuery)) ||
        (p.uuid && p.uuid.toLowerCase().includes(this.searchQuery)) ||
        (p.ip && p.ip.includes(this.searchQuery))
      );
    }

    if (!isRunning) {
      container.innerHTML = `
        <div class="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <i data-lucide="power-off" class="w-8 h-8"></i>
          </div>
          <div>
            <h4 class="text-base font-bold text-white">Minecraft Server is Offline</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Start the server from the top power controls to view and interact with real-time connected players.
            </p>
          </div>
          <button onclick="serverConsole.triggerPower(${this.currentServerId}, 'start')" class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg inline-flex items-center gap-2 transition">
            <i data-lucide="play" class="w-4 h-4"></i> Start Server Now
          </button>
        </div>
      `;
      return;
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
          <div class="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <i data-lucide="users" class="w-8 h-8"></i>
          </div>
          <div>
            <h4 class="text-base font-bold text-white">No Players Currently Online</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Connect to your server using <span class="font-mono text-cyan-300">127.0.0.1:${this.data.port}</span>. Connected players will appear here in real time.
            </p>
          </div>
        </div>
      `;
      return;
    }

    const cardsHtml = list.map(player => {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/64`;
      const fallbackUrl = `https://minotar.net/avatar/${encodeURIComponent(player.name)}/64`;
      const isOp = (this.data.ops || []).some(o => o.name && o.name.toLowerCase() === player.name.toLowerCase());
      const isWl = (this.data.whitelist || []).some(w => w.name && w.name.toLowerCase() === player.name.toLowerCase());

      return `
        <div class="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition shadow-xl">
          <div class="flex items-start gap-3.5">
            <img src="${avatarUrl}" onerror="this.src='${fallbackUrl}'" alt="${player.name}" class="w-12 h-12 rounded-xl ring-2 ring-white/10 shadow-lg shrink-0 cursor-pointer hover:opacity-80 transition" onclick="playerManager.showPlayerDetailsModal('${player.name}')">
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span onclick="playerManager.showPlayerDetailsModal('${player.name}')" class="font-bold text-sm text-white truncate cursor-pointer hover:text-cyan-300 transition">${player.name}</span>
                ${isOp ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">OP</span>' : ''}
                ${isWl ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Whitelisted</span>' : ''}
              </div>
              <p class="text-[10px] font-mono text-slate-400 truncate">${player.uuid || 'UUID Resolving...'}</p>
              ${player.ip ? `<p class="text-[10px] font-mono text-slate-500 flex items-center gap-1"><i data-lucide="globe" class="w-2.5 h-2.5"></i> ${player.ip}</p>` : ''}
            </div>
          </div>

          <!-- Quick Action Buttons Grid -->
          <div class="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5 text-center">
            <button onclick="playerManager.showPlayerDetailsModal('${player.name}')" title="Inspect Player (Inventory, Stats, Advancements)" class="p-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition flex items-center justify-center gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5 text-cyan-400"></i> Inspect
            </button>
            <button onclick="playerManager.showQuickActionModal('${player.name}')" title="Player Actions" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 transition flex items-center justify-center gap-1">
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-cyan-400"></i> Actions
            </button>
            <button onclick="playerManager.showKickModal('${player.name}')" title="Kick Player" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 transition flex items-center justify-center gap-1">
              <i data-lucide="log-out" class="w-3.5 h-3.5 text-amber-400"></i> Kick
            </button>
            <button onclick="playerManager.showBanPlayerModal('${player.name}')" title="Ban Player" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 transition flex items-center justify-center gap-1">
              <i data-lucide="ban" class="w-3.5 h-3.5 text-rose-400"></i> Ban
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cardsHtml}
      </div>
    `;
  }

  /**
   * 2. Whitelist Tab
   */
  renderWhitelistTab(container) {
    let list = this.data.whitelist || [];
    const isWlEnabled = this.data.whitelistEnabled;

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(this.searchQuery)) ||
        (p.uuid && p.uuid.toLowerCase().includes(this.searchQuery))
      );
    }

    const rowsHtml = list.map(player => {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/32`;
      const fallbackUrl = `https://minotar.net/avatar/${encodeURIComponent(player.name)}/32`;

      return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition">
          <td class="px-4 py-3 flex items-center gap-3">
            <img src="${avatarUrl}" onerror="this.src='${fallbackUrl}'" class="w-8 h-8 rounded-lg shadow cursor-pointer" onclick="playerManager.showPlayerDetailsModal('${player.name}')">
            <span onclick="playerManager.showPlayerDetailsModal('${player.name}')" class="font-bold text-white text-xs cursor-pointer hover:text-cyan-300">${player.name}</span>
          </td>
          <td class="px-4 py-3 font-mono text-[11px] text-slate-400">${player.uuid || 'N/A'}</td>
          <td class="px-4 py-3 text-right space-x-1">
            <button onclick="playerManager.showPlayerDetailsModal('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
              Inspect
            </button>
            <button onclick="playerManager.promoteToOp('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition">
              Make OP
            </button>
            <button onclick="playerManager.removeFromWhitelist('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition">
              Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="space-y-4">
        <div class="glass-card p-4 rounded-2xl border ${isWlEnabled ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/40'} flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl ${isWlEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
              <i data-lucide="${isWlEnabled ? 'shield-check' : 'shield-alert'}" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-xs font-bold ${isWlEnabled ? 'text-emerald-300' : 'text-slate-300'}">
                Whitelist Enforcement is ${isWlEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
              </p>
              <p class="text-[11px] text-slate-400">
                ${isWlEnabled ? 'Only whitelisted users can connect to this server.' : 'Any player can connect without being whitelisted.'}
              </p>
            </div>
          </div>
          <button onclick="playerManager.toggleWhitelist()" class="px-4 py-2 rounded-xl text-xs font-bold ${isWlEnabled ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} shadow transition">
            ${isWlEnabled ? 'Disable Whitelist' : 'Enable Whitelist'}
          </button>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="px-4 py-3">Player</th>
                  <th class="px-4 py-3">UUID</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.length > 0 ? rowsHtml : `
                  <tr>
                    <td colspan="3" class="px-4 py-10 text-center text-slate-400">
                      No whitelisted players found. Click "+ Add Whitelist" above to permit a player.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 3. Operators (OPs) Tab
   */
  renderOpsTab(container) {
    let list = this.data.ops || [];

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(this.searchQuery)) ||
        (p.uuid && p.uuid.toLowerCase().includes(this.searchQuery))
      );
    }

    const levelDescriptions = {
      1: 'Level 1: Spawn Protection Bypass',
      2: 'Level 2: Cheat Commands & Command Blocks',
      3: 'Level 3: Moderation Commands (Kick/Ban/OP)',
      4: 'Level 4: Full Administrator (Stop Server)'
    };

    const rowsHtml = list.map(op => {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(op.name)}/32`;
      const fallbackUrl = `https://minotar.net/avatar/${encodeURIComponent(op.name)}/32`;

      return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition">
          <td class="px-4 py-3 flex items-center gap-3">
            <img src="${avatarUrl}" onerror="this.src='${fallbackUrl}'" class="w-8 h-8 rounded-lg shadow cursor-pointer" onclick="playerManager.showPlayerDetailsModal('${op.name}')">
            <div>
              <span onclick="playerManager.showPlayerDetailsModal('${op.name}')" class="font-bold text-white text-xs block cursor-pointer hover:text-cyan-300">${op.name}</span>
              <span class="text-[10px] text-amber-400 font-mono">OP Level ${op.level || 4}</span>
            </div>
          </td>
          <td class="px-4 py-3 font-mono text-[11px] text-slate-400">${op.uuid || 'N/A'}</td>
          <td class="px-4 py-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ${levelDescriptions[op.level || 4] || `Level ${op.level}`}
            </span>
          </td>
          <td class="px-4 py-3 text-right space-x-1">
            <button onclick="playerManager.showPlayerDetailsModal('${op.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
              Inspect
            </button>
            <button onclick="playerManager.showChangeOpLevelModal('${op.name}', ${op.level || 4})" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-slate-200 hover:bg-white/20 transition">
              Change Level
            </button>
            <button onclick="playerManager.revokeOp('${op.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition">
              De-OP
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="space-y-4">
        <div class="glass-card p-3.5 rounded-2xl border border-white/5 text-[11px] text-slate-400 flex items-center gap-3">
          <i data-lucide="info" class="w-4 h-4 text-amber-400 shrink-0"></i>
          <span>Operators hold server moderation and administrative permissions. Level 4 grants full commands including stopping the server and managing world saves.</span>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="px-4 py-3">Operator</th>
                  <th class="px-4 py-3">UUID</th>
                  <th class="px-4 py-3">Permission Tier</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.length > 0 ? rowsHtml : `
                  <tr>
                    <td colspan="4" class="px-4 py-10 text-center text-slate-400">
                      No operators configured. Click "+ Add Operator" above to grant admin permissions.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 4. Banned Players Tab
   */
  renderBannedPlayersTab(container) {
    let list = this.data.bannedPlayers || [];

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(this.searchQuery)) ||
        (p.reason && p.reason.toLowerCase().includes(this.searchQuery)) ||
        (p.uuid && p.uuid.toLowerCase().includes(this.searchQuery))
      );
    }

    const rowsHtml = list.map(player => {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/32`;
      const fallbackUrl = `https://minotar.net/avatar/${encodeURIComponent(player.name)}/32`;

      return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition">
          <td class="px-4 py-3 flex items-center gap-3">
            <img src="${avatarUrl}" onerror="this.src='${fallbackUrl}'" class="w-8 h-8 rounded-lg shadow opacity-70">
            <div>
              <span class="font-bold text-white text-xs block line-through text-rose-300">${player.name}</span>
              <span class="text-[10px] font-mono text-slate-400">${player.uuid || 'N/A'}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-slate-300 text-xs">${player.reason || 'Banned by operator'}</td>
          <td class="px-4 py-3 text-slate-400 text-[11px]">${player.created || 'N/A'}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="playerManager.unbanPlayer('${player.name}')" class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition">
              Pardon (Unban)
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3">Player</th>
                <th class="px-4 py-3">Ban Reason</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.length > 0 ? rowsHtml : `
                <tr>
                  <td colspan="4" class="px-4 py-10 text-center text-slate-400">
                    No banned players on record.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * 5. Banned IPs Tab
   */
  renderBannedIpsTab(container) {
    let list = this.data.bannedIps || [];

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.ip && p.ip.includes(this.searchQuery)) ||
        (p.reason && p.reason.toLowerCase().includes(this.searchQuery))
      );
    }

    const rowsHtml = list.map(item => {
      return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition">
          <td class="px-4 py-3 font-mono text-rose-300 font-bold">${item.ip}</td>
          <td class="px-4 py-3 text-slate-300 text-xs">${item.reason || 'IP banned by operator'}</td>
          <td class="px-4 py-3 text-slate-400 text-[11px]">${item.created || 'N/A'}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="playerManager.unbanIp('${item.ip}')" class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition">
              Pardon IP
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3">IP Address</th>
                <th class="px-4 py-3">Ban Reason</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.length > 0 ? rowsHtml : `
                <tr>
                  <td colspan="4" class="px-4 py-10 text-center text-slate-400">
                    No banned IP addresses on record.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * 6. All Players (Historical Cache) Tab
   */
  renderAllPlayersTab(container) {
    let list = this.data.allPlayers || [];

    if (this.searchQuery) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(this.searchQuery)) ||
        (p.uuid && p.uuid.toLowerCase().includes(this.searchQuery))
      );
    }

    const rowsHtml = list.map(player => {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/32`;
      const fallbackUrl = `https://minotar.net/avatar/${encodeURIComponent(player.name)}/32`;
      const isOp = (this.data.ops || []).some(o => o.name && o.name.toLowerCase() === player.name.toLowerCase());
      const isWl = (this.data.whitelist || []).some(w => w.name && w.name.toLowerCase() === player.name.toLowerCase());
      const isBanned = (this.data.bannedPlayers || []).some(b => b.name && b.name.toLowerCase() === player.name.toLowerCase());

      return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition">
          <td class="px-4 py-3 flex items-center gap-3">
            <img src="${avatarUrl}" onerror="this.src='${fallbackUrl}'" class="w-8 h-8 rounded-lg shadow cursor-pointer" onclick="playerManager.showPlayerDetailsModal('${player.name}')">
            <div>
              <span onclick="playerManager.showPlayerDetailsModal('${player.name}')" class="font-bold text-white text-xs block cursor-pointer hover:text-cyan-300">${player.name}</span>
              <span class="text-[10px] font-mono text-slate-400">${player.uuid}</span>
            </div>
          </td>
          <td class="px-4 py-3 space-x-1">
            ${isOp ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">OP</span>' : ''}
            ${isWl ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Whitelisted</span>' : ''}
            ${isBanned ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Banned</span>' : ''}
            ${!isOp && !isWl && !isBanned ? '<span class="text-[11px] text-slate-500 font-mono">Standard</span>' : ''}
          </td>
          <td class="px-4 py-3 text-right space-x-1">
            <button onclick="playerManager.showPlayerDetailsModal('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
              Inspect
            </button>
            ${isOp 
              ? `<button onclick="playerManager.revokeOp('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition">De-OP</button>`
              : `<button onclick="playerManager.promoteToOp('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition">Make OP</button>`
            }
            ${isWl
              ? `<button onclick="playerManager.removeFromWhitelist('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-slate-300 hover:bg-white/20 transition">Un-whitelist</button>`
              : `<button onclick="playerManager.addToWhitelist('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition">Whitelist</button>`
            }
            ${isBanned
              ? `<button onclick="playerManager.unbanPlayer('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition">Unban</button>`
              : `<button onclick="playerManager.showBanPlayerModal('${player.name}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition">Ban</button>`
            }
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3">Player Profile</th>
                <th class="px-4 py-3">Status Badges</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.length > 0 ? rowsHtml : `
                <tr>
                  <td colspan="3" class="px-4 py-10 text-center text-slate-400">
                    No historical player records found in usercache.json.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // DEEP PLAYER INSPECTION MODAL (INVENTORY, STATISTICS & ADVANCEMENTS)
  // =========================================================================

  async showPlayerDetailsModal(username) {
    this.inspectorPlayer = username;
    this.inspectorTab = 'inventory';
    this.inventoryView = 'player';
    this.statsCategory = 'mined';
    this.advCategory = 'story';

    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-5xl w-full border border-white/20 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
          <!-- Modal Top Header Bar -->
          <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div class="flex items-center gap-3.5">
              <img src="https://mc-heads.net/avatar/${encodeURIComponent(username)}/64" onerror="this.src='https://minotar.net/avatar/${encodeURIComponent(username)}/64'" class="w-12 h-12 rounded-xl ring-2 ring-cyan-400/40 shadow-xl">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-white">${username}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE (5s)
                  </span>
                </div>
                <p id="insp-uuid-text" class="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>Loading live playerdata...</span>
                </p>
              </div>
            </div>
            <button onclick="playerManager.closePlayerDetailsModal()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Inspector Tabs -->
          <div class="flex items-center justify-between gap-3 shrink-0 border-b border-white/10 pb-3">
            <div class="flex flex-wrap gap-1.5">
              <button onclick="playerManager.switchInspectorTab('inventory')" id="insp-tab-inventory" class="px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-2">
                <i data-lucide="backpack" class="w-4 h-4"></i> Inventory & Ender Chest
              </button>
              <button onclick="playerManager.switchInspectorTab('stats')" id="insp-tab-stats" class="px-4 py-2 rounded-xl text-xs font-bold transition text-slate-300 hover:bg-white/10 flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-4 h-4"></i> Statistics
              </button>
              <button onclick="playerManager.switchInspectorTab('advancements')" id="insp-tab-advancements" class="px-4 py-2 rounded-xl text-xs font-bold transition text-slate-300 hover:bg-white/10 flex items-center gap-2">
                <i data-lucide="trophy" class="w-4 h-4"></i> Advancements
              </button>
            </div>

            <!-- Quick Refresh Player Details -->
            <button onclick="playerManager.fetchAndRenderInspectorDetails(false)" class="px-3 py-1.5 rounded-xl text-xs font-semibold glass-btn text-slate-300 hover:text-white flex items-center gap-1.5">
              <i data-lucide="refresh-cw" id="insp-refresh-icon" class="w-3.5 h-3.5"></i> Reload
            </button>
          </div>

          <!-- Tab Content Body Area -->
          <div id="insp-body-container" class="flex-1 overflow-y-auto pr-1">
            <div class="text-center py-20 text-slate-400">
              <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
              <p class="text-xs">Reading live playerdata, stats and achievements...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.fetchAndRenderInspectorDetails(false);
    this.startLiveInspector(username);
  }

  closePlayerDetailsModal() {
    this.stopLiveInspector();
    const modal = document.getElementById('modal-container');
    if (modal) modal.innerHTML = '';
  }

  startLiveInspector(username) {
    this.stopLiveInspector();
    this.inspectorTimer = setInterval(() => {
      const modal = document.getElementById('modal-container');
      if (!modal || modal.innerHTML.trim() === '' || this.inspectorPlayer !== username) {
        this.stopLiveInspector();
        return;
      }
      this.fetchAndRenderInspectorDetails(true);
    }, 5000);
  }

  stopLiveInspector() {
    if (this.inspectorTimer) {
      clearInterval(this.inspectorTimer);
      this.inspectorTimer = null;
    }
  }

  async fetchAndRenderInspectorDetails(silent = false) {
    const icon = !silent ? document.getElementById('insp-refresh-icon') : null;
    if (icon) icon.classList.add('animate-spin');

    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/players/${encodeURIComponent(this.inspectorPlayer)}/details`);
      if (res && res.success) {
        this.inspectorDetails = res;
        
        // Update header uuid & live status
        const uuidEl = document.getElementById('insp-uuid-text');
        if (uuidEl) {
          uuidEl.innerHTML = `
            <span>${res.player.uuid}</span>
            <button onclick="app.copyToClipboard('${res.player.uuid}')" class="text-slate-400 hover:text-cyan-400"><i data-lucide="copy" class="w-3 h-3"></i></button>
            ${res.player.isOnline ? '<span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE</span>' : '<span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">OFFLINE</span>'}
          `;
        }

        this.renderInspectorActiveTab(silent);
      }
    } catch (err) {
      if (!silent) {
        console.error('[PlayerManager] Details error:', err);
        const body = document.getElementById('insp-body-container');
        if (body) {
          body.innerHTML = `
            <div class="glass-card p-8 rounded-2xl border border-rose-500/20 text-center text-rose-300 space-y-2">
              <i data-lucide="alert-circle" class="w-8 h-8 mx-auto text-rose-400"></i>
              <p class="text-sm font-bold">Could not load player data</p>
              <p class="text-xs text-slate-400">${err.message}</p>
            </div>
          `;
        }
      }
    } finally {
      if (icon) icon.classList.remove('animate-spin');
      if (!silent && window.lucide) lucide.createIcons();
    }
  }

  switchInspectorTab(tabKey) {
    this.inspectorTab = tabKey;

    ['inventory', 'stats', 'advancements'].forEach(t => {
      const btn = document.getElementById(`insp-tab-${t}`);
      if (btn) {
        if (t === tabKey) {
          btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-2';
        } else {
          btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-slate-300 hover:bg-white/10 flex items-center gap-2';
        }
      }
    });

    this.renderInspectorActiveTab(false);
  }

  renderInspectorActiveTab(silent = false) {
    const container = document.getElementById('insp-body-container');
    if (!container || !this.inspectorDetails) return;

    if (this.inspectorTab === 'inventory') {
      this.renderInspectorInventory(container, silent);
    } else if (this.inspectorTab === 'stats') {
      this.renderInspectorStats(container);
    } else if (this.inspectorTab === 'advancements') {
      this.renderInspectorAdvancements(container);
    }

    if (!silent && window.lucide) lucide.createIcons();
  }

  // --- 1. INVENTORY & ENDER CHEST RENDERER ---

  renderInspectorInventory(container, silent = false) {
    const inv = this.inspectorDetails.inventory;
    const isEnder = this.inventoryView === 'ender';

    const renderSlot = (item, slotIndex, placeholderIcon = '') => {
      if (!item) {
        return `
          <div class="w-11 h-11 bg-black/40 border border-white/10 rounded-xl relative flex items-center justify-center text-slate-600 select-none">
            ${placeholderIcon ? `<i data-lucide="${placeholderIcon}" class="w-4 h-4 opacity-30"></i>` : ''}
          </div>
        `;
      }

      return `
        <div class="w-11 h-11 bg-black/50 border border-white/15 rounded-xl relative flex items-center justify-center hover:border-cyan-400 hover:bg-cyan-500/10 transition group cursor-pointer shadow" title="${item.name} (x${item.count})\nID: ${item.id}">
          <img src="${item.iconUrl}" onerror="this.src='https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/items/barrier.png'" class="w-7 h-7 object-contain drop-shadow" alt="${item.name}">
          ${item.count > 1 ? `<span class="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow bg-black/70 px-1 rounded leading-none">${item.count}</span>` : ''}
        </div>
      `;
    };

    // Calculate vital percentages
    const hpPct = Math.min(100, Math.max(0, Math.round((inv.health / 20) * 100)));
    const foodPct = Math.min(100, Math.max(0, Math.round((inv.foodLevel / 20) * 100)));
    const xpPct = Math.min(100, Math.max(0, inv.xpProgress || 0));

    // Preserve any active input values during live updates
    const prevItemVal = document.getElementById('insp-quick-item')?.value || 'diamond';
    const prevCountVal = document.getElementById('insp-quick-count')?.value || '16';

    const dimName = (inv.dimension || 'minecraft:overworld').replace('minecraft:', '');
    const dimDisplay = dimName === 'the_nether' ? '🔥 The Nether' : dimName === 'the_end' ? '🌌 The End' : '🌍 Overworld';

    container.innerHTML = `
      <div class="space-y-4 animate-fade-in">
        <!-- Vitals & Location Bar (Live Animated) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="glass-card p-3 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>Health Points</span>
              <span class="font-mono text-rose-400">${inv.health} / 20</span>
            </span>
            <div class="text-rose-400 text-lg font-black font-mono flex items-center gap-1.5">
              <span>❤️ ${inv.health}</span>
            </div>
            <div class="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
              <div class="h-full ${inv.health > 10 ? 'bg-rose-500' : 'bg-rose-600'} transition-all duration-300" style="width: ${hpPct}%"></div>
            </div>
          </div>

          <div class="glass-card p-3 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>Food / Hunger</span>
              <span class="font-mono text-amber-400">${inv.foodLevel} / 20</span>
            </span>
            <div class="text-amber-400 text-lg font-black font-mono flex items-center gap-1.5">
              <span>🍗 ${inv.foodLevel}</span>
            </div>
            <div class="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 transition-all duration-300" style="width: ${foodPct}%"></div>
            </div>
          </div>

          <div class="glass-card p-3 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>Experience</span>
              <span class="font-mono text-emerald-400">${xpPct}%</span>
            </span>
            <div class="text-emerald-400 text-lg font-black font-mono flex items-center gap-1.5">
              <span>⚡ Lv ${inv.xpLevel}</span>
            </div>
            <div class="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-400 transition-all duration-300" style="width: ${xpPct}%"></div>
            </div>
          </div>

          <div class="glass-card p-3 rounded-2xl border border-white/5 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-slate-400">Live Coordinates</span>
              <span class="text-[10px] font-bold text-cyan-400">${dimDisplay}</span>
            </div>
            <p class="text-xs font-mono text-cyan-300 truncate font-semibold">X:${inv.pos[0]} Y:${inv.pos[1]} Z:${inv.pos[2]}</p>
            <div class="flex items-center gap-1 pt-0.5">
              <button onclick="playerManager.promptTeleport('${this.inspectorPlayer}')" class="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 underline underline-offset-2">
                <i data-lucide="navigation" class="w-3 h-3"></i> Teleport
              </button>
            </div>
          </div>
        </div>

        <!-- Gamemode Switcher & Live Quick Actions Toolbar -->
        <div class="glass-card p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <!-- Live Gamemode Selector Pills -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-bold uppercase text-slate-400 mr-1">Mode:</span>
            ${['survival', 'creative', 'adventure', 'spectator'].map(mode => `
              <button onclick="playerManager.setPlayerGamemode('${this.inspectorPlayer}', '${mode}')" class="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition ${inv.gameType === mode ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/30' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}">
                ${mode === 'survival' ? '⚔️ Survival' : mode === 'creative' ? '🎨 Creative' : mode === 'adventure' ? '🗺️ Adventure' : '👁️ Spectator'}
              </button>
            `).join('')}
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button onclick="playerManager.quickHeal('${this.inspectorPlayer}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-1">
              ❤️ Heal
            </button>
            <button onclick="playerManager.quickFeed('${this.inspectorPlayer}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 transition flex items-center gap-1">
              🍗 Feed
            </button>
            <button onclick="playerManager.promptSetXp('${this.inspectorPlayer}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition flex items-center gap-1">
              ⚡ Set XP
            </button>
            <button onclick="playerManager.openCustomPlayerModal('${this.inspectorPlayer}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition flex items-center gap-1 shadow-sm shadow-purple-500/10">
              ⚙️ Custom
            </button>
            <button onclick="playerManager.clearInventory('${this.inspectorPlayer}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20 transition flex items-center gap-1">
              🧹 Clear
            </button>
          </div>
        </div>

        <!-- Inventory / Ender Chest Switch & Quick Give Item Bar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
          <div class="flex gap-1">
            <button onclick="playerManager.setInventoryView('player')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${!isEnder ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
              🎒 Main Inventory
            </button>
            <button onclick="playerManager.setInventoryView('ender')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${isEnder ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'}">
              🔮 Ender Chest
            </button>
          </div>

          <!-- Quick Give Item Bar -->
          <div class="flex items-center gap-1.5">
            <select id="insp-quick-item" class="bg-black/60 border border-white/10 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400">
              <option value="diamond">💎 Diamond</option>
              <option value="golden_apple">🍏 Golden Apple</option>
              <option value="enchanted_golden_apple">✨ Enchanted Apple</option>
              <option value="netherite_sword">🗡️ Netherite Sword</option>
              <option value="netherite_pickaxe">⛏️ Netherite Pickaxe</option>
              <option value="elytra">🪽 Elytra</option>
              <option value="totem_of_undying">🗿 Totem of Undying</option>
              <option value="cooked_beef">🥩 Cooked Beef</option>
              <option value="iron_ingot">🪙 Iron Ingot</option>
              <option value="ender_pearl">🔮 Ender Pearl</option>
              <option value="experience_bottle">🧪 Bottle o' XP</option>
            </select>
            <input id="insp-quick-count" type="number" min="1" max="64" value="${prevCountVal}" class="w-14 bg-black/60 border border-white/10 text-white text-xs rounded-xl px-2 py-1.5 text-center font-mono focus:outline-none focus:border-cyan-400">
            <button onclick="playerManager.submitInspectorGive()" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center gap-1">
              🎁 Give
            </button>
          </div>
        </div>

        <!-- Inventory Grid Container -->
        ${!isEnder ? `
          <!-- Main Player Inventory GUI -->
          <div class="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-center gap-8">
            <!-- Left: Armor Slots & Offhand -->
            <div class="flex md:flex-col items-center gap-2 p-3 rounded-2xl bg-black/30 border border-white/5">
              <span class="text-[9px] font-bold uppercase text-slate-500 tracking-wider md:mb-1">Armor</span>
              ${renderSlot(inv.armor.helmet, 103, 'shield')}
              ${renderSlot(inv.armor.chestplate, 102, 'shield')}
              ${renderSlot(inv.armor.leggings, 101, 'shield')}
              ${renderSlot(inv.armor.boots, 100, 'shield')}
              <div class="w-full h-px bg-white/10 my-1 hidden md:block"></div>
              <span class="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Offhand</span>
              ${renderSlot(inv.offhand, -106, 'shield-alert')}
            </div>

            <!-- Right: 3x9 Main Inventory + 1x9 Hotbar -->
            <div class="space-y-4">
              <!-- 3 Rows of 9 Main Slots -->
              <div class="space-y-1.5 p-3 rounded-2xl bg-black/30 border border-white/5">
                <div class="flex justify-between items-center px-1 mb-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Inventory</span>
                  <span class="text-[10px] text-slate-500">27 Slots</span>
                </div>
                <div class="grid grid-cols-9 gap-1.5">
                  ${inv.main.map((item, idx) => renderSlot(item, idx + 9)).join('')}
                </div>
              </div>

              <!-- 1 Row of 9 Hotbar Slots -->
              <div class="p-3 rounded-2xl bg-black/40 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 space-y-1.5">
                <div class="flex justify-between items-center px-1">
                  <span class="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Hotbar</span>
                  <span class="text-[10px] text-cyan-400/60 font-mono">1 - 9</span>
                </div>
                <div class="grid grid-cols-9 gap-1.5">
                  ${inv.hotbar.map((item, idx) => renderSlot(item, idx)).join('')}
                </div>
              </div>
            </div>
          </div>
        ` : `
          <!-- Ender Chest GUI (3x9) -->
          <div class="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-purple-950/10 flex flex-col items-center justify-center space-y-3">
            <div class="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <i data-lucide="archive" class="w-4 h-4"></i> Ender Chest Storage (27 Slots)
            </div>
            <div class="p-4 rounded-2xl bg-black/40 border border-purple-500/30 grid grid-cols-9 gap-1.5 shadow-2xl">
              ${inv.enderChest.map((item, idx) => renderSlot(item, idx)).join('')}
            </div>
          </div>
        `}
      </div>
    `;
  }

  setInventoryView(view) {
    this.inventoryView = view;
    const container = document.getElementById('insp-body-container');
    if (container) this.renderInspectorInventory(container);
    if (window.lucide) lucide.createIcons();
  }

  // --- 2. STATISTICS RENDERER ---

  renderInspectorStats(container) {
    const stats = this.inspectorDetails.stats;
    const cat = this.statsCategory;

    const catData = stats[cat] || [];

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Overview Metrics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3 h-3 text-cyan-400"></i> Total Playtime
            </span>
            <p class="text-xl font-black text-cyan-300 font-mono">${stats.playTimeFormatted}</p>
          </div>
          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <i data-lucide="skull" class="w-3 h-3 text-rose-400"></i> Deaths
            </span>
            <p class="text-xl font-black text-rose-300 font-mono">${stats.deaths}</p>
          </div>
          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <i data-lucide="swords" class="w-3 h-3 text-amber-400"></i> Mob Kills
            </span>
            <p class="text-xl font-black text-amber-300 font-mono">${stats.mobKills}</p>
          </div>
          <div class="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <i data-lucide="footprints" class="w-3 h-3 text-emerald-400"></i> Distance Walked
            </span>
            <p class="text-xl font-black text-emerald-300 font-mono">${stats.distanceWalkedKm} km</p>
          </div>
        </div>

        <!-- Secondary metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div class="glass-card p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <span class="text-slate-400">Player Kills:</span>
            <span class="font-bold text-white font-mono">${stats.playerKills}</span>
          </div>
          <div class="glass-card p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <span class="text-slate-400">Distance Flown:</span>
            <span class="font-bold text-white font-mono">${stats.distanceFlownKm} km</span>
          </div>
          <div class="glass-card p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <span class="text-slate-400">Jumps:</span>
            <span class="font-bold text-white font-mono">${stats.jumps}</span>
          </div>
          <div class="glass-card p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <span class="text-slate-400">Damage Dealt:</span>
            <span class="font-bold text-white font-mono">${stats.damageDealt}</span>
          </div>
        </div>

        <!-- Category Selector -->
        <div class="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
          <button onclick="playerManager.setStatsCategory('mined')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${cat === 'mined' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
            ⛏️ Blocks Mined (${stats.mined.length})
          </button>
          <button onclick="playerManager.setStatsCategory('killed')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${cat === 'killed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
            🗡️ Mobs Slain (${stats.killed.length})
          </button>
          <button onclick="playerManager.setStatsCategory('crafted')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${cat === 'crafted' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
            🔨 Items Crafted (${stats.crafted.length})
          </button>
          <button onclick="playerManager.setStatsCategory('used')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${cat === 'used' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
            📦 Items Used (${stats.used.length})
          </button>
        </div>

        <!-- Items Table / Grid -->
        <div class="glass-panel p-4 rounded-2xl border border-white/10 max-h-80 overflow-y-auto">
          ${catData.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              ${catData.map(item => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img src="${item.iconUrl}" onerror="this.src='https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.4/items/barrier.png'" class="w-6 h-6 object-contain shrink-0">
                    <span class="text-xs text-slate-200 truncate">${item.name}</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-cyan-300 ml-2">x${item.count.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-center py-10 text-slate-400 text-xs">No records tracked in this category yet.</p>
          `}
        </div>
      </div>
    `;
  }

  setStatsCategory(cat) {
    this.statsCategory = cat;
    const container = document.getElementById('insp-body-container');
    if (container) this.renderInspectorStats(container);
    if (window.lucide) lucide.createIcons();
  }

  // --- 3. ADVANCEMENTS RENDERER ---

  renderInspectorAdvancements(container) {
    const adv = this.inspectorDetails.advancements;
    const activeCatKey = this.advCategory;
    const activeCategory = adv.categories[activeCatKey] || { advancements: [], completed: 0, total: 0, percentage: 0 };

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Progress Bar Card -->
        <div class="glass-card p-4 rounded-2xl border border-white/10 space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-white flex items-center gap-1.5">
              <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i> Overall Advancements Completion
            </span>
            <span class="font-mono text-cyan-300 font-bold">${adv.completed} / ${adv.total} (${adv.percentage}%)</span>
          </div>
          <div class="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500" style="width: ${adv.percentage}%"></div>
          </div>
        </div>

        <!-- Category Buttons & Bulk Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 border-b border-white/10 pb-3">
          <div class="flex flex-wrap gap-1.5">
            ${Object.entries(adv.categories).map(([k, c]) => `
              <button onclick="playerManager.setAdvCategory('${k}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeCatKey === k ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}">
                <i data-lucide="${c.icon}" class="w-3.5 h-3.5"></i>
                ${c.name} (${c.completed}/${c.total})
              </button>
            `).join('')}
          </div>

          <!-- Bulk Grant/Reset -->
          <div class="flex items-center gap-1.5">
            <button onclick="playerManager.grantAdvancement('${this.inspectorPlayer}', 'everything')" class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition">
              Grant All
            </button>
            <button onclick="playerManager.revokeAdvancement('${this.inspectorPlayer}', 'everything')" class="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition">
              Reset All
            </button>
          </div>
        </div>

        <!-- Advancements Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          ${activeCategory.advancements.map(a => `
            <div class="p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${a.done ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-white/5 bg-white/5 opacity-70'}">
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <div class="p-2 rounded-xl shrink-0 ${a.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                  <i data-lucide="${a.done ? 'check-circle-2' : 'lock'}" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs ${a.done ? 'text-emerald-300' : 'text-slate-200'} truncate">${a.title}</span>
                    <span class="text-[9px] px-1.5 py-0.2 rounded font-mono ${a.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}">${a.done ? 'DONE' : 'LOCKED'}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">${a.desc}</p>
                </div>
              </div>

              <div class="shrink-0">
                ${a.done ? `
                  <button onclick="playerManager.revokeAdvancement('${this.inspectorPlayer}', '${a.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition">
                    Revoke
                  </button>
                ` : `
                  <button onclick="playerManager.grantAdvancement('${this.inspectorPlayer}', '${a.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition">
                    Grant
                  </button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  setAdvCategory(cat) {
    this.advCategory = cat;
    const container = document.getElementById('insp-body-container');
    if (container) this.renderInspectorAdvancements(container);
    if (window.lucide) lucide.createIcons();
  }

  async grantAdvancement(username, advancement) {
    await this.sendPlayerAction('advancement-grant', { username, advancement });
    await this.fetchAndRenderInspectorDetails();
  }

  async revokeAdvancement(username, advancement) {
    if (advancement === 'everything' && !confirm(`Reset ALL advancements for ${username}?`)) return;
    await this.sendPlayerAction('advancement-revoke', { username, advancement });
    await this.fetchAndRenderInspectorDetails();
  }

  promptSetXp(username) {
    this.openCustomPlayerModal(username, 'xp');
  }

  // =========================================================================
  // CUSTOM PLAYER ATTRIBUTES, EFFECTS & COMMANDS MODAL
  // =========================================================================

  openCustomPlayerModal(username, initialTab = 'vitals') {
    this.customModalPlayer = username;
    this.customActiveTab = initialTab;

    let subModal = document.getElementById('custom-player-modal-container');
    if (!subModal) {
      subModal = document.createElement('div');
      subModal.id = 'custom-player-modal-container';
      document.body.appendChild(subModal);
    }

    subModal.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-fade-in">
        <div class="glass-panel p-5 sm:p-6 rounded-3xl max-w-lg w-full border border-purple-500/30 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <i data-lucide="sliders" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-white">Custom Player Controls</h4>
                  <span class="text-[10px] px-2 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">${username}</span>
                </div>
                <p class="text-xs text-slate-400">Custom health, hunger, XP, potion effects & commands</p>
              </div>
            </div>
            <button onclick="playerManager.closeCustomPlayerModal()" class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Navigation Subtabs -->
          <div class="flex flex-wrap gap-1 border-b border-white/10 pb-2.5 shrink-0">
            <button onclick="playerManager.switchCustomTab('vitals')" id="cust-tab-vitals" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              ❤️ Health & Food
            </button>
            <button onclick="playerManager.switchCustomTab('xp')" id="cust-tab-xp" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              ⚡ Experience (XP)
            </button>
            <button onclick="playerManager.switchCustomTab('effects')" id="cust-tab-effects" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              🧪 Potion Effects
            </button>
            <button onclick="playerManager.switchCustomTab('command')" id="cust-tab-command" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              💻 Custom Command
            </button>
          </div>

          <!-- Tab Content Body Area -->
          <div id="cust-tab-body" class="flex-1 overflow-y-auto space-y-4 pr-1">
          </div>
        </div>
      </div>
    `;

    this.switchCustomTab(initialTab);
    if (window.lucide) lucide.createIcons();
  }

  closeCustomPlayerModal() {
    const subModal = document.getElementById('custom-player-modal-container');
    if (subModal) subModal.remove();
  }

  switchCustomTab(tabKey) {
    this.customActiveTab = tabKey;

    ['vitals', 'xp', 'effects', 'command'].forEach(t => {
      const btn = document.getElementById(`cust-tab-${t}`);
      if (btn) {
        if (t === tabKey) {
          btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1.5';
        } else {
          btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition text-slate-400 hover:text-white flex items-center gap-1.5';
        }
      }
    });

    const body = document.getElementById('cust-tab-body');
    if (!body) return;

    if (tabKey === 'vitals') {
      this.renderCustomVitalsTab(body);
    } else if (tabKey === 'xp') {
      this.renderCustomXpTab(body);
    } else if (tabKey === 'effects') {
      this.renderCustomEffectsTab(body);
    } else if (tabKey === 'command') {
      this.renderCustomCommandTab(body);
    }

    if (window.lucide) lucide.createIcons();
  }

  renderCustomVitalsTab(container) {
    const inv = this.inspectorDetails?.inventory || { health: 20, foodLevel: 20 };
    container.innerHTML = `
      <div class="space-y-4 animate-fade-in text-xs">
        <!-- Health Section -->
        <div class="glass-card p-4 rounded-2xl border border-rose-500/20 space-y-3 bg-rose-950/10">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center gap-1.5 text-xs">
              <span class="text-rose-400">❤️</span> Custom Health & Max Hearts
            </span>
            <span id="cust-hp-val" class="font-mono text-rose-300 font-bold">${inv.health} HP (${inv.health / 2} Hearts)</span>
          </div>

          <div class="flex items-center gap-3">
            <input type="range" id="cust-hp-slider" min="1" max="40" value="${inv.health}" oninput="document.getElementById('cust-hp-input').value = this.value; document.getElementById('cust-hp-val').innerText = this.value + ' HP (' + (this.value/2) + ' Hearts)'" class="flex-1 accent-rose-500">
            <input type="number" id="cust-hp-input" min="1" max="100" value="${inv.health}" oninput="document.getElementById('cust-hp-slider').value = this.value; document.getElementById('cust-hp-val').innerText = this.value + ' HP (' + (this.value/2) + ' Hearts)'" class="w-16 bg-black/60 border border-white/10 text-white rounded-xl px-2 py-1 text-center font-mono">
          </div>

          <!-- Health Presets -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
            <button onclick="playerManager.setCustomHpField(1)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">💔 1 HP (0.5♥)</button>
            <button onclick="playerManager.setCustomHpField(10)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">❤️ 10 HP (5♥)</button>
            <button onclick="playerManager.setCustomHpField(20)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">💖 20 HP (10♥)</button>
            <button onclick="playerManager.setCustomHpField(40)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">🛡️ 40 HP (20♥)</button>
          </div>

          <button onclick="playerManager.applyCustomHealth()" class="w-full py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center justify-center gap-1.5">
            ❤️ Set Health
          </button>
        </div>

        <!-- Food / Hunger Section -->
        <div class="glass-card p-4 rounded-2xl border border-amber-500/20 space-y-3 bg-amber-950/10">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center gap-1.5 text-xs">
              <span class="text-amber-400">🍗</span> Custom Hunger / Food Level
            </span>
            <span id="cust-food-val" class="font-mono text-amber-300 font-bold">${inv.foodLevel} / 20</span>
          </div>

          <div class="flex items-center gap-3">
            <input type="range" id="cust-food-slider" min="0" max="20" value="${inv.foodLevel}" oninput="document.getElementById('cust-food-input').value = this.value; document.getElementById('cust-food-val').innerText = this.value + ' / 20'" class="flex-1 accent-amber-500">
            <input type="number" id="cust-food-input" min="0" max="20" value="${inv.foodLevel}" oninput="document.getElementById('cust-food-slider').value = this.value; document.getElementById('cust-food-val').innerText = this.value + ' / 20'" class="w-16 bg-black/60 border border-white/10 text-white rounded-xl px-2 py-1 text-center font-mono">
          </div>

          <!-- Food Presets -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
            <button onclick="playerManager.setCustomFoodField(0)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">💀 0 (Starving)</button>
            <button onclick="playerManager.setCustomFoodField(10)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">🍗 10 (Half)</button>
            <button onclick="playerManager.setCustomFoodField(20)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">🥩 20 (Full)</button>
          </div>

          <button onclick="playerManager.applyCustomFood()" class="w-full py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5">
            🍗 Set Food Level
          </button>
        </div>
      </div>
    `;
  }

  renderCustomXpTab(container) {
    const inv = this.inspectorDetails?.inventory || { xpLevel: 0 };
    container.innerHTML = `
      <div class="space-y-4 animate-fade-in text-xs">
        <div class="glass-card p-4 rounded-2xl border border-emerald-500/20 space-y-3 bg-emerald-950/10">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center gap-1.5">
              <span class="text-emerald-400">⚡</span> Custom Experience Controls
            </span>
            <span class="font-mono text-emerald-300 font-bold">Current: Lv ${inv.xpLevel}</span>
          </div>

          <!-- Operation Mode -->
          <div class="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <button onclick="playerManager.setXpMode('set')" id="xp-mode-set" class="py-1.5 rounded-lg font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition text-center">
              Set Level
            </button>
            <button onclick="playerManager.setXpMode('add')" id="xp-mode-add" class="py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition text-center">
              Add Levels
            </button>
            <button onclick="playerManager.setXpMode('points')" id="xp-mode-points" class="py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition text-center">
              Set Points
            </button>
          </div>

          <!-- XP Amount Input -->
          <div class="space-y-1">
            <label class="text-[11px] text-slate-400 font-semibold">Amount / Level Value:</label>
            <input type="number" id="cust-xp-val-input" min="0" max="100000" value="30" class="w-full bg-black/60 border border-white/10 text-white rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-400">
          </div>

          <!-- Quick Presets -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
            <button onclick="playerManager.setXpInput(0)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">0 (Reset)</button>
            <button onclick="playerManager.setXpInput(15)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">15</button>
            <button onclick="playerManager.setXpInput(30)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">30 (Enchant)</button>
            <button onclick="playerManager.setXpInput(50)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">50</button>
            <button onclick="playerManager.setXpInput(100)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">100</button>
            <button onclick="playerManager.setXpInput(1000)" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">1,000</button>
          </div>

          <button onclick="playerManager.applyCustomXp()" class="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center justify-center gap-1.5">
            ⚡ Apply Experience
          </button>
        </div>
      </div>
    `;
    this.customXpMode = 'set';
  }

  renderCustomEffectsTab(container) {
    const effects = [
      { id: 'speed', name: 'Speed ⚡' },
      { id: 'strength', name: 'Strength 🗡️' },
      { id: 'haste', name: 'Haste ⛏️' },
      { id: 'regeneration', name: 'Regeneration 💖' },
      { id: 'resistance', name: 'Resistance 🛡️' },
      { id: 'fire_resistance', name: 'Fire Resistance 🔥' },
      { id: 'night_vision', name: 'Night Vision 👁️' },
      { id: 'invisibility', name: 'Invisibility 👻' },
      { id: 'water_breathing', name: 'Water Breathing 🤿' },
      { id: 'jump_boost', name: 'Jump Boost 🦘' },
      { id: 'glowing', name: 'Glowing ✨' },
      { id: 'levitation', name: 'Levitation 🎈' },
      { id: 'slow_falling', name: 'Slow Falling 🪂' },
      { id: 'hero_of_the_village', name: 'Hero of the Village 👑' },
      { id: 'darkness', name: 'Darkness 🌑' }
    ];

    container.innerHTML = `
      <div class="space-y-4 animate-fade-in text-xs">
        <div class="glass-card p-4 rounded-2xl border border-purple-500/20 space-y-3 bg-purple-950/10">
          <div class="space-y-1">
            <label class="text-[11px] text-slate-400 font-semibold">Select Potion Effect:</label>
            <select id="cust-effect-id" class="w-full bg-black/60 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400">
              ${effects.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] text-slate-400 font-semibold">Duration (seconds):</label>
              <input type="number" id="cust-effect-dur" min="1" max="999999" value="60" class="w-full bg-black/60 border border-white/10 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-purple-400">
            </div>

            <div class="space-y-1">
              <label class="text-[11px] text-slate-400 font-semibold">Level / Amplifier:</label>
              <select id="cust-effect-amp" class="w-full bg-black/60 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400">
                <option value="0">Level 1 (I)</option>
                <option value="1">Level 2 (II)</option>
                <option value="2">Level 3 (III)</option>
                <option value="3">Level 4 (IV)</option>
                <option value="4">Level 5 (V)</option>
                <option value="254">Max (255)</option>
              </select>
            </div>
          </div>

          <!-- Quick Duration Presets -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[10px] text-slate-400 font-semibold mr-1">Duration:</span>
            <button onclick="document.getElementById('cust-effect-dur').value=30" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">30s</button>
            <button onclick="document.getElementById('cust-effect-dur').value=60" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">60s</button>
            <button onclick="document.getElementById('cust-effect-dur').value=300" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">5 Min</button>
            <button onclick="document.getElementById('cust-effect-dur').value=99999" class="px-2 py-0.5 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">Infinite</button>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" id="cust-effect-hide" class="rounded accent-purple-500">
            <label for="cust-effect-hide" class="text-slate-300 text-[11px] cursor-pointer">Hide potion swirl particles</label>
          </div>

          <div class="flex gap-2 pt-1">
            <button onclick="playerManager.applyPotionEffect()" class="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition flex items-center justify-center gap-1.5">
              ✨ Apply Effect
            </button>
            <button onclick="playerManager.clearPotionEffects()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-slate-300 hover:bg-white/20 transition flex items-center gap-1.5">
              🧼 Clear All
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderCustomCommandTab(container) {
    container.innerHTML = `
      <div class="space-y-4 animate-fade-in text-xs">
        <div class="glass-card p-4 rounded-2xl border border-cyan-500/20 space-y-3 bg-cyan-950/10">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-[11px] text-slate-400 font-semibold">Command to Execute:</label>
              <span class="text-[10px] font-mono text-cyan-300">Variables: {player}, {uuid}</span>
            </div>
            <textarea id="cust-cmd-input" rows="3" placeholder="e.g. title {player} title {\\"text\\":\\"Welcome!\\"}" class="w-full bg-black/60 border border-white/10 text-white rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-cyan-400"></textarea>
          </div>

          <!-- Command Presets -->
          <div class="space-y-1.5">
            <span class="text-[10px] text-slate-400 font-semibold">Quick Command Presets:</span>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="playerManager.setCommandPreset('summon lightning_bolt {player}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[11px] text-slate-300 border border-white/5 truncate">
                ⚡ Strike Lightning
              </button>
              <button onclick="playerManager.setCommandPreset('particle flame ~ ~1 ~ 0.5 0.5 0.5 0.1 100')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[11px] text-slate-300 border border-white/5 truncate">
                🔥 Flame Particles
              </button>
              <button onclick="playerManager.setCommandPreset('effect give {player} levitation 5 10')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[11px] text-slate-300 border border-white/5 truncate">
                🚀 Launch Skyward
              </button>
              <button onclick="playerManager.setCommandPreset('attribute {player} max_health base set 40')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[11px] text-slate-300 border border-white/5 truncate">
                🛡️ 20 Hearts (40 HP)
              </button>
            </div>
          </div>

          <button onclick="playerManager.executeCustomCommand()" class="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center justify-center gap-1.5">
            🚀 Run Console Command
          </button>
        </div>
      </div>
    `;
  }

  setCustomHpField(val) {
    const slider = document.getElementById('cust-hp-slider');
    const input = document.getElementById('cust-hp-input');
    const valText = document.getElementById('cust-hp-val');
    if (slider) slider.value = val;
    if (input) input.value = val;
    if (valText) valText.innerText = `${val} HP (${val / 2} Hearts)`;
  }

  setCustomFoodField(val) {
    const slider = document.getElementById('cust-food-slider');
    const input = document.getElementById('cust-food-input');
    const valText = document.getElementById('cust-food-val');
    if (slider) slider.value = val;
    if (input) input.value = val;
    if (valText) valText.innerText = `${val} / 20`;
  }

  setXpMode(mode) {
    this.customXpMode = mode;
    ['set', 'add', 'points'].forEach(m => {
      const btn = document.getElementById(`xp-mode-${m}`);
      if (btn) {
        if (m === mode) {
          btn.className = 'py-1.5 rounded-lg font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition text-center';
        } else {
          btn.className = 'py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition text-center';
        }
      }
    });
  }

  setXpInput(val) {
    const el = document.getElementById('cust-xp-val-input');
    if (el) el.value = val;
  }

  setCommandPreset(cmd) {
    const el = document.getElementById('cust-cmd-input');
    if (el) el.value = cmd;
  }

  async applyCustomHealth() {
    const val = parseInt(document.getElementById('cust-hp-input')?.value || '20', 10);
    await this.sendPlayerAction('custom-health', { username: this.customModalPlayer, health: val });
  }

  async applyCustomFood() {
    const val = parseInt(document.getElementById('cust-food-input')?.value || '20', 10);
    await this.sendPlayerAction('custom-food', { username: this.customModalPlayer, food: val });
  }

  async applyCustomXp() {
    const val = parseInt(document.getElementById('cust-xp-val-input')?.value || '30', 10);
    await this.sendPlayerAction('set-xp', { username: this.customModalPlayer, amount: val, mode: this.customXpMode || 'set' });
  }

  async applyPotionEffect() {
    const effect = document.getElementById('cust-effect-id')?.value || 'speed';
    const duration = parseInt(document.getElementById('cust-effect-dur')?.value || '60', 10);
    const amplifier = parseInt(document.getElementById('cust-effect-amp')?.value || '0', 10);
    const hideParticles = document.getElementById('cust-effect-hide')?.checked || false;
    await this.sendPlayerAction('potion-effect', { username: this.customModalPlayer, effect, duration, amplifier, hideParticles });
  }

  async clearPotionEffects() {
    await this.sendPlayerAction('clear-effects', { username: this.customModalPlayer });
  }

  async executeCustomCommand() {
    const command = document.getElementById('cust-cmd-input')?.value?.trim();
    if (!command) return;
    await this.sendPlayerAction('custom-command', { username: this.customModalPlayer, command });
  }

  async quickHeal(username) {
    await this.sendPlayerAction('heal', { username });
  }

  async quickFeed(username) {
    await this.sendPlayerAction('feed', { username });
  }

  async setPlayerGamemode(username, gamemode) {
    await this.sendPlayerAction('gamemode', { username, gamemode });
  }

  promptTeleport(username) {
    const target = prompt(`Teleport ${username} to coordinates or player (e.g. 0 100 0 or Steve):`, '0 100 0');
    if (target && target.trim()) {
      this.sendPlayerAction('teleport', { username, target: target.trim() });
    }
  }

  async submitInspectorGive() {
    const itemEl = document.getElementById('insp-quick-item');
    const countEl = document.getElementById('insp-quick-count');
    if (!itemEl || !this.inspectorPlayer) return;
    const item = itemEl.value;
    const count = parseInt(countEl?.value || '16', 10) || 1;
    await this.sendPlayerAction('give', { username: this.inspectorPlayer, item, amount: count });
  }

  // --- General Action Execution ---

  async sendPlayerAction(action, payload = {}) {
    try {
      const body = { action, ...payload };
      const res = await app.api(`/api/servers/${this.currentServerId}/players/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res && res.success) {
        app.showToast(res.message || 'Action executed successfully!', 'success');
        await this.loadData();
        // Immediately trigger live inspector update if modal is active
        if (this.inspectorPlayer) {
          setTimeout(() => this.fetchAndRenderInspectorDetails(false), 200);
        }
      } else {
        app.showToast(res.error || 'Failed to execute player action.', 'error');
      }
    } catch (err) {
      console.error('[PlayerManager] Action error:', err);
      app.showToast(err.message || 'Network error during player action', 'error');
    }
  }

  async toggleWhitelist() {
    const nextState = !this.data.whitelistEnabled;
    await this.sendPlayerAction('whitelist-toggle', { enabled: nextState });
  }

  async addToWhitelist(username) {
    if (!username) return;
    await this.sendPlayerAction('whitelist-add', { username });
  }

  async removeFromWhitelist(username) {
    if (!confirm(`Are you sure you want to remove ${username} from the whitelist?`)) return;
    await this.sendPlayerAction('whitelist-remove', { username });
  }

  async promoteToOp(username, level = 4) {
    await this.sendPlayerAction('op', { username, level });
  }

  async revokeOp(username) {
    if (!confirm(`Are you sure you want to revoke Operator permissions for ${username}?`)) return;
    await this.sendPlayerAction('deop', { username });
  }

  async unbanPlayer(username) {
    if (!confirm(`Pardon and unban ${username}?`)) return;
    await this.sendPlayerAction('unban', { username });
  }

  async unbanIp(ip) {
    if (!confirm(`Pardon and unban IP ${ip}?`)) return;
    await this.sendPlayerAction('unban-ip', { ip });
  }

  // --- Modals ---

  showAddWhitelistModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="user-check" class="w-4 h-4 text-cyan-400"></i> Add Player to Whitelist
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitAddWhitelist();" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Minecraft Username</label>
              <input type="text" id="modal-wl-username" placeholder="e.g. Steve" required class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow">
                Add to Whitelist
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('modal-wl-username').focus();
  }

  submitAddWhitelist() {
    const username = document.getElementById('modal-wl-username').value.trim();
    if (username) {
      document.getElementById('modal-container').innerHTML = '';
      this.addToWhitelist(username);
    }
  }

  showAddOpModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i> Promote to Server Operator
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitAddOp();" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Minecraft Username</label>
              <input type="text" id="modal-op-username" placeholder="e.g. Alex" required class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Permission Tier</label>
              <select id="modal-op-level" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900">
                <option value="4" selected>Level 4 - Full Server Administrator</option>
                <option value="3">Level 3 - Moderator (Kick, Ban, Whitelist, OP)</option>
                <option value="2">Level 2 - Cheat Commands & Command Blocks</option>
                <option value="1">Level 1 - Spawn Protection Bypass Only</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow">
                Grant Operator
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('modal-op-username').focus();
  }

  submitAddOp() {
    const username = document.getElementById('modal-op-username').value.trim();
    const level = document.getElementById('modal-op-level').value;
    if (username) {
      document.getElementById('modal-container').innerHTML = '';
      this.promoteToOp(username, level);
    }
  }

  showChangeOpLevelModal(username, currentLevel) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i> Change OP Level: ${username}
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitChangeOpLevel('${username}');" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">New Permission Tier</label>
              <select id="modal-change-op-level" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900">
                <option value="4" ${currentLevel == 4 ? 'selected' : ''}>Level 4 - Full Server Administrator</option>
                <option value="3" ${currentLevel == 3 ? 'selected' : ''}>Level 3 - Moderator (Kick, Ban, Whitelist, OP)</option>
                <option value="2" ${currentLevel == 2 ? 'selected' : ''}>Level 2 - Cheat Commands & Command Blocks</option>
                <option value="1" ${currentLevel == 1 ? 'selected' : ''}>Level 1 - Spawn Protection Bypass Only</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow">
                Save Level
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  submitChangeOpLevel(username) {
    const level = document.getElementById('modal-change-op-level').value;
    document.getElementById('modal-container').innerHTML = '';
    this.promoteToOp(username, level);
  }

  showBanPlayerModal(defaultUsername = '') {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-rose-400 flex items-center gap-2">
              <i data-lucide="ban" class="w-4 h-4"></i> Ban Minecraft Player
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitBanPlayer();" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Player Username</label>
              <input type="text" id="modal-ban-username" value="${defaultUsername}" placeholder="e.g. BadPlayer" required class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Reason for Ban</label>
              <input type="text" id="modal-ban-reason" placeholder="e.g. Griefing, Cheating, Rule violations" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow">
                Confirm Ban
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('modal-ban-username').focus();
  }

  submitBanPlayer() {
    const username = document.getElementById('modal-ban-username').value.trim();
    const reason = document.getElementById('modal-ban-reason').value.trim();
    if (username) {
      document.getElementById('modal-container').innerHTML = '';
      this.sendPlayerAction('ban', { username, reason });
    }
  }

  showBanIpModal(defaultIp = '') {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-rose-400 flex items-center gap-2">
              <i data-lucide="globe-lock" class="w-4 h-4"></i> Ban IP Address
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitBanIp();" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">IP Address or Player Name</label>
              <input type="text" id="modal-ban-ip" value="${defaultIp}" placeholder="e.g. 192.168.1.50 or PlayerName" required class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Reason for Ban</label>
              <input type="text" id="modal-ban-ip-reason" placeholder="e.g. Bot attack, Malicious network" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow">
                Confirm IP Ban
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('modal-ban-ip').focus();
  }

  submitBanIp() {
    const ip = document.getElementById('modal-ban-ip').value.trim();
    const reason = document.getElementById('modal-ban-ip-reason').value.trim();
    if (ip) {
      document.getElementById('modal-container').innerHTML = '';
      this.sendPlayerAction('ban-ip', { ip, reason });
    }
  }

  showKickModal(username) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-amber-400 flex items-center gap-2">
              <i data-lucide="log-out" class="w-4 h-4"></i> Kick Player: ${username}
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <form onsubmit="event.preventDefault(); playerManager.submitKick('${username}');" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Kick Reason (Visible to player)</label>
              <input type="text" id="modal-kick-reason" placeholder="e.g. AFK, Please reconnect" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow">
                Kick Player
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById('modal-kick-reason').focus();
  }

  submitKick(username) {
    const reason = document.getElementById('modal-kick-reason').value.trim();
    document.getElementById('modal-container').innerHTML = '';
    this.sendPlayerAction('kick', { username, reason });
  }

  showQuickActionModal(username) {
    const modal = document.getElementById('modal-container');
    const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/48`;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="glass-panel p-6 rounded-3xl max-w-lg w-full border border-white/20 shadow-2xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-3">
              <img src="${avatarUrl}" class="w-10 h-10 rounded-xl ring-2 ring-cyan-400/40 shadow">
              <div>
                <h3 class="text-base font-bold text-white">${username}</h3>
                <p class="text-[10px] text-cyan-400 font-mono">Live Player Control Center</p>
              </div>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div class="glass-card p-3.5 rounded-2xl border border-white/5 space-y-2">
              <p class="text-xs font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-cyan-400"></i> Set Gamemode
              </p>
              <div class="grid grid-cols-4 gap-2">
                <button onclick="playerManager.setGamemode('${username}', 'survival')" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 text-slate-200 border border-white/5 hover:border-cyan-500/30 transition text-center">
                  Survival
                </button>
                <button onclick="playerManager.setGamemode('${username}', 'creative')" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 text-slate-200 border border-white/5 hover:border-cyan-500/30 transition text-center">
                  Creative
                </button>
                <button onclick="playerManager.setGamemode('${username}', 'adventure')" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 text-slate-200 border border-white/5 hover:border-cyan-500/30 transition text-center">
                  Adventure
                </button>
                <button onclick="playerManager.setGamemode('${username}', 'spectator')" class="p-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 text-slate-200 border border-white/5 hover:border-cyan-500/30 transition text-center">
                  Spectator
                </button>
              </div>
            </div>

            <div class="glass-card p-3.5 rounded-2xl border border-white/5 space-y-2">
              <p class="text-xs font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="compass" class="w-3.5 h-3.5 text-purple-400"></i> Teleport Player
              </p>
              <div class="flex gap-2">
                <input type="text" id="quick-tp-target" placeholder="Target Player or X Y Z (e.g. 0 80 0)" class="flex-1 glass-input px-3 py-1.5 rounded-xl text-xs font-mono">
                <button onclick="playerManager.submitTeleport('${username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition">
                  Teleport
                </button>
              </div>
            </div>

            <div class="glass-card p-3.5 rounded-2xl border border-white/5 space-y-2">
              <p class="text-xs font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="gift" class="w-3.5 h-3.5 text-amber-400"></i> Give Items
              </p>
              <div class="flex gap-2">
                <input type="text" id="quick-give-item" placeholder="Item ID (e.g. diamond, golden_apple)" class="flex-1 glass-input px-3 py-1.5 rounded-xl text-xs font-mono">
                <input type="number" id="quick-give-count" placeholder="Qty" value="64" min="1" max="64" class="w-16 glass-input px-2 py-1.5 rounded-xl text-xs font-mono text-center">
                <button onclick="playerManager.submitGiveItem('${username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition">
                  Give
                </button>
              </div>
            </div>

            <div class="glass-card p-3.5 rounded-2xl border border-white/5 space-y-2">
              <p class="text-xs font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="message-square" class="w-3.5 h-3.5 text-emerald-400"></i> Send Private In-Game Message
              </p>
              <div class="flex gap-2">
                <input type="text" id="quick-pm-text" placeholder="Message content..." class="flex-1 glass-input px-3 py-1.5 rounded-xl text-xs">
                <button onclick="playerManager.submitMessage('${username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition">
                  Send
                </button>
              </div>
            </div>

            <div class="glass-card p-3.5 rounded-2xl border border-rose-500/20 bg-rose-950/20 space-y-2">
              <p class="text-xs font-bold text-rose-300 flex items-center gap-2">
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i> Direct Server Interventions
              </p>
              <div class="flex gap-2">
                <button onclick="playerManager.killPlayer('${username}')" class="flex-1 p-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition">
                  Kill Player
                </button>
                <button onclick="playerManager.clearInventory('${username}')" class="flex-1 p-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition">
                  Clear Inventory
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-white/10">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold glass-btn text-slate-300">
              Done
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  setGamemode(username, gamemode) {
    this.sendPlayerAction('gamemode', { username, gamemode });
  }

  submitTeleport(username) {
    const target = document.getElementById('quick-tp-target').value.trim();
    if (target) {
      this.sendPlayerAction('teleport', { username, target });
    }
  }

  submitGiveItem(username) {
    const item = document.getElementById('quick-give-item').value.trim();
    const amount = document.getElementById('quick-give-count').value || 1;
    if (item) {
      this.sendPlayerAction('give', { username, item, amount });
    }
  }

  submitMessage(username) {
    const message = document.getElementById('quick-pm-text').value.trim();
    if (message) {
      this.sendPlayerAction('message', { username, message });
      document.getElementById('quick-pm-text').value = '';
    }
  }

  killPlayer(username) {
    if (!confirm(`Kill ${username} in-game?`)) return;
    this.sendPlayerAction('kill', { username });
  }

  clearInventory(username) {
    if (!confirm(`Clear the entire inventory of ${username}?`)) return;
    this.sendPlayerAction('clear', { username });
  }
}

const playerManager = new PlayerManager();
