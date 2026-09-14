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

  // Compatibility alias for toast
  showToast(message, type = 'info') {
    return this.toast(message, type);
  }

  // HTML Escaper for XSS prevention and safe template rendering
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    if (!s) return;

    if (s.panel_name) {
      const tabTitle = document.getElementById('tab-title');
      if (tabTitle) tabTitle.innerText = s.panel_name;
      const headerTitle = document.getElementById('header-panel-name');
      if (headerTitle) headerTitle.innerText = s.panel_name;
    }

    if (s.favicon_name) {
      const tabTitle = document.getElementById('tab-title');
      if (tabTitle) tabTitle.innerText = s.favicon_name;
    }

    if (s.panel_logo) {
      const img = document.getElementById('header-logo-img');
      if (img) img.src = s.panel_logo;
    }

    if (s.favicon_logo) {
      const fav = document.getElementById('tab-favicon');
      if (fav) fav.href = s.favicon_logo;
    }

    // Theme Mode (Dark / Light)
    const isLight = s.theme_mode === 'light';
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    // Apply Background (Image or Video)
    if (s.panel_bg) {
      const isVideo = s.panel_bg_type === 'video' || /\.(mp4|webm|mkv|mov)($|\?)/i.test(s.panel_bg);
      const vid = document.getElementById('wallpaper-video');
      const wallLayer = document.getElementById('wallpaper-layer');

      if (isVideo && vid) {
        if (vid.src !== s.panel_bg) {
          vid.src = s.panel_bg;
        }
        vid.classList.remove('hidden');
        if (wallLayer) wallLayer.style.backgroundImage = 'none';
        vid.play().catch(() => {});
      } else {
        if (vid) {
          vid.classList.add('hidden');
          vid.pause();
        }
        if (wallLayer) wallLayer.style.backgroundImage = '';
        document.documentElement.style.setProperty('--panel-bg', `url('${s.panel_bg}')`);
      }
    }

    // Active UI Theme (Arix Theme vs NookTheme)
    const activeTheme = s.active_theme || localStorage.getItem('mpanel_active_theme') || 'arix';
    localStorage.setItem('mpanel_active_theme', activeTheme);
    this.activeTheme = activeTheme;

    if (activeTheme === 'arix') {
      document.documentElement.classList.add('theme-arix');
      document.documentElement.classList.remove('theme-nook');
      const logoEl = document.getElementById('header-logo-img');
      if (logoEl && (!s.panel_logo || s.panel_logo === '/assets/mpanel-logo.svg')) {
        logoEl.src = '/arix/Arix.png';
      }
      const subNameEl = document.getElementById('header-sub-name');
      if (subNameEl && (!s.panel_name || s.panel_name === 'Angelillo15' || s.panel_name === 'Mpanel')) {
        subNameEl.innerText = 'Arix Theme v2.1.3';
      }
      if (s.arix_primary_color) {
        document.documentElement.style.setProperty('--arix-primary', s.arix_primary_color);
      }
    } else {
      document.documentElement.classList.remove('theme-arix');
      document.documentElement.classList.add('theme-nook');
      const logoEl = document.getElementById('header-logo-img');
      if (logoEl && (!s.panel_logo || s.panel_logo === '/arix/Arix.png')) {
        logoEl.src = '/assets/mpanel-logo.svg';
      }
      const subNameEl = document.getElementById('header-sub-name');
      if (subNameEl && subNameEl.innerText === 'Arix Theme v2.1.3') {
        subNameEl.innerText = 'Mpanel Server Engine';
      }
    }

    if (s.panel_sounds_enabled !== undefined) {
      localStorage.setItem('panelSounds', s.panel_sounds_enabled === '1' ? 'true' : 'false');
    }

    // Apply Transparency slider (0 to 100%)
    if (s.transparency_bar !== undefined) {
      const transparency = parseInt(s.transparency_bar, 10);
      const opacityVal = (100 - transparency) / 100;
      document.documentElement.style.setProperty('--card-opacity', `${Math.max(0.02, Math.min(1.0, opacityVal))}`);
    }

    // Apply Blur slider (0 to 40px)
    if (s.blur_bar !== undefined) {
      const blur = parseInt(s.blur_bar, 10);
      document.documentElement.style.setProperty('--card-blur', `${Math.max(0, Math.min(40, blur))}px`);
    }
  }

  playSound(type) {
    const soundsEnabled = this.settings?.panel_sounds_enabled !== '0' && localStorage.getItem('panelSounds') !== 'false';
    if (!soundsEnabled) return;

    let soundFile = '';
    let volume = 0.5;
    if (type === 'online') {
      soundFile = '/arix/online.mp3';
      volume = 0.8;
    } else if (type === 'offline') {
      soundFile = '/arix/offline.mp3';
      volume = 0.4;
    } else if (type === 'copy') {
      soundFile = '/arix/copy.mp3';
      volume = 0.6;
    }

    if (soundFile) {
      try {
        const audio = new Audio(soundFile);
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch (e) {}
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
    const portalAdminSwitchCard = document.getElementById('portal-admin-switch-card');
    const headerAdminToggleBtn = document.getElementById('header-admin-toggle-btn');
    const dropdownAdminDivider = document.getElementById('dropdown-admin-divider');
    const dropdownAdminLink = document.getElementById('dropdown-admin-link');

    if (user) {
      if (authSection) authSection.classList.add('hidden');
      if (userMenu) userMenu.classList.remove('hidden');

      const nameEl = document.getElementById('user-display-name');
      if (nameEl) nameEl.innerText = user.username;

      const roleEl = document.getElementById('user-display-role');
      if (roleEl) roleEl.innerText = user.role === 'admin' ? 'Administrator' : 'Standard User';

      const avatarEl = document.getElementById('user-avatar-initials');
      if (avatarEl) avatarEl.innerText = (user.username || 'U').substring(0, 1).toUpperCase();

      const emailEl = document.getElementById('user-dropdown-email');
      if (emailEl) emailEl.innerText = user.email;

      if (user.role === 'admin') {
        if (portalAdminSwitchCard) portalAdminSwitchCard.classList.remove('hidden');
        if (headerAdminToggleBtn) headerAdminToggleBtn.classList.remove('hidden');
        if (dropdownAdminDivider) dropdownAdminDivider.classList.remove('hidden');
        if (dropdownAdminLink) dropdownAdminLink.classList.remove('hidden');
      } else {
        if (portalAdminSwitchCard) portalAdminSwitchCard.classList.add('hidden');
        if (headerAdminToggleBtn) headerAdminToggleBtn.classList.add('hidden');
        if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
        if (dropdownAdminDivider) dropdownAdminDivider.classList.add('hidden');
        if (dropdownAdminLink) dropdownAdminLink.classList.add('hidden');
      }
    } else {
      if (authSection) authSection.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
      if (sidebarAdmin) sidebarAdmin.classList.add('hidden');
      if (portalAdminSwitchCard) portalAdminSwitchCard.classList.add('hidden');
      if (headerAdminToggleBtn) headerAdminToggleBtn.classList.add('hidden');
    }
    if (window.lucide) lucide.createIcons();
  }

  toggleAdminPortalMode() {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (hash.startsWith('admin-')) {
      this.navigate('user-overview');
    } else {
      this.navigate('admin-overview');
    }
  }

  toggleUserDropdown() {
    const dd = document.getElementById('user-dropdown-dropdown');
    if (dd) dd.classList.toggle('hidden');
  }

  bindHashChange() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  navigate(viewName, params = {}) {
    if (params.serverId) {
      this.currentServerId = params.serverId;
    }
    const cleanHash = (viewName || '').replace(/^#/, '');
    const currentHash = window.location.hash.replace(/^#/, '');
    if (currentHash === cleanHash) {
      this.handleRoute();
    } else {
      window.location.hash = cleanHash;
    }
  }

  toggleMobileSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('fixed');
      sidebar.classList.toggle('inset-y-0');
      sidebar.classList.toggle('left-0');
      sidebar.classList.toggle('z-50');
      sidebar.classList.toggle('shadow-2xl');
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const btn = document.getElementById('header-theme-toggle-btn');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      if (btn) btn.innerHTML = '<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      if (btn) btn.innerHTML = '<i data-lucide="moon" class="w-4 h-4"></i>';
    }
    if (window.lucide) lucide.createIcons();
  }

  async showServerSwitcherModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    let servers = [];
    try {
      const data = await this.api('/api/servers');
      servers = data.servers || [];
    } catch (e) {
      console.warn(e);
    }

    modalContainer.innerHTML = `
      <div id="server-switcher-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4" onclick="app.closeServerSwitcherModal(event)">
        <div class="bg-[#17171b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
          <div class="p-4 border-b border-white/10 flex items-center gap-3">
            <i data-lucide="search" class="w-5 h-5 text-slate-400"></i>
            <input type="text" id="switcher-search-input" placeholder="Search servers by name or port..." oninput="app.filterServerSwitcher(this.value)" class="bg-transparent border-none text-white text-sm w-full outline-none focus:ring-0" autofocus>
            <button onclick="app.closeServerSwitcherModal()" class="text-slate-400 hover:text-white p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div id="switcher-servers-list" class="max-h-80 overflow-y-auto p-2 space-y-1">
            ${servers.length === 0 ? '<p class="text-xs text-slate-400 text-center py-6">No servers deployed yet</p>' : servers.map(s => `
              <div onclick="app.selectServerFromSwitcher(${s.id})" class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition switcher-item" data-name="${s.name.toLowerCase()}">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#212121] flex items-center justify-center text-slate-300">
                    <i data-lucide="server" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white">${s.name}</h4>
                    <p class="text-[10px] text-slate-400 font-mono">${s.ip || '127.0.0.1'}:${s.port || 25565}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${s.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${s.status.toUpperCase()}</span>
                  <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      const inp = document.getElementById('switcher-search-input');
      if (inp) inp.focus();
    }, 50);
  }

  closeServerSwitcherModal(e) {
    const el = document.getElementById('server-switcher-modal');
    if (el) el.remove();
  }

  filterServerSwitcher(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.switcher-item').forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  }

  selectServerFromSwitcher(serverId) {
    this.closeServerSwitcherModal();
    this.navigate(`server-manage/${serverId}/console`, { serverId });
  }

  renderNookServerSidebar(serverId, activeSubTab = 'console') {
    const container = document.getElementById('server-nav-links');
    if (!container) return;

    const routes = [
      { tab: 'console', name: 'Console', icon: 'terminal' },
      { tab: 'files', name: 'Files', icon: 'folder' },
      { tab: 'properties', name: 'Properties', icon: 'sliders' },
      { tab: 'players', name: 'Players', icon: 'gamepad-2' },
      { tab: 'importer', name: 'Importer', icon: 'download-cloud' },
      { tab: 'marketplace', name: 'Addons', icon: 'shopping-bag' },
      { tab: 'databases', name: 'Databases', icon: 'database' },
      { tab: 'schedules', name: 'Schedules', icon: 'clock' },
      { tab: 'subusers', name: 'Users', icon: 'users' },
      { tab: 'backups', name: 'Backups', icon: 'archive' },
      { tab: 'network', name: 'Network', icon: 'network' },
      { tab: 'startup', name: 'Startup', icon: 'play-circle' },
      { tab: 'settings', name: 'Settings', icon: 'settings' },
      { tab: 'activity', name: 'Activity', icon: 'activity' }
    ];

    container.innerHTML = routes.map(r => `
      <a href="#server-manage/${serverId}/${r.tab}" onclick="serverConsole.switchSubTab('${r.tab}')" id="server-nav-${r.tab}" class="nook-nav-item ${activeSubTab === r.tab ? 'active' : ''}">
        <div class="nook-icon-box">
          <i data-lucide="${r.icon}" class="w-5 h-5"></i>
        </div>
        <span>${r.name}</span>
      </a>
    `).join('') + `
      <div class="pt-2 mt-2 border-t border-white/5">
        <a href="#servers" onclick="app.navigate('user-servers')" class="nook-nav-item text-slate-400 hover:text-white">
          <div class="nook-icon-box bg-transparent text-slate-400">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
          </div>
          <span>Back to Servers</span>
        </a>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'overview';
    const dd = document.getElementById('user-dropdown-dropdown');
    if (dd) dd.classList.add('hidden');

    if (!this.user && hash !== 'login' && hash !== 'register') {
      if (window.auth && typeof window.auth.showLoginModal === 'function') {
        window.auth.showLoginModal();
      }
      return;
    }

    const isServerContext = hash.startsWith('server-manage');
    const isAdminContext = hash.startsWith('admin-');
    const serverSection = document.getElementById('sidebar-server-section');
    const portalSection = document.getElementById('sidebar-portal-section');
    const adminSection = document.getElementById('sidebar-admin-section');
    const headerAdminToggleBtn = document.getElementById('header-admin-toggle-btn');

    // Update Topbar Admin / Client Area Quick Switcher Toggle Button
    if (headerAdminToggleBtn && this.user && this.user.role === 'admin') {
      headerAdminToggleBtn.classList.remove('hidden');
      if (isAdminContext) {
        headerAdminToggleBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-sm bg-white/10 hover:bg-white/20 text-slate-200 border-white/10';
        headerAdminToggleBtn.title = 'Switch to Client Area';
        headerAdminToggleBtn.innerHTML = `<i data-lucide="arrow-left" class="w-3.5 h-3.5 text-cyan-400"></i><span class="hidden sm:inline">Client Area</span>`;
      } else {
        headerAdminToggleBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40';
        headerAdminToggleBtn.title = 'Switch to Admin Area';
        headerAdminToggleBtn.innerHTML = `<i data-lucide="shield" class="w-3.5 h-3.5"></i><span class="hidden sm:inline">Admin Area</span>`;
      }
    }

    if (isServerContext) {
      if (portalSection) portalSection.classList.add('hidden');
      if (adminSection) adminSection.classList.add('hidden');
      if (serverSection) serverSection.classList.remove('hidden');

      const parts = hash.split('/');
      const sId = parts[1] || this.currentServerId;
      const subTab = parts[2] || 'console';
      this.currentServerId = sId;

      this.renderNookServerSidebar(sId, subTab);
      await serverConsole.renderServerManagementSuite(sId, subTab);
    } else if (isAdminContext) {
      // Security guard: redirect if not admin
      if (this.user && this.user.role !== 'admin') {
        this.toast('Access denied. Administrator privileges required.', 'error');
        this.navigate('user-overview');
        return;
      }

      if (serverSection) serverSection.classList.add('hidden');
      if (portalSection) portalSection.classList.add('hidden');
      if (adminSection) adminSection.classList.remove('hidden');

      // Update active nav links in admin sidebar
      document.querySelectorAll('.nook-nav-item').forEach(el => el.classList.remove('active'));
      const activeNav = document.getElementById(`nav-${hash}`);
      if (activeNav) activeNav.classList.add('active');

      // Admin route handling
      if (hash === 'admin-overview') {
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
      }
    } else {
      if (serverSection) serverSection.classList.add('hidden');
      if (adminSection) adminSection.classList.add('hidden');
      if (portalSection) portalSection.classList.remove('hidden');

      // Update active nav links in portal sidebar
      document.querySelectorAll('.nook-nav-item').forEach(el => el.classList.remove('active'));
      const activeNav = document.getElementById(`nav-${hash}`) || document.getElementById(`nav-user-${hash}`);
      if (activeNav) activeNav.classList.add('active');

      // Route handling
      if (hash === 'overview' || hash === 'user-overview') {
        await this.renderUserOverview();
      } else if (hash === 'servers' || hash === 'user-servers') {
        await this.renderUserServers();
      } else if (hash === 'marketplace') {
        if (window.marketplace) {
          await marketplace.renderGlobalMarketplaceView();
        }
      } else if (hash === 'profile' || hash === 'user-profile') {
        await this.renderUserProfile();
      } else if (hash === 'activity' || hash === 'user-activity') {
        await this.renderUserActivity();
      } else {
        await this.renderUserOverview();
      }
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

      const sServers = document.getElementById('stat-user-servers');
      if (sServers) sServers.innerText = servers.length;

      const sRunning = document.getElementById('stat-user-running');
      if (sRunning) sRunning.innerText = servers.filter(s => s.status === 'running').length;
      
      const totalMem = servers.reduce((acc, s) => acc + (s.memory_mb || 0), 0);
      const sMem = document.getElementById('stat-user-memory');
      if (sMem) sMem.innerText = totalMem > 1024 ? `${(totalMem/1024).toFixed(1)} GB` : `${totalMem} MB`;

      const totalDisk = servers.reduce((acc, s) => acc + (s.disk_mb || 0), 0);
      const sDisk = document.getElementById('stat-user-disk');
      if (sDisk) sDisk.innerText = totalDisk > 1024 ? `${(totalDisk/1024).toFixed(1)} GB` : `${totalDisk} MB`;

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
    const isSuspended = !!s.is_suspended || s.status === 'suspended';
    const isRunning = !isSuspended && s.status === 'running';
    const isStarting = !isSuspended && s.status === 'starting';

    const typeIcons = {
      minecraft: '🎮 Minecraft',
      nodejs: '⚡ Node.js',
      python: '🐍 Python'
    };

    let expBadge = '';
    if (s.expiration_date) {
      const expDate = new Date(s.expiration_date);
      const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24));
      if (diffDays <= 0) {
        expBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Expired</span>`;
      } else if (diffDays <= 3) {
        expBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Expires in ${diffDays}d</span>`;
      } else {
        expBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 bg-white/5 border border-white/10">${diffDays}d left</span>`;
      }
    }

    const statusBadge = isSuspended
      ? `<span class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"><i data-lucide="lock" class="w-3 h-3"></i> SUSPENDED</span>`
      : isRunning
      ? `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green"></span> RUNNING</span>`
      : isStarting
      ? `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-yellow"></span> STARTING</span>`
      : `<span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> OFFLINE</span>`;

    const ipPort = `${s.ip || '127.0.0.1'}:${s.port || 25565}`;

    return `
      <div class="glass-card rounded-2xl p-5 flex flex-col justify-between border ${isSuspended ? 'border-rose-500/30' : 'border-white/10 hover:border-cyan-500/40'} transition">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${typeIcons[s.server_type] || s.server_type}</span>
                ${expBadge}
              </div>
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
          ${isSuspended
            ? `<span class="px-3 py-1 text-[11px] font-bold text-rose-400 bg-rose-950/40 rounded-lg border border-rose-500/20">Locked</span>`
            : (isRunning
              ? `<button onclick="serverConsole.triggerPower(${s.id}, 'restart')" title="Restart" class="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                 <button onclick="serverConsole.triggerPower(${s.id}, 'stop')" title="Stop" class="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 flex items-center justify-center"><i data-lucide="square" class="w-3.5 h-3.5"></i></button>`
              : `<button onclick="serverConsole.triggerPower(${s.id}, 'start')" title="Start" class="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center"><i data-lucide="play" class="w-3.5 h-3.5"></i></button>`
            )
          }
        </div>
      </div>
    `;
  }

  // Render User Profile & 2FA
  async renderUserProfile() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="flex items-center justify-center py-16 text-slate-500">
        <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2 text-cyan-400"></i>
        <span>Loading profile and account data...</span>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      // Fetch latest user data and servers in parallel
      const [meRes, srvRes] = await Promise.all([
        this.api('/api/auth/me').catch(() => ({ success: false })),
        this.api('/api/servers').catch(() => ({ servers: [] }))
      ]);

      if (meRes && meRes.success && meRes.user) {
        this.user = meRes.user;
        this.updateAuthUI(this.user);
      }

      const u = this.user || {};
      const servers = srvRes.servers || [];
      const isAdm = u.role === 'admin';

      // Build Server Access HTML
      let serverAccessHTML = '';
      if (servers.length === 0) {
        serverAccessHTML = `<span class="text-slate-500 font-mono text-[11px]">0 Servers Assigned</span>`;
      } else {
        serverAccessHTML = `
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ${servers.length} ${servers.length === 1 ? 'Server' : 'Servers'}
            </span>
            ${servers.map(s => `
              <button onclick="app.navigate('server-manage/${s.id}/console')" class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition inline-flex items-center gap-1" title="Manage ${this.escapeHtml(s.name)}">
                <i data-lucide="hard-drive" class="w-2.5 h-2.5 text-cyan-400"></i> ${this.escapeHtml(s.name)}
              </button>
            `).join('')}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="space-y-8 pb-12">
          <!-- Top Header Bar -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span class="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">PROFILE</span>
              </h1>
              <p class="text-xs text-slate-400 mt-1 font-medium">Manage your personal account, security credentials, and server access</p>
            </div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <button onclick="app.renderUserProfile()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition" title="Refresh Profile">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              </button>
              <button onclick="auth.logout()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition shadow-sm">
                <i data-lucide="log-out" class="w-4 h-4 text-rose-400"></i> Sign Out
              </button>
            </div>
          </div>

          <!-- ──────────────────────────────────────── -->
          <!-- Account Section                          -->
          <!-- ──────────────────────────────────────── -->
          <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <i data-lucide="user-check" class="w-4 h-4"></i>
                </div>
                <h3 class="text-base font-bold text-white tracking-wide">Account</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Active</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono">
                UID #${u.id || 1}
              </div>
            </div>

            <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th class="px-4 py-3">Username</th>
                      <th class="px-4 py-3">Email</th>
                      <th class="px-4 py-3">Server Access</th>
                      <th class="px-4 py-3">Permissions</th>
                      <th class="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    <tr class="hover:bg-white/5 transition-colors">
                      <!-- Username -->
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-8 h-8 rounded-full ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            ${(u.username || 'U').substring(0, 1)}
                          </div>
                          <div class="min-w-0">
                            <span class="font-bold text-white block text-xs truncate">${this.escapeHtml(u.username || 'User')}</span>
                            <span class="text-[10px] font-mono text-slate-500">UID #${u.id || 1}</span>
                          </div>
                        </div>
                      </td>

                      <!-- Email -->
                      <td class="px-4 py-3 font-mono">
                        <div class="flex items-center gap-1.5">
                          <span class="text-slate-300 text-xs truncate max-w-xs">${this.escapeHtml(u.email || 'user@mpanel.local')}</span>
                          <button onclick="navigator.clipboard.writeText('${this.escapeHtml(u.email || '')}'); app.toast('Copied email: ${this.escapeHtml(u.email || '')}', 'info');" class="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition" title="Copy Email">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                          </button>
                        </div>
                      </td>

                      <!-- Server Access -->
                      <td class="px-4 py-3">
                        ${serverAccessHTML}
                      </td>

                      <!-- Permissions -->
                      <td class="px-4 py-3">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-white/10'}">
                            ${isAdm ? 'ADMINISTRATOR' : 'CLIENT USER'}
                          </span>
                          ${u.two_factor_enabled
                            ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">2FA Active</span>'
                            : '<span class="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-500 border border-white/5">No 2FA</span>'}
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                        </div>
                      </td>

                      <!-- Actions -->
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="document.getElementById('prof-username').focus(); document.getElementById('prof-username').scrollIntoView({behavior:'smooth', block:'center'}); app.toast('Ready to edit profile details below', 'info');" class="btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm" title="Edit Profile Details">
                            <i data-lucide="edit-3" class="w-3 h-3"></i> Edit
                          </button>
                          <button onclick="document.getElementById('prof-current-pass').focus(); document.getElementById('prof-current-pass').scrollIntoView({behavior:'smooth', block:'center'}); app.toast('Enter your current & new password below', 'info');" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-white/10 transition" title="Change Password">
                            <i data-lucide="key" class="w-3.5 h-3.5"></i>
                          </button>
                          ${u.two_factor_enabled
                            ? `<button onclick="auth.showDisable2FAModal()" class="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 transition" title="Manage 2FA">
                                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                              </button>`
                            : `<button onclick="auth.start2FASetup()" class="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 transition" title="Setup 2FA">
                                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                              </button>`
                          }
                          <button onclick="auth.logout()" class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition" title="Sign Out">
                            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Settings & 2FA Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- Profile Details Card -->
            <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i> Update Profile Credentials
              </h3>
              <form onsubmit="auth.handleProfileUpdate(event)" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                  <input type="text" id="prof-username" value="${this.escapeHtml(u.username || '')}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input type="email" id="prof-email" value="${this.escapeHtml(u.email || '')}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
                </div>
                <div class="pt-2 border-t border-white/10">
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Current Password (required to change)</label>
                  <input type="password" id="prof-current-pass" placeholder="••••••••" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <input type="password" id="prof-new-pass" placeholder="Leave empty to keep unchanged" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
                </div>
                <button type="submit" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-semibold shadow-md">
                  Save Profile Changes
                </button>
              </form>
            </div>

            <!-- Two-Factor Authentication (2FA) Card -->
            <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Two-Factor Authentication
                </h3>
                ${u.two_factor_enabled
                  ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ENABLED</span>`
                  : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400">DISABLED</span>`
                }
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">Protect your account from unauthorized access by requiring an authenticator code (Google Authenticator / Authy) on login.</p>

              ${u.two_factor_enabled
                ? `
                  <div class="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
                    <p class="font-semibold">✓ 2FA is actively protecting your account.</p>
                    <p class="text-[11px] text-slate-400">You must provide a 6-digit TOTP code each time you sign in.</p>
                  </div>
                  <button onclick="auth.showDisable2FAModal()" class="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition shadow-sm">
                    Disable Two-Factor Auth
                  </button>
                `
                : `
                  <button onclick="auth.start2FASetup()" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
                    <i data-lucide="qr-code" class="w-4 h-4"></i> Setup 2FA Authenticator
                  </button>
                  <div id="2fa-setup-box" class="hidden space-y-4 pt-4 border-t border-white/10"></div>
                `
              }
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error rendering user profile:', err);
      container.innerHTML = `
        <div class="p-8 text-center text-rose-400">
          <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2"></i>
          <p class="text-sm font-semibold">Failed to load account profile: ${this.escapeHtml(err.message)}</p>
        </div>
      `;
    }

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
    if (window.auth && typeof window.auth.showLoginModal === 'function') {
      window.auth.showLoginModal();
    }
  }
}

window.app = new App();
window.escapeHtml = (str) => window.app.escapeHtml(str);

