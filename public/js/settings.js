// Admin Settings & Customization Engine
class SettingsManager {
  async renderSettingsView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Admin Management</span>
          <h2 class="text-xl font-bold text-white mt-2 flex items-center gap-2">
            <i data-lucide="sliders" class="w-5 h-5 text-purple-400"></i> Global Panel Settings & Customization
          </h2>
          <p class="text-xs text-slate-400">Customize branding, 4K wallpapers, background audio, transparency, blur, and system controls</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left 2 Cols: Form Controls -->
          <div class="lg:col-span-2 space-y-6">

            <!-- General Branding -->
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

            <!-- Panel Background & 4K Wallpapers -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 class="text-sm font-bold text-slate-200 flex items-center justify-between border-b border-white/10 pb-3">
                <span class="flex items-center gap-2">
                  <i data-lucide="image" class="w-4 h-4 text-purple-400"></i> Panel Background & 4K Wallpapers
                </span>
                <span class="text-[10px] text-slate-400">Source: 4kwallpapers.com / Custom</span>
              </h3>

              <!-- Category Preset Chips -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-2">4K Wallpaper Category Presets:</label>
                <div id="wallpaper-category-chips" class="flex flex-wrap gap-2">
                  <!-- Populated by JS -->
                </div>
              </div>

              <!-- Background URL / Upload -->
              <div class="space-y-3 pt-2 border-t border-white/5">
                <div class="flex flex-col sm:flex-row gap-3">
                  <input type="text" id="set-panel-bg" oninput="settingsManager.previewBackground(this.value)" placeholder="Image or Video URL (.mp4, .webm, .png, .jpg)" class="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs">
                  <label class="btn-cyber-purple px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 shrink-0">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload BG Media
                    <input type="file" accept="image/*,video/*" class="hidden" onchange="settingsManager.uploadAsset(this, 'background')">
                  </label>
                </div>
              </div>
            </div>

            <!-- Theme Transparency & Blur Controls -->
            <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-white/10 pb-3">
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-400"></i> Glassmorphism, Transparency & Blur Sliders
              </h3>

              <!-- Transparency Slider -->
              <div class="space-y-2">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-300">Card Transparency Bar: <span class="font-mono text-cyan-400">-------|------</span></span>
                  <span id="transparency-val-label" class="text-cyan-400 font-mono">18%</span>
                </div>
                <input type="range" id="set-transparency-bar" min="0" max="95" value="18" oninput="settingsManager.onTransparencySlider(this.value)" class="slider-custom">
                <div class="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Solid Dark)</span>
                  <span>50% (Medium Glass)</span>
                  <span>95% (Ultra Clear)</span>
                </div>
              </div>

              <!-- Blur Slider -->
              <div class="space-y-2 pt-3 border-t border-white/5">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-300">Backdrop Blur Bar: <span class="font-mono text-purple-400">-------|----------</span></span>
                  <span id="blur-val-label" class="text-purple-400 font-mono">16px</span>
                </div>
                <input type="range" id="set-blur-bar" min="0" max="40" value="16" oninput="settingsManager.onBlurSlider(this.value)" class="slider-custom">
                <div class="flex justify-between text-[10px] text-slate-400">
                  <span>0px (No Blur)</span>
                  <span>20px (Frost Glass)</span>
                  <span>40px (Heavy Cyber Blur)</span>
                </div>
              </div>
            </div>


            <!-- System Options -->
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
            <button onclick="settingsManager.saveSettings()" class="btn-cyber w-full py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> Save All Customization Settings
            </button>
          </div>

          <!-- Right Col: Live Interactive Preview Card -->
          <div class="space-y-6">
            <div class="sticky top-20 glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-white/10">
                <i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i> Real-time Live Preview
              </h3>

              <!-- Live Card Sample -->
              <div id="preview-sample-card" class="glass-card p-5 rounded-2xl border border-white/15 space-y-4">
                <div class="flex items-center gap-3">
                  <div id="preview-logo-box" class="w-10 h-10 rounded-xl bg-slate-900/80 p-1 border border-cyan-500/40 flex items-center justify-center">
                    <img id="preview-logo-img" src="/assets/mpanel-logo.svg" alt="Preview Logo" class="w-full h-full object-contain">
                  </div>
                  <div>
                    <h4 id="preview-panel-title" class="text-sm font-bold text-white">Mpanel</h4>
                    <p class="text-[10px] text-slate-400">Live Glassmorphism Preview</p>
                  </div>
                </div>

                <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Server Metric</span>
                    <span class="text-emerald-400 font-semibold font-mono">ONLINE</span>
                  </div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-cyan-400 to-purple-500 h-full w-3/4 rounded-full"></div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button class="btn-cyber flex-1 py-1.5 rounded-lg text-[11px] font-semibold">Test Button</button>
                  <button class="btn-cyber-purple px-3 py-1.5 rounded-lg text-[11px] font-semibold">Action</button>
                </div>
              </div>

              <!-- Active Wallpaper Thumbnail -->
              <div class="space-y-2">
                <p class="text-xs font-semibold text-slate-300">Active Background Thumbnail:</p>
                <div class="rounded-xl overflow-hidden border border-white/10 h-36 bg-slate-950 relative">
                  <img id="preview-bg-thumbnail" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Wallpaper Preview" class="w-full h-full object-cover">
                </div>
              </div>

              <p class="text-[11px] text-slate-400 text-center">Changes to transparency and blur apply instantly across the entire panel.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadSettingsData();
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
      document.getElementById('set-panel-bg').value = s.panel_bg || '';

      if (s.transparency_bar !== undefined) {
        document.getElementById('set-transparency-bar').value = s.transparency_bar;
        document.getElementById('transparency-val-label').innerText = `${s.transparency_bar}%`;
      }

      if (s.blur_bar !== undefined) {
        document.getElementById('set-blur-bar').value = s.blur_bar;
        document.getElementById('blur-val-label').innerText = `${s.blur_bar}px`;
      }

      if (s.registration_enabled !== undefined) {
        document.getElementById('set-registration').checked = s.registration_enabled === '1';
      }

      this.renderWallpaperChips(data.wallpaperPresets || []);
      this.updatePreviewCards();
    } catch (err) {
      console.error(err);
    }
  }

  renderWallpaperChips(presets) {
    const container = document.getElementById('wallpaper-category-chips');
    if (!container) return;

    container.innerHTML = presets.map(p => `
      <button onclick="settingsManager.selectWallpaperPreset('${p.preview}', '${p.id}')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-slate-300 transition">
        <span class="w-2.5 h-2.5 rounded-full" style="background-image: url('${p.preview}'); background-size: cover;"></span>
        <span>${p.name}</span>
      </button>
    `).join('');
  }

  selectWallpaperPreset(url, categoryId) {
    document.getElementById('set-panel-bg').value = url;
    this.previewBackground(url);
    app.toast(`Selected preset wallpaper!`, 'info');
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
  }

  previewFavicon(url) {
    const fav = document.getElementById('tab-favicon');
    if (fav && url) fav.href = url;
  }

  previewBackground(url) {
    const thumb = document.getElementById('preview-bg-thumbnail');
    if (thumb && url) thumb.src = url;
    document.documentElement.style.setProperty('--panel-bg', `url('${url}')`);
  }

  onTransparencySlider(val) {
    document.getElementById('transparency-val-label').innerText = `${val}%`;
    const opacityVal = (100 - parseInt(val, 10)) / 100;
    document.documentElement.style.setProperty('--card-opacity', `${Math.max(0.05, opacityVal)}`);
  }

  onBlurSlider(val) {
    document.getElementById('blur-val-label').innerText = `${val}px`;
    document.documentElement.style.setProperty('--card-blur', `${parseInt(val, 10)}px`);
  }

  updatePreviewCards() {
    const logo = document.getElementById('set-panel-logo').value;
    if (logo) this.previewLogo(logo);
    const bg = document.getElementById('set-panel-bg').value;
    if (bg) this.previewBackground(bg);
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
          document.getElementById('set-panel-bg').value = data.url;
          this.previewBackground(data.url);
        } else if (type === 'music') {
          document.getElementById('set-music-url').value = data.url;
        }
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async saveSettings() {
    const payload = {
      panel_name: document.getElementById('set-panel-name').value.trim(),
      favicon_name: document.getElementById('set-favicon-name').value.trim(),
      panel_logo: document.getElementById('set-panel-logo').value.trim(),
      favicon_logo: document.getElementById('set-favicon-logo').value.trim(),
      panel_bg: document.getElementById('set-panel-bg').value.trim(),
      transparency_bar: document.getElementById('set-transparency-bar').value,
      blur_bar: document.getElementById('set-blur-bar').value,
      registration_enabled: document.getElementById('set-registration').checked ? '1' : '0'
    };

    try {
      const data = await app.api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        app.toast('Panel settings saved successfully!', 'success');
        app.applyBrandingAndTheme(payload);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }
}

window.settingsManager = new SettingsManager();

