// Mpanel Marketplace Module - Modrinth Plugins, Mods, Datapacks, Resourcepacks & Modpacks Store
class MarketplaceController {
  constructor() {
    this.currentServerId = null;
    this.serverData = null;
    this.activeTab = 'plugin'; // 'plugin' | 'mod' | 'datapack' | 'resourcepack' | 'modpack' | 'installed'
    this.searchQuery = '';
    this.selectedLoader = '';
    this.selectedGameVersion = '';
    this.sortBy = 'downloads';
    this.currentPage = 0;
    this.limit = 24;
    this.totalHits = 0;
    this.debounceTimer = null;
    this.projectMap = new Map();
    this.installedAddons = [];
    this.allGameVersions = [
      '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
      '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
      '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
      '1.18.2', '1.18.1', '1.18',
      '1.17.1', '1.17',
      '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1',
      '1.15.2', '1.15.1',
      '1.14.4', '1.14.3',
      '1.13.2', '1.13.1',
      '1.12.2', '1.12.1',
      '1.11.2',
      '1.10.2',
      '1.9.4',
      '1.8.9', '1.8.8',
      '1.7.10'
    ];
    this.allSoftwareTypes = [
      { id: '', name: 'All Software / Loaders' },
      { id: 'paper', name: 'Paper' },
      { id: 'purpur', name: 'Purpur' },
      { id: 'spigot', name: 'Spigot' },
      { id: 'bukkit', name: 'CraftBukkit' },
      { id: 'folia', name: 'Folia' },
      { id: 'fabric', name: 'Fabric' },
      { id: 'forge', name: 'Forge' },
      { id: 'neoforge', name: 'NeoForge' },
      { id: 'quilt', name: 'Quilt' },
      { id: 'velocity', name: 'Velocity' },
      { id: 'bungeecord', name: 'BungeeCord' },
      { id: 'waterfall', name: 'Waterfall' },
      { id: 'sponge', name: 'Sponge' },
      { id: 'geyser', name: 'Geyser' },
      { id: 'vanilla', name: 'Vanilla / Datapack' }
    ];
  }

  formatDownloads(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return `${num}`;
  }

  detectServerDefaults(server) {
    if (!server) return;
    const jarType = (server.jar_type || '').toLowerCase();
    
    // Auto-detect default category and loader
    if (['fabric', 'quilt'].includes(jarType)) {
      this.activeTab = 'mod';
      this.selectedLoader = 'fabric';
    } else if (['forge'].includes(jarType)) {
      this.activeTab = 'mod';
      this.selectedLoader = 'forge';
    } else if (['neoforge'].includes(jarType)) {
      this.activeTab = 'mod';
      this.selectedLoader = 'neoforge';
    } else if (['velocity'].includes(jarType)) {
      this.activeTab = 'plugin';
      this.selectedLoader = 'velocity';
    } else if (['bungeecord', 'waterfall'].includes(jarType)) {
      this.activeTab = 'plugin';
      this.selectedLoader = 'bungeecord';
    } else {
      // Paper, Purpur, Spigot, Vanilla, Leaf, Leaves, Folia, DivineMC
      this.activeTab = 'plugin';
      this.selectedLoader = 'paper';
    }

    if (server.jar_version) {
      this.selectedGameVersion = server.jar_version;
    }
  }

  // Render Marketplace Tab inside Server Management Suite
  async renderServerMarketplaceTab(container, serverId, serverData) {
    this.currentServerId = serverId;
    this.serverData = serverData;
    this.detectServerDefaults(serverData);

    const gameVersion = serverData?.jar_version || '';
    const jarType = serverData?.jar_type || 'Paper';

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Banner Header -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                <i data-lucide="shopping-bag" class="w-3 h-3 inline mr-1"></i> Addon Marketplace
              </span>
              <span class="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-white/5">
                Target: <strong class="text-white">${jarType}</strong> ${gameVersion ? `(${gameVersion})` : ''}
              </span>
            </div>
            <h3 class="text-2xl font-black text-white flex items-center gap-2">
              Addon Marketplace
            </h3>
            <p class="text-xs text-slate-300">
              Browse and install 50,000+ Plugins, Mods, Datapacks, Resource Packs, and Modpacks with 1-click downloads.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="marketplace.switchCategory('installed')" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 shadow transition flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Installed Addons
              <span id="mp-installed-badge" class="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-mono">0</span>
            </button>
          </div>
        </div>

        <!-- Dedicated Category Tabs ("sab alg alg") -->
        <div class="glass-panel p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2">
          <button onclick="marketplace.switchCategory('plugin')" id="cat-btn-plugin" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'plugin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="puzzle" class="w-4 h-4"></i> Plugins
          </button>
          <button onclick="marketplace.switchCategory('mod')" id="cat-btn-mod" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'mod' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="box" class="w-4 h-4"></i> Mods
          </button>
          <button onclick="marketplace.switchCategory('datapack')" id="cat-btn-datapack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'datapack' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="database" class="w-4 h-4"></i> Datapacks
          </button>
          <button onclick="marketplace.switchCategory('resourcepack')" id="cat-btn-resourcepack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'resourcepack' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="palette" class="w-4 h-4"></i> Resource Packs
          </button>
          <button onclick="marketplace.switchCategory('modpack')" id="cat-btn-modpack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'modpack' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="archive" class="w-4 h-4"></i> Modpacks
          </button>
          <button onclick="marketplace.switchCategory('world')" id="cat-btn-world" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'world' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="globe" class="w-4 h-4"></i> World Installer
          </button>
          <button onclick="marketplace.switchCategory('playit')" id="cat-btn-playit" class="cat-pill flex-1 min-w-[130px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'playit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="network" class="w-4 h-4 text-indigo-400"></i> Playit.gg Tunnel
          </button>
        </div>

        <!-- Dynamic Content Area -->
        <div id="marketplace-view-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.renderCurrentView();
    this.refreshInstalledBadge();
  }

  async switchCategory(category) {
    this.activeTab = category;
    this.currentPage = 0;

    // Update Category Pills
    document.querySelectorAll('.cat-pill').forEach(btn => {
      btn.className = 'cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition bg-slate-800/60 text-slate-300 hover:bg-white/10';
    });

    const activeBtn = document.getElementById(`cat-btn-${category}`);
    if (activeBtn) {
      const colors = {
        plugin: 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20',
        mod: 'bg-purple-600 text-white shadow-lg shadow-purple-500/20',
        datapack: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
        resourcepack: 'bg-amber-600 text-white shadow-lg shadow-amber-500/20',
        modpack: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20',
        world: 'bg-teal-500 text-white shadow-lg shadow-teal-500/20',
        playit: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
      };
      activeBtn.className = `cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${colors[category] || 'bg-cyan-500 text-white'}`;
    }

    await this.renderCurrentView();
    if (window.lucide) lucide.createIcons();
  }

  async renderCurrentView() {
    if (this.activeTab === 'installed') {
      await this.renderInstalledView();
    } else if (this.activeTab === 'world') {
      await this.renderWorldsMarketplaceView();
    } else if (this.activeTab === 'playit') {
      await this.renderPlayitView();
    } else {
      await this.renderBrowseView();
    }
  }

  async renderBrowseView() {
    const container = document.getElementById('marketplace-view-content');
    if (!container) return;

    const catLabels = {
      plugin: 'Plugins (Paper / Spigot / Bukkit / Folia / Velocity)',
      mod: 'Mods (Fabric / Forge / NeoForge / Quilt)',
      datapack: 'Datapacks',
      resourcepack: 'Resource Packs (Textures & Models)',
      modpack: 'Modpacks'
    };

    const currentLabel = catLabels[this.activeTab] || 'Addons';

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Playit.gg Featured Hero Banner -->
        <div class="glass-panel p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
              <i data-lucide="network" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">Free Port Forwarding</span>
                <span class="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-semibold">Official Plugin</span>
                <span class="text-[10px] text-slate-400 font-mono">playit.gg</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-0.5">Playit.gg — Global Minecraft Server Tunnel</h4>
              <p class="text-[11px] text-slate-300">Allow players to join without port forwarding or static public IP. Free .joinmc.link domain.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button onclick="marketplace.switchCategory('playit')" class="btn-cyber-purple w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20">
              <i data-lucide="zap" class="w-3.5 h-3.5"></i> Playit Tunnel Manager
            </button>
          </div>
        </div>

        <!-- Search & Filter Controls Toolbar -->
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-white/5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="filter" class="w-3.5 h-3.5 text-cyan-400"></i> Filter & Search ${currentLabel}
            </span>
            <button onclick="marketplace.resetFilters()" class="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Reset Filters
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            <!-- 1. Search Query Input (4 cols) -->
            <div class="md:col-span-4 relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
              <input type="text" id="mp-search-input" value="${this.searchQuery}" oninput="marketplace.onSearchInput(this.value)" placeholder="Search ${this.activeTab}s by name or keyword..." class="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs">
              ${this.searchQuery ? `
                <button onclick="marketplace.clearSearch()" class="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>

            <!-- 2. Software Type Dropdown (3 cols) -->
            <div class="md:col-span-3">
              <select id="mp-loader-select" onchange="marketplace.onLoaderChange(this.value)" class="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-medium">
                ${this.allSoftwareTypes.map(st => `
                  <option value="${st.id}" ${st.id === this.selectedLoader ? 'selected' : ''}>⚙️ ${st.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- 3. Minecraft Version Dropdown (All A to Z) (3 cols) -->
            <div class="md:col-span-3">
              <select id="mp-version-select" onchange="marketplace.onVersionChange(this.value)" class="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-medium">
                <option value="" ${!this.selectedGameVersion ? 'selected' : ''}>🎮 All Minecraft Versions</option>
                ${this.allGameVersions.map(v => `
                  <option value="${v}" ${v === this.selectedGameVersion ? 'selected' : ''}>Minecraft ${v}</option>
                `).join('')}
              </select>
            </div>

            <!-- 4. Sort By Dropdown (2 cols) -->
            <div class="md:col-span-2">
              <select id="mp-sort-select" onchange="marketplace.onSortChange(this.value)" class="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-medium">
                <option value="downloads" ${this.sortBy === 'downloads' ? 'selected' : ''}>🔥 Downloads</option>
                <option value="updated" ${this.sortBy === 'updated' ? 'selected' : ''}>⏱️ Updated</option>
                <option value="relevance" ${this.sortBy === 'relevance' ? 'selected' : ''}>🎯 Match</option>
                <option value="newest" ${this.sortBy === 'newest' ? 'selected' : ''}>✨ Newest</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Project Cards Grid Container -->
        <div id="mp-projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
          <div class="col-span-full py-16 text-center text-slate-400">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
            <p>Loading ${this.activeTab}s from Modrinth repository...</p>
          </div>
        </div>

        <!-- Pagination Bar -->
        <div id="mp-pagination-bar" class="flex justify-between items-center text-xs text-slate-400 pt-2 hidden">
          <button id="mp-prev-btn" onclick="marketplace.prevPage()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
            <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> Previous
          </button>
          <span id="mp-page-info" class="font-mono">Showing 1-24</span>
          <button id="mp-next-btn" onclick="marketplace.nextPage()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
            Next <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.fetchAndRenderProjects();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedLoader = '';
    this.selectedGameVersion = '';
    this.sortBy = 'downloads';
    this.currentPage = 0;
    this.renderBrowseView();
  }

  onSearchInput(val) {
    this.searchQuery = val;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage = 0;
      this.fetchAndRenderProjects();
    }, 350);
  }

  clearSearch() {
    this.searchQuery = '';
    const inp = document.getElementById('mp-search-input');
    if (inp) inp.value = '';
    this.currentPage = 0;
    this.fetchAndRenderProjects();
  }

  onLoaderChange(val) {
    this.selectedLoader = val;
    this.currentPage = 0;
    this.fetchAndRenderProjects();
  }

  onVersionChange(val) {
    this.selectedGameVersion = val;
    this.currentPage = 0;
    this.fetchAndRenderProjects();
  }

  onSortChange(val) {
    this.sortBy = val;
    this.currentPage = 0;
    this.fetchAndRenderProjects();
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchAndRenderProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if ((this.currentPage + 1) * this.limit < this.totalHits) {
      this.currentPage++;
      this.fetchAndRenderProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async fetchAndRenderProjects() {
    const grid = document.getElementById('mp-projects-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
        <p>Loading ${this.activeTab}s...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const params = new URLSearchParams({
        query: this.searchQuery,
        projectType: this.activeTab,
        loader: this.selectedLoader,
        gameVersion: this.selectedGameVersion,
        sort: this.sortBy,
        limit: this.limit,
        offset: this.currentPage * this.limit
      });

      const res = await app.api(`/api/marketplace/search?${params.toString()}`);
      if (!res.success) throw new Error(res.error);

      const projects = res.projects || [];
      this.totalHits = res.totalHits || 0;

      // Cache projects in Map to prevent quote-escaping issues
      this.projectMap.clear();
      projects.forEach(p => this.projectMap.set(p.slug, p));

      if (projects.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center text-slate-400 space-y-3">
            <i data-lucide="package-search" class="w-12 h-12 mx-auto text-slate-500"></i>
            <p class="text-base font-semibold text-slate-300">No ${this.activeTab}s found matching your filters</p>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search filters or switching software type/Minecraft version.</p>
            <button onclick="marketplace.resetFilters()" class="btn-cyber px-4 py-2 rounded-xl text-xs mt-2">Reset Filters</button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      grid.innerHTML = projects.map(p => this.renderProjectCard(p)).join('');

      // Update pagination bar
      const pBar = document.getElementById('mp-pagination-bar');
      if (pBar) {
        pBar.classList.remove('hidden');
        const start = this.currentPage * this.limit + 1;
        const end = Math.min((this.currentPage + 1) * this.limit, this.totalHits);
        document.getElementById('mp-page-info').innerText = `Showing ${start}-${end} of ${this.totalHits}`;
        const prevBtn = document.getElementById('mp-prev-btn');
        const nextBtn = document.getElementById('mp-next-btn');
        if (prevBtn) prevBtn.disabled = (this.currentPage === 0);
        if (nextBtn) nextBtn.disabled = (end >= this.totalHits);
      }
    } catch (err) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-rose-400 space-y-2">
          <i data-lucide="alert-triangle" class="w-10 h-10 mx-auto text-rose-500"></i>
          <p class="font-bold">Error loading marketplace</p>
          <p class="text-xs text-slate-400">${err.message}</p>
          <button onclick="marketplace.fetchAndRenderProjects()" class="btn-cyber px-4 py-2 rounded-xl text-xs mt-2">Retry</button>
        </div>
      `;
    }

    if (window.lucide) lucide.createIcons();
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  renderProjectCard(p) {
    const typeBadges = {
      plugin: { label: 'Plugin', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      mod: { label: 'Mod', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      datapack: { label: 'Datapack', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      resourcepack: { label: 'Resource Pack', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      modpack: { label: 'Modpack', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
    };

    const badge = typeBadges[p.projectType] || { label: p.projectType, color: 'bg-slate-700 text-slate-200 border-white/10' };
    const iconUrl = p.iconUrl || '/assets/favicon.svg';
    const escapedTitle = this.escapeHtml(p.title);
    const escapedDesc = this.escapeHtml(p.description);

    return `
      <div class="glass-card p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-3 group">
        <div>
          <!-- Card Header: Icon, Name & Type -->
          <div class="flex items-start gap-3">
            <img src="${iconUrl}" onerror="this.src='/assets/favicon.svg'" alt="${escapedTitle}" class="w-12 h-12 rounded-xl object-contain bg-slate-900/60 p-1 border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <h4 class="font-bold text-sm text-white truncate hover:text-cyan-400 cursor-pointer" onclick="marketplace.showProjectModal('${p.slug}')" title="${escapedTitle}">${escapedTitle}</h4>
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge.color} flex-shrink-0">${badge.label}</span>
              </div>
              <p class="text-[11px] text-slate-400 truncate">by <span class="text-slate-200">${this.escapeHtml(p.author || 'Author')}</span></p>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed h-8">
            ${escapedDesc || 'No description provided.'}
          </p>

          <!-- Badges & Tags -->
          <div class="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-slate-400">
            <span class="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5">
              <i data-lucide="download" class="w-3 h-3 text-cyan-400"></i> ${this.formatDownloads(p.downloads)}
            </span>
            <span class="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5">
              <i data-lucide="heart" class="w-3 h-3 text-rose-400"></i> ${this.formatDownloads(p.follows)}
            </span>
            ${(p.displayCategories || []).slice(0, 2).map(c => `
              <span class="bg-white/5 px-2 py-0.5 rounded-md text-slate-400 truncate max-w-[90px]">${this.escapeHtml(c)}</span>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 border-t border-white/5 flex items-center gap-2">
          <button onclick="marketplace.showProjectModal('${p.slug}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center justify-center gap-1.5">
            <i data-lucide="info" class="w-3.5 h-3.5"></i> Details
          </button>
          <button id="quick-install-btn-${p.slug}" onclick="marketplace.quickInstall('${p.slug}')" class="flex-1 btn-cyber px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
            <i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Install
          </button>
        </div>
      </div>
    `;
  }

  // Quick 1-Click Install to Server
  async quickInstall(projectSlug) {
    if (!this.currentServerId) {
      app.toast('Please select a target server first.', 'error');
      return;
    }

    const project = this.projectMap.get(projectSlug);
    const projectTitle = project?.title || projectSlug;
    
    let projectType = this.activeTab;
    if (!projectType || projectType === 'installed') {
      projectType = project?.projectType || 'plugin';
    }
    const serverEngine = (this.serverData?.jar_type || '').toLowerCase();
    const isPluginServer = ['paper', 'purpur', 'spigot', 'bukkit', 'craftbukkit', 'folia', 'pufferfish', 'leaf', 'leaves', 'divinemc', 'velocity', 'bungeecord', 'waterfall'].includes(serverEngine);
    const isModServer = ['fabric', 'forge', 'neoforge', 'quilt'].includes(serverEngine);
    if (isPluginServer && (projectType === 'mod' || projectType === 'plugin')) {
      projectType = 'plugin';
    } else if (isModServer && (projectType === 'plugin' || projectType === 'mod')) {
      projectType = 'mod';
    }

    const btn = document.getElementById(`quick-install-btn-${projectSlug}`);
    const originalText = btn ? btn.innerHTML : null;

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Installing...`;
        if (window.lucide) lucide.createIcons();
      }

      app.toast(`Finding latest compatible build for ${projectTitle}...`, 'info');

      const gameVersion = this.selectedGameVersion || this.serverData?.jar_version || null;
      const loader = this.selectedLoader || null;

      const params = new URLSearchParams();
      if (gameVersion) params.append('gameVersion', gameVersion);
      if (loader) params.append('loader', loader);

      const verRes = await app.api(`/api/marketplace/project/${projectSlug}/versions?${params.toString()}`);
      if (!verRes.success || !verRes.versions || verRes.versions.length === 0) {
        // Try fallback without constraints
        const fallbackRes = await app.api(`/api/marketplace/project/${projectSlug}/versions`);
        if (!fallbackRes.success || !fallbackRes.versions || fallbackRes.versions.length === 0) {
          throw new Error('No downloadable build found for this project.');
        }
        verRes.versions = fallbackRes.versions;
      }

      const targetVersion = verRes.versions[0];
      const file = targetVersion.file;
      if (!file || !file.url) {
        throw new Error('Download link missing in release file.');
      }

      app.toast(`Downloading ${file.filename}...`, 'info');

      const installRes = await app.api(`/api/servers/${this.currentServerId}/marketplace/install`, {
        method: 'POST',
        body: JSON.stringify({
          downloadUrl: file.url,
          fileName: file.filename,
          targetType: projectType,
          projectName: projectTitle
        })
      });

      if (!installRes.success) throw new Error(installRes.error);

      app.toast(`✅ Successfully installed ${file.filename} to ${installRes.directory}/!`, 'success');
      this.refreshInstalledBadge();
    } catch (err) {
      console.error(err);
      app.toast(`Failed to install: ${err.message}`, 'error');
    } finally {
      if (btn && originalText) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  // Render Installed Addons Manager View
  async renderInstalledView() {
    const container = document.getElementById('marketplace-view-content');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Installed Server Addons
            </h4>
            <p class="text-xs text-slate-400">Manage all plugins, mods, datapacks, and resourcepacks installed on this server.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="marketplace.switchCategory('plugin')" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i> Browse Store
            </button>
            <button onclick="marketplace.renderInstalledView()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1.5">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Refresh
            </button>
          </div>
        </div>

        <div id="mp-installed-table-card" class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div class="p-8 text-center text-slate-400">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
            <p>Scanning server directories...</p>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/marketplace/installed`);
      if (!res.success) throw new Error(res.error);

      this.installedAddons = res.installed || [];
      this.updateInstalledBadgeCount(this.installedAddons.length);

      const tableCard = document.getElementById('mp-installed-table-card');
      if (!tableCard) return;

      if (this.installedAddons.length === 0) {
        tableCard.innerHTML = `
          <div class="py-16 text-center text-slate-400 space-y-4">
            <i data-lucide="folder-x" class="w-12 h-12 mx-auto text-slate-500"></i>
            <p class="text-base font-semibold text-slate-200">No addons installed yet</p>
            <p class="text-xs text-slate-400 max-w-md mx-auto">Explore the marketplace categories above to search and install Plugins, Mods, Datapacks, Resource Packs, or Modpacks.</p>
            <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button onclick="marketplace.switchCategory('plugin')" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="puzzle" class="w-4 h-4"></i> Browse Plugins
              </button>
              <button onclick="marketplace.switchCategory('mod')" class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition flex items-center gap-1.5">
                <i data-lucide="box" class="w-4 h-4"></i> Browse Mods
              </button>
              <button onclick="marketplace.switchCategory('datapack')" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition flex items-center gap-1.5">
                <i data-lucide="database" class="w-4 h-4"></i> Browse Datapacks
              </button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      tableCard.innerHTML = `
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
            <tr>
              <th class="px-5 py-3.5">Addon / File</th>
              <th class="px-5 py-3.5">Directory</th>
              <th class="px-5 py-3.5">Size</th>
              <th class="px-5 py-3.5">Modified Date</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${this.installedAddons.map(item => `
              <tr class="hover:bg-white/5 transition">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-cyan-400">
                      <i data-lucide="${item.type === 'mod' ? 'box' : (item.type === 'datapack' ? 'database' : (item.type === 'resourcepack' ? 'palette' : 'puzzle'))}" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-white font-mono">${this.escapeHtml(item.fileName)}</p>
                      <span class="text-[10px] text-slate-400 uppercase tracking-wider">${item.type}</span>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 font-mono text-cyan-400">${item.directory}/</td>
                <td class="px-5 py-3.5 font-mono text-slate-400">${item.sizeFormatted}</td>
                <td class="px-5 py-3.5 text-slate-400">${new Date(item.modifiedAt).toLocaleDateString()}</td>
                <td class="px-5 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button onclick="marketplace.openInFileManager('${item.directory}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition flex items-center gap-1.5">
                      <i data-lucide="folder-open" class="w-3.5 h-3.5"></i> Open Folder
                    </button>
                    <button onclick="marketplace.uninstallAddon('${this.escapeHtml(item.fileName)}', '${item.directory}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition flex items-center gap-1.5">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Uninstall
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      const tableCard = document.getElementById('mp-installed-table-card');
      if (tableCard) {
        tableCard.innerHTML = `
          <div class="p-8 text-center text-rose-400">
            <p class="font-bold">Failed to list installed addons</p>
            <p class="text-xs text-slate-400">${err.message}</p>
          </div>
        `;
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  async uninstallAddon(fileName, directory) {
    if (!confirm(`Are you sure you want to uninstall and delete "${fileName}"?`)) return;

    try {
      app.toast(`Uninstalling ${fileName}...`, 'info');
      const res = await app.api(`/api/servers/${this.currentServerId}/marketplace/uninstall`, {
        method: 'POST',
        body: JSON.stringify({ fileName, directory })
      });

      if (!res.success) throw new Error(res.error);

      app.toast(`✅ Successfully removed ${fileName}`, 'success');
      await this.renderInstalledView();
      this.refreshInstalledBadge();
    } catch (err) {
      app.toast(`Uninstall failed: ${err.message}`, 'error');
    }
  }

  openInFileManager(directory) {
    if (window.serverConsole && this.currentServerId) {
      serverConsole.switchSubTab('files');
      if (window.fileManager) {
        fileManager.navigateTo(directory || '');
      }
    }
  }

  async refreshInstalledBadge() {
    if (!this.currentServerId) return;
    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/marketplace/installed`);
      if (res.success && res.installed) {
        this.updateInstalledBadgeCount(res.installed.length);
      }
    } catch (e) {}
  }

  updateInstalledBadgeCount(count) {
    const badge = document.getElementById('mp-installed-badge');
    if (badge) badge.innerText = `${count}`;
  }

  // Show Detailed Project Information & Versions Modal
  async showProjectModal(slugOrId) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Project Details</span>
            <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-slate-400 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div id="mp-modal-details-area" class="py-8 text-center text-slate-400">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
            <p>Loading project details...</p>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const [projRes, verRes] = await Promise.all([
        app.api(`/api/marketplace/project/${slugOrId}`),
        app.api(`/api/marketplace/project/${slugOrId}/versions`)
      ]);

      const p = projRes.project;
      const versions = verRes.versions || [];
      const area = document.getElementById('mp-modal-details-area');
      if (!area) return;

      this.currentModalProject = p;
      this.currentModalVersions = versions;

      area.className = 'space-y-6 text-left';
      area.innerHTML = `
        <!-- Header Info -->
        <div class="flex items-start gap-4 pb-4 border-b border-white/10">
          <img src="${p.icon_url || '/assets/favicon.svg'}" onerror="this.src='/assets/favicon.svg'" alt="${this.escapeHtml(p.title)}" class="w-16 h-16 rounded-2xl object-contain bg-slate-900/60 p-1.5 border border-white/10 shadow-lg">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-xl font-bold text-white">${this.escapeHtml(p.title)}</h3>
              <span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">${p.project_type}</span>
            </div>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">${this.escapeHtml(p.description)}</p>
            <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span><i data-lucide="download" class="w-3.5 h-3.5 inline text-cyan-400 mr-1"></i> ${this.formatDownloads(p.downloads)} downloads</span>
              <span><i data-lucide="heart" class="w-3.5 h-3.5 inline text-rose-400 mr-1"></i> ${this.formatDownloads(p.followers)} followers</span>
              <a href="https://modrinth.com/${p.project_type}/${p.slug}" target="_blank" class="text-cyan-400 hover:underline flex items-center gap-1">
                Modrinth <i data-lucide="external-link" class="w-3 h-3"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Versions List -->
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-white flex items-center justify-between">
            <span>Available Release Builds</span>
            <span class="text-xs text-slate-400 font-normal">${versions.length} release builds</span>
          </h4>

          <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
            ${versions.length === 0 ? `
              <p class="text-xs text-slate-500 text-center py-4">No download files available for this project.</p>
            ` : versions.map((v, idx) => `
              <div class="glass-card p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-white text-xs font-mono">${this.escapeHtml(v.versionNumber || v.name)}</span>
                    <span class="text-[10px] text-slate-400">${new Date(v.datePublished).toLocaleDateString()}</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap">
                    <span>File: <strong class="text-slate-300">${this.escapeHtml(v.file.filename)}</strong></span>
                    <span>•</span>
                    <span>${v.file.sizeFormatted}</span>
                    <span>•</span>
                    <span>MC: ${(v.gameVersions || []).slice(0, 4).join(', ')}${v.gameVersions.length > 4 ? '...' : ''}</span>
                  </div>
                </div>

                <button onclick="marketplace.installModalVersionByIndex(${idx})" class="btn-cyber px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i> Install
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      const area = document.getElementById('mp-modal-details-area');
      if (area) {
        area.innerHTML = `<p class="text-rose-400 text-center">${err.message}</p>`;
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  async installModalVersionByIndex(index) {
    if (!this.currentServerId) {
      app.toast('Please open a server first.', 'error');
      return;
    }

    const version = this.currentModalVersions ? this.currentModalVersions[index] : null;
    const project = this.currentModalProject;
    if (!version || !version.file) {
      app.toast('Invalid version selected.', 'error');
      return;
    }

    let modalTargetType = this.activeTab;
    if (!modalTargetType || modalTargetType === 'installed') {
      modalTargetType = project?.project_type || 'plugin';
    }
    const serverEngine = (this.serverData?.jar_type || '').toLowerCase();
    const isPluginServer = ['paper', 'purpur', 'spigot', 'bukkit', 'craftbukkit', 'folia', 'pufferfish', 'leaf', 'leaves', 'divinemc', 'velocity', 'bungeecord', 'waterfall'].includes(serverEngine);
    const isModServer = ['fabric', 'forge', 'neoforge', 'quilt'].includes(serverEngine);
    if (isPluginServer && (modalTargetType === 'mod' || modalTargetType === 'plugin')) {
      modalTargetType = 'plugin';
    } else if (isModServer && (modalTargetType === 'plugin' || modalTargetType === 'mod')) {
      modalTargetType = 'mod';
    }

    try {
      app.toast(`Downloading ${version.file.filename}...`, 'info');
      const res = await app.api(`/api/servers/${this.currentServerId}/marketplace/install`, {
        method: 'POST',
        body: JSON.stringify({
          downloadUrl: version.file.url,
          fileName: version.file.filename,
          targetType: modalTargetType,
          projectName: project?.title || version.file.filename
        })
      });

      if (!res.success) throw new Error(res.error);

      app.toast(`✅ Successfully installed ${version.file.filename} to ${res.directory}/!`, 'success');
      document.getElementById('modal-container').innerHTML = '';
      this.refreshInstalledBadge();
    } catch (err) {
      app.toast(`Install failed: ${err.message}`, 'error');
    }
  }

  // Render Global Marketplace from Sidebar
  async renderGlobalMarketplaceView() {
    const container = document.getElementById('view-container');
    if (!container) return;

    // Fetch user's servers so they can pick which server to install to
    let servers = [];
    try {
      const sRes = await app.api('/api/servers');
      servers = sRes.servers || [];
    } catch (e) {}

    // Default to first server if available
    if (servers.length > 0 && !this.currentServerId) {
      this.currentServerId = servers[0].id;
      this.serverData = servers[0];
      this.detectServerDefaults(this.serverData);
    } else if (this.currentServerId) {
      this.serverData = servers.find(s => s.id == this.currentServerId) || servers[0] || null;
      if (this.serverData) this.detectServerDefaults(this.serverData);
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5 inline mr-1"></i> Global Marketplace
            </span>
            <h2 class="text-2xl font-black text-white">Addon Marketplace</h2>
            <p class="text-xs text-slate-300">Browse 50,000+ Plugins, Mods, Datapacks, Resource Packs & Modpacks and deploy directly to your servers.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Server Picker Dropdown -->
            ${servers.length > 0 ? `
              <div class="glass-panel p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                <span class="text-xs text-slate-400 pl-2">Deploy to:</span>
                <select id="global-target-server-select" onchange="marketplace.onGlobalServerChange(this.value)" class="glass-input px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-400">
                  ${servers.map(s => `
                    <option value="${s.id}" ${s.id == this.currentServerId ? 'selected' : ''}>${s.name} (${s.server_type.toUpperCase()})</option>
                  `).join('')}
                </select>
              </div>
            ` : `
              <div class="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                ⚠️ No servers created yet. Create a server first to install plugins.
              </div>
            `}

            <button onclick="marketplace.switchCategory('installed')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 shadow transition flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Installed <span id="mp-installed-badge" class="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-mono">0</span>
            </button>
          </div>
        </div>

        <!-- Category Tabs ("sab alg alg") -->
        <div class="glass-panel p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2">
          <button onclick="marketplace.switchCategory('plugin')" id="cat-btn-plugin" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'plugin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="puzzle" class="w-4 h-4"></i> Plugins
          </button>
          <button onclick="marketplace.switchCategory('mod')" id="cat-btn-mod" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'mod' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="box" class="w-4 h-4"></i> Mods
          </button>
          <button onclick="marketplace.switchCategory('datapack')" id="cat-btn-datapack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'datapack' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="database" class="w-4 h-4"></i> Datapacks
          </button>
          <button onclick="marketplace.switchCategory('resourcepack')" id="cat-btn-resourcepack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'resourcepack' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="palette" class="w-4 h-4"></i> Resource Packs
          </button>
          <button onclick="marketplace.switchCategory('modpack')" id="cat-btn-modpack" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'modpack' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="archive" class="w-4 h-4"></i> Modpacks
          </button>
          <button onclick="marketplace.switchCategory('world')" id="cat-btn-world" class="cat-pill flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'world' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="globe" class="w-4 h-4"></i> World Installer
          </button>
          <button onclick="marketplace.switchCategory('playit')" id="cat-btn-playit" class="cat-pill flex-1 min-w-[130px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${this.activeTab === 'playit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800/60 text-slate-300 hover:bg-white/10'}">
            <i data-lucide="network" class="w-4 h-4 text-indigo-400"></i> Playit.gg Tunnel
          </button>
        </div>

        <!-- Inner Content -->
        <div id="marketplace-view-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.renderCurrentView();
    this.refreshInstalledBadge();
  }

  // Render Worlds & Maps Marketplace View
  async renderWorldsMarketplaceView() {
    const container = document.getElementById('marketplace-view-content');
    if (!container) return;

    container.innerHTML = `
      <div class="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        <p class="text-sm font-semibold text-slate-300">Loading Minecraft World Maps & Addons...</p>
      </div>
    `;

    try {
      const res = await app.api('/api/marketplace/maps');
      const maps = res.maps || [];
      const plugins = res.plugins || [];

      container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
          <!-- Worlds Hero Strip -->
          <div class="glass-panel p-6 rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-cyan-950/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="space-y-1 max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  <i data-lucide="globe" class="w-3.5 h-3.5 inline mr-1"></i> Worlds & Maps Store
                </span>
                <span class="text-[10px] text-slate-400 font-mono">1-Click World Deployment</span>
              </div>
              <h3 class="text-2xl font-black text-white">Curated World Maps & World Management Addons</h3>
              <p class="text-xs text-slate-300">
                Deploy ready-to-play Skyblock, OneBlock, Parkour, Bedwars Arenas, and SMP Spawns, or manage existing worlds directly inside Mpanel.
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              ${this.currentServerId && window.serverConsole ? `
                <button onclick="serverConsole.switchSubTab('worlds')" class="btn-cyber px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                  <i data-lucide="compass" class="w-4 h-4"></i> Open Server World Manager
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Direct URL World Installer Bar -->
          <div class="glass-panel p-5 rounded-3xl border border-white/10 bg-slate-900/80 shadow-lg space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <i data-lucide="link" class="w-4 h-4 text-cyan-400"></i>
                <span class="text-xs font-bold text-white uppercase tracking-wider">Install World from Direct URL (.zip)</span>
              </div>
              <span class="text-[11px] text-slate-400">Paste any direct .zip link (Planet Minecraft, Mediafire, GitHub releases, etc.)</span>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <input type="url" id="mp-direct-world-url" placeholder="https://example.com/downloads/epic_adventure_map.zip" class="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
              <input type="text" id="mp-direct-world-name" placeholder="World Name (optional)" class="w-full sm:w-48 glass-input px-3 py-2.5 rounded-xl text-xs font-mono">
              <button onclick="marketplace.installFromDirectUrl()" id="mp-direct-url-btn" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-2 shadow">
                <i data-lucide="download" class="w-4 h-4"></i> Download & Install
              </button>
            </div>
          </div>

          <!-- Section 1: Curated World Maps -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h4 class="text-lg font-black text-white flex items-center gap-2">
                  <i data-lucide="map" class="w-5 h-5 text-teal-400"></i> Popular World Maps & Templates
                </h4>
                <span class="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full font-mono font-bold">${maps.length}</span>
              </div>
              <span class="text-xs text-slate-400">Ready to download and activate with 1 click</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              ${maps.map(m => `
                <div class="glass-panel p-5 rounded-3xl border border-white/10 bg-gradient-to-b ${m.bannerColor || 'from-slate-800/40 to-slate-900/60'} hover:border-teal-500/40 transition flex flex-col justify-between gap-4 shadow-lg group">
                  <div class="space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <div class="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        ${m.icon || '🗺️'}
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-teal-300 border border-white/10">
                          ${this.escapeHtml(m.tag || 'Map')}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">${m.sizeFormatted || ''}</span>
                      </div>
                    </div>

                    <div>
                      <h5 class="font-bold text-base text-white group-hover:text-teal-300 transition-colors">
                        ${this.escapeHtml(m.title)}
                      </h5>
                      <p class="text-[11px] text-slate-400 font-medium">By ${this.escapeHtml(m.author || 'Community')}</p>
                    </div>

                    <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      ${this.escapeHtml(m.description)}
                    </p>

                    <div class="pt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span class="bg-black/30 px-2 py-0.5 rounded border border-white/5">
                        Minecraft: <strong class="text-slate-200">${m.version || '1.20+'}</strong>
                      </span>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-white/10 flex items-center gap-2">
                    <button onclick="marketplace.openMapInstallModal('${m.id}', '${this.escapeHtml(m.title)}', '${m.sizeFormatted || ''}')" class="btn-cyber flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                      <i data-lucide="download" class="w-4 h-4"></i> 1-Click Install
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: World Management Plugins -->
          <div class="space-y-4 pt-4 border-t border-white/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h4 class="text-lg font-black text-white flex items-center gap-2">
                  <i data-lucide="puzzle" class="w-5 h-5 text-cyan-400"></i> Essential World Management Plugins
                </h4>
                <span class="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono font-bold">${plugins.length}</span>
              </div>
              <span class="text-xs text-slate-400">Multi-world handling, schematic editing, and pre-generation</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              ${plugins.map(p => `
                <div class="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:border-white/20 transition flex flex-col justify-between gap-3 shadow">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-lg">
                        ${p.icon || '🧩'}
                      </div>
                      <div class="truncate">
                        <h6 class="font-bold text-sm text-white truncate" title="${this.escapeHtml(p.title)}">${this.escapeHtml(p.title)}</h6>
                        <span class="text-[10px] text-slate-400">${this.escapeHtml(p.category || 'Plugin')}</span>
                      </div>
                    </div>
                    <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      ${this.escapeHtml(p.description)}
                    </p>
                  </div>

                  <div class="pt-2 border-t border-white/5 flex items-center gap-2">
                    <button onclick="marketplace.quickInstall('${p.slug}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white transition flex items-center justify-center gap-1.5 shadow">
                      <i data-lucide="download" class="w-3.5 h-3.5"></i> Install Plugin
                    </button>
                    <button onclick="marketplace.showProjectModal('${p.slug}')" title="Details" class="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition">
                      <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Failed to load marketplace maps:', err);
      container.innerHTML = `
        <div class="glass-panel p-10 rounded-3xl border border-rose-500/20 text-center space-y-3">
          <p class="text-base font-bold text-white">Error loading World Maps</p>
          <p class="text-xs text-rose-300">${this.escapeHtml(err.message)}</p>
          <button onclick="marketplace.renderWorldsMarketplaceView()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold mt-2">
            Retry
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // Open Map Install Modal
  openMapInstallModal(mapId, mapTitle, mapSize) {
    if (!this.currentServerId) {
      app.toast('Please select or open a server first to install maps.', 'warning');
      return;
    }

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="map-install-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-teal-500/30 p-6 space-y-5 shadow-2xl bg-slate-900/95">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <i data-lucide="download" class="w-5 h-5"></i>
              </div>
              <h3 class="text-lg font-bold text-white">Install World Map</h3>
            </div>
            <button onclick="marketplace.closeModal('map-install-modal')" class="text-slate-400 hover:text-white transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="marketplace.handleInstallMap(event, '${mapId}')" class="space-y-4">
            <div class="glass-panel p-3.5 rounded-2xl border border-white/10 bg-slate-950/40 space-y-1">
              <span class="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">Target Map</span>
              <p class="font-bold text-white text-sm">${this.escapeHtml(mapTitle)}</p>
              ${mapSize ? `<span class="text-[11px] text-slate-400 font-mono">Download Size: ${mapSize}</span>` : ''}
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">World Folder Name *</label>
              <input type="text" id="install-map-folder-name" value="${mapId.replace(/[^a-zA-Z0-9_]/g, '_')}" required class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono" pattern="[a-zA-Z0-9_\\-]+" title="Only letters, numbers, underscores, and hyphens">
              <p class="text-[11px] text-slate-400 mt-1">Directory where map will be extracted.</p>
            </div>

            <div class="pt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="install-map-set-active" checked class="rounded bg-slate-800 border-white/20 text-teal-500 focus:ring-0">
                <span class="text-xs text-teal-300 font-semibold">Set as Active World (level-name) in server.properties</span>
              </label>
            </div>

            <div class="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button type="button" onclick="marketplace.closeModal('map-install-modal')" class="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" id="install-map-submit-btn" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4"></i> Deploy Map to Server
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  async handleInstallMap(e, mapId) {
    e.preventDefault();
    const btn = document.getElementById('install-map-submit-btn');
    const folderInput = document.getElementById('install-map-folder-name');
    const activeInput = document.getElementById('install-map-set-active');

    const customName = folderInput?.value?.trim() || mapId;
    const setActive = activeInput?.checked !== false;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Deploying Map...`;
    }

    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/worlds/install-map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, customName, setActive })
      });

      app.toast(res.message || 'World map installed successfully!', 'success');
      this.closeModal('map-install-modal');

      // If user is in server console, refresh world manager if initialized
      if (window.worldManager && worldManager.currentServerId == this.currentServerId) {
        await worldManager.loadWorlds();
      }
    } catch (err) {
      app.toast(`Map install failed: ${err.message}`, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async installFromDirectUrl() {
    if (!this.currentServerId) {
      app.toast('Please select or open a server first.', 'warning');
      return;
    }

    const urlInput = document.getElementById('mp-direct-world-url');
    const nameInput = document.getElementById('mp-direct-world-name');
    const btn = document.getElementById('mp-direct-url-btn');

    const downloadUrl = urlInput?.value?.trim();
    const customName = nameInput?.value?.trim() || '';

    if (!downloadUrl) {
      app.toast('Please paste a direct download URL (.zip).', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full mr-1.5"></span> Downloading World...`;
    }

    try {
      const res = await app.api(`/api/servers/${this.currentServerId}/worlds/install-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl, customName, setActive: true })
      });

      app.toast(res.message || 'World downloaded & installed successfully!', 'success');
      if (urlInput) urlInput.value = '';
      if (nameInput) nameInput.value = '';

      if (window.worldManager && worldManager.currentServerId == this.currentServerId) {
        await worldManager.loadWorlds();
      }
    } catch (err) {
      app.toast(`Direct install error: ${err.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Download & Install`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  // Render Playit.gg Zero-Port Tunnel Manager View
  async renderPlayitView() {
    const container = document.getElementById('marketplace-view-content');
    if (!container) return;

    if (!this.currentServerId) {
      container.innerHTML = `
        <div class="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4 max-w-lg mx-auto">
          <div class="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/20">
            <i data-lucide="network" class="w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-bold text-white">Select a Target Server</h3>
          <p class="text-xs text-slate-300">
            Please select a Minecraft server from the selector above to manage its Playit.gg tunnel.
          </p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <p class="text-sm font-semibold text-slate-300">Detecting Playit.gg Tunnel & Status...</p>
      </div>
    `;

    try {
      const res = await app.api(`/api/marketplace/playit/status?serverId=${this.currentServerId}`);
      if (!res.success || !res.status) {
        throw new Error(res.error || 'Failed to retrieve Playit tunnel status');
      }
      this.renderPlayitContent(container, res.status);
    } catch (err) {
      container.innerHTML = `
        <div class="glass-panel p-10 rounded-3xl border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto">
          <div class="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <i data-lucide="alert-circle" class="w-7 h-7"></i>
          </div>
          <h4 class="text-lg font-bold text-white">Failed to Load Playit Tunnel Status</h4>
          <p class="text-xs text-rose-300">${this.escapeHtml(err.message)}</p>
          <button onclick="marketplace.renderPlayitView()" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold">
            <i data-lucide="rotate-ccw" class="w-4 h-4 inline mr-1"></i> Try Again
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // Render Playit Details, Connection Domain, Claim Link, & Settings
  renderPlayitContent(container, status) {
    const isInstalled = Boolean(status.installed);
    const hasSecretKey = Boolean(status.hasSecretKey);
    const statusType = status.status; // 'active' | 'needs_claim' | 'installed' | 'not_installed'
    const tunnelDomain = status.tunnelDomain;
    const claimUrl = status.claimUrl;
    const jar = status.jar;

    let statusBadge = '';
    if (statusType === 'active') {
      statusBadge = `
        <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Tunnel Online & Active
        </span>
      `;
    } else if (statusType === 'needs_claim') {
      statusBadge = `
        <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
          <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Claim Required
        </span>
      `;
    } else if (isInstalled) {
      statusBadge = `
        <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
          <i data-lucide="info" class="w-3.5 h-3.5"></i> Installed (Waiting for Server Start)
        </span>
      `;
    } else {
      statusBadge = `
        <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-white/10 flex items-center gap-1.5">
          <i data-lucide="circle" class="w-3.5 h-3.5"></i> Not Installed
        </span>
      `;
    }

    const defaultTargetType = (this.serverData?.jar_type && ['fabric', 'forge', 'neoforge', 'quilt'].includes(this.serverData.jar_type.toLowerCase())) ? 'mod' : 'plugin';

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Hero Header Card -->
        <div class="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/70 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-xl shadow-indigo-500/20">
              <i data-lucide="network" class="w-7 h-7"></i>
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-0.5 rounded-full border border-indigo-500/30">
                  Zero Port Forwarding
                </span>
                <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Official Latest Release
                </span>
                ${statusBadge}
              </div>
              <h3 class="text-2xl font-black text-white flex items-center gap-2">
                Playit.gg Tunnel Manager
              </h3>
              <p class="text-xs text-slate-300 max-w-xl">
                Allow anyone in the world to join your Minecraft server without port forwarding, static IPs, router access, or VPNs.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button onclick="marketplace.renderPlayitView()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 shadow transition flex items-center gap-1.5">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Refresh Status
            </button>
            ${isInstalled ? `
              <button onclick="marketplace.uninstallPlayit()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1.5">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Uninstall
              </button>
            ` : ''}
          </div>
        </div>

        ${tunnelDomain ? `
          <!-- Active Public Domain Banner (No Port Forwarding Address) -->
          <div class="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-indigo-950/30 shadow-2xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <span class="text-xs font-black uppercase tracking-wider text-emerald-400">Public Player Connection Address</span>
              </div>
              <span class="text-[11px] text-slate-300 font-mono">Ready for Minecraft Java / Bedrock</span>
            </div>

            <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/20">
              <div class="space-y-0.5 text-center md:text-left">
                <div class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Direct Join Domain</div>
                <div class="text-xl sm:text-2xl font-mono font-black tracking-wide select-all text-emerald-300">
                  ${this.escapeHtml(tunnelDomain)}
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button onclick="marketplace.copyAddress('${this.escapeHtml(tunnelDomain)}')" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <i data-lucide="copy" class="w-4 h-4"></i> Copy IP Address
                </button>
              </div>
            </div>

            <p class="text-xs text-slate-300 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
              Share this domain with your players! They can paste it directly into their Minecraft client server address bar.
            </p>
          </div>
        ` : ''}

        ${claimUrl ? `
          <!-- Claim Required Alert Card -->
          <div class="glass-panel p-6 rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-amber-950/20 shadow-2xl space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-base font-bold text-white">Playit Account Claim Required</h4>
                <p class="text-xs text-amber-200/90">
                  Your server generated a claim URL. Link this tunnel to your free Playit.gg account to unlock your public address.
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a href="${claimUrl}" target="_blank" rel="noopener noreferrer" class="btn-cyber-purple px-6 py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
                <i data-lucide="external-link" class="w-4 h-4"></i> Click Here to Claim Tunnel on Playit.gg
              </a>
              <button onclick="marketplace.renderPlayitView()" class="px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition flex items-center justify-center gap-2">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i> Check Status After Claiming
              </button>
            </div>
            <p class="text-[11px] text-slate-400 font-mono">
              Claim URL: <a href="${claimUrl}" target="_blank" class="text-indigo-400 underline break-all">${this.escapeHtml(claimUrl)}</a>
            </p>
          </div>
        ` : ''}

        <!-- Main Configuration & Setup Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Installation & Status Card (7 cols) -->
          <div class="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div class="flex items-center gap-2">
                <i data-lucide="box" class="w-4 h-4 text-indigo-400"></i>
                <h4 class="text-sm font-bold text-white uppercase tracking-wider">Plugin Installation & State</h4>
              </div>
              <span class="text-[11px] font-mono text-slate-400">Target Server #${this.currentServerId}</span>
            </div>

            ${isInstalled && jar ? `
              <!-- Installed Jar Details -->
              <div class="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <h5 class="text-xs font-bold text-white font-mono">${this.escapeHtml(jar.fileName)}</h5>
                      <p class="text-[11px] text-slate-400 font-mono">Located in /${this.escapeHtml(jar.directory)} (${(jar.size / (1024 * 1024)).toFixed(2)} MB)</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Installed</span>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <button onclick="marketplace.installPlayit()" id="playit-install-btn" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Reinstall / Update Plugin
                  </button>
                  <button onclick="marketplace.uninstallPlayit()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition flex items-center gap-1.5">
                    <i data-lucide="trash" class="w-3.5 h-3.5"></i> Remove Plugin
                  </button>
                </div>
              </div>
            ` : `
              <!-- Install Option Box -->
              <div class="bg-slate-900/70 p-5 rounded-2xl border border-indigo-500/20 space-y-4">
                <div>
                  <h5 class="text-sm font-bold text-white">1-Click Official Playit.gg Installation</h5>
                  <p class="text-xs text-slate-300 mt-1">
                    Downloads the official <code>playit-minecraft-plugin.jar</code> (Latest Release) directly into your server directory.
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Target Directory</label>
                    <select id="playit-target-type" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
                      <option value="plugin" ${defaultTargetType === 'plugin' ? 'selected' : ''}>plugins/ (Paper, Purpur, Spigot, Velocity)</option>
                      <option value="mod" ${defaultTargetType === 'mod' ? 'selected' : ''}>mods/ (Fabric, Forge, NeoForge)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Optional Secret Key</label>
                    <input type="text" id="playit-install-secret" placeholder="Paste playit secret key (optional)" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
                  </div>
                </div>

                <button onclick="marketplace.installPlayit()" id="playit-install-btn" class="btn-cyber-purple w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
                  <i data-lucide="download" class="w-4 h-4"></i> Install Playit.gg Plugin
                </button>
              </div>
            `}

            <!-- Server Startup Reminder Notice -->
            <div class="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
              <i data-lucide="lightbulb" class="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"></i>
              <div class="text-xs text-slate-300 space-y-1">
                <p class="font-bold text-white">Important: Restart or Start Server to Activate</p>
                <p class="text-[11px] text-slate-400">
                  After installing the plugin or updating your secret key, restart your Minecraft server from the Server Console. The plugin initializes its tunnel during startup.
                </p>
              </div>
            </div>
          </div>

          <!-- Right Column: Secret Key Configuration & Account Linking (5 cols) -->
          <div class="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div class="flex items-center gap-2">
                <i data-lucide="key" class="w-4 h-4 text-cyan-400"></i>
                <h4 class="text-sm font-bold text-white uppercase tracking-wider">Secret Key Configuration</h4>
              </div>
              ${hasSecretKey ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Configured</span>
              ` : `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/10">Unset</span>
              `}
            </div>

            <div class="space-y-3">
              <p class="text-xs text-slate-300 leading-relaxed">
                If you manage your tunnels through a Playit.gg account, copy your <strong>Secret Key</strong> from <a href="https://playit.gg/manage" target="_blank" class="text-indigo-400 underline font-semibold">playit.gg/manage</a> and paste it below.
              </p>

              ${hasSecretKey ? `
                <div class="bg-slate-900/80 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div class="space-y-0.5">
                    <span class="text-[10px] font-bold uppercase text-slate-400">Current Saved Key:</span>
                    <p class="text-xs font-mono text-emerald-300">${this.escapeHtml(status.secretKey)}</p>
                  </div>
                  <i data-lucide="lock" class="w-4 h-4 text-emerald-400"></i>
                </div>
              ` : ''}

              <div>
                <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Enter Secret Key</label>
                <div class="relative">
                  <input type="password" id="playit-secret-input" placeholder="Paste playit secret key..." class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono pr-10">
                  <button type="button" onclick="const i=document.getElementById('playit-secret-input'); i.type = i.type === 'password' ? 'text' : 'password';" class="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <button onclick="marketplace.configurePlayit()" id="playit-save-secret-btn" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow">
                <i data-lucide="save" class="w-4 h-4"></i> Save & Bind Key to playit.toml
              </button>
            </div>

            <!-- Quick Info / Links -->
            <div class="pt-3 border-t border-white/5 space-y-2">
              <a href="https://playit.gg/manage" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200">
                <span class="flex items-center gap-2">
                  <i data-lucide="external-link" class="w-3.5 h-3.5 text-indigo-400"></i> Open Playit Dashboard
                </span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </a>
              <a href="https://playit.gg/support" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200">
                <span class="flex items-center gap-2">
                  <i data-lucide="help-circle" class="w-3.5 h-3.5 text-cyan-400"></i> Playit Help & Docs
                </span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- 3-Step Setup Guide & Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">1</div>
            <h5 class="text-xs font-bold text-white">1-Click Install</h5>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Mpanel installs the official Playit plugin into your server plugins or mods directory automatically.
            </p>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">2</div>
            <h5 class="text-xs font-bold text-white">Start Your Server</h5>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Launch your server. The plugin boots and automatically builds an encrypted tunnel with Playit's global network.
            </p>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">3</div>
            <h5 class="text-xs font-bold text-white">Connect & Play</h5>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Get your custom <code class="text-emerald-300">*.joinmc.link</code> domain above and share it with your friends!
            </p>
          </div>
        </div>

        <!-- Native Linux System CLI (playit package) Box -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <i data-lucide="terminal" class="w-4 h-4"></i>
              </div>
              <div>
                <h5 class="text-xs font-bold text-white uppercase tracking-wider">Native Linux System Tunnel (playit CLI)</h5>
                <p class="text-[11px] text-slate-400">Run Playit directly as a background Linux system daemon (ideal for VPS, Bedrock, and non-plugin servers)</p>
              </div>
            </div>

            ${status.systemCli && status.systemCli.installed ? `
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> CLI Installed (${status.systemCli.version || 'Active'})
              </span>
            ` : `
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-white/10 flex items-center gap-1.5 shrink-0">
                <i data-lucide="circle" class="w-3.5 h-3.5"></i> CLI Not Installed
              </span>
            `}
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-bold text-slate-300">Ubuntu / Debian One-Liner Install Command:</span>
              <button onclick="marketplace.copyAddress('curl -SsL https://packages.playit.gg/keys/playit.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/playit.gpg >/dev/null && sudo chmod 0644 /usr/share/keyrings/playit.gpg && sudo curl -fsSL -o /etc/apt/sources.list.d/playit.list https://packages.playit.gg/repo-files/playit-debian.list && sudo apt update && sudo apt install -y playit')" class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Commands
              </button>
            </div>
            <pre class="bg-slate-950/90 p-3.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed select-all">curl -SsL https://packages.playit.gg/keys/playit.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/playit.gpg >/dev/null
sudo chmod 0644 /usr/share/keyrings/playit.gpg
sudo curl -fsSL -o /etc/apt/sources.list.d/playit.list https://packages.playit.gg/repo-files/playit-debian.list
sudo apt update
sudo apt install -y playit</pre>
            <p class="text-[10px] text-slate-400">
              💡 You can also install it anytime via Mpanel CLI: <code>./menu.sh playit</code> or <code>bash menu.sh</code> (Option 8).
            </p>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  async installPlayit() {
    if (!this.currentServerId) {
      app.toast('Please select a server first.', 'warning');
      return;
    }

    const targetSelect = document.getElementById('playit-target-type');
    const secretInput = document.getElementById('playit-install-secret');
    const targetType = targetSelect ? targetSelect.value : (this.activeTab === 'mod' ? 'mod' : 'plugin');
    const secretKey = secretInput ? secretInput.value.trim() : '';

    const btn = document.getElementById('playit-install-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5"></span> Installing Playit Plugin...`;
    }

    try {
      const res = await app.api('/api/marketplace/playit/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: this.currentServerId,
          targetType,
          secretKey: secretKey || undefined
        })
      });

      app.toast(res.message || 'Playit.gg plugin installed successfully! Start/restart your server to launch the tunnel.', 'success');
      await this.renderPlayitView();
    } catch (err) {
      app.toast(`Installation failed: ${err.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Install Playit.gg Plugin`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  async configurePlayit() {
    if (!this.currentServerId) {
      app.toast('Please select a server first.', 'warning');
      return;
    }

    const input = document.getElementById('playit-secret-input');
    const secretKey = input ? input.value.trim() : '';
    if (!secretKey) {
      app.toast('Please enter your Playit secret key.', 'warning');
      return;
    }

    const btn = document.getElementById('playit-save-secret-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5"></span> Saving...`;
    }

    try {
      const res = await app.api('/api/marketplace/playit/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: this.currentServerId,
          secretKey
        })
      });

      app.toast(res.message || 'Secret key configured successfully!', 'success');
      if (input) input.value = '';
      await this.renderPlayitView();
    } catch (err) {
      app.toast(`Failed to save secret key: ${err.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Save & Bind Key to playit.toml`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  async uninstallPlayit() {
    if (!this.currentServerId) return;

    if (!confirm('Are you sure you want to uninstall Playit.gg and remove its plugin & config from this server?')) {
      return;
    }

    try {
      const res = await app.api('/api/marketplace/playit/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: this.currentServerId })
      });

      app.toast(res.message || 'Playit.gg uninstalled successfully.', 'success');
      await this.renderPlayitView();
    } catch (err) {
      app.toast(`Uninstall failed: ${err.message}`, 'error');
    }
  }

  copyAddress(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        app.toast(`Copied address: ${text}`, 'success');
      }).catch(() => {
        this.copyAddressFallback(text);
      });
    } else {
      this.copyAddressFallback(text);
    }
  }

  copyAddressFallback(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      app.toast(`Copied address: ${text}`, 'success');
    } catch (e) {
      app.toast(`Could not copy address: ${text}`, 'error');
    }
    document.body.removeChild(el);
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  }

  async onGlobalServerChange(sId) {
    this.currentServerId = sId;
    try {
      const res = await app.api(`/api/servers/${sId}`);
      this.serverData = res.server;
      this.detectServerDefaults(this.serverData);
    } catch (e) {}
    await this.renderCurrentView();
  }
}

window.marketplace = new MarketplaceController();
