// Mpanel Application Core & Router
class App {
  constructor() {
    this.token = localStorage.getItem('mpanel_token') || null;
    this.user = null;
    this.currentView = 'user-overview';
    this.currentServerId = null;
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadPublicSettings();
    await this.checkAuth();
    this.bindHashChange();
    this.handleRoute();
  }

  // Toast Notification System
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600/90 border-emerald-400 text-white',
      error: 'bg-rose-600/90 border-rose-400 text-white',
      warning: 'bg-amber-600/90 border-amber-400 text-white',
      info: 'bg-cyan-600/90 border-cyan-400 text-white'
    };

    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 text-xs font-medium ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Generic API Requester
  async api(endpoint, options = {}) {
    const headers = options.headers || {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  async loadPublicSettings() {
    try {
      const data = await this.api('/api/admin/settings/public');
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.applyBrandingAndTheme(data.settings);
      }
    } catch (e) {
      console.warn('Could not load public settings:', e);
    }
  }

  applyBrandingAndTheme(s) {
    if (s.panel_name) {
      document.getElementById('tab-title').innerText = s.panel_name;
      document.getElementById('header-panel-name').innerText = s.panel_name;
    }

    if (s.favicon_name) {
      document.getElementById('tab-title').innerText = s.favicon_name;
    }

    if (s.panel_logo) {
      const img = document.getElementById('header-logo-img');
      if (img) img.src = s.panel_logo;
    }

    if (s.favicon_logo) {
      const fav = document.getElementById('tab-favicon');
      if (fav) fav.href = s.favicon_logo;
    }

    // Apply Background
    if (s.panel_bg) {
      if (s.panel_bg_type === 'video') {
        const vid = document.getElementById('wallpaper-video');
        vid.src = s.panel_bg;
        vid.classList.remove('hidden');
        document.getElementById('wallpaper-layer').style.backgroundImage = 'none';
      } else {
        const vid = document.getElementById('wallpaper-video');
        vid.classList.add('hidden');
        document.documentElement.style.setProperty('--panel-bg', `url('${s.panel_bg}')`);
      }
    }

    // Apply Transparency slider (0 to 100)
    if (s.transparency_bar !== undefined) {
      const opacityVal = (100 - parseInt(s.transparency_bar, 10)) / 100;
      document.documentElement.style.setProperty('--card-opacity', `${Math.max(0.05, opacityVal)}`);
    }

    // Apply Blur slider (0 to 40px)
    if (s.blur_bar !== undefined) {
      document.documentElement.style.setProperty('--card-blur', `${parseInt(s.blur_bar, 10)}px`);
    }
  }

  async checkAuth() {
    if (!this.token) {
      this.updateAuthUI(null);
      return;
    }

    try {
      const data = await this.api('/api/auth/me');
      if (data.success && data.user) {
        this.user = data.user;
        this.updateAuthUI(data.user);
      } else {
        this.logout();
      }
    } catch (err) {
      this.logout();
    }
  }

  updateAuthUI(user) {
    const authSection = document.getElementById('header-auth-section');
    const userMenu = document.getElementById('header-user-menu');
    const sidebarAdmin = document.getElementById('sidebar-admin-section');
    const dropdownAdminDivider = document.getElementById('dropdown-admin-divider');
    const dropdownAdminLink = document.getElementById('dropdown-admin-link');

    if (user) {
      if (authSection) authSection.classList.add('hidden');
      if (userMenu) userMenu.classList.remove('hidden');

      document.getElementById('user-display-name').innerText = user.username;
      document.getElementById('user-display-role').innerText = user.role === 'admin' ? 'Administrator' : 'Standard User';
      document.getElementById('user-avatar-initials').innerText = user.username.substring(0, 1).toUpperCase();
      document.getElementById('user-dropdown-email').innerText = user.email;

      if (user.role === 'admin') {
        if (sidebarAdmin) sidebarAdmin.classList.remove('hidden');
        if (dropdownAdminDivider) dropdownAdminDivider.classList.remove('hidden');
        if (dropdownAdminLink) dropdownAdminLink.classList.remove('hidden');
      } else {
        if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
        if (dropdownAdminDivider) dropdownAdminDivider.classList.add('hidden');
        if (dropdownAdminLink) dropdownAdminLink.classList.add('hidden');
      }
    } else {
      if (authSection) authSection.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
      if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
    }
    if (window.lucide) lucide.createIcons();
  }

  toggleUserDropdown() {
    const dd = document.getElementById('user-dropdown-dropdown');
    if (dd) dd.classList.toggle('hidden');
  }

  bindHashChange() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  navigate(viewName, params = {}) {
    window.location.hash = viewName;
    if (params.serverId) {
      this.currentServerId = params.serverId;
    }
  }

  async handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'overview';
    const dd = document.getElementById('user-dropdown-dropdown');
    if (dd) dd.classList.add('hidden');

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.remove('bg-white/15', 'text-cyan-400', 'text-purple-400', 'shadow-md');
    });

    const activeNav = document.getElementById(`nav-${hash}`) || document.getElementById(`nav-user-${hash}`);
    if (activeNav) {
      activeNav.classList.add('bg-white/15', hash.startsWith('admin') ? 'text-purple-400' : 'text-cyan-400', 'shadow-md');
    }

    if (!this.user && hash !== 'login' && hash !== 'register') {
      auth.showLoginModal();
      return;
    }

    // Hide server badge unless in server management view
    const serverBadge = document.getElementById('header-server-badge');
    if (serverBadge && !hash.startsWith('server-')) {
      serverBadge.classList.add('hidden');
    }

    // Route handling
    if (hash === 'overview' || hash === 'user-overview') {
      await this.renderUserOverview();
    } else if (hash === 'servers' || hash === 'user-servers') {
      await this.renderUserServers();
    } else if (hash === 'profile' || hash === 'user-profile') {
      await this.renderUserProfile();
    } else if (hash === 'activity' || hash === 'user-activity') {
      await this.renderUserActivity();
    } else if (hash === 'admin-overview') {
      await admin.renderAdminOverview();
    } else if (hash === 'admin-settings') {
      await settingsManager.renderSettingsView();
    } else if (hash === 'admin-servers') {
      await admin.renderServersView();
    } else if (hash === 'admin-users') {
      await admin.renderUsersView();
    } else if (hash === 'admin-nodes') {
      await admin.renderNodesView();
    } else if (hash === 'admin-locations') {
      await admin.renderLocationsView();
    } else if (hash === 'admin-api') {
      await admin.renderApiKeysView();
    } else if (hash.startsWith('server-manage')) {
      const parts = hash.split('/');
      const sId = parts[1] || this.currentServerId;
      const subTab = parts[2] || 'console';
      this.currentServerId = sId;
      await serverConsole.renderServerManagementSuite(sId, subTab);
    } else {
      await this.renderUserOverview();
    }

    if (window.lucide) lucide.createIcons();
  }

  // Render Normal User Overview
  async renderUserOverview() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Welcome Hero Banner -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">User Dashboard</span>
            <h2 class="text-2xl font-black text-white">Welcome back, ${this.user?.username || 'User'}!</h2>
            <p class="text-xs text-slate-300 max-w-xl">Manage your Minecraft servers, Python bots, and Node.js applications with ultra-low latency container orchestration.</p>
          </div>
          <button onclick="admin.showCreateServerModal()" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Deploy New Server
          </button>
        </div>

        <!-- Metric Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <i data-lucide="server" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">My Servers</p>
              <h3 id="stat-user-servers" class="text-2xl font-bold text-white">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <i data-lucide="activity" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Running Servers</p>
              <h3 id="stat-user-running" class="text-2xl font-bold text-emerald-400">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <i data-lucide="cpu" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Memory Allocated</p>
              <h3 id="stat-user-memory" class="text-2xl font-bold text-purple-400">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <i data-lucide="hard-drive" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Disk Allocated</p>
              <h3 id="stat-user-disk" class="text-2xl font-bold text-amber-400">...</h3>
            </div>
          </div>
        </div>

        <!-- Active Servers Overview Grid -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-200 flex items-center gap-2">
              <i data-lucide="layers" class="w-4 h-4 text-cyan-400"></i> Active Server Instances
            </h3>
            <button onclick="app.navigate('user-servers')" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              View All <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div id="overview-servers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="text-center py-10 text-slate-400 col-span-full">Loading servers...</div>
          </div>
        </div>
      </div>
    `;

    try {
      const data = await this.api('/api/servers');
      const servers = data.servers || [];

      document.getElementById('stat-user-servers').innerText = servers.length;
      document.getElementById('stat-user-running').innerText = servers.filter(s => s.status === 'running').length;
      
      const totalMem = servers.reduce((acc, s) => acc + (s.memory_mb || 0), 0);
      document.getElementById('stat-user-memory').innerText = totalMem > 1024 ? `${(totalMem/1024).toFixed(1)} GB` : `${totalMem} MB`;

      const totalDisk = servers.reduce((acc, s) => acc + (s.disk_mb || 0), 0);
      document.getElementById('stat-user-disk').innerText = totalDisk > 1024 ? `${(totalDisk/1024).toFixed(1)} GB` : `${totalDisk} MB`;

      const grid = document.getElementById('overview-servers-grid');
      if (servers.length === 0) {
        grid.innerHTML = `
          <div class="glass-card p-10 rounded-2xl text-center col-span-full border border-dashed border-white/20">
            <i data-lucide="server-off" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
            <h4 class="text-sm font-bold text-slate-200">No servers deployed yet</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Create your first Minecraft, Python, or Node.js server to get started.</p>
            <button onclick="admin.showCreateServerModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold mt-4">
              + Create Server
            </button>
          </div>
        `;
      } else {
        grid.innerHTML = servers.slice(0, 6).map(s => this.renderServerCardHTML(s)).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  // Render User Servers View (Grid of cards)
  async renderUserServers() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <i data-lucide="server" class="w-5 h-5 text-cyan-400"></i> My Server Instances
            </h2>
            <p class="text-xs text-slate-400">View and control all your deployed server applications</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="app.renderUserServers()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
            <button onclick="admin.showCreateServerModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Create Server
            </button>
          </div>
        </div>

        <div id="user-servers-list-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="text-center py-10 text-slate-400 col-span-full">Loading servers...</div>
        </div>
      </div>
    `;

    try {
      const data = await this.api('/api/servers');
      const servers = data.servers || [];
      const grid = document.getElementById('user-servers-list-grid');

      if (servers.length === 0) {
        grid.innerHTML = `
          <div class="glass-card p-12 rounded-2xl text-center col-span-full border border-dashed border-white/20">
            <i data-lucide="box" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
            <h4 class="text-base font-bold text-slate-200">No servers deployed yet</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">You have not created or been assigned any game or application servers.</p>
            <button onclick="admin.showCreateServerModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold mt-4">
              Deploy Your First Server
            </button>
          </div>
        `;
      } else {
        grid.innerHTML = servers.map(s => this.renderServerCardHTML(s)).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  // HTML Template for Server Card
  renderServerCardHTML(s) {
    const isRunning = s.status === 'running';
    const isStarting = s.status === 'starting';

    const typeIcons = {
      minecraft: '🎮 Minecraft',
      nodejs: '⚡ Node.js',
      python: '🐍 Python'
    };

    const statusBadge = isRunning
      ? `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green"></span> RUNNING</span>`
      : isStarting
      ? `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-yellow"></span> STARTING</span>`
      : `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> OFFLINE</span>`;

    const ipPort = `${s.ip || '127.0.0.1'}:${s.port || 25565}`;

    return `
      <div class="glass-card rounded-2xl p-5 flex flex-col justify-between border border-white/10 hover:border-cyan-500/40 transition">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${typeIcons[s.server_type] || s.server_type}</span>
              <h4 class="text-base font-bold text-white hover:text-cyan-400 cursor-pointer truncate max-w-[200px]" onclick="app.navigate('server-manage/${s.id}/console')">${s.name}</h4>
            </div>
            ${statusBadge}
          </div>

          <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono text-slate-300">
            <span class="truncate">${ipPort}</span>
            <button onclick="app.copyToClipboard('${ipPort}')" title="Copy Address" class="text-slate-400 hover:text-cyan-400 ml-2">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-xs text-slate-300 py-1">
            <div class="bg-slate-800/40 p-2 rounded-lg">
              <p class="text-[10px] text-slate-400">RAM</p>
              <p class="font-bold text-white">${s.memory_mb || 1024} MB</p>
            </div>
            <div class="bg-slate-800/40 p-2 rounded-lg">
              <p class="text-[10px] text-slate-400">CPU</p>
              <p class="font-bold text-white">${s.cpu_limit || 100}%</p>
            </div>
            <div class="bg-slate-800/40 p-2 rounded-lg">
              <p class="text-[10px] text-slate-400">SSD</p>
              <p class="font-bold text-white">${s.disk_mb || 5120} MB</p>
            </div>
          </div>
        </div>

        <div class="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button onclick="app.navigate('server-manage/${s.id}/console')" class="btn-cyber px-4 py-1.5 rounded-lg text-xs font-semibold flex-1 flex items-center justify-center gap-1.5">
            <i data-lucide="terminal" class="w-3.5 h-3.5"></i> Console
          </button>
          ${isRunning
            ? `<button onclick="serverConsole.triggerPower(${s.id}, 'restart')" title="Restart" class="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
               <button onclick="serverConsole.triggerPower(${s.id}, 'stop')" title="Stop" class="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 flex items-center justify-center"><i data-lucide="square" class="w-3.5 h-3.5"></i></button>`
            : `<button onclick="serverConsole.triggerPower(${s.id}, 'start')" title="Start" class="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center"><i data-lucide="play" class="w-3.5 h-3.5"></i></button>`
          }
        </div>
      </div>
    `;
  }

  // Render User Profile & 2FA
  async renderUserProfile() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <i data-lucide="user" class="w-5 h-5 text-cyan-400"></i> Account Settings & Security
          </h2>
          <p class="text-xs text-slate-400">Manage your profile details, password, and Two-Factor Authentication</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Profile Details Card -->
          <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
              <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i> Update Profile
            </h3>
            <form onsubmit="auth.handleProfileUpdate(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input type="text" id="prof-username" value="${this.user.username}" class="w-full glass-input px-3 py-2 rounded-xl text-xs" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input type="email" id="prof-email" value="${this.user.email}" class="w-full glass-input px-3 py-2 rounded-xl text-xs" required>
              </div>
              <div class="pt-2 border-t border-white/10">
                <label class="block text-xs font-semibold text-slate-300 mb-1">Current Password (to change)</label>
                <input type="password" id="prof-current-pass" placeholder="••••••••" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input type="password" id="prof-new-pass" placeholder="Leave empty to keep unchanged" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
              </div>
              <button type="submit" class="btn-cyber w-full py-2 rounded-xl text-xs font-semibold">
                Save Profile Changes
              </button>
            </form>
          </div>

          <!-- Two-Factor Authentication (2FA) Card -->
          <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Two-Factor Authentication
              </h3>
              ${this.user.two_factor_enabled
                ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ENABLED</span>`
                : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400">DISABLED</span>`
              }
            </div>
            <p class="text-xs text-slate-400">Protect your account from unauthorized access by requiring an authenticator code (Google Authenticator / Authy) on login.</p>

            ${this.user.two_factor_enabled
              ? `
                <div class="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
                  <p class="font-semibold">✓ 2FA is actively protecting your account.</p>
                  <p class="text-[11px] text-slate-400">You must provide a 6-digit TOTP code each time you sign in.</p>
                </div>
                <button onclick="auth.showDisable2FAModal()" class="w-full py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition">
                  Disable Two-Factor Auth
                </button>
              `
              : `
                <button onclick="auth.start2FASetup()" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <i data-lucide="qr-code" class="w-4 h-4"></i> Setup 2FA Authenticator
                </button>
                <div id="2fa-setup-box" class="hidden space-y-4 pt-4 border-t border-white/10"></div>
              `
            }
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  // Render User Activity Log
  async renderUserActivity() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <i data-lucide="activity" class="w-5 h-5 text-cyan-400"></i> My Activity & Login History
          </h2>
          <p class="text-xs text-slate-400">Audit trail of actions and logins performed on your account</p>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th class="px-5 py-3">Action</th>
                  <th class="px-5 py-3">Details</th>
                  <th class="px-5 py-3">IP Address</th>
                  <th class="px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody id="user-activity-tbody" class="divide-y divide-white/5">
                <tr><td colspan="4" class="text-center py-6 text-slate-500">Loading audit history...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    try {
      const data = await this.api('/api/activity?limit=50');
      const logs = data.logs || [];
      const tbody = document.getElementById('user-activity-tbody');

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500">No activity recorded yet.</td></tr>`;
      } else {
        tbody.innerHTML = logs.map(l => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3 font-semibold text-cyan-400">${l.action}</td>
            <td class="px-5 py-3 font-mono text-[11px] text-slate-300 truncate max-w-xs">${l.details || '-'}</td>
            <td class="px-5 py-3 font-mono text-slate-400">${l.ip_address || '127.0.0.1'}</td>
            <td class="px-5 py-3 text-slate-400">${new Date(l.created_at).toLocaleString()}</td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    this.toast(`Copied "${text}" to clipboard!`, 'success');
  }

  logout() {
    localStorage.removeItem('mpanel_token');
    this.token = null;
    this.user = null;
    this.updateAuthUI(null);
    auth.showLoginModal();
  }
}

window.app = new App();

