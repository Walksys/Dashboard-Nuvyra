// Admin Portal Management Suite
class AdminManager {
  // 1. Admin Overview
  async renderAdminOverview() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Admin Portal</span>
          <h2 class="text-2xl font-black text-white mt-2 flex items-center gap-2">
            <i data-lucide="gauge" class="w-6 h-6 text-purple-400"></i> Global System Overview
          </h2>
          <p class="text-xs text-slate-400">Cluster resource status, daemon health, and administrative metrics</p>
        </div>

        <!-- Global Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <i data-lucide="server" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Total Servers</p>
              <h3 id="adm-stat-servers" class="text-2xl font-bold text-white">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <i data-lucide="users" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Registered Users</p>
              <h3 id="adm-stat-users" class="text-2xl font-bold text-cyan-400">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <i data-lucide="network" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Active Nodes</p>
              <h3 id="adm-stat-nodes" class="text-2xl font-bold text-emerald-400">...</h3>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <i data-lucide="radio" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 uppercase font-semibold">Port Allocations</p>
              <h3 id="adm-stat-allocs" class="text-2xl font-bold text-amber-400">...</h3>
            </div>
          </div>
        </div>

        <!-- System Daemon Status & Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="glass-panel p-6 rounded-3xl border border-white/10 lg:col-span-2 space-y-4">
            <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-white/10 pb-3">
              <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i> Host & Daemon Health
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                <span class="text-[10px] text-slate-400 uppercase">Daemon Port</span>
                <p class="text-sm font-bold text-white">3003</p>
              </div>
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                <span class="text-[10px] text-slate-400 uppercase">SFTP Port</span>
                <p class="text-sm font-bold text-emerald-400">3004</p>
              </div>
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                <span class="text-[10px] text-slate-400 uppercase">Docker Status</span>
                <p id="adm-docker-status" class="text-sm font-bold text-cyan-400">Checking...</p>
              </div>
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                <span class="text-[10px] text-slate-400 uppercase">Runner Mode</span>
                <p class="text-sm font-bold text-purple-400">Dual Active</p>
              </div>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
                <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i> Quick Actions
              </h3>
              <p class="text-xs text-slate-400">Fast administrative management shortcuts</p>
            </div>
            <div class="space-y-2">
              <button onclick="admin.showCreateServerModal()" class="btn-cyber w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> Deploy New Server
              </button>
              <button onclick="admin.showCreateUserModal()" class="btn-cyber-purple w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <i data-lucide="user-plus" class="w-4 h-4"></i> Add User
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const [serversRes, usersRes, nodesRes] = await Promise.all([
        app.api('/api/servers'),
        app.api('/api/admin/users'),
        app.api('/api/admin/nodes')
      ]);

      document.getElementById('adm-stat-servers').innerText = serversRes.servers?.length || 0;
      document.getElementById('adm-stat-users').innerText = usersRes.users?.length || 0;
      document.getElementById('adm-stat-nodes').innerText = nodesRes.nodes?.length || 0;

      const totalAllocs = nodesRes.nodes?.reduce((acc, n) => acc + (n.total_allocations || 0), 0) || 0;
      document.getElementById('adm-stat-allocs').innerText = totalAllocs;
      document.getElementById('adm-docker-status').innerText = 'CONNECTED';
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  // 2. Server Management View
  async renderServersView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Management</span>
            <h2 class="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <i data-lucide="hard-drive" class="w-5 h-5 text-purple-400"></i> Server Management
            </h2>
            <p class="text-xs text-slate-400">Manage all servers across all nodes, allocations, owners, and build configs</p>
          </div>
          <button onclick="admin.showCreateServerModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Create Server
          </button>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">Server</th>
                <th class="px-5 py-3">Owner</th>
                <th class="px-5 py-3">Type</th>
                <th class="px-5 py-3">Port</th>
                <th class="px-5 py-3">Limits (RAM/CPU)</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="adm-servers-tbody" class="divide-y divide-white/5">
              <tr><td colspan="7" class="text-center py-8 text-slate-500">Loading servers...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const data = await app.api('/api/servers');
      const servers = data.servers || [];
      const tbody = document.getElementById('adm-servers-tbody');

      if (servers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500">No servers deployed.</td></tr>`;
      } else {
        tbody.innerHTML = servers.map(s => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3">
              <div class="font-bold text-white hover:text-cyan-400 cursor-pointer truncate max-w-xs" onclick="app.navigate('server-manage/${s.id}/console')">
                ${s.name}
              </div>
              <span class="text-[10px] font-mono text-slate-400">${s.uuid.substring(0, 13)}...</span>
            </td>
            <td class="px-5 py-3">
              <span class="font-semibold text-slate-200">${s.owner_username || 'Admin'}</span>
            </td>
            <td class="px-5 py-3 font-semibold uppercase text-cyan-400">${s.server_type}</td>
            <td class="px-5 py-3 font-mono">${s.port || 25565}</td>
            <td class="px-5 py-3 font-mono">${s.memory_mb || 1024} MB / ${s.cpu_limit || 100}%</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}">
                ${s.status.toUpperCase()}
              </span>
            </td>
            <td class="px-5 py-3 text-right space-x-2">
              <button onclick="app.navigate('server-manage/${s.id}/console')" class="btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1">
                <i data-lucide="terminal" class="w-3 h-3"></i> Manage
              </button>
              <button onclick="admin.showEditServerModal(${s.id})" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
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

  // Show Server Creation Wizard (with MCJars integration & Docker templates)
  async showCreateServerModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="text-lg font-black text-white flex items-center gap-2">
              <i data-lucide="server" class="w-5 h-5 text-cyan-400"></i> Deploy New Server Instance
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="admin.handleCreateServer(event)" class="space-y-4">
            <!-- Server Type Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2">Supported Server Type</label>
              <div class="grid grid-cols-3 gap-3">
                <label class="glass-card p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 cursor-pointer hover:border-cyan-400 transition">
                  <input type="radio" name="create_srv_type" value="minecraft" checked onchange="admin.onServerTypeChange('minecraft')" class="accent-cyan-400">
                  <i data-lucide="box" class="w-6 h-6 text-cyan-400"></i>
                  <span class="text-xs font-bold text-white">Minecraft</span>
                  <span class="text-[10px] text-slate-400 text-center">Paper, Purpur, Forge, Fabric...</span>
                </label>
                <label class="glass-card p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 cursor-pointer hover:border-purple-400 transition">
                  <input type="radio" name="create_srv_type" value="nodejs" onchange="admin.onServerTypeChange('nodejs')" class="accent-purple-400">
                  <i data-lucide="cpu" class="w-6 h-6 text-purple-400"></i>
                  <span class="text-xs font-bold text-white">Node.js</span>
                  <span class="text-[10px] text-slate-400 text-center">v12 - v25 Apps & Bots</span>
                </label>
                <label class="glass-card p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-400 transition">
                  <input type="radio" name="create_srv_type" value="python" onchange="admin.onServerTypeChange('python')" class="accent-emerald-400">
                  <i data-lucide="layers" class="w-6 h-6 text-emerald-400"></i>
                  <span class="text-xs font-bold text-white">Python</span>
                  <span class="text-[10px] text-slate-400 text-center">v2.7, 3.7 - 3.13 Apps & Bots</span>
                </label>
              </div>
            </div>

            <!-- Server Name & Description -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Server Name</label>
                <input type="text" id="srv-create-name" placeholder="My Epic Survival" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Server Description</label>
                <input type="text" id="srv-create-desc" placeholder="High-speed Paper 1.21.4 server" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
              </div>
            </div>

            <!-- Minecraft Version Changer & Software Selector with Icons -->
            <div id="mcjars-config-box" class="glass-card p-5 rounded-2xl border border-cyan-500/30 space-y-4 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-slate-900/80">
              <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                  </span>
                  <div>
                    <h4 class="text-xs font-bold text-white flex items-center gap-2">
                      Minecraft Version Changer & Software Selector
                    </h4>
                    <p class="text-[10px] text-slate-400">Choose your server engine and version with automatic Java runtime matching</p>
                  </div>
                </div>
                <a href="https://mcjars.app" target="_blank" class="text-[10px] font-mono text-cyan-400 hover:underline">mcjars.app</a>
              </div>

              <!-- Engine Cards with Icons -->
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Select Server Engine:</span>
                  <span class="text-[10px] text-slate-400">Click to select engine</span>
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <!-- Paper -->
                  <div onclick="admin.selectDeployEngine('paper')" data-type="paper" class="deploy-engine-card group relative p-3 rounded-xl border border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400 cursor-pointer transition">
                    <span class="deploy-card-check absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <i data-lucide="zap" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Paper</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-medium">Recommended</span>
                  </div>

                  <!-- Purpur -->
                  <div onclick="admin.selectDeployEngine('purpur')" data-type="purpur" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                        <i data-lucide="layers" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Purpur</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-purple-300 font-medium">Popular</span>
                  </div>

                  <!-- Fabric -->
                  <div onclick="admin.selectDeployEngine('fabric')" data-type="fabric" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                        <i data-lucide="box" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Fabric</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-medium">Fast Modding</span>
                  </div>

                  <!-- Forge -->
                  <div onclick="admin.selectDeployEngine('forge')" data-type="forge" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-orange-500/20 text-orange-300">
                        <i data-lucide="tool" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Forge</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-orange-300 font-medium">Classic Mods</span>
                  </div>

                  <!-- NeoForge -->
                  <div onclick="admin.selectDeployEngine('neoforge')" data-type="neoforge" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                        <i data-lucide="flame" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">NeoForge</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-rose-300 font-medium">Next-Gen</span>
                  </div>

                  <!-- Vanilla -->
                  <div onclick="admin.selectDeployEngine('vanilla')" data-type="vanilla" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                        <i data-lucide="compass" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Vanilla</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-medium">Official</span>
                  </div>

                  <!-- Spigot -->
                  <div onclick="admin.selectDeployEngine('spigot')" data-type="spigot" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                        <i data-lucide="cpu" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Spigot</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-blue-300 font-medium">Standard</span>
                  </div>

                  <!-- Folia -->
                  <div onclick="admin.selectDeployEngine('folia')" data-type="folia" class="deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition">
                    <span class="deploy-card-check hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-cyan-500 text-black flex items-center gap-0.5">
                      <i data-lucide="check" class="w-2.5 h-2.5"></i> ACTIVE
                    </span>
                    <div class="flex items-center gap-2 mb-1.5">
                      <div class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                        <i data-lucide="grid" class="w-4 h-4"></i>
                      </div>
                      <div class="font-bold text-xs text-white">Folia</div>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-medium">Multi-Thread</span>
                  </div>
                </div>
              </div>

              <!-- More Engines Dropdown -->
              <div class="pt-1">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-slate-400 whitespace-nowrap">Or choose other engine:</span>
                  <select id="mc-jar-type" onchange="admin.selectDeployEngine(this.value)" class="glass-input px-3 py-1.5 rounded-xl text-xs w-full">
                    <optgroup label="Server Forks (Optimized)">
                      <option value="paper" selected>Paper (Recommended)</option>
                      <option value="purpur">Purpur (Optimized & Features)</option>
                      <option value="pufferfish">Pufferfish (High-Performance)</option>
                      <option value="folia">Folia (Multi-threaded Regionized)</option>
                      <option value="leaves">Leaves (Vanilla Parity)</option>
                      <option value="leaf">Leaf (Balanced)</option>
                      <option value="divinemc">DivineMC (Optimized Purpur)</option>
                      <option value="spigot">Spigot (Classic)</option>
                      <option value="vanilla">Vanilla (Official Mojang)</option>
                      <option value="craftbukkit">CraftBukkit</option>
                    </optgroup>
                    <optgroup label="Modded Platforms">
                      <option value="fabric">Fabric (Fast Mod Loader)</option>
                      <option value="forge">Forge (Classic Modding)</option>
                      <option value="neoforge">NeoForge (Modern Forge)</option>
                      <option value="quilt">Quilt (Modular Mod Loader)</option>
                      <option value="legacyfabric">Legacy Fabric (Old MC)</option>
                    </optgroup>
                    <optgroup label="Hybrid (Mods + Plugins)">
                      <option value="mohist">Mohist (Forge + Plugins)</option>
                      <option value="arclight">Arclight (Forge/Fabric + Plugins)</option>
                      <option value="magma">Magma (Forge + Spigot)</option>
                      <option value="youer">Youer (NeoForge + Spigot)</option>
                    </optgroup>
                    <optgroup label="Proxies">
                      <option value="velocity">Velocity (Next-Gen Proxy)</option>
                      <option value="bungeecord">BungeeCord (Standard Proxy)</option>
                      <option value="waterfall">Waterfall (Paper Proxy)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <!-- Quick Pick Version Buttons (Dynamic A to Z Auto) -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <i data-lucide="zap" class="w-3 h-3 text-amber-400"></i> Quick Select Minecraft Version (A to Z Auto):
                  </label>
                  <div class="flex items-center gap-2">
                    <input type="text" id="deploy-ver-filter" placeholder="Filter A-Z..." oninput="admin.filterDeployQuickVersions(this.value)" class="glass-input px-2 py-0.5 rounded-lg text-[10px] w-24">
                    <button type="button" onclick="admin.toggleDeploySortOrder()" id="deploy-sort-btn" class="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 border border-white/5 flex items-center gap-1 transition">
                      <i data-lucide="arrow-down-up" class="w-2.5 h-2.5"></i> A-Z
                    </button>
                  </div>
                </div>
                <div id="deploy-quick-versions-container" class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  <!-- Populated dynamically with all versions from A to Z -->
                </div>
              </div>

              <!-- Version Dropdown & Auto-matched Java indicator -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Minecraft Version</span>
                    <span id="deploy-version-count" class="text-[10px] text-slate-400">All available</span>
                  </label>
                  <select id="mc-jar-version" onchange="admin.onDeployVersionChange(this.value)" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-cyan-300">
                    <option value="1.21.4" selected>1.21.4 (Latest Stable)</option>
                    <option value="1.20.4">1.20.4</option>
                    <option value="1.19.4">1.19.4</option>
                    <option value="1.18.2">1.18.2</option>
                    <option value="1.16.5">1.16.5</option>
                    <option value="1.12.2">1.12.2</option>
                    <option value="1.8.8">1.8.8</option>
                    <option value="1.7.10">1.7.10</option>
                  </select>
                </div>
                <div class="flex flex-col justify-end">
                  <div class="glass-card p-2 rounded-xl border border-white/10 flex items-center gap-2">
                    <div id="deploy-java-tag" class="flex items-center gap-1.5 text-xs font-mono">
                      <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                      <span class="text-emerald-400 font-semibold">Auto-matched Java 21</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Docker Image Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Docker Image Environment</label>
              <select id="srv-docker-image" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
                <!-- Dynamically populated -->
              </select>
            </div>

            <!-- Build Resources Limit (Memory, CPU, Disk) -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Memory (MB)</label>
                <input type="number" id="srv-create-ram" value="1024" min="256" step="256" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">CPU Limit (%)</label>
                <input type="number" id="srv-create-cpu" value="100" min="10" step="10" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Disk Limit (MB)</label>
                <input type="number" id="srv-create-disk" value="5120" min="500" step="500" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
              </div>
            </div>

            <button type="submit" class="btn-cyber w-full py-3 rounded-2xl text-xs font-bold shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i> Deploy Server
            </button>
          </form>
        </div>
      </div>
    `;

    this.populateDockerImages('minecraft');
    this.initDeployVersionChanger();
    if (window.lucide) lucide.createIcons();
  }

  initDeployVersionChanger() {
    this.deployVersions = [];
    this.deployVerFilter = '';
    this.deploySortOrder = 'desc';
    this.selectDeployEngine('paper', true);
  }

  async selectDeployEngine(typeId, fetchVersions = true) {
    const hiddenType = document.getElementById('mc-jar-type');
    if (hiddenType) hiddenType.value = typeId;

    document.querySelectorAll('.deploy-engine-card').forEach(card => {
      const isThis = card.getAttribute('data-type') === typeId;
      if (isThis) {
        card.className = 'deploy-engine-card group relative p-3 rounded-xl border border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400 cursor-pointer transition';
        const checkBadge = card.querySelector('.deploy-card-check');
        if (checkBadge) checkBadge.classList.remove('hidden');
      } else {
        card.className = 'deploy-engine-card group relative p-3 rounded-xl border border-white/10 glass-card hover:border-cyan-500/40 hover:bg-white/5 cursor-pointer transition';
        const checkBadge = card.querySelector('.deploy-card-check');
        if (checkBadge) checkBadge.classList.add('hidden');
      }
    });

    if (fetchVersions) {
      await this.onMcTypeChange(typeId);
    }
  }

  renderDeployQuickVersionPills() {
    const container = document.getElementById('deploy-quick-versions-container');
    if (!container) return;

    let list = (this.deployVersions || []).map(v => typeof v === 'object' ? v.version : v);
    if (list.length === 0) {
      list = ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.7.10'];
    }

    if (this.deployVerFilter) {
      const q = this.deployVerFilter.toLowerCase();
      list = list.filter(v => v.toLowerCase().includes(q));
    }

    if (this.deploySortOrder === 'asc') {
      list = [...list].reverse();
    }

    if (list.length === 0) {
      container.innerHTML = `<span class="text-[11px] text-slate-500 py-1">No versions matching "${this.deployVerFilter}"</span>`;
      return;
    }

    const currentVer = document.getElementById('mc-jar-version')?.value || '1.21.4';

    container.innerHTML = list.map(v => {
      const isSelected = currentVer === v;
      return `
        <button type="button" onclick="admin.quickPickDeployVersion('${v}')" data-ver="${v}" class="deploy-ver-pill px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${isSelected ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300' : 'bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border border-white/5'}">
          ${v}
        </button>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  filterDeployQuickVersions(val) {
    this.deployVerFilter = val.trim();
    this.renderDeployQuickVersionPills();
  }

  toggleDeploySortOrder() {
    this.deploySortOrder = this.deploySortOrder === 'desc' ? 'asc' : 'desc';
    const btn = document.getElementById('deploy-sort-btn');
    if (btn) {
      btn.innerHTML = `<i data-lucide="arrow-down-up" class="w-2.5 h-2.5"></i> ${this.deploySortOrder === 'asc' ? 'A-Z' : 'Latest'}`;
      if (window.lucide) lucide.createIcons();
    }
    this.renderDeployQuickVersionPills();
  }

  quickPickDeployVersion(ver) {
    const sel = document.getElementById('mc-jar-version');
    if (sel) {
      let found = false;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === ver) {
          sel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = document.createElement('option');
        opt.value = ver;
        opt.innerText = ver;
        opt.selected = true;
        sel.appendChild(opt);
      }
      this.onDeployVersionChange(ver);
    }
    this.renderDeployQuickVersionPills();
  }

  onDeployVersionChange(version) {
    this.autoMatchDeployJava(version);
    this.renderDeployQuickVersionPills();
  }

  autoMatchDeployJava(version) {
    if (!version) return;
    const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
    let targetJava = 'ghcr.io/pterodactyl/yolks:java_21';

    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3] || '0', 10);

      if (major === 1) {
        if (minor >= 21) {
          targetJava = 'ghcr.io/pterodactyl/yolks:java_21';
        } else if (minor === 20 && patch >= 5) {
          targetJava = 'ghcr.io/pterodactyl/yolks:java_21';
        } else if (minor >= 18) {
          targetJava = 'ghcr.io/pterodactyl/yolks:java_17';
        } else if (minor === 17) {
          targetJava = 'ghcr.io/pterodactyl/yolks:java_17';
        } else {
          targetJava = 'ghcr.io/pterodactyl/yolks:java_8';
        }
      } else if (major >= 26) {
        targetJava = 'ghcr.io/pterodactyl/yolks:java_25';
      }
    }

    const javaSelect = document.getElementById('srv-docker-image');
    if (javaSelect) {
      javaSelect.value = targetJava;
    }

    const tag = document.getElementById('deploy-java-tag');
    if (tag) {
      const label = targetJava.includes('java_21') ? 'Java 21' :
                    targetJava.includes('java_17') ? 'Java 17' :
                    targetJava.includes('java_8')  ? 'Java 8'  :
                    targetJava.includes('java_25') ? 'Java 25' :
                    targetJava.includes('java_16') ? 'Java 16' : 'Java';
      tag.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> <span class="text-emerald-400 font-semibold">Auto-matched ${label}</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }

  async onMcTypeChange(type) {
    const sel = document.getElementById('mc-jar-version');
    const countTag = document.getElementById('deploy-version-count');
    if (countTag) countTag.innerText = 'Loading...';

    try {
      const data = await app.api(`/api/mcjars/types/${type}/versions`);
      if (sel && data.versions && data.versions.length > 0) {
        this.deployVersions = data.versions;
        if (countTag) countTag.innerText = `${data.versions.length} versions`;
        sel.innerHTML = data.versions.map(v => `<option value="${v.version}">${v.version} ${v.version === '1.21.4' ? '(Latest Stable)' : ''}</option>`).join('');
        const firstVer = data.versions[0].version;
        sel.value = firstVer;
        this.onDeployVersionChange(firstVer);
      }
    } catch (e) {
      if (countTag) countTag.innerText = 'Default versions';
      const fallbacks = ['1.21.4', '1.20.4', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.8', '1.7.10'];
      this.deployVersions = fallbacks.map(v => ({ version: v }));
      if (sel) {
        sel.innerHTML = fallbacks.map(v => `<option value="${v}">${v}</option>`).join('');
        this.onDeployVersionChange('1.21.4');
      }
    }
    this.renderDeployQuickVersionPills();
  }

  populateDockerImages(type) {
    const select = document.getElementById('srv-docker-image');
    if (!select) return;

    const mcImages = [
      { label: 'Java 21 (ghcr.io/pterodactyl/yolks:java_21)', value: 'ghcr.io/pterodactyl/yolks:java_21' },
      { label: 'Java 17 (ghcr.io/pterodactyl/yolks:java_17)', value: 'ghcr.io/pterodactyl/yolks:java_17' },
      { label: 'Java 8 (ghcr.io/pterodactyl/yolks:java_8)', value: 'ghcr.io/pterodactyl/yolks:java_8' },
      { label: 'Java 25 (ghcr.io/pterodactyl/yolks:java_25)', value: 'ghcr.io/pterodactyl/yolks:java_25' },
      { label: 'Java 16 (ghcr.io/pterodactyl/yolks:java_16)', value: 'ghcr.io/pterodactyl/yolks:java_16' },
      { label: 'Java 11 (ghcr.io/pterodactyl/yolks:java_11)', value: 'ghcr.io/pterodactyl/yolks:java_11' }
    ];

    const nodeImages = [
      { label: 'Nodejs 25 (ghcr.io/ptero-eggs/yolks:nodejs_25)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_25' },
      { label: 'Nodejs 24 (ghcr.io/ptero-eggs/yolks:nodejs_24)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_24' },
      { label: 'Nodejs 22 (ghcr.io/ptero-eggs/yolks:nodejs_22)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_22' },
      { label: 'Nodejs 20 (ghcr.io/ptero-eggs/yolks:nodejs_20)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_20' },
      { label: 'Nodejs 18 (ghcr.io/ptero-eggs/yolks:nodejs_18)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_18' },
      { label: 'Nodejs 16 (ghcr.io/ptero-eggs/yolks:nodejs_16)', value: 'ghcr.io/ptero-eggs/yolks:nodejs_16' }
    ];

    const pyImages = [
      { label: 'Python 3.13 (ghcr.io/ptero-eggs/yolks:python_3.13)', value: 'ghcr.io/ptero-eggs/yolks:python_3.13' },
      { label: 'Python 3.12 (ghcr.io/ptero-eggs/yolks:python_3.12)', value: 'ghcr.io/ptero-eggs/yolks:python_3.12' },
      { label: 'Python 3.11 (ghcr.io/ptero-eggs/yolks:python_3.11)', value: 'ghcr.io/ptero-eggs/yolks:python_3.11' },
      { label: 'Python 3.10 (ghcr.io/ptero-eggs/yolks:python_3.10)', value: 'ghcr.io/ptero-eggs/yolks:python_3.10' },
      { label: 'Python 3.8 (ghcr.io/ptero-eggs/yolks:python_3.8)', value: 'ghcr.io/ptero-eggs/yolks:python_3.8' },
      { label: 'Python 2.7 (ghcr.io/ptero-eggs/yolks:python_2.7)', value: 'ghcr.io/ptero-eggs/yolks:python_2.7' }
    ];

    const map = { minecraft: mcImages, nodejs: nodeImages, python: pyImages };
    const list = map[type] || mcImages;

    select.innerHTML = list.map(item => `
      <option value="${item.value}">${item.label}</option>
    `).join('');
  }

  onServerTypeChange(type) {
    const mcBox = document.getElementById('mcjars-config-box');
    if (mcBox) {
      if (type === 'minecraft') mcBox.classList.remove('hidden');
      else mcBox.classList.add('hidden');
    }
    this.populateDockerImages(type);
    if (type === 'minecraft') {
      const verSel = document.getElementById('mc-jar-version');
      this.autoMatchDeployJava(verSel?.value || '1.21.4');
    }
  }

  async handleCreateServer(e) {
    e.preventDefault();
    const typeInput = document.querySelector('input[name="create_srv_type"]:checked');
    const server_type = typeInput ? typeInput.value : 'minecraft';
    const name = document.getElementById('srv-create-name').value.trim();
    const description = document.getElementById('srv-create-desc').value.trim();
    const docker_image = document.getElementById('srv-docker-image').value;
    const memory_mb = parseInt(document.getElementById('srv-create-ram').value, 10);
    const cpu_limit = parseInt(document.getElementById('srv-create-cpu').value, 10);
    const disk_mb = parseInt(document.getElementById('srv-create-disk').value, 10);

    let mc_jar_type = null;
    let mc_jar_version = null;
    if (server_type === 'minecraft') {
      mc_jar_type = document.getElementById('mc-jar-type')?.value;
      mc_jar_version = document.getElementById('mc-jar-version')?.value;
    }

    try {
      app.toast('Deploying server container...', 'info');
      const data = await app.api('/api/servers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          server_type,
          docker_image,
          memory_mb,
          cpu_limit,
          disk_mb,
          mc_jar_type,
          mc_jar_version
        })
      });

      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Server deployed successfully!', 'success');
        app.navigate(`server-manage/${data.serverId}/console`);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // 3. User Management View
  async renderUsersView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Management</span>
            <h2 class="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-purple-400"></i> User & Team Management
            </h2>
            <p class="text-xs text-slate-400">Manage user accounts, roles, suspend access, and view activity</p>
          </div>
          <button onclick="admin.showCreateUserModal()" class="btn-cyber-purple px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Create User
          </button>
        </div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">User</th>
                <th class="px-5 py-3">Email</th>
                <th class="px-5 py-3">Role</th>
                <th class="px-5 py-3">2FA</th>
                <th class="px-5 py-3">Servers</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="adm-users-tbody" class="divide-y divide-white/5">
              <tr><td colspan="7" class="text-center py-8 text-slate-500">Loading users...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const data = await app.api('/api/admin/users');
      const users = data.users || [];
      const tbody = document.getElementById('adm-users-tbody');

      if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500">No users found.</td></tr>`;
      } else {
        tbody.innerHTML = users.map(u => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-cyan-400">
                  ${u.username.substring(0, 1).toUpperCase()}
                </div>
                <span class="font-semibold text-white">${u.username}</span>
              </div>
            </td>
            <td class="px-5 py-3 font-mono">${u.email}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-300'}">
                ${u.role.toUpperCase()}
              </span>
            </td>
            <td class="px-5 py-3 font-semibold ${u.two_factor_enabled ? 'text-emerald-400' : 'text-slate-500'}">
              ${u.two_factor_enabled ? 'Enabled' : 'No'}
            </td>
            <td class="px-5 py-3 font-mono">${u.server_count || 0}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.suspended ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}">
                ${u.suspended ? 'SUSPENDED' : 'ACTIVE'}
              </span>
            </td>
            <td class="px-5 py-3 text-right space-x-1.5">
              <button onclick="admin.toggleSuspendUser(${u.id})" title="${u.suspended ? 'Unsuspend' : 'Suspend'}" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 ${u.suspended ? 'text-emerald-400' : 'text-amber-400'}">
                <i data-lucide="${u.suspended ? 'check' : 'slash'}" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="admin.deleteUser(${u.id})" title="Delete User" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">
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

  showCreateUserModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="user-plus" class="w-5 h-5 text-purple-400"></i> Create User Account
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input type="text" id="adm-new-user-name" placeholder="shadow" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input type="email" id="adm-new-user-email" placeholder="user@example.com" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input type="password" id="adm-new-user-pass" placeholder="••••••••" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required minlength="6">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select id="adm-new-user-role" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="admin.handleCreateUser()" class="btn-cyber-purple flex-1 py-2 rounded-xl text-xs font-semibold">Create User</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateUser() {
    const username = document.getElementById('adm-new-user-name').value.trim();
    const email = document.getElementById('adm-new-user-email').value.trim();
    const password = document.getElementById('adm-new-user-pass').value;
    const role = document.getElementById('adm-new-user-role').value;

    try {
      const data = await app.api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role })
      });
      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('User created successfully!', 'success');
        this.renderUsersView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async toggleSuspendUser(userId) {
    try {
      const data = await app.api(`/api/admin/users/${userId}/suspend`, { method: 'POST' });
      if (data.success) {
        app.toast(`User status updated.`, 'info');
        this.renderUsersView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? All their servers will be deleted as well.')) return;
    try {
      const data = await app.api(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('User deleted.', 'info');
        this.renderUsersView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // 4. Nodes & Port Allocations View
  async renderNodesView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Infrastructure</span>
            <h2 class="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <i data-lucide="network" class="w-5 h-5 text-purple-400"></i> Nodes & Port Allocations
            </h2>
            <p class="text-xs text-slate-400">Manage hosting nodes, daemon endpoints, and assignable port ranges</p>
          </div>
          <button onclick="admin.showCreateNodeModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Create Node
          </button>
        </div>

        <div id="nodes-card-list" class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="col-span-full text-center py-8 text-slate-400">Loading nodes...</div>
        </div>
      </div>
    `;

    try {
      const data = await app.api('/api/admin/nodes');
      const nodes = data.nodes || [];
      const list = document.getElementById('nodes-card-list');

      if (nodes.length === 0) {
        list.innerHTML = `<div class="glass-card p-8 rounded-2xl text-center col-span-full border border-dashed border-white/20 text-slate-400 text-xs">No nodes created yet.</div>`;
      } else {
        list.innerHTML = nodes.map(n => `
          <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">${n.location_name || 'Local'}</span>
                <h4 class="text-base font-bold text-white">${n.name}</h4>
                <p class="text-xs font-mono text-slate-400">${n.fqdn}</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900/60 rounded-xl border border-white/5 font-mono">
              <div>
                <p class="text-[10px] text-slate-400">Servers</p>
                <p class="font-bold text-white">${n.server_count || 0}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400">Total Ports</p>
                <p class="font-bold text-cyan-400">${n.total_allocations || 0}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400">Used Ports</p>
                <p class="font-bold text-amber-400">${n.assigned_allocations || 0}</p>
              </div>
            </div>

            <div class="flex gap-2 pt-2 border-t border-white/10">
              <button onclick="admin.showAllocationsModal(${n.id})" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <i data-lucide="radio" class="w-3.5 h-3.5"></i> Manage Port Allocations
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

  showCreateNodeModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="network" class="w-5 h-5 text-cyan-400"></i> Create Node
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Node Name</label>
            <input type="text" id="node-name" placeholder="EU Node 01" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">FQDN or Host IP</label>
            <input type="text" id="node-fqdn" placeholder="127.0.0.1" value="127.0.0.1" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono" required>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Daemon Port</label>
              <input type="number" id="node-daemon-port" value="3003" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">SFTP Port</label>
              <input type="number" id="node-sftp-port" value="3004" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono">
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="admin.handleCreateNode()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Create Node</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateNode() {
    const name = document.getElementById('node-name').value.trim();
    const fqdn = document.getElementById('node-fqdn').value.trim();
    const daemon_port = document.getElementById('node-daemon-port').value;
    const sftp_port = document.getElementById('node-sftp-port').value;

    try {
      const data = await app.api('/api/admin/nodes', {
        method: 'POST',
        body: JSON.stringify({ name, fqdn, daemon_port, sftp_port })
      });
      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Node created successfully!', 'success');
        this.renderNodesView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async showAllocationsModal(nodeId) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5">
          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="radio" class="w-5 h-5 text-cyan-400"></i> Port Allocations Manager
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Add Ports Batch Generator -->
          <div class="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3">
            <h4 class="text-xs font-bold text-cyan-300">Generate Port Range (e.g. 25565 to 25575)</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Start Port</label>
                <input type="number" id="alloc-start-port" placeholder="25565" class="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono">
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">End Port</label>
                <input type="number" id="alloc-end-port" placeholder="25575" class="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono">
              </div>
              <div class="flex items-end">
                <button onclick="admin.handleBatchGeneratePorts(${nodeId})" class="btn-cyber w-full py-2 rounded-xl text-xs font-semibold">
                  + Add Ports
                </button>
              </div>
            </div>
          </div>

          <!-- Allocations List -->
          <div id="allocs-list-container" class="space-y-2">
            <p class="text-xs text-slate-400">Loading existing allocations...</p>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    this.loadNodeAllocations(nodeId);
  }

  async loadNodeAllocations(nodeId) {
    try {
      const data = await app.api(`/api/admin/nodes/${nodeId}`);
      const allocs = data.allocations || [];
      const container = document.getElementById('allocs-list-container');

      if (!container) return;

      if (allocs.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">No port allocations found on this node.</p>';
      } else {
        container.innerHTML = `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
            ${allocs.map(a => `
              <div class="glass-card p-2.5 rounded-xl border border-white/5 flex items-center justify-between font-mono text-xs">
                <span class="${a.assigned ? 'text-amber-400 font-bold' : 'text-slate-300'}">${a.port}</span>
                <div class="flex items-center gap-1">
                  ${a.assigned ? '<span class="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">USED</span>' : '<span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">FREE</span>'}
                  ${!a.assigned ? `<button onclick="admin.deleteAllocation(${nodeId}, ${a.id})" class="text-slate-500 hover:text-rose-400 ml-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  async handleBatchGeneratePorts(nodeId) {
    const startPort = document.getElementById('alloc-start-port').value;
    const endPort = document.getElementById('alloc-end-port').value;
    if (!startPort || !endPort) return;

    try {
      const data = await app.api(`/api/admin/nodes/${nodeId}/allocations`, {
        method: 'POST',
        body: JSON.stringify({ startPort, endPort })
      });
      if (data.success) {
        app.toast(data.message, 'success');
        this.loadNodeAllocations(nodeId);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteAllocation(nodeId, allocId) {
    try {
      const data = await app.api(`/api/admin/nodes/${nodeId}/allocations/${allocId}`, { method: 'DELETE' });
      if (data.success) {
        this.loadNodeAllocations(nodeId);
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // 5. Locations View
  async renderLocationsView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Infrastructure</span>
            <h2 class="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <i data-lucide="map-pin" class="w-5 h-5 text-purple-400"></i> Locations (Auto / Custom)
            </h2>
            <p class="text-xs text-slate-400">Organize node regions and data centers</p>
          </div>
          <button onclick="admin.showCreateLocationModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Location
          </button>
        </div>

        <div id="locations-list" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-8 text-slate-400">Loading locations...</div>
        </div>
      </div>
    `;

    try {
      const data = await app.api('/api/admin/locations');
      const locs = data.locations || [];
      const list = document.getElementById('locations-list');

      if (locs.length === 0) {
        list.innerHTML = `<div class="glass-card p-8 rounded-2xl text-center col-span-full border border-dashed border-white/20 text-slate-400 text-xs">No locations created yet.</div>`;
      } else {
        list.innerHTML = locs.map(l => `
          <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400">${l.short_code}</span>
                <h4 class="text-sm font-bold text-white mt-1">${l.name}</h4>
                <p class="text-[11px] text-slate-400">${l.description || 'No description'}</p>
              </div>
              <button onclick="admin.deleteLocation(${l.id})" class="text-slate-500 hover:text-rose-400 text-xs">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex justify-between">
              <span>Nodes attached:</span>
              <span class="font-bold text-white">${l.node_count || 0}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  showCreateLocationModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="map-pin" class="w-5 h-5 text-cyan-400"></i> Add New Location
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Short Code (e.g. us-east)</label>
            <input type="text" id="loc-code" placeholder="us-east-1" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Location Name</label>
            <input type="text" id="loc-name" placeholder="North Virginia DC" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <input type="text" id="loc-desc" placeholder="Primary Datacenter" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="admin.handleCreateLocation()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Save Location</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateLocation() {
    const short_code = document.getElementById('loc-code').value.trim();
    const name = document.getElementById('loc-name').value.trim();
    const description = document.getElementById('loc-desc').value.trim();

    try {
      const data = await app.api('/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({ short_code, name, description })
      });
      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Location created!', 'success');
        this.renderLocationsView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteLocation(locId) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const data = await app.api(`/api/admin/locations/${locId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('Location deleted.', 'info');
        this.renderLocationsView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  // 6. Panel API Keys View
  async renderApiKeysView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Integrations</span>
            <h2 class="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <i data-lucide="key" class="w-5 h-5 text-purple-400"></i> Panel API Keys (Port 3003)
            </h2>
            <p class="text-xs text-slate-400">Generate secure API tokens for WHMCS billing, Discord bots, and automated scripts</p>
          </div>
          <button onclick="admin.showCreateApiKeyModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Create API Key
          </button>
        </div>

        <div id="new-key-alert-box" class="hidden"></div>

        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th class="px-5 py-3">Description</th>
                <th class="px-5 py-3">Key Token</th>
                <th class="px-5 py-3">Last Used</th>
                <th class="px-5 py-3">Created</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="api-keys-tbody" class="divide-y divide-white/5">
              <tr><td colspan="5" class="text-center py-8 text-slate-500">Loading API keys...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const data = await app.api('/api/admin/api-keys');
      const keys = data.keys || [];
      const tbody = document.getElementById('api-keys-tbody');

      if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">No API keys generated yet.</td></tr>`;
      } else {
        tbody.innerHTML = keys.map(k => `
          <tr class="hover:bg-white/5 transition">
            <td class="px-5 py-3 font-semibold text-white">${k.description}</td>
            <td class="px-5 py-3 font-mono text-cyan-400">${k.key_token}</td>
            <td class="px-5 py-3 text-slate-400">${k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
            <td class="px-5 py-3 text-slate-400">${new Date(k.created_at).toLocaleDateString()}</td>
            <td class="px-5 py-3 text-right">
              <button onclick="admin.deleteApiKey(${k.id})" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs">
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

  showCreateApiKeyModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="key" class="w-5 h-5 text-cyan-400"></i> Generate Panel API Token
          </h3>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Description / Identifier</label>
            <input type="text" id="api-key-desc" placeholder="WHMCS Integration / Discord Bot" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="admin.handleCreateApiKey()" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Generate Token</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleCreateApiKey() {
    const description = document.getElementById('api-key-desc').value.trim();
    if (!description) return;

    try {
      const data = await app.api('/api/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify({ description })
      });

      if (data.success && data.key) {
        document.getElementById('modal-container').innerHTML = '';
        const alertBox = document.getElementById('new-key-alert-box');
        if (alertBox) {
          alertBox.classList.remove('hidden');
          alertBox.innerHTML = `
            <div class="bg-cyan-500/15 p-4 rounded-2xl border border-cyan-500/30 text-xs space-y-2">
              <p class="font-bold text-cyan-300">🔑 Copy your new API Token (it will not be displayed again):</p>
              <div class="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl font-mono text-white text-xs select-all">
                <span class="flex-1 truncate">${data.key.key_token}</span>
                <button onclick="app.copyToClipboard('${data.key.key_token}')" class="text-cyan-400 hover:text-white"><i data-lucide="copy" class="w-4 h-4"></i></button>
              </div>
            </div>
          `;
          if (window.lucide) lucide.createIcons();
        }
        app.toast('API Key generated successfully!', 'success');
        this.renderApiKeysView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteApiKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const data = await app.api(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
      if (data.success) {
        app.toast('API Key revoked.', 'info');
        this.renderApiKeysView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }
  async showEditServerModal(serverId) {
    const modalContainer = document.getElementById('modal-container');
    try {
      const data = await app.api(`/api/servers/${serverId}`);
      const s = data.server;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div class="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
            <div class="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="sliders" class="w-5 h-5 text-purple-400"></i> Edit Build Configuration: ${s.name}
              </h3>
              <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <form onsubmit="admin.handleEditServer(event, ${s.id})" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Server Name</label>
                <input type="text" id="edit-srv-name" value="${s.name}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Memory (MB)</label>
                  <input type="number" id="edit-srv-ram" value="${s.memory_mb || 1024}" min="256" step="256" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">CPU Limit (%)</label>
                  <input type="number" id="edit-srv-cpu" value="${s.cpu_limit || 100}" min="10" step="10" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Disk Limit (MB)</label>
                  <input type="number" id="edit-srv-disk" value="${s.disk_mb || 5120}" min="500" step="500" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Startup Command</label>
                <input type="text" id="edit-srv-cmd" value="${s.startup_cmd || ''}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Docker Image</label>
                <input type="text" id="edit-srv-img" value="${s.docker_image || ''}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
              </div>

              <div class="flex gap-2 pt-2">
                <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
                <button type="submit" class="btn-cyber flex-1 py-2 rounded-xl text-xs font-semibold">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleEditServer(e, serverId) {
    e.preventDefault();
    const name = document.getElementById('edit-srv-name').value.trim();
    const memory_mb = parseInt(document.getElementById('edit-srv-ram').value, 10);
    const cpu_limit = parseInt(document.getElementById('edit-srv-cpu').value, 10);
    const disk_mb = parseInt(document.getElementById('edit-srv-disk').value, 10);
    const startup_cmd = document.getElementById('edit-srv-cmd').value.trim();
    const docker_image = document.getElementById('edit-srv-img').value.trim();

    try {
      const data = await app.api(`/api/servers/${serverId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, memory_mb, cpu_limit, disk_mb, startup_cmd, docker_image })
      });
      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Server configuration updated!', 'success');
        this.renderServersView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }
}

window.admin = new AdminManager();
