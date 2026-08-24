// Server Management Suite & Interactive Terminal Console
class ServerConsole {
  constructor() {
    this.serverId = null;
    this.ws = null;
    this.term = null;
    this.fitAddon = null;
    this.cpuChart = null;
    this.memoryChart = null;
    this.statsHistory = {
      labels: [],
      cpu: [],
      memory: []
    };
  }

  async renderServerManagementSuite(serverId, subTab = 'console') {
    this.serverId = serverId;
    const container = document.getElementById('view-container');

    // Show server badge in header
    const serverBadge = document.getElementById('header-server-badge');
    if (serverBadge) serverBadge.classList.remove('hidden');

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Server Header Bar -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <span id="srv-type-badge" class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">Loading...</span>
              <span id="srv-status-badge" class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offline</span>
            </div>
            <h2 id="srv-header-name" class="text-2xl font-black text-white">Server #${serverId}</h2>
            <div class="flex items-center gap-2 text-xs font-mono text-slate-300">
              <i data-lucide="globe" class="w-3.5 h-3.5 text-slate-400"></i>
              <span id="srv-ip-port">127.0.0.1:25565</span>
              <button onclick="app.copyToClipboard(document.getElementById('srv-ip-port').innerText)" class="text-slate-400 hover:text-cyan-400">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Quick Power Action Controls -->
          <div class="flex items-center gap-2">
            <button onclick="serverConsole.triggerPower(${serverId}, 'start')" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 transition">
              <i data-lucide="play" class="w-4 h-4"></i> Start
            </button>
            <button onclick="serverConsole.triggerPower(${serverId}, 'restart')" class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg flex items-center gap-1.5 transition">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i> Restart
            </button>
            <button onclick="serverConsole.triggerPower(${serverId}, 'stop')" class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-1.5 transition">
              <i data-lucide="square" class="w-4 h-4"></i> Stop
            </button>
            <button onclick="serverConsole.triggerPower(${serverId}, 'kill')" title="Force Kill" class="p-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950 text-rose-400 border border-rose-500/30 transition">
              <i data-lucide="zap-off" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Sub-Navigation Navigation Bar -->
        <div class="glass-panel p-2 rounded-2xl border border-white/10 flex flex-wrap gap-1">
          <button onclick="serverConsole.switchSubTab('console')" id="subnav-console" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="terminal" class="w-4 h-4"></i> Console
          </button>
          <button onclick="serverConsole.switchSubTab('files')" id="subnav-files" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="folder" class="w-4 h-4"></i> File Manager
          </button>
          <button onclick="serverConsole.switchSubTab('backups')" id="subnav-backups" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="archive" class="w-4 h-4"></i> Backups
          </button>
          <button onclick="serverConsole.switchSubTab('schedules')" id="subnav-schedules" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="clock" class="w-4 h-4"></i> Schedules
          </button>
          <button onclick="serverConsole.switchSubTab('startup')" id="subnav-startup" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="play-circle" class="w-4 h-4"></i> Startup
          </button>
          <button onclick="serverConsole.switchSubTab('subusers')" id="subnav-subusers" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="users" class="w-4 h-4"></i> Subusers
          </button>
          <button onclick="serverConsole.switchSubTab('settings')" id="subnav-settings" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="settings" class="w-4 h-4"></i> Settings & SFTP
          </button>
          <button onclick="serverConsole.switchSubTab('activity')" id="subnav-activity" class="subnav-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition">
            <i data-lucide="activity" class="w-4 h-4"></i> Activity
          </button>
        </div>

        <!-- Dynamic Subtab Container -->
        <div id="subtab-content-area"></div>
      </div>
    `;

    await this.loadServerHeader(serverId);
    this.switchSubTab(subTab);
    if (window.lucide) lucide.createIcons();
  }

  async loadServerHeader(serverId) {
    try {
      const data = await app.api(`/api/servers/${serverId}`);
      const s = data.server;
      this.serverData = s;

      document.getElementById('srv-header-name').innerText = s.name;
      document.getElementById('header-current-server-name').innerText = s.name;
      document.getElementById('srv-type-badge').innerText = `${s.server_type.toUpperCase()}`;
      document.getElementById('srv-ip-port').innerText = `${s.ip || '127.0.0.1'}:${s.port || 25565}`;

      this.updateStatusBadge(s.status);
    } catch (e) {
      console.error(e);
    }
  }

  updateStatusBadge(status) {
    const el = document.getElementById('srv-status-badge');
    if (!el) return;

    if (status === 'running') {
      el.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green"></span> RUNNING';
    } else if (status === 'starting') {
      el.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-yellow"></span> STARTING';
    } else if (status === 'stopping') {
      el.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> STOPPING';
    } else {
      el.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> OFFLINE';
    }
  }

  switchSubTab(tabName) {
    document.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.classList.remove('bg-white/20', 'text-cyan-400', 'shadow');
    });

    const activeBtn = document.getElementById(`subnav-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-white/20', 'text-cyan-400', 'shadow');
    }

    const area = document.getElementById('subtab-content-area');

    if (tabName === 'console') {
      this.renderConsoleTab(area);
    } else if (tabName === 'files') {
      fileManager.renderFileManagerTab(area, this.serverId);
    } else if (tabName === 'backups') {
      this.renderBackupsTab(area);
    } else if (tabName === 'schedules') {
      this.renderSchedulesTab(area);
    } else if (tabName === 'startup') {
      this.renderStartupTab(area);
    } else if (tabName === 'subusers') {
      this.renderSubusersTab(area);
    } else if (tabName === 'settings') {
      this.renderSettingsTab(area);
    } else if (tabName === 'activity') {
      this.renderActivityTab(area);
    }

    if (window.lucide) lucide.createIcons();
  }

  // Render Console Tab
  renderConsoleTab(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Terminal Column (3 Cols) -->
        <div class="lg:col-span-3 space-y-4">
          <div class="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span class="ml-2 font-mono text-[11px] text-slate-400">Terminal - server${this.serverId}</span>
              </div>
              <button onclick="serverConsole.clearTerminal()" title="Clear Console" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Clear
              </button>
            </div>

            <!-- xterm.js Container -->
            <div id="terminal-container" class="h-[450px] w-full"></div>

            <!-- Command Input Box -->
            <form onsubmit="serverConsole.handleSendCommand(event)" class="flex gap-2 pt-2">
              <input type="text" id="console-cmd-input" placeholder="Type a console command (e.g. op player, help, npm test)..." class="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs font-mono">
              <button type="submit" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <i data-lucide="corner-down-left" class="w-3.5 h-3.5"></i> Send
              </button>
            </form>
          </div>
        </div>

        <!-- Metrics Gauges Column (1 Col) -->
        <div class="space-y-4">
          <!-- CPU Live Metric Card -->
          <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
            <div class="flex justify-between items-center text-xs font-bold">
              <span class="text-slate-300 flex items-center gap-2"><i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i> CPU Usage</span>
              <span id="metric-cpu-val" class="text-cyan-400 font-mono">0%</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div id="metric-cpu-bar" class="bg-cyan-400 h-full w-0 transition-all duration-500"></div>
            </div>
          </div>

          <!-- Memory Live Metric Card -->
          <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
            <div class="flex justify-between items-center text-xs font-bold">
              <span class="text-slate-300 flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4 text-purple-400"></i> Memory</span>
              <span id="metric-ram-val" class="text-purple-400 font-mono">0 / ${this.serverData?.memory_mb || 1024} MB</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div id="metric-ram-bar" class="bg-purple-400 h-full w-0 transition-all duration-500"></div>
            </div>
          </div>

          <!-- Disk Storage Usage -->
          <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
            <div class="flex justify-between items-center text-xs font-bold">
              <span class="text-slate-300 flex items-center gap-2"><i data-lucide="hard-drive" class="w-4 h-4 text-amber-400"></i> Disk Space</span>
              <span id="metric-disk-val" class="text-amber-400 font-mono">0 / ${this.serverData?.disk_mb || 5120} MB</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div id="metric-disk-bar" class="bg-amber-400 h-full w-0 transition-all duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initTerminal();
    this.connectWebSocket();
  }

  initTerminal() {
    if (this.term) {
      try { this.term.dispose(); } catch (e) {}
    }

    const termContainer = document.getElementById('terminal-container');
    if (!termContainer) return;

    this.term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#d0d7de'
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      convertEol: true,
      disableStdin: true
    });

    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(termContainer);
    this.fitAddon.fit();

    window.addEventListener('resize', () => {
      if (this.fitAddon) this.fitAddon.fit();
    });
  }

  connectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/servers/${this.serverId}/console?token=${app.token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      if (this.term) {
        this.term.writeln('\x1b[32m[Mpanel]\x1b[0m Connected to server live stream.');
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'history' || msg.type === 'console') {
          if (this.term && msg.data) {
            this.term.write(msg.data);
          }
        } else if (msg.type === 'status') {
          this.updateStatusBadge(msg.status);
        } else if (msg.type === 'stats') {
          this.updateStatsUI(msg.stats);
        } else if (msg.type === 'error') {
          app.toast(msg.message, 'error');
        }
      } catch (err) {
        if (this.term) this.term.write(event.data);
      }
    };

    this.ws.onclose = () => {
      if (this.term) {
        this.term.writeln('\r\n\x1b[33m[Mpanel]\x1b[0m Disconnected from server stream.');
      }
    };
  }

  clearTerminal() {
    if (this.term) this.term.clear();
  }

  updateStatsUI(stats) {
    if (!stats) return;
    const cpuVal = document.getElementById('metric-cpu-val');
    const cpuBar = document.getElementById('metric-cpu-bar');
    if (cpuVal && cpuBar) {
      cpuVal.innerText = `${stats.cpu}%`;
      cpuBar.style.width = `${Math.min(100, stats.cpu)}%`;
    }

    const maxMem = this.serverData?.memory_mb || 1024;
    const ramVal = document.getElementById('metric-ram-val');
    const ramBar = document.getElementById('metric-ram-bar');
    if (ramVal && ramBar) {
      ramVal.innerText = `${stats.memory} / ${maxMem} MB`;
      const memPct = Math.round((stats.memory / maxMem) * 100);
      ramBar.style.width = `${Math.min(100, memPct)}%`;
    }

    const maxDisk = this.serverData?.disk_mb || 5120;
    const diskVal = document.getElementById('metric-disk-val');
    const diskBar = document.getElementById('metric-disk-bar');
    if (diskVal && diskBar) {
      diskVal.innerText = `${stats.disk} / ${maxDisk} MB`;
      const diskPct = Math.round((stats.disk / maxDisk) * 100);
      diskBar.style.width = `${Math.min(100, diskPct)}%`;
    }
  }

  handleSendCommand(e) {
    e.preventDefault();
    const input = document.getElementById('console-cmd-input');
    const cmd = input.value.trim();
    if (!cmd) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'command', command: cmd }));
      input.value = '';
    } else {
      app.toast('Terminal is not connected.', 'error');
    }
  }

  async triggerPower(serverId, action) {
    try {
      app.toast(`Sending ${action.toUpperCase()} signal...`, 'info');
      const data = await app.api(`/api/servers/${serverId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });

      if (data.success) {
        app.toast(`Server power signal "${action}" executed.`, 'success');
        this.loadServerHeader(serverId);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Backups Tab
  async renderBackupsTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="archive" class="w-5 h-5 text-cyan-400"></i> Server Backups
            </h3>
            <p class="text-xs text-slate-400">Create, restore, or download complete snapshots of your server</p>
          </div>
          <button onclick="serverConsole.showCreateBackupModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Create Backup
          </button>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">Backup Name</th>
                <th class="px-5 py-3">Size</th>
                <th class="px-5 py-3">Created</th>
                <th class="px-5 py-3">Lock</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="backups-table-tbody" class="divide-y divide-white/5">
              <tr><td colspan="5" class="text-center py-6 text-slate-500">Loading backups...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const data = await app.api(`/api/servers/${this.serverId}/backups`);
      const backups = data.backups || [];
      const tbody = document.getElementById('backups-table-tbody');

      if (backups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">No backups created yet.</td></tr>`;
      } else {
        tbody.innerHTML = backups.map(b => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3 font-semibold text-white">${b.name}</td>
            <td class="px-5 py-3 font-mono">${(b.file_size / (1024 * 1024)).toFixed(2)} MB</td>
            <td class="px-5 py-3 text-slate-400">${new Date(b.created_at).toLocaleString()}</td>
            <td class="px-5 py-3">
              <button onclick="serverConsole.toggleBackupLock(${b.id})" class="text-xs ${b.is_locked ? 'text-amber-400' : 'text-slate-500'} hover:opacity-80">
                <i data-lucide="${b.is_locked ? 'lock' : 'unlock'}" class="w-4 h-4"></i>
              </button>
            </td>
            <td class="px-5 py-3 text-right space-x-2">
              <a href="/api/servers/${this.serverId}/backups/${b.id}/download?token=${app.token}" target="_blank" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1">
                <i data-lucide="download" class="w-3 h-3"></i> Download
              </a>
              <button onclick="serverConsole.restoreBackup(${b.id})" class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[11px] font-semibold">
                Restore
              </button>
              <button onclick="serverConsole.deleteBackup(${b.id})" class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[11px]">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  showCreateBackupModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="archive" class="w-5 h-5 text-cyan-400"></i> Create New Backup
          </h3>
          <p class="text-xs text-slate-300">Enter a descriptive name for this server snapshot:</p>
          <input type="text" id="new-backup-name" placeholder="e.g. Before Mod Update" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="serverConsole.handleCreateBackup()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Create Snapshot</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateBackup() {
    const name = document.getElementById('new-backup-name').value.trim();
    if (!name) return;

    try {
      app.toast('Generating compressed backup archive...', 'info');
      document.getElementById('modal-container').innerHTML = '';
      const data = await app.api(`/api/servers/${this.serverId}/backups`, {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      if (data.success) {
        app.toast('Backup archive created successfully!', 'success');
        this.renderBackupsTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async restoreBackup(backupId) {
    if (!confirm('Are you sure you want to restore this backup? All existing server files will be overwritten.')) return;
    try {
      app.toast('Restoring backup archive...', 'info');
      const data = await app.api(`/api/servers/${this.serverId}/backups/${backupId}/restore`, { method: 'POST' });
      if (data.success) {
        app.toast('Backup restored successfully!', 'success');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async toggleBackupLock(backupId) {
    try {
      const data = await app.api(`/api/servers/${this.serverId}/backups/${backupId}/lock`, { method: 'POST' });
      if (data.success) {
        this.renderBackupsTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteBackup(backupId) {
    if (!confirm('Are you sure you want to delete this backup archive?')) return;
    try {
      const data = await app.api(`/api/servers/${this.serverId}/backups/${backupId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('Backup deleted.', 'info');
        this.renderBackupsTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Schedules Tab
  async renderSchedulesTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="clock" class="w-5 h-5 text-cyan-400"></i> Scheduled Tasks (Cron)
            </h3>
            <p class="text-xs text-slate-400">Automate recurring server restarts, backups, and custom commands</p>
          </div>
          <button onclick="serverConsole.showCreateScheduleModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> New Schedule
          </button>
        </div>

        <div id="schedules-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-full text-center py-8 text-slate-400">Loading schedules...</div>
        </div>
      </div>
    `;

    try {
      const data = await app.api(`/api/servers/${this.serverId}/schedules`);
      const schedules = data.schedules || [];
      const list = document.getElementById('schedules-list');

      if (schedules.length === 0) {
        list.innerHTML = `<div class="glass-card p-8 rounded-2xl text-center col-span-full border border-dashed border-white/20 text-slate-400 text-xs">No scheduled tasks configured.</div>`;
      } else {
        list.innerHTML = schedules.map(s => `
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-sm font-bold text-white">${s.name}</h4>
                <p class="text-[11px] font-mono text-cyan-400">${s.cron_expression}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}">
                ${s.is_active ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
            <div class="text-xs text-slate-300">
              <span class="text-slate-400">Action:</span> <span class="font-semibold text-white uppercase">${s.action_type}</span>
              ${s.payload ? `<div class="mt-1 bg-slate-900/60 p-1.5 rounded font-mono text-[11px] text-slate-300 truncate">${s.payload}</div>` : ''}
            </div>
            <div class="pt-2 border-t border-white/10 flex justify-between items-center">
              <span class="text-[10px] text-slate-400">Last run: ${s.last_run_at ? new Date(s.last_run_at).toLocaleString() : 'Never'}</span>
              <button onclick="serverConsole.deleteSchedule(${s.id})" class="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  showCreateScheduleModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="clock" class="w-5 h-5 text-cyan-400"></i> Create Scheduled Task
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Schedule Name</label>
            <input type="text" id="sched-name" placeholder="Daily Restart" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Cron Expression (5-part)</label>
            <input type="text" id="sched-cron" placeholder="0 4 * * * (Daily at 4 AM)" value="0 4 * * *" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Action Type</label>
            <select id="sched-action" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
              <option value="restart">Restart Server</option>
              <option value="backup">Create Full Backup</option>
              <option value="command">Send Console Command</option>
              <option value="stop">Stop Server</option>
              <option value="start">Start Server</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Command / Payload (if action is command)</label>
            <input type="text" id="sched-payload" placeholder="say Server is restarting in 1 minute!" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="serverConsole.handleCreateSchedule()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Save Schedule</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateSchedule() {
    const name = document.getElementById('sched-name').value.trim();
    const cron_expression = document.getElementById('sched-cron').value.trim();
    const action_type = document.getElementById('sched-action').value;
    const payload = document.getElementById('sched-payload').value.trim();

    try {
      const data = await app.api(`/api/servers/${this.serverId}/schedules`, {
        method: 'POST',
        body: JSON.stringify({ name, cron_expression, action_type, payload })
      });

      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Schedule created successfully!', 'success');
        this.renderSchedulesTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const data = await app.api(`/api/servers/${this.serverId}/schedules/${scheduleId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('Schedule deleted.', 'info');
        this.renderSchedulesTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Startup Configuration Tab
  async renderStartupTab(container) {
    const s = this.serverData || {};
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="play-circle" class="w-5 h-5 text-cyan-400"></i> Server Startup Parameters
          </h3>
          <p class="text-xs text-slate-400">Edit launch commands, Docker image environment, and runtime variables</p>
        </div>

        <form onsubmit="serverConsole.handleSaveStartup(event)" class="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Startup Command</label>
            <input type="text" id="startup-cmd-input" value="${s.startup_cmd || ''}" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono text-cyan-300" required>
            <p class="text-[11px] text-slate-400 mt-1">Available variables: <span class="font-mono text-cyan-400">{{SERVER_MEMORY}}</span>, <span class="font-mono text-cyan-400">{{SERVER_PORT}}</span>, <span class="font-mono text-cyan-400">{{SERVER_JARFILE}}</span></p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Docker Image Environment</label>
            <input type="text" id="startup-image-input" value="${s.docker_image || ''}" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono" required>
          </div>

          <div class="pt-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1">Environment Variables (JSON)</label>
            <textarea id="startup-env-input" rows="4" class="w-full glass-input p-3 rounded-xl text-xs font-mono">${s.env_vars || '{}'}</textarea>
          </div>

          <button type="submit" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-bold shadow-lg">
            Save Startup Configuration
          </button>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleSaveStartup(e) {
    e.preventDefault();
    const startup_cmd = document.getElementById('startup-cmd-input').value.trim();
    const docker_image = document.getElementById('startup-image-input').value.trim();
    const env_vars = document.getElementById('startup-env-input').value.trim();

    try {
      const data = await app.api(`/api/servers/${this.serverId}`, {
        method: 'PUT',
        body: JSON.stringify({ startup_cmd, docker_image, env_vars })
      });

      if (data.success) {
        app.toast('Startup configuration updated!', 'success');
        this.loadServerHeader(this.serverId);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Subusers Tab
  async renderSubusersTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-cyan-400"></i> Server Subusers & Collaborators
            </h3>
            <p class="text-xs text-slate-400">Grant teammates granular access to console, file manager, and controls</p>
          </div>
          <button onclick="serverConsole.showAddSubuserModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Add Subuser
          </button>
        </div>

        <div id="subusers-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-full text-center py-8 text-slate-400">Loading subusers...</div>
        </div>
      </div>
    `;

    try {
      const data = await app.api(`/api/servers/${this.serverId}/subusers`);
      const subusers = data.subusers || [];
      const list = document.getElementById('subusers-list');

      if (subusers.length === 0) {
        list.innerHTML = `<div class="glass-card p-8 rounded-2xl text-center col-span-full border border-dashed border-white/20 text-slate-400 text-xs">No subusers assigned to this server.</div>`;
      } else {
        list.innerHTML = subusers.map(sub => `
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  ${sub.username.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">${sub.username}</h4>
                  <p class="text-[11px] text-slate-400">${sub.email}</p>
                </div>
              </div>
              <button onclick="serverConsole.removeSubuser(${sub.id})" class="text-rose-400 hover:text-rose-300 text-xs">
                <i data-lucide="user-x" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="flex flex-wrap gap-1 pt-1">
              ${sub.permissions.map(p => `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-white/5">${p}</span>`).join('')}
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  showAddSubuserModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="user-plus" class="w-5 h-5 text-cyan-400"></i> Add Subuser
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">User Username or Email</label>
            <input type="text" id="subuser-ident" placeholder="user@example.com" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2">Permissions</label>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-console" value="console.write" checked class="accent-cyan-400"> Console Access</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-power" value="power.control" checked class="accent-cyan-400"> Power Control</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-files" value="files.read,files.write" checked class="accent-cyan-400"> File Manager</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-backups" value="backups.read,backups.create" class="accent-cyan-400"> Backups</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-schedules" value="schedules.read" class="accent-cyan-400"> Schedules</label>
              <label class="flex items-center gap-2"><input type="checkbox" id="perm-settings" value="settings.view" class="accent-cyan-400"> View Settings</label>
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="serverConsole.handleAddSubuser()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Add User</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleAddSubuser() {
    const userIdentifier = document.getElementById('subuser-ident').value.trim();
    if (!userIdentifier) return;

    const perms = ['view'];
    if (document.getElementById('perm-console')?.checked) perms.push('console.view', 'console.write');
    if (document.getElementById('perm-power')?.checked) perms.push('power.control');
    if (document.getElementById('perm-files')?.checked) perms.push('files.read', 'files.write', 'files.delete');
    if (document.getElementById('perm-backups')?.checked) perms.push('backups.read', 'backups.create');
    if (document.getElementById('perm-schedules')?.checked) perms.push('schedules.read', 'schedules.create');
    if (document.getElementById('perm-settings')?.checked) perms.push('settings.view');

    try {
      const data = await app.api(`/api/servers/${this.serverId}/subusers`, {
        method: 'POST',
        body: JSON.stringify({ userIdentifier, permissions: perms })
      });

      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Subuser added successfully!', 'success');
        this.renderSubusersTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async removeSubuser(subuserId) {
    if (!confirm('Are you sure you want to remove this subuser?')) return;
    try {
      const data = await app.api(`/api/servers/${this.serverId}/subusers/${subuserId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('Subuser removed.', 'info');
        this.renderSubusersTab(document.getElementById('subtab-content-area'));
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Server Settings & SFTP Info Tab
  async renderSettingsTab(container) {
    const s = this.serverData || {};
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="settings" class="w-5 h-5 text-cyan-400"></i> Server Settings & SFTP Connection
          </h3>
          <p class="text-xs text-slate-400">Configure connection details and server lifecycle options</p>
        </div>

        <!-- Embedded SFTP Details Card -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <i data-lucide="hard-drive" class="w-4 h-4"></i> SFTP Connection Information (Port 3004)
            </h4>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>

          <p class="text-xs text-slate-300">Use FileZilla, WinSCP, or Cyberduck to connect directly to this server file directory:</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
              <span class="text-[10px] text-slate-400">Server Host / IP</span>
              <p class="font-bold text-white">${s.sftp_host || '127.0.0.1'}</p>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
              <span class="text-[10px] text-slate-400">SFTP Port</span>
              <p class="font-bold text-emerald-400">${s.sftp_port || 3004}</p>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
              <span class="text-[10px] text-slate-400">Username</span>
              <p class="font-bold text-cyan-400">${s.sftp_username || `${app.user?.username}.${s.id}`}</p>
            </div>
          </div>
          <p class="text-[11px] text-slate-400">Password is your regular Mpanel account login password.</p>
        </div>

        <!-- Rename Server Card -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i> Rename Server
          </h4>
          <div class="flex flex-col sm:flex-row gap-3">
            <input type="text" id="rename-srv-name" value="${s.name || ''}" class="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs">
            <button onclick="serverConsole.handleRenameServer()" class="btn-cyber px-5 py-2 rounded-xl text-xs font-bold">
              Save Name
            </button>
          </div>
        </div>

        <!-- Danger Zone (Reinstall / Delete) -->
        <div class="glass-panel p-6 rounded-3xl border border-rose-500/20 bg-rose-950/10 space-y-4">
          <h4 class="text-sm font-bold text-rose-400 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i> Danger Zone
          </h4>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div>
              <h5 class="text-xs font-bold text-white">Reinstall Server</h5>
              <p class="text-[11px] text-slate-400">Re-downloads default software / jar files and resets basic templates</p>
            </div>
            <button onclick="serverConsole.handleReinstallServer()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white">
              Reinstall Server
            </button>
          </div>
          <div class="border-t border-rose-500/20 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h5 class="text-xs font-bold text-white">Delete Server</h5>
              <p class="text-[11px] text-slate-400">Permanently delete this container and all associated data</p>
            </div>
            <button onclick="serverConsole.handleDeleteServer()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white">
              Delete Server
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleRenameServer() {
    const name = document.getElementById('rename-srv-name').value.trim();
    if (!name) return;
    try {
      const data = await app.api(`/api/servers/${this.serverId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      if (data.success) {
        app.toast('Server renamed successfully!', 'success');
        this.loadServerHeader(this.serverId);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleReinstallServer() {
    if (!confirm('Are you sure you want to reinstall this server?')) return;
    try {
      app.toast('Reinstalling server base files...', 'info');
      const data = await app.api(`/api/servers/${this.serverId}/reinstall`, { method: 'POST' });
      if (data.success) {
        app.toast('Server reinstalled successfully!', 'success');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleDeleteServer() {
    if (!confirm('DANGER: Are you absolutely sure you want to delete this server? This action CANNOT be undone!')) return;
    try {
      const data = await app.api(`/api/servers/${this.serverId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('Server deleted.', 'info');
        app.navigate('user-servers');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // Render Server Activity Log
  async renderActivityTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="activity" class="w-5 h-5 text-cyan-400"></i> Server Activity Audit Trail
          </h3>
          <p class="text-xs text-slate-400">History of actions executed specifically on this server</p>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">Action</th>
                <th class="px-5 py-3">User</th>
                <th class="px-5 py-3">Details</th>
                <th class="px-5 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody id="server-activity-tbody" class="divide-y divide-white/5">
              <tr><td colspan="4" class="text-center py-6 text-slate-500">Loading audit history...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const data = await app.api(`/api/activity/server/${this.serverId}`);
      const logs = data.logs || [];
      const tbody = document.getElementById('server-activity-tbody');

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500">No activity recorded for this server.</td></tr>`;
      } else {
        tbody.innerHTML = logs.map(l => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3 font-semibold text-cyan-400">${l.action}</td>
            <td class="px-5 py-3 font-medium text-white">${l.username || 'System'}</td>
            <td class="px-5 py-3 font-mono text-[11px] text-slate-300 truncate max-w-xs">${l.details || '-'}</td>
            <td class="px-5 py-3 text-slate-400">${new Date(l.created_at).toLocaleString()}</td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }
}

window.serverConsole = new ServerConsole();

