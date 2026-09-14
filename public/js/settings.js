// Admin Settings & Customization Engine with 4K Wallpapers Browser, Video Backgrounds, Transparency & Blur Controls
class SettingsManager {
  constructor() {
    this.categories = [];
    this.activeCategory = 'all';
    this.currentPage = 1;
    this.totalPages = 1;
    this.searchQuery = '';
    this.wallpapers = [];
    this.favorites = this.loadFavorites();
    this.activeTab = 'browser'; // 'browser' | 'upload' | 'url' | 'favorites'
    this.autoSaveTimer = null;
    this.previewingWallpaper = null;
    this.revertTheme = null;
    this.currentTheme = {
      transparency: 18,
      blur: 16,
      bg: '',
      bgType: 'image',
      themeMode: 'dark',
      activeTheme: localStorage.getItem('mpanel_active_theme') || 'arix',
      panelSoundsEnabled: localStorage.getItem('panelSounds') !== 'false',
      arixPrimaryColor: '#4A35CF',
      autoSave: true
    };
  }

  loadFavorites() {
    try {
      const saved = localStorage.getItem('mpanel_fav_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem('mpanel_fav_wallpapers', JSON.stringify(this.favorites));
    } catch (e) {
      console.warn('Could not save favorites to localStorage', e);
    }
  }

  async renderSettingsView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto pb-12">
        <!-- Top Bar Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Admin Management</span>
              <span id="theme-mode-badge" class="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">Dark Mode</span>
            </div>
            <h2 class="text-2xl font-black text-white mt-2 flex items-center gap-2.5 tracking-wide">
              <i data-lucide="sliders" class="w-6 h-6 text-purple-400"></i> Global Settings & Customization
            </h2>
            <p class="text-xs text-slate-400 mt-1">Configure 4K wallpapers, background video/images, real-time glassmorphism, transparency, blur, and branding</p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <!-- Dark / Light Mode Toggle -->
            <button id="theme-toggle-btn" onclick="settingsManager.toggleThemeMode()" title="Toggle Dark/Light Mode" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 transition flex items-center gap-2">
              <i id="theme-toggle-icon" data-lucide="moon" class="w-4 h-4 text-amber-400"></i>
              <span id="theme-toggle-label">Dark Mode</span>
            </button>

            <!-- Reset to Default Button -->
            <button onclick="settingsManager.resetToDefault()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-2">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset to Default
            </button>

            <!-- Save All Settings Button -->
            <button onclick="settingsManager.saveSettings()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> Save Settings
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left 2 Cols: Main Controls & Wallpaper Engine -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Card 0: Active Theme Selection (NookTheme vs Arix Theme v2.1.3) -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <i data-lucide="palette" class="w-4 h-4 text-purple-400"></i> Panel Theme Selection
                  </h3>
                  <p class="text-[11px] text-slate-400">Choose between the high-tech NookTheme and the premier Arix Theme v2.1.3</p>
                </div>
                <span id="active-theme-badge" class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${this.currentTheme.activeTheme === 'arix' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'}">
                  ${this.currentTheme.activeTheme === 'arix' ? 'Arix Theme v2.1.3 Active' : 'NookTheme Active'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Option A: NookTheme -->
                <div id="theme-card-nook" onclick="settingsManager.selectTheme('nook')" class="theme-select-card p-5 rounded-2xl border ${this.currentTheme.activeTheme === 'nook' ? 'active bg-cyan-950/20 border-cyan-500/50' : 'bg-slate-900/40 border-white/5 hover:border-white/20'} flex flex-col justify-between space-y-4">
                  <div class="flex items-start justify-between">
                    <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                      <i data-lucide="terminal" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Cyber Glass</span>
                  </div>
                  <div>
                    <h4 class="text-base font-bold text-white">NookTheme</h4>
                    <p class="text-xs text-slate-400 mt-1 leading-relaxed">Modern cyber aesthetics with glassmorphic cards, neon cyan/emerald accents, and sharp geometry.</p>
                  </div>
                  <div class="pt-2 flex items-center justify-between border-t border-white/5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-full bg-cyan-400"></span>
                      <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                      <span class="w-3 h-3 rounded-full bg-slate-700"></span>
                    </div>
                    <button type="button" id="btn-theme-nook" class="text-xs font-semibold px-3 py-1.5 rounded-lg ${this.currentTheme.activeTheme === 'nook' ? 'btn-cyber' : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                      ${this.currentTheme.activeTheme === 'nook' ? '✓ Active Theme' : 'Activate Nook'}
                    </button>
                  </div>
                </div>

                <!-- Option B: Arix Theme v2.1.3 -->
                <div id="theme-card-arix" onclick="settingsManager.selectTheme('arix')" class="theme-select-card p-5 rounded-2xl border ${this.currentTheme.activeTheme === 'arix' ? 'active bg-purple-950/20 border-purple-500/50' : 'bg-slate-900/40 border-white/5 hover:border-white/20'} flex flex-col justify-between space-y-4">
                  <div class="flex items-start justify-between">
                    <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 p-2 flex items-center justify-center shadow-inner">
                      <img src="/arix/Arix.png" alt="Arix Theme" class="w-full h-full object-contain">
                    </div>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Arix v2.1.3</span>
                  </div>
                  <div>
                    <h4 class="text-base font-bold text-white flex items-center gap-1.5">
                      Arix Theme <span class="text-xs text-purple-400 font-normal">v2.1.3</span>
                    </h4>
                    <p class="text-xs text-slate-400 mt-1 leading-relaxed">The premier Pterodactyl theme with signature royal violet accents, midnight indigo cards, and audio sound effects.</p>
                  </div>
                  <div class="pt-2 flex items-center justify-between border-t border-white/5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-full bg-[#4A35CF]"></span>
                      <span class="w-3 h-3 rounded-full bg-[#6E56CF]"></span>
                      <span class="w-3 h-3 rounded-full bg-[#0B0D2A]"></span>
                    </div>
                    <button type="button" id="btn-theme-arix" class="text-xs font-semibold px-3 py-1.5 rounded-lg ${this.currentTheme.activeTheme === 'arix' ? 'btn-cyber' : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                      ${this.currentTheme.activeTheme === 'arix' ? '✓ Active Theme' : 'Activate Arix'}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Arix Theme Enhancements (Audio FX & Colors) -->
              <div id="arix-options-panel" class="pt-2 border-t border-white/10 space-y-4 ${this.currentTheme.activeTheme === 'arix' ? '' : 'opacity-60'}">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 class="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <i data-lucide="volume-2" class="w-4 h-4 text-purple-400"></i> Panel Audio Sound Effects (Arix Audio FX)
                    </h4>
                    <p class="text-[11px] text-slate-400">Play authentic audio feedback on server online, offline, and clipboard actions</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="set-panel-sounds" class="sr-only peer" ${this.currentTheme.panelSoundsEnabled ? 'checked' : ''} onchange="settingsManager.togglePanelSounds(this.checked)">
                      <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Quick Audio Preview Buttons -->
                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <span class="text-[11px] text-slate-400 mr-1">Preview Sounds:</span>
                  <button type="button" onclick="app.playSound('online')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-colors">
                    <i data-lucide="play" class="w-3 h-3"></i> Server Online
                  </button>
                  <button type="button" onclick="app.playSound('offline')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-colors">
                    <i data-lucide="play" class="w-3 h-3"></i> Server Offline
                  </button>
                  <button type="button" onclick="app.playSound('copy')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors">
                    <i data-lucide="copy" class="w-3 h-3"></i> Copy Sound
                  </button>
                </div>
              </div>
            </div>

            <!-- Card 1: Panel Background & Integrated 4K Wallpaper Browser -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <i data-lucide="image" class="w-4 h-4 text-purple-400"></i> Panel Background Engine
                  </h3>
                  <p class="text-[11px] text-slate-400">Select from 4KWallpapers.com, upload your own video/image, or add via URL</p>
                </div>

                <!-- Sub Navigation Tabs -->
                <div class="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 shrink-0 text-xs font-semibold">
                  <button id="tab-btn-browser" onclick="settingsManager.switchTab('browser')" class="px-3 py-1.5 rounded-lg transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                    <i data-lucide="globe" class="w-3.5 h-3.5"></i> 4K Wallpapers
                  </button>
                  <button id="tab-btn-upload" onclick="settingsManager.switchTab('upload')" class="px-3 py-1.5 rounded-lg transition text-slate-400 hover:text-white flex items-center gap-1.5">
                    <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i> Upload Media
                  </button>
                  <button id="tab-btn-url" onclick="settingsManager.switchTab('url')" class="px-3 py-1.5 rounded-lg transition text-slate-400 hover:text-white flex items-center gap-1.5">
                    <i data-lucide="link" class="w-3.5 h-3.5"></i> Custom URL
                  </button>
                  <button id="tab-btn-favorites" onclick="settingsManager.switchTab('favorites')" class="px-3 py-1.5 rounded-lg transition text-slate-400 hover:text-white flex items-center gap-1.5">
                    <i data-lucide="heart" class="w-3.5 h-3.5 text-rose-400"></i> Favorites (<span id="fav-count-badge">0</span>)
                  </button>
                </div>
              </div>

              <!-- VIEW 1: 4K Wallpapers Browser (Default) -->
              <div id="subview-browser" class="space-y-4">
                <!-- Search & Category Filters -->
                <div class="flex flex-col sm:flex-row gap-3">
                  <!-- Search Bar -->
                  <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    <input type="text" id="wallpaper-search-input" placeholder="Search 4K wallpapers (e.g. Minecraft, Cyberpunk, Nature, Space)..." onkeydown="if(event.key==='Enter') settingsManager.searchWallpapers()" class="w-full glass-input pl-10 pr-20 py-2 rounded-xl text-xs">
                    <button onclick="settingsManager.searchWallpapers()" class="absolute right-1.5 top-1/2 -translate-y-1/2 btn-cyber px-3 py-1 rounded-lg text-[11px] font-semibold">Search</button>
                  </div>

                  <!-- Category Dropdown Select -->
                  <div class="shrink-0">
                    <select id="wallpaper-category-select" onchange="settingsManager.selectCategory(this.value)" class="glass-input px-3.5 py-2 rounded-xl text-xs cursor-pointer font-medium">
                      <!-- Populated dynamically -->
                    </select>
                  </div>
                </div>

                <!-- Category Chips Horizontal Bar -->
                <div>
                  <div id="wallpaper-category-chips" class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <!-- Populated dynamically -->
                  </div>
                </div>

                <!-- Wallpapers Results Grid -->
                <div id="wallpapers-grid-container" class="relative min-h-[300px]">
                  <div id="wallpapers-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    <!-- Cards populated dynamically -->
                  </div>

                  <!-- Skeleton / Loading State -->
                  <div id="wallpapers-loading" class="hidden absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 rounded-2xl">
                    <div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs text-slate-300 font-medium">Fetching 4K Wallpapers...</span>
                  </div>
                </div>

                <!-- Pagination Bar -->
                <div id="wallpaper-pagination" class="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <button id="page-prev-btn" onclick="settingsManager.prevPage()" class="btn-cyber px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none">
                    <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> Previous
                  </button>
                  <div class="flex items-center gap-2">
                    <span id="page-info-label" class="text-slate-300 font-medium">Page 1 of 1</span>
                    <input type="number" id="page-jump-input" min="1" max="1" placeholder="Go" onkeydown="if(event.key==='Enter') settingsManager.jumpToPage(this.value)" class="glass-input w-14 py-1 text-center rounded-lg text-xs">
                  </div>
                  <button id="page-next-btn" onclick="settingsManager.nextPage()" class="btn-cyber px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none">
                    Next <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <!-- VIEW 2: Upload Media (Images & Videos) -->
              <div id="subview-upload" class="hidden space-y-4">
                <div class="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-3xl p-8 text-center transition bg-slate-900/40 space-y-4">
                  <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                    <i data-lucide="upload-cloud" class="w-8 h-8"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-white">Upload Custom Background Media</h4>
                    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Supports high-resolution images (<span class="text-cyan-400">JPG, PNG, WEBP, GIF</span>) and looping background videos (<span class="text-purple-400">MP4, WEBM</span> up to 100MB)
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <!-- Image Picker -->
                    <label class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                      <i data-lucide="image" class="w-4 h-4"></i> Choose Image File
                      <input type="file" accept="image/*" class="hidden" onchange="settingsManager.uploadAsset(this, 'background')">
                    </label>

                    <!-- Video Picker -->
                    <label class="btn-cyber-purple px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/20">
                      <i data-lucide="video" class="w-4 h-4"></i> Choose Video File (.mp4, .webm)
                      <input type="file" accept="video/mp4,video/webm,video/*" class="hidden" onchange="settingsManager.uploadAsset(this, 'background')">
                    </label>
                  </div>
                </div>
              </div>

              <!-- VIEW 3: Custom URL Media Input -->
              <div id="subview-url" class="hidden space-y-4">
                <div class="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-3">
                  <label class="block text-xs font-semibold text-slate-300">Direct Media URL (Image or Video)</label>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <input type="text" id="custom-media-url" placeholder="https://example.com/wallpaper.jpg or https://example.com/motion-loop.mp4" class="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs">
                    <button onclick="settingsManager.testUrlBackground()" class="btn-cyber px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2">
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i> Test & Live Preview
                    </button>
                    <button onclick="settingsManager.applyUrlBackground()" class="btn-cyber-purple px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i> Apply
                    </button>
                  </div>
                  <div class="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Detected type: <strong id="url-type-detected" class="text-cyan-400">Image</strong></span>
                    <span>• Works with MP4, WEBM, JPG, PNG, WEBP URLs</span>
                  </div>
                </div>
              </div>

              <!-- VIEW 4: Favorites -->
              <div id="subview-favorites" class="hidden space-y-4">
                <div id="favorites-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 min-h-[160px]">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Card 2: Glassmorphism, Transparency & Blur Controls -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
              <div class="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <i data-lucide="sparkles" class="w-4 h-4 text-emerald-400"></i> Glassmorphism, Transparency & Blur Sliders
                </h3>
                <div class="flex items-center gap-2">
                  <label class="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" id="set-auto-save" onchange="settingsManager.toggleAutoSave(this.checked)" checked class="rounded border-white/20 text-cyan-500 focus:ring-0">
                    <span>Auto-save changes</span>
                  </label>
                </div>
              </div>

              <!-- Transparency Slider -->
              <div class="space-y-2.5">
                <div class="flex justify-between items-center text-xs font-semibold">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-300">Card Transparency Bar:</span>
                    <span id="transparency-bar-indicator" class="font-mono text-cyan-400">0% ---------|--------- 100%</span>
                  </div>
                  <span id="transparency-val-label" class="text-cyan-400 font-mono text-sm font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">18%</span>
                </div>
                <input type="range" id="set-transparency-bar" min="0" max="100" value="18" oninput="settingsManager.onTransparencySlider(this.value)" class="slider-custom">
                <div class="flex justify-between text-[11px] text-slate-400">
                  <span>0% (Solid Dark)</span>
                  <span>50% (Balanced Glass)</span>
                  <span>100% (Ultra Clear)</span>
                </div>
              </div>

              <!-- Blur Slider -->
              <div class="space-y-2.5 pt-3 border-t border-white/5">
                <div class="flex justify-between items-center text-xs font-semibold">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-300">Backdrop Blur Bar:</span>
                    <span id="blur-bar-indicator" class="font-mono text-purple-400">0px ---------|---------- 40px</span>
                  </div>
                  <span id="blur-val-label" class="text-purple-400 font-mono text-sm font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">16px</span>
                </div>
                <input type="range" id="set-blur-bar" min="0" max="40" value="16" oninput="settingsManager.onBlurSlider(this.value)" class="slider-custom">
                <div class="flex justify-between text-[11px] text-slate-400">
                  <span>0px (No Blur)</span>
                  <span>20px (Frost Glass)</span>
                  <span>40px (Heavy Cyber Blur)</span>
                </div>
              </div>
            </div>

            <!-- Card 3: Branding & Identity -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-white/10 pb-3">
                <i data-lucide="layout" class="w-4 h-4 text-cyan-400"></i> Branding & Identity
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Panel Name</label>
                  <input type="text" id="set-panel-name" oninput="settingsManager.previewPanelName(this.value)" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="Mpanel">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Favicon Title Name</label>
                  <input type="text" id="set-favicon-name" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="Mpanel Server Management">
                </div>
              </div>

              <!-- Panel Logo -->
              <div class="space-y-2 pt-2 border-t border-white/5">
                <label class="block text-xs font-semibold text-slate-300">Panel Logo (URL or Upload)</label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input type="text" id="set-panel-logo" oninput="settingsManager.previewLogo(this.value)" placeholder="https://example.com/logo.png" class="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs">
                  <label class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 shrink-0">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Logo
                    <input type="file" accept="image/*" class="hidden" onchange="settingsManager.uploadAsset(this, 'logo')">
                  </label>
                </div>
              </div>

              <!-- Favicon Logo -->
              <div class="space-y-2 pt-2 border-t border-white/5">
                <label class="block text-xs font-semibold text-slate-300">Favicon Logo (URL or Upload)</label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input type="text" id="set-favicon-logo" oninput="settingsManager.previewFavicon(this.value)" placeholder="https://example.com/favicon.png" class="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs">
                  <label class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 shrink-0">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Favicon
                    <input type="file" accept="image/*" class="hidden" onchange="settingsManager.uploadAsset(this, 'favicon')">
                  </label>
                </div>
              </div>
            </div>

            <!-- Card 4: System Access Options -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-white/10 pb-3">
                <i data-lucide="shield" class="w-4 h-4 text-rose-400"></i> Access & Registration
              </h3>
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white">Public User Self-Registration</h4>
                  <p class="text-[11px] text-slate-400">Allow visitors to register new user accounts from the sign up page</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="set-registration" class="sr-only peer" checked>
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            <!-- Save Action Button -->
            <button onclick="settingsManager.saveSettings()" class="btn-cyber w-full py-4 rounded-2xl text-sm font-bold shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> Save All Customization Settings
            </button>
          </div>

          <!-- Right Col: Real-Time Live Preview -->
          <div class="space-y-6">
            <div class="sticky top-20 glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5">
              <div class="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i> Live Glass Preview
                </h3>
                <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Real-time
                </span>
              </div>

              <!-- Interactive Glass Card Sample -->
              <div id="preview-sample-card" class="glass-card p-5 rounded-2xl border border-white/15 space-y-4">
                <div class="flex items-center gap-3">
                  <div id="preview-logo-box" class="w-10 h-10 rounded-xl bg-slate-900/80 p-1 border border-cyan-500/40 flex items-center justify-center">
                    <img id="preview-logo-img" src="/assets/mpanel-logo.svg" alt="Preview Logo" class="w-full h-full object-contain">
                  </div>
                  <div>
                    <h4 id="preview-panel-title" class="text-sm font-bold text-white">Mpanel</h4>
                    <p class="text-[10px] text-slate-400">Glassmorphism UI Engine</p>
                  </div>
                </div>

                <div class="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Server Status</span>
                    <span class="text-emerald-400 font-semibold font-mono flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ONLINE
                    </span>
                  </div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-cyan-400 to-purple-500 h-full w-3/4 rounded-full"></div>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>RAM: 3.2 / 8.0 GB</span>
                    <span>CPU: 24%</span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button class="btn-cyber flex-1 py-1.5 rounded-lg text-[11px] font-semibold">Action Button</button>
                  <button class="btn-cyber-purple px-3 py-1.5 rounded-lg text-[11px] font-semibold">Manage</button>
                </div>
              </div>

              <!-- Active Background Media Preview -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Active Background:</span>
                  <span id="preview-media-badge" class="text-[10px] text-cyan-400 uppercase font-mono">Image</span>
                </div>
                <div class="rounded-2xl overflow-hidden border border-white/10 h-40 bg-slate-950 relative group">
                  <img id="preview-bg-thumbnail" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Wallpaper Preview" class="w-full h-full object-cover">
                  <video id="preview-bg-video" autoplay muted loop playsinline class="hidden w-full h-full object-cover"></video>
                  
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                    <p id="preview-bg-title" class="text-xs font-semibold text-white truncate">Active Wallpaper</p>
                  </div>
                </div>
              </div>

              <!-- Quick Live Settings Stats -->
              <div class="grid grid-cols-2 gap-2 text-center text-xs">
                <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <p class="text-[10px] text-slate-400 uppercase font-semibold">Transparency</p>
                  <p id="stat-transparency" class="text-cyan-400 font-mono font-bold text-sm">18%</p>
                </div>
                <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <p class="text-[10px] text-slate-400 uppercase font-semibold">Blur Glass</p>
                  <p id="stat-blur" class="text-purple-400 font-mono font-bold text-sm">16px</p>
                </div>
              </div>

              <p class="text-[11px] text-slate-400 text-center leading-relaxed">
                Changes to transparency and blur apply smoothly and dynamically in real time across the entire panel!
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateFavCountBadge();
    await this.loadSettingsData();
    await this.loadWallpaperCategories();
    await this.loadWallpapers('all', 1);

    if (window.lucide) lucide.createIcons();
  }

  updateFavCountBadge() {
    const badge = document.getElementById('fav-count-badge');
    if (badge) badge.innerText = this.favorites.length;
  }

  switchTab(tab) {
    this.activeTab = tab;
    const tabs = ['browser', 'upload', 'url', 'favorites'];

    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const view = document.getElementById(`subview-${t}`);

      if (t === tab) {
        if (btn) {
          btn.className = 'px-3 py-1.5 rounded-lg transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5';
        }
        if (view) view.classList.remove('hidden');
      } else {
        if (btn) {
          btn.className = 'px-3 py-1.5 rounded-lg transition text-slate-400 hover:text-white flex items-center gap-1.5';
        }
        if (view) view.classList.add('hidden');
      }
    });

    if (tab === 'favorites') {
      this.renderFavoritesView();
    }

    if (window.lucide) lucide.createIcons();
  }

  async loadSettingsData() {
    try {
      const data = await app.api('/api/admin/settings');
      const s = data.settings || {};

      document.getElementById('set-panel-name').value = s.panel_name || 'Mpanel';
      document.getElementById('set-favicon-name').value = s.favicon_name || 'Mpanel';
      document.getElementById('set-panel-logo').value = s.panel_logo || '';
      document.getElementById('set-favicon-logo').value = s.favicon_logo || '';

      const bgUrl = s.panel_bg || '';
      const bgType = s.panel_bg_type || (/\.(mp4|webm|mkv|mov)($|\?)/i.test(bgUrl) ? 'video' : 'image');

      this.currentTheme.bg = bgUrl;
      this.currentTheme.bgType = bgType;
      this.currentTheme.themeMode = s.theme_mode || 'dark';

      // Transparency
      if (s.transparency_bar !== undefined) {
        const tVal = parseInt(s.transparency_bar, 10);
        document.getElementById('set-transparency-bar').value = tVal;
        this.updateTransparencyUI(tVal);
      }

      // Blur
      if (s.blur_bar !== undefined) {
        const bVal = parseInt(s.blur_bar, 10);
        document.getElementById('set-blur-bar').value = bVal;
        this.updateBlurUI(bVal);
      }

      // Theme Mode UI
      this.updateThemeModeUI(this.currentTheme.themeMode);

      // Active Theme & Arix Options
      if (s.active_theme) {
        this.currentTheme.activeTheme = s.active_theme;
      }
      if (s.panel_sounds_enabled !== undefined) {
        this.currentTheme.panelSoundsEnabled = s.panel_sounds_enabled !== '0';
        const soundsEl = document.getElementById('set-panel-sounds');
        if (soundsEl) soundsEl.checked = this.currentTheme.panelSoundsEnabled;
      }
      if (s.arix_primary_color) {
        this.currentTheme.arixPrimaryColor = s.arix_primary_color;
      }
      this.updateThemeSelectionUI();

      // Registration
      if (s.registration_enabled !== undefined) {
        document.getElementById('set-registration').checked = s.registration_enabled === '1';
      }

      this.updatePreviewCards();
    } catch (err) {
      console.error('Failed to load admin settings:', err);
    }
  }

  selectTheme(themeName) {
    this.currentTheme.activeTheme = themeName;
    localStorage.setItem('mpanel_active_theme', themeName);
    this.updateThemeSelectionUI();
    app.applyBrandingAndTheme({
      active_theme: themeName,
      panel_sounds_enabled: this.currentTheme.panelSoundsEnabled ? '1' : '0',
      arix_primary_color: this.currentTheme.arixPrimaryColor
    });
    if (themeName === 'arix') {
      app.playSound('online');
      app.toast('Arix Theme v2.1.3 activated!', 'success');
    } else {
      app.toast('NookTheme activated!', 'success');
    }
    this.saveSettings(true);
  }

  togglePanelSounds(enabled) {
    this.currentTheme.panelSoundsEnabled = enabled;
    localStorage.setItem('panelSounds', enabled ? 'true' : 'false');
    if (enabled) {
      app.playSound('copy');
      app.toast('Panel sound effects enabled', 'info');
    } else {
      app.toast('Panel sound effects disabled', 'info');
    }
    this.saveSettings(true);
  }

  updateThemeSelectionUI() {
    const isArix = this.currentTheme.activeTheme === 'arix';
    const cardArix = document.getElementById('theme-card-arix');
    const cardNook = document.getElementById('theme-card-nook');
    const btnArix = document.getElementById('btn-theme-arix');
    const btnNook = document.getElementById('btn-theme-nook');
    const badge = document.getElementById('active-theme-badge');
    const arixPanel = document.getElementById('arix-options-panel');

    if (badge) {
      badge.innerText = isArix ? 'Arix Theme v2.1.3 Active' : 'NookTheme Active';
      badge.className = `text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isArix ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'}`;
    }

    if (cardArix && cardNook) {
      if (isArix) {
        cardArix.className = 'theme-select-card p-5 rounded-2xl border active bg-purple-950/20 border-purple-500/50 flex flex-col justify-between space-y-4';
        cardNook.className = 'theme-select-card p-5 rounded-2xl border bg-slate-900/40 border-white/5 hover:border-white/20 flex flex-col justify-between space-y-4';
        if (btnArix) {
          btnArix.innerText = '✓ Active Theme';
          btnArix.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg btn-cyber';
        }
        if (btnNook) {
          btnNook.innerText = 'Activate Nook';
          btnNook.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10';
        }
        if (arixPanel) arixPanel.classList.remove('opacity-60');
      } else {
        cardArix.className = 'theme-select-card p-5 rounded-2xl border bg-slate-900/40 border-white/5 hover:border-white/20 flex flex-col justify-between space-y-4';
        cardNook.className = 'theme-select-card p-5 rounded-2xl border active bg-cyan-950/20 border-cyan-500/50 flex flex-col justify-between space-y-4';
        if (btnArix) {
          btnArix.innerText = 'Activate Arix';
          btnArix.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10';
        }
        if (btnNook) {
          btnNook.innerText = '✓ Active Theme';
          btnNook.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg btn-cyber';
        }
        if (arixPanel) arixPanel.classList.add('opacity-60');
      }
    }
  }

  async loadWallpaperCategories() {
    try {
      const res = await app.api('/api/admin/settings/categories');
      if (res.success && res.categories) {
        this.categories = res.categories;

        // Populate Dropdown
        const select = document.getElementById('wallpaper-category-select');
        if (select) {
          select.innerHTML = this.categories.map(c => `
            <option value="${c.id}">${c.name}</option>
          `).join('');
          select.value = this.activeCategory;
        }

        // Populate Chips Bar with all categories
        const chipsContainer = document.getElementById('wallpaper-category-chips');
        if (chipsContainer) {
          chipsContainer.innerHTML = this.categories.map(c => `
            <button onclick="settingsManager.selectCategory('${c.id}')" id="cat-chip-${c.id}" class="cat-chip px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${c.id === this.activeCategory ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-500/30'}">
              ${c.name}
            </button>
          `).join('');
        }
      }
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  }

  async loadWallpapers(category = 'all', page = 1, query = '') {
    const loading = document.getElementById('wallpapers-loading');
    if (loading) loading.classList.remove('hidden');

    try {
      this.activeCategory = category;
      this.currentPage = page;
      this.searchQuery = query;

      let url = `/api/admin/settings/wallpapers?category=${encodeURIComponent(category)}&page=${page}`;
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }

      const res = await app.api(url);
      if (res && res.wallpapers) {
        this.wallpapers = res.wallpapers;
        this.totalPages = res.totalPages || 1;
        this.renderWallpapers(this.wallpapers);
        this.renderPagination(res);
      }
    } catch (err) {
      console.error('Failed to load wallpapers:', err);
      app.toast('Failed to load wallpapers feed.', 'error');
    } finally {
      if (loading) loading.classList.add('hidden');
      if (window.lucide) lucide.createIcons();
    }
  }

  renderWallpapers(list) {
    const grid = document.getElementById('wallpapers-grid');
    if (!grid) return;

    if (!list || list.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 space-y-2">
          <i data-lucide="image-off" class="w-8 h-8 mx-auto text-slate-500"></i>
          <p class="text-xs font-semibold">No wallpapers found for this search/category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(w => {
      const isFav = this.favorites.some(f => f.id === w.id);
      const applyTarget = w.full4k || w.preview;
      const downloadTarget = w.full4k || w.preview;

      return `
        <div class="wallpaper-card group">
          <div class="aspect-video w-full overflow-hidden bg-slate-950 relative">
            <img src="${w.preview || w.thumb}" alt="${w.title}" loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover:scale-105">

            <!-- Top Action Buttons (Favorite & Download) -->
            <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <!-- Favorite Button -->
              <button onclick="event.stopPropagation(); settingsManager.toggleFavorite('${w.id}')" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}" class="wallpaper-fav-btn p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-white/15 text-slate-300 hover:text-rose-400 transition ${isFav ? 'active' : ''}">
                <i data-lucide="heart" class="w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}"></i>
              </button>

              <!-- Download Button -->
              <a href="${downloadTarget}" target="_blank" rel="noopener noreferrer" title="Download High-Res Wallpaper" onclick="event.stopPropagation()" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-white/15 text-slate-300 hover:text-cyan-400 transition">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
              </a>
            </div>

            <!-- Hover Overlay with Live Preview & One-Click Apply -->
            <div class="wallpaper-overlay absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] p-3 flex flex-col justify-between">
              <div class="text-left">
                <span class="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">${w.category || '4K UHD'}</span>
                <h5 class="text-xs font-bold text-white line-clamp-1">${w.title}</h5>
              </div>

              <div class="space-y-1.5">
                <button onclick="settingsManager.startLivePreview('${applyTarget}', 'image', '${w.title.replace(/'/g, "\\'")}', '${w.id}')" class="w-full py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-1.5">
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-cyan-400"></i> Live Preview
                </button>
                <button onclick="settingsManager.applyWallpaper('${applyTarget}', 'image', '${w.title.replace(/'/g, "\\'")}', '${w.id}')" class="btn-cyber w-full py-1.5 rounded-lg text-[11px] font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> One-Click Apply
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Title Bar -->
          <div class="p-2 text-left bg-slate-900/60 flex items-center justify-between">
            <span class="text-[11px] font-medium text-slate-300 truncate max-w-[130px]">${w.title}</span>
            <span class="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">4K</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPagination(res) {
    const info = document.getElementById('page-info-label');
    const prevBtn = document.getElementById('page-prev-btn');
    const nextBtn = document.getElementById('page-next-btn');
    const jumpInput = document.getElementById('page-jump-input');

    if (info) info.innerText = `Page ${res.page} of ${res.totalPages}`;
    if (prevBtn) prevBtn.disabled = !res.hasPrev;
    if (nextBtn) nextBtn.disabled = !res.hasNext;
    if (jumpInput) {
      jumpInput.value = res.page;
      jumpInput.max = res.totalPages;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadWallpapers(this.activeCategory, this.currentPage - 1, this.searchQuery);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadWallpapers(this.activeCategory, this.currentPage + 1, this.searchQuery);
    }
  }

  jumpToPage(val) {
    const num = parseInt(val, 10);
    if (num >= 1 && num <= this.totalPages) {
      this.loadWallpapers(this.activeCategory, num, this.searchQuery);
    }
  }

  selectCategory(catId) {
    this.activeCategory = catId;
    const select = document.getElementById('wallpaper-category-select');
    if (select) select.value = catId;

    // Highlight chip
    document.querySelectorAll('.cat-chip').forEach(c => {
      c.className = 'cat-chip px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-500/30';
    });
    const chip = document.getElementById(`cat-chip-${catId}`);
    if (chip) {
      chip.className = 'cat-chip px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }

    const searchInput = document.getElementById('wallpaper-search-input');
    if (searchInput) searchInput.value = '';
    this.searchQuery = '';

    this.loadWallpapers(catId, 1);
  }

  searchWallpapers() {
    const input = document.getElementById('wallpaper-search-input');
    const query = input ? input.value.trim() : '';
    this.searchQuery = query;
    this.loadWallpapers(this.activeCategory, 1, query);
  }

  toggleFavorite(id) {
    const existingIndex = this.favorites.findIndex(f => f.id === id);
    if (existingIndex >= 0) {
      this.favorites.splice(existingIndex, 1);
      app.toast('Removed from favorites', 'info');
    } else {
      const item = this.wallpapers.find(w => w.id === id);
      if (item) {
        this.favorites.push(item);
        app.toast('Added to favorite wallpapers!', 'success');
      }
    }

    this.saveFavorites();
    this.updateFavCountBadge();

    if (this.activeTab === 'favorites') {
      this.renderFavoritesView();
    } else {
      this.renderWallpapers(this.wallpapers);
    }

    if (window.lucide) lucide.createIcons();
  }

  renderFavoritesView() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    if (!this.favorites || this.favorites.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 space-y-2">
          <i data-lucide="heart" class="w-8 h-8 mx-auto text-rose-400/50"></i>
          <p class="text-xs font-semibold">No favorite wallpapers saved yet.</p>
          <p class="text-[11px] text-slate-500">Click the heart icon on any wallpaper in the 4K browser to save it here!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.favorites.map(w => {
      const applyTarget = w.full4k || w.preview;
      const downloadTarget = w.full4k || w.preview;

      return `
        <div class="wallpaper-card group">
          <div class="aspect-video w-full overflow-hidden bg-slate-950 relative">
            <img src="${w.preview || w.thumb}" alt="${w.title}" class="w-full h-full object-cover">
            
            <div class="absolute top-2 right-2 z-10 flex gap-1">
              <button onclick="settingsManager.toggleFavorite('${w.id}')" title="Remove Favorite" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-500/20 border border-white/15 text-rose-400 transition">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
              <a href="${downloadTarget}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-slate-900/80 border border-white/15 text-slate-300 hover:text-cyan-400 transition">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
              </a>
            </div>

            <div class="wallpaper-overlay absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] p-3 flex flex-col justify-between">
              <div>
                <span class="text-[9px] font-bold text-cyan-400 uppercase">${w.category || 'Favorite'}</span>
                <h5 class="text-xs font-bold text-white line-clamp-1">${w.title}</h5>
              </div>
              <div class="space-y-1.5">
                <button onclick="settingsManager.startLivePreview('${applyTarget}', 'image', '${w.title.replace(/'/g, "\\'")}', '${w.id}')" class="w-full py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-1.5">
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-cyan-400"></i> Live Preview
                </button>
                <button onclick="settingsManager.applyWallpaper('${applyTarget}', 'image', '${w.title.replace(/'/g, "\\'")}', '${w.id}')" class="btn-cyber w-full py-1.5 rounded-lg text-[11px] font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Apply Wallpaper
                </button>
              </div>
            </div>
          </div>
          <div class="p-2 text-left bg-slate-900/60">
            <span class="text-[11px] font-medium text-slate-300 truncate block">${w.title}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  applyWallpaper(url, type = 'image', title = '', id = '') {
    this.currentTheme.bg = url;
    this.currentTheme.bgType = type;

    // Apply directly to live panel
    this.previewBackground(url, type, title);
    this.removeFloatingPreviewBar();
    this.previewingWallpaper = null;
    this.revertTheme = null;

    app.toast(`Applied wallpaper: ${title || 'Custom Wallpaper'}!`, 'success');

    // Trigger auto-save if enabled
    if (this.currentTheme.autoSave) {
      this.triggerAutoSave();
    }
  }

  startLivePreview(url, type = 'image', title = '', id = '') {
    if (!this.previewingWallpaper) {
      this.revertTheme = {
        bg: this.currentTheme.bg || '',
        bgType: this.currentTheme.bgType || 'image'
      };
    }
    this.previewingWallpaper = { url, type, title, id };

    // Apply temporarily to live UI
    this.previewBackground(url, type, title);

    // Show floating bar
    this.showFloatingPreviewBar(title);
    app.toast(`Live previewing "${title || 'Wallpaper'}"`, 'info');
  }

  showFloatingPreviewBar(title = 'Wallpaper') {
    let bar = document.getElementById('preview-floating-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'preview-floating-bar';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
        <span class="text-xs text-slate-200">Live Previewing: <strong class="text-white max-w-[200px] truncate inline-block align-bottom">${title}</strong></span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="settingsManager.confirmPreviewApply()" class="btn-cyber px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-1.5">
          <i data-lucide="check" class="w-3.5 h-3.5"></i> Apply Wallpaper
        </button>
        <button onclick="settingsManager.cancelPreview()" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition flex items-center gap-1.5">
          <i data-lucide="x" class="w-3.5 h-3.5"></i> Revert
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  confirmPreviewApply() {
    if (!this.previewingWallpaper) return;
    const { url, type, title, id } = this.previewingWallpaper;
    this.applyWallpaper(url, type, title, id);
  }

  cancelPreview() {
    if (this.revertTheme) {
      this.previewBackground(this.revertTheme.bg, this.revertTheme.bgType);
      this.currentTheme.bg = this.revertTheme.bg;
      this.currentTheme.bgType = this.revertTheme.bgType;
    }
    this.removeFloatingPreviewBar();
    this.previewingWallpaper = null;
    this.revertTheme = null;
    app.toast('Preview cancelled. Reverted to previous wallpaper.', 'info');
  }

  removeFloatingPreviewBar() {
    const bar = document.getElementById('preview-floating-bar');
    if (bar) bar.remove();
  }

  testUrlBackground() {
    const input = document.getElementById('custom-media-url');
    const url = input ? input.value.trim() : '';
    if (!url) {
      app.toast('Please enter a media URL', 'warning');
      return;
    }

    const isVideo = /\.(mp4|webm|mkv|mov)($|\?)/i.test(url);
    const typeLabel = document.getElementById('url-type-detected');
    if (typeLabel) {
      typeLabel.innerText = isVideo ? 'Video (MP4/WebM)' : 'Image';
      typeLabel.className = isVideo ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold';
    }

    this.startLivePreview(url, isVideo ? 'video' : 'image', 'Custom URL Media');
  }

  applyUrlBackground() {
    const input = document.getElementById('custom-media-url');
    const url = input ? input.value.trim() : '';
    if (!url) {
      app.toast('Please enter a media URL', 'warning');
      return;
    }
    const isVideo = /\.(mp4|webm|mkv|mov)($|\?)/i.test(url);
    this.applyWallpaper(url, isVideo ? 'video' : 'image', 'Custom URL Media');
  }

  previewBackground(url, type = 'image', title = '') {
    if (!url) return;
    const isVideo = type === 'video' || /\.(mp4|webm|mkv|mov)($|\?)/i.test(url);

    // Update Right Column Preview Box
    const thumbImg = document.getElementById('preview-bg-thumbnail');
    const thumbVid = document.getElementById('preview-bg-video');
    const titleEl = document.getElementById('preview-bg-title');
    const badgeEl = document.getElementById('preview-media-badge');

    if (titleEl) titleEl.innerText = title || 'Custom Background';

    if (isVideo) {
      if (thumbImg) thumbImg.classList.add('hidden');
      if (thumbVid) {
        thumbVid.classList.remove('hidden');
        thumbVid.src = url;
      }
      if (badgeEl) {
        badgeEl.innerText = 'Video Loop';
        badgeEl.className = 'text-[10px] text-purple-400 uppercase font-mono font-bold';
      }
    } else {
      if (thumbVid) {
        thumbVid.classList.add('hidden');
        thumbVid.pause();
      }
      if (thumbImg) {
        thumbImg.classList.remove('hidden');
        thumbImg.src = url;
      }
      if (badgeEl) {
        badgeEl.innerText = '4K Image';
        badgeEl.className = 'text-[10px] text-cyan-400 uppercase font-mono font-bold';
      }
    }

    // Apply to Main Panel Live Layers
    const mainVid = document.getElementById('wallpaper-video');
    const mainLayer = document.getElementById('wallpaper-layer');

    if (isVideo && mainVid) {
      mainVid.src = url;
      mainVid.classList.remove('hidden');
      if (mainLayer) mainLayer.style.backgroundImage = 'none';
      mainVid.play().catch(() => {});
    } else {
      if (mainVid) {
        mainVid.classList.add('hidden');
        mainVid.pause();
      }
      if (mainLayer) mainLayer.style.backgroundImage = '';
      document.documentElement.style.setProperty('--panel-bg', `url('${url}')`);
    }
  }

  onTransparencySlider(val) {
    const num = parseInt(val, 10);
    this.currentTheme.transparency = num;
    this.updateTransparencyUI(num);

    // Apply Live CSS variable
    const opacityVal = Math.max(0.02, Math.min(1.0, (100 - num) / 100));
    document.documentElement.style.setProperty('--card-opacity', opacityVal);

    if (this.currentTheme.autoSave) {
      this.triggerAutoSave();
    }
  }

  updateTransparencyUI(val) {
    const label = document.getElementById('transparency-val-label');
    const stat = document.getElementById('stat-transparency');
    const bar = document.getElementById('transparency-bar-indicator');

    if (label) label.innerText = `${val}%`;
    if (stat) stat.innerText = `${val}%`;

    // Dynamic bar indicator: 0% ---------|--------- 100%
    if (bar) {
      const totalTicks = 20;
      const thumbPos = Math.round((val / 100) * totalTicks);
      let barStr = '0% ';
      for (let i = 0; i <= totalTicks; i++) {
        barStr += (i === thumbPos) ? '|' : '-';
      }
      barStr += ' 100%';
      bar.innerText = barStr;
    }
  }

  onBlurSlider(val) {
    const num = parseInt(val, 10);
    this.currentTheme.blur = num;
    this.updateBlurUI(num);

    // Apply Live CSS variable
    document.documentElement.style.setProperty('--card-blur', `${Math.max(0, Math.min(40, num))}px`);

    if (this.currentTheme.autoSave) {
      this.triggerAutoSave();
    }
  }

  updateBlurUI(val) {
    const label = document.getElementById('blur-val-label');
    const stat = document.getElementById('stat-blur');
    const bar = document.getElementById('blur-bar-indicator');

    if (label) label.innerText = `${val}px`;
    if (stat) stat.innerText = `${val}px`;

    // Dynamic bar indicator: 0px ---------|---------- 40px
    if (bar) {
      const totalTicks = 20;
      const thumbPos = Math.round((val / 40) * totalTicks);
      let barStr = '0px ';
      for (let i = 0; i <= totalTicks; i++) {
        barStr += (i === thumbPos) ? '|' : '-';
      }
      barStr += ' 40px';
      bar.innerText = barStr;
    }
  }

  toggleThemeMode() {
    const newMode = this.currentTheme.themeMode === 'light' ? 'dark' : 'light';
    this.currentTheme.themeMode = newMode;
    this.updateThemeModeUI(newMode);

    if (newMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    app.toast(`Switched to ${newMode.toUpperCase()} mode`, 'info');

    if (this.currentTheme.autoSave) {
      this.triggerAutoSave();
    }

    if (window.lucide) lucide.createIcons();
  }

  updateThemeModeUI(mode) {
    const badge = document.getElementById('theme-mode-badge');
    const btnLabel = document.getElementById('theme-toggle-label');
    const icon = document.getElementById('theme-toggle-icon');

    const isLight = mode === 'light';
    if (badge) {
      badge.innerText = isLight ? 'Light Mode' : 'Dark Mode';
      badge.className = isLight ? 'text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20' : 'text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20';
    }
    if (btnLabel) {
      btnLabel.innerText = isLight ? 'Light Mode' : 'Dark Mode';
    }
    if (icon) {
      icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
      icon.className = isLight ? 'w-4 h-4 text-amber-400' : 'w-4 h-4 text-cyan-400';
    }
  }

  toggleAutoSave(enabled) {
    this.currentTheme.autoSave = enabled;
    app.toast(`Auto-save ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }

  triggerAutoSave() {
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveSettings(true);
    }, 600);
  }

  previewPanelName(name) {
    const el = document.getElementById('preview-panel-title');
    if (el) el.innerText = name || 'Mpanel';
    const headerTitle = document.getElementById('header-panel-name');
    if (headerTitle) headerTitle.innerText = name || 'Mpanel';
  }

  previewLogo(url) {
    const img = document.getElementById('preview-logo-img');
    if (img && url) img.src = url;
    const headerLogo = document.getElementById('header-logo-img');
    if (headerLogo && url) headerLogo.src = url;
  }

  previewFavicon(url) {
    const fav = document.getElementById('tab-favicon');
    if (fav && url) fav.href = url;
  }

  updatePreviewCards() {
    const logo = document.getElementById('set-panel-logo')?.value;
    if (logo) this.previewLogo(logo);

    if (this.currentTheme.bg) {
      this.previewBackground(this.currentTheme.bg, this.currentTheme.bgType);
    }
  }

  async uploadAsset(input, type) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      app.toast(`Uploading ${type}...`, 'info');
      const data = await app.api('/api/admin/settings/upload', {
        method: 'POST',
        body: formData
      });

      if (data.success && data.url) {
        app.toast(`Uploaded ${type} successfully!`, 'success');
        if (type === 'logo') {
          document.getElementById('set-panel-logo').value = data.url;
          this.previewLogo(data.url);
        } else if (type === 'favicon') {
          document.getElementById('set-favicon-logo').value = data.url;
          this.previewFavicon(data.url);
        } else if (type === 'background') {
          const isVideo = data.isVideo || /\.(mp4|webm|mkv|mov)($|\?)/i.test(data.url);
          this.currentTheme.bg = data.url;
          this.currentTheme.bgType = isVideo ? 'video' : 'image';
          this.startLivePreview(data.url, this.currentTheme.bgType, file.name);
        }
      }
    } catch (err) {
      app.toast(err.message || 'Upload failed', 'error');
    }
  }

  async resetToDefault() {
    if (!confirm('Are you sure you want to reset all theme and customization settings to original defaults?')) {
      return;
    }

    try {
      app.toast('Resetting theme to default...', 'info');
      const res = await app.api('/api/admin/settings/reset', { method: 'POST' });
      if (res.success) {
        app.toast('Panel settings reset to default!', 'success');
        app.applyBrandingAndTheme(res.defaults);
        await this.loadSettingsData();
      }
    } catch (err) {
      app.toast(err.message || 'Failed to reset settings', 'error');
    }
  }

  async saveSettings(isSilent = false) {
    const payload = {
      panel_name: document.getElementById('set-panel-name')?.value.trim() || 'Mpanel',
      favicon_name: document.getElementById('set-favicon-name')?.value.trim() || 'Mpanel',
      panel_logo: document.getElementById('set-panel-logo')?.value.trim() || '',
      favicon_logo: document.getElementById('set-favicon-logo')?.value.trim() || '',
      panel_bg: this.currentTheme.bg || '',
      panel_bg_type: this.currentTheme.bgType || 'image',
      panel_bg_category: this.activeCategory || 'all',
      transparency_bar: String(this.currentTheme.transparency ?? 18),
      blur_bar: String(this.currentTheme.blur ?? 16),
      theme_mode: this.currentTheme.themeMode || 'dark',
      active_theme: this.currentTheme.activeTheme || 'arix',
      panel_sounds_enabled: this.currentTheme.panelSoundsEnabled ? '1' : '0',
      arix_primary_color: this.currentTheme.arixPrimaryColor || '#4A35CF',
      registration_enabled: document.getElementById('set-registration')?.checked ? '1' : '0'
    };

    try {
      const data = await app.api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        if (!isSilent) {
          app.toast('Panel settings saved successfully!', 'success');
        }
        app.applyBrandingAndTheme(payload);
      }
    } catch (err) {
      if (!isSilent) {
        app.toast(err.message || 'Failed to save settings', 'error');
      }
    }
  }
}

window.settingsManager = new SettingsManager();
