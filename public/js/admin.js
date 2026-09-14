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

      const elServers = document.getElementById('adm-stat-servers');
      if (elServers) elServers.innerText = serversRes.servers?.length || 0;
      const elUsers = document.getElementById('adm-stat-users');
      if (elUsers) elUsers.innerText = usersRes.users?.length || 0;
      const elNodes = document.getElementById('adm-stat-nodes');
      if (elNodes) elNodes.innerText = nodesRes.nodes?.length || 0;

      const totalAllocs = nodesRes.nodes?.reduce((acc, n) => acc + (n.total_allocations || 0), 0) || 0;
      const elAllocs = document.getElementById('adm-stat-allocs');
      if (elAllocs) elAllocs.innerText = totalAllocs;
      const elDocker = document.getElementById('adm-docker-status');
      if (elDocker) elDocker.innerText = 'CONNECTED';
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  // 2. Server Management View
  // 2. SERVERS & SERVER ACCOUNTS MONITOR
  async renderServersView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="space-y-8 pb-12">
        <!-- Top Header Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span class="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">SERVERS</span>
            </h1>
            <p class="text-xs text-slate-400 mt-1 font-medium">Manage and monitor all your servers</p>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <button onclick="admin.renderServersView()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition" title="Refresh Tables">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
            <button onclick="admin.showCreateUserModal()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition shadow-sm">
              <i data-lucide="user-plus" class="w-4 h-4 text-purple-400"></i> + Add User
            </button>
            <button onclick="admin.showCreateServerModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> + Deploy New
            </button>
          </div>
        </div>

        <!-- ──────────────────────────────────────── -->
        <!-- 1. Server Section -->
        <!-- ──────────────────────────────────────── -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <i data-lucide="server" class="w-4 h-4"></i>
              </div>
              <h3 class="text-base font-bold text-white tracking-wide">Server</h3>
              <span id="adm-servers-count-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Loading...</span>
            </div>
          </div>

          <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th class="px-4 py-3">Server Name</th>
                    <th class="px-4 py-3">IP Address</th>
                    <th class="px-4 py-3">User</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Resources</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="adm-servers-tbody" class="divide-y divide-white/5">
                  <tr><td colspan="6" class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400"></i>Loading servers...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────── -->
        <!-- 2. User Account Section -->
        <!-- ──────────────────────────────────────── -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <i data-lucide="users" class="w-4 h-4"></i>
              </div>
              <h3 class="text-base font-bold text-white tracking-wide">User Account</h3>
              <span id="adm-users-count-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Loading...</span>
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
                <tbody id="adm-users-tbody" class="divide-y divide-white/5">
                  <tr><td colspan="5" class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400"></i>Loading user accounts...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    try {
      const [serversRes, usersRes] = await Promise.all([
        app.api('/api/servers'),
        app.api('/api/admin/users')
      ]);

      const servers = serversRes.servers || [];
      const users = usersRes.users || [];

      // Update count badges
      const srvBadge = document.getElementById('adm-servers-count-badge');
      if (srvBadge) srvBadge.innerText = `${servers.length} ${servers.length === 1 ? 'Server' : 'Servers'}`;
      const usrBadge = document.getElementById('adm-users-count-badge');
      if (usrBadge) usrBadge.innerText = `${users.length} ${users.length === 1 ? 'Account' : 'Accounts'}`;

      // Build user-to-servers map
      const userServersMap = {};
      servers.forEach(s => {
        const uid = s.user_id;
        if (!userServersMap[uid]) userServersMap[uid] = [];
        userServersMap[uid].push(s);
      });

      // ----------------------------------------------------------------------
      // Populate Server Table
      // ----------------------------------------------------------------------
      const srvTbody = document.getElementById('adm-servers-tbody');
      if (srvTbody) {
        if (servers.length === 0) {
          srvTbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center py-12 text-slate-500">
                <i data-lucide="server-off" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                <p class="text-sm font-semibold text-slate-300">No servers deployed yet</p>
                <button onclick="admin.showCreateServerModal()" class="btn-cyber px-3 py-1.5 rounded-xl text-xs mt-3 font-bold">+ Deploy New Server</button>
              </td>
            </tr>
          `;
        } else {
          srvTbody.innerHTML = servers.map(s => {
            const isSuspended = !!s.is_suspended || s.status === 'suspended';
            const isRunning = !isSuspended && s.status === 'running';

            let expBadge = '';
            if (s.expiration_date) {
              const expDate = new Date(s.expiration_date);
              const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24));
              if (diffDays <= 0) {
                expBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Expired</span>';
              } else if (diffDays <= 3) {
                expBadge = `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">${diffDays}d left</span>`;
              } else {
                expBadge = `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 border border-white/5">${diffDays}d left</span>`;
              }
            }

            const statusHTML = isSuspended
              ? `<div class="flex items-center gap-1.5"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>SUSPENDED</span>${expBadge}</div>`
              : (isRunning
                ? `<div class="flex items-center gap-1.5"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>RUNNING</span>${expBadge}</div>`
                : `<div class="flex items-center gap-1.5"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5"><span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>OFFLINE</span>${expBadge}</div>`);

            const fullAddr = `${s.ip || '127.0.0.1'}:${s.port || 25565}`;
            const ramFmt = s.memory_mb >= 1024 ? (s.memory_mb / 1024).toFixed(1) + ' GiB' : s.memory_mb + ' MB';

            return `
              <tr class="hover:bg-white/5 transition-colors">
                <!-- Server Name -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                      <i data-lucide="${s.server_type === 'minecraft' ? 'box' : 'terminal'}" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-white hover:text-cyan-300 cursor-pointer truncate max-w-xs transition text-xs" onclick="app.navigate('server-manage/${s.id}/console')">
                        ${app.escapeHtml(s.name)}
                      </div>
                      <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span class="text-slate-500">#${s.id}</span>
                        <span>•</span>
                        <span class="px-1 rounded bg-white/5 text-[9px] uppercase">${app.escapeHtml(s.server_type)}</span>
                        <span>•</span>
                        <span class="text-slate-500 truncate max-w-[90px]">${s.uuid.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- IP Address -->
                <td class="px-4 py-3 font-mono">
                  <div class="flex items-center gap-1.5">
                    <span class="text-cyan-300 font-semibold text-xs">${fullAddr}</span>
                    <button onclick="navigator.clipboard.writeText('${fullAddr}'); app.playSound('copy'); app.toast('Copied address: ${fullAddr}', 'info');" class="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition" title="Copy Address">
                      <i data-lucide="copy" class="w-3 h-3"></i>
                    </button>
                  </div>
                </td>

                <!-- User (Owner) -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-400 uppercase shrink-0">
                      ${(s.owner_username || 'A').substring(0, 1)}
                    </div>
                    <div class="min-w-0">
                      <span class="font-semibold text-slate-200 block text-xs truncate">${app.escapeHtml(s.owner_username || 'Admin')}</span>
                      ${s.owner_email ? `<span class="text-[10px] text-slate-500 block truncate font-mono">${app.escapeHtml(s.owner_email)}</span>` : ''}
                    </div>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  ${statusHTML}
                </td>

                <!-- Resources -->
                <td class="px-4 py-3 font-mono">
                  <div class="space-y-0.5 text-[11px]">
                    <div class="text-cyan-300 font-bold">${ramFmt} RAM</div>
                    <div class="text-slate-400 text-[10px]">${s.cpu_limit || 100}% CPU • ${s.disk_mb || 1000} MB Disk</div>
                  </div>
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <button onclick="app.navigate('server-manage/${s.id}/console')" class="btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm" title="Manage Console">
                      <i data-lucide="terminal" class="w-3 h-3"></i> Manage
                    </button>
                    <button onclick="admin.toggleServerSuspension(${s.id})" title="${isSuspended ? 'Unsuspend Server' : 'Suspend Server'}" class="p-1.5 rounded-lg border transition ${isSuspended ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' : 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border-white/10'}">
                      <i data-lucide="${isSuspended ? 'unlock' : 'lock'}" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="admin.showEditServerModal(${s.id})" title="Edit Configuration" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition">
                      <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="admin.deleteServer(${s.id}, '${app.escapeHtml(s.name)}')" title="Delete Server" class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      // ----------------------------------------------------------------------
      // Populate User Account Table
      // ----------------------------------------------------------------------
      const usrTbody = document.getElementById('adm-users-tbody');
      if (usrTbody) {
        if (users.length === 0) {
          usrTbody.innerHTML = `
            <tr>
              <td colspan="5" class="text-center py-12 text-slate-500">
                <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                <p class="text-sm font-semibold text-slate-300">No user accounts found</p>
                <button onclick="admin.showCreateUserModal()" class="px-3 py-1.5 rounded-xl text-xs mt-3 font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">+ Add User Account</button>
              </td>
            </tr>
          `;
        } else {
          usrTbody.innerHTML = users.map(u => {
            const userServers = userServersMap[u.id] || [];
            const isAdm = u.role === 'admin';
            const isSuspended = !!u.suspended;

            let serverAccessHTML = '';
            if (userServers.length === 0) {
              serverAccessHTML = `<span class="text-slate-500 font-mono text-[11px]">0 Servers</span>`;
            } else {
              serverAccessHTML = `
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ${userServers.length} ${userServers.length === 1 ? 'Server' : 'Servers'}
                  </span>
                  ${userServers.map(srv => `
                    <button onclick="app.navigate('server-manage/${srv.id}/console')" class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition inline-flex items-center gap-1">
                      <i data-lucide="hard-drive" class="w-2.5 h-2.5 text-cyan-400"></i> ${app.escapeHtml(srv.name)}
                    </button>
                  `).join('')}
                </div>
              `;
            }

            return `
              <tr class="hover:bg-white/5 transition-colors">
                <!-- Username -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      ${(u.username || 'U').substring(0, 1)}
                    </div>
                    <div class="min-w-0">
                      <span class="font-bold text-white block text-xs truncate">${app.escapeHtml(u.username)}</span>
                      <span class="text-[10px] font-mono text-slate-500">UID #${u.id}</span>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-4 py-3 font-mono">
                  <div class="flex items-center gap-1.5">
                    <span class="text-slate-300 text-xs truncate max-w-xs">${app.escapeHtml(u.email)}</span>
                    <button onclick="navigator.clipboard.writeText('${app.escapeHtml(u.email)}'); app.toast('Copied email: ${app.escapeHtml(u.email)}', 'info');" class="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition" title="Copy Email">
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
                    ${isSuspended
                      ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">SUSPENDED</span>'
                      : '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">ACTIVE</span>'}
                  </div>
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <button onclick="admin.toggleSuspendUser(${u.id})" class="p-1.5 rounded-lg border transition ${isSuspended ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-400 border-white/10'}" title="${isSuspended ? 'Unsuspend Account' : 'Suspend Account'}">
                      <i data-lucide="${isSuspended ? 'check' : 'slash'}" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="admin.showResetPasswordModal(${u.id}, '${app.escapeHtml(u.username)}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-white/10 transition" title="Reset Password">
                      <i data-lucide="key" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="admin.deleteUser(${u.id})" class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition" title="Delete Account">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.error('Error rendering servers & accounts view:', err);
      app.toast('Failed to load server and account data: ' + err.message, 'error');
    }

    if (window.lucide) lucide.createIcons();
  }

  // Helper methods for auto-generated server naming & resource conversions
  generateServerName(type = 'minecraft') {
    const prefixes = ['Apex', 'Cyber', 'Vortex', 'Shadow', 'Titan', 'Nova', 'Pulse', 'Frost', 'Iron', 'Echo', 'Nebula', 'Quantum', 'Hyper', 'Blaze', 'Mythic', 'Obsidian', 'Arix'];
    const mcSuffixes = ['SMP', 'Craft', 'Realms', 'Node', 'Zone', 'Hub', 'Grid', 'World', 'Legends'];
    const nodeSuffixes = ['App', 'Bot', 'API', 'Worker', 'Service', 'Server'];
    const pySuffixes = ['Bot', 'AI', 'Script', 'Engine', 'Worker', 'Service'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let suffix = mcSuffixes[Math.floor(Math.random() * mcSuffixes.length)];
    if (type === 'nodejs') suffix = nodeSuffixes[Math.floor(Math.random() * nodeSuffixes.length)];
    if (type === 'python') suffix = pySuffixes[Math.floor(Math.random() * pySuffixes.length)];

    const num = Math.floor(10 + Math.random() * 90);
    return `${prefix}-${suffix}-${num}`;
  }

  generateServerDesc(type = 'minecraft', engine = 'Paper', ver = '1.21.4') {
    if (type === 'nodejs') return `Ultra-fast Node.js application container with automated process supervisor.`;
    if (type === 'python') return `Low-latency Python application container with automatic runtime environments.`;
    return `High-performance ${engine || 'Minecraft'} ${ver || '1.21.4'} server instance with auto-suspension telemetry.`;
  }

  regenerateDeployServerName() {
    const typeInput = document.querySelector('input[name="create_srv_type"]:checked');
    const type = typeInput ? typeInput.value : 'minecraft';
    const nameInput = document.getElementById('srv-create-name');
    const tag = document.getElementById('srv-name-mode-tag');
    if (nameInput) {
      nameInput.value = this.generateServerName(type);
      if (tag) tag.innerText = 'Default Auto';
    }
  }

  regenerateDeployServerDesc() {
    const typeInput = document.querySelector('input[name="create_srv_type"]:checked');
    const type = typeInput ? typeInput.value : 'minecraft';
    const engine = document.getElementById('mc-jar-type')?.value || 'Paper';
    const ver = document.getElementById('mc-jar-version')?.value || '1.21.4';
    const descInput = document.getElementById('srv-create-desc');
    const tag = document.getElementById('srv-desc-mode-tag');
    if (descInput) {
      descInput.value = this.generateServerDesc(type, engine, ver);
      if (tag) tag.innerText = 'Default Auto';
    }
  }

  onServerNameInput() {
    const tag = document.getElementById('srv-name-mode-tag');
    if (tag) tag.innerText = 'Custom';
  }

  onServerDescInput() {
    const tag = document.getElementById('srv-desc-mode-tag');
    if (tag) tag.innerText = 'Custom';
  }

  setDeployRamUnit(unit) {
    this.deployRamUnit = unit;
    const input = document.getElementById('srv-create-ram-val');
    const btnGb = document.getElementById('btn-ram-unit-gb');
    const btnMb = document.getElementById('btn-ram-unit-mb');
    const presets = document.getElementById('ram-presets-container');
    if (!input) return;

    let val = parseFloat(input.value) || 2;
    if (unit === 'GB') {
      if (val > 128) val = Math.max(0.5, Math.round(val / 1024 * 10) / 10);
      input.value = val;
      input.min = "0.25";
      input.max = "128";
      if (btnGb) btnGb.className = "px-2 py-0.5 rounded-md transition bg-cyan-500 text-black shadow font-bold";
      if (btnMb) btnMb.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployRamValue(1)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">1 GB</button>
          <button type="button" onclick="admin.setDeployRamValue(2)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition">2 GB</button>
          <button type="button" onclick="admin.setDeployRamValue(4)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">4 GB</button>
          <button type="button" onclick="admin.setDeployRamValue(8)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">8 GB</button>
        `;
      }
    } else {
      if (val <= 128) val = Math.round(val * 1024);
      input.value = val;
      input.min = "256";
      input.max = "131072";
      if (btnMb) btnMb.className = "px-2 py-0.5 rounded-md transition bg-cyan-500 text-black shadow font-bold";
      if (btnGb) btnGb.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployRamValue(1024)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">1024 MB</button>
          <button type="button" onclick="admin.setDeployRamValue(2048)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition">2048 MB</button>
          <button type="button" onclick="admin.setDeployRamValue(4096)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">4096 MB</button>
          <button type="button" onclick="admin.setDeployRamValue(8192)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">8192 MB</button>
        `;
      }
    }
    this.updateDeployResourceSummary();
  }

  setDeployRamValue(val) {
    const input = document.getElementById('srv-create-ram-val');
    if (input) {
      input.value = val;
      this.updateDeployResourceSummary();
    }
  }

  setDeployCpuUnit(unit) {
    this.deployCpuUnit = unit;
    const input = document.getElementById('srv-create-cpu-val');
    const btnPct = document.getElementById('btn-cpu-unit-pct');
    const btnCores = document.getElementById('btn-cpu-unit-cores');
    const presets = document.getElementById('cpu-presets-container');
    if (!input) return;

    let val = parseFloat(input.value) || 100;
    if (unit === '%') {
      if (val <= 32) val = Math.round(val * 100);
      input.value = val;
      input.min = "10";
      input.max = "1600";
      if (btnPct) btnPct.className = "px-2 py-0.5 rounded-md transition bg-purple-600 text-white shadow font-bold";
      if (btnCores) btnCores.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployCpuValue(50)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">50%</button>
          <button type="button" onclick="admin.setDeployCpuValue(100)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold transition">100%</button>
          <button type="button" onclick="admin.setDeployCpuValue(200)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">200%</button>
          <button type="button" onclick="admin.setDeployCpuValue(400)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">400%</button>
        `;
      }
    } else {
      if (val > 32) val = Math.max(0.25, Math.round(val / 100 * 10) / 10);
      input.value = val;
      input.min = "0.25";
      input.max = "16";
      if (btnCores) btnCores.className = "px-2 py-0.5 rounded-md transition bg-purple-600 text-white shadow font-bold";
      if (btnPct) btnPct.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployCpuValue(0.5)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">0.5 Core</button>
          <button type="button" onclick="admin.setDeployCpuValue(1)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold transition">1 Core</button>
          <button type="button" onclick="admin.setDeployCpuValue(2)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">2 Cores</button>
          <button type="button" onclick="admin.setDeployCpuValue(4)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">4 Cores</button>
        `;
      }
    }
    this.updateDeployResourceSummary();
  }

  setDeployCpuValue(val) {
    const input = document.getElementById('srv-create-cpu-val');
    if (input) {
      input.value = val;
      this.updateDeployResourceSummary();
    }
  }

  setDeployDiskUnit(unit) {
    this.deployDiskUnit = unit;
    const input = document.getElementById('srv-create-disk-val');
    const btnGb = document.getElementById('btn-disk-unit-gb');
    const btnMb = document.getElementById('btn-disk-unit-mb');
    const presets = document.getElementById('disk-presets-container');
    if (!input) return;

    let val = parseFloat(input.value) || 10;
    if (unit === 'GB') {
      if (val > 500) val = Math.max(1, Math.round(val / 1024 * 10) / 10);
      input.value = val;
      input.min = "0.5";
      input.max = "500";
      if (btnGb) btnGb.className = "px-2 py-0.5 rounded-md transition bg-indigo-600 text-white shadow font-bold";
      if (btnMb) btnMb.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployDiskValue(5)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">5 GB</button>
          <button type="button" onclick="admin.setDeployDiskValue(10)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold transition">10 GB</button>
          <button type="button" onclick="admin.setDeployDiskValue(25)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">25 GB</button>
          <button type="button" onclick="admin.setDeployDiskValue(50)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">50 GB</button>
        `;
      }
    } else {
      if (val <= 500) val = Math.round(val * 1024);
      input.value = val;
      input.min = "512";
      input.max = "512000";
      if (btnMb) btnMb.className = "px-2 py-0.5 rounded-md transition bg-indigo-600 text-white shadow font-bold";
      if (btnGb) btnGb.className = "px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white";
      if (presets) {
        presets.innerHTML = `
          <button type="button" onclick="admin.setDeployDiskValue(5120)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">5120 MB</button>
          <button type="button" onclick="admin.setDeployDiskValue(10240)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold transition">10240 MB</button>
          <button type="button" onclick="admin.setDeployDiskValue(25600)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">25600 MB</button>
          <button type="button" onclick="admin.setDeployDiskValue(51200)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">51200 MB</button>
        `;
      }
    }
    this.updateDeployResourceSummary();
  }

  setDeployDiskValue(val) {
    const input = document.getElementById('srv-create-disk-val');
    if (input) {
      input.value = val;
      this.updateDeployResourceSummary();
    }
  }

  updateDeployResourceSummary() {
    const ramInput = document.getElementById('srv-create-ram-val');
    const cpuInput = document.getElementById('srv-create-cpu-val');
    const diskInput = document.getElementById('srv-create-disk-val');

    const ramEquiv = document.getElementById('ram-equiv-tag');
    if (ramInput && ramEquiv) {
      const v = parseFloat(ramInput.value) || 0;
      if (this.deployRamUnit === 'GB') {
        ramEquiv.innerHTML = `<span>Allocation:</span><span class="text-cyan-400 font-bold">${Math.round(v * 1024)} MB</span>`;
      } else {
        ramEquiv.innerHTML = `<span>Allocation:</span><span class="text-cyan-400 font-bold">${(v / 1024).toFixed(1)} GB</span>`;
      }
    }

    const cpuEquiv = document.getElementById('cpu-equiv-tag');
    if (cpuInput && cpuEquiv) {
      const v = parseFloat(cpuInput.value) || 0;
      if (this.deployCpuUnit === '%') {
        cpuEquiv.innerHTML = `<span>Allocation:</span><span class="text-purple-400 font-bold">${(v / 100).toFixed(1)} Cores</span>`;
      } else {
        cpuEquiv.innerHTML = `<span>Allocation:</span><span class="text-purple-400 font-bold">${Math.round(v * 100)}%</span>`;
      }
    }

    const diskEquiv = document.getElementById('disk-equiv-tag');
    if (diskInput && diskEquiv) {
      const v = parseFloat(diskInput.value) || 0;
      if (this.deployDiskUnit === 'GB') {
        diskEquiv.innerHTML = `<span>Allocation:</span><span class="text-indigo-400 font-bold">${Math.round(v * 1024)} MB</span>`;
      } else {
        diskEquiv.innerHTML = `<span>Allocation:</span><span class="text-indigo-400 font-bold">${(v / 1024).toFixed(1)} GB</span>`;
      }
    }
  }

  // Show Server Creation Wizard (with MCJars integration & Docker templates)
  async showCreateServerModal() {
    const modalContainer = document.getElementById('modal-container');

    // Fetch registered users for User Access / Server Access assignment
    let users = [];
    if (app.user?.role === 'admin') {
      try {
        const uRes = await app.api('/api/admin/users');
        users = uRes.users || [];
      } catch (e) {
        console.warn('Could not load users for deploy modal:', e);
      }
    }

    this.deployRamUnit = 'GB';
    this.deployCpuUnit = '%';
    this.deployDiskUnit = 'GB';

    const initialName = this.generateServerName('minecraft');
    const initialDesc = this.generateServerDesc('minecraft', 'Paper', '1.21.4');

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
            <!-- 1. User Access / Server Access -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="user-check" class="w-3.5 h-3.5 text-cyan-400"></i> User Access / Server Access
                </span>
                <span class="text-[10px] text-slate-400">Assign server ownership & client access</span>
              </label>
              ${app.user?.role === 'admin' && users.length > 0 ? `
                <select id="srv-create-user-id" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
                  ${users.map(u => `
                    <option value="${u.id}" ${u.id === (app.user?.id || 1) ? 'selected' : ''}>
                      ${app.escapeHtml(u.username)} (${app.escapeHtml(u.email)}) - UID #${u.id} [${u.role.toUpperCase()}]
                    </option>
                  `).join('')}
                </select>
              ` : `
                <input type="hidden" id="srv-create-user-id" value="${app.user?.id || 1}">
                <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Self Assigned: <strong>${app.escapeHtml(app.user?.username || 'Current User')}</strong></span>
                  </span>
                  <span class="text-[10px] font-mono text-slate-500">UID #${app.user?.id || 1}</span>
                </div>
              `}
            </div>

            <!-- 2. Server Type Selector -->
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

            <!-- 3. Server Name & Description (Default auto generate or custom) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Server Name -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Server Name</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" id="srv-name-mode-tag">Default Auto</span>
                  </label>
                  <button type="button" onclick="admin.regenerateDeployServerName()" class="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition" title="Auto Generate Name">
                    <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Generate
                  </button>
                </div>
                <div class="relative">
                  <input type="text" id="srv-create-name" value="${initialName}" placeholder="Server name" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs pr-8 font-semibold text-white" required oninput="admin.onServerNameInput()">
                  <button type="button" onclick="admin.regenerateDeployServerName()" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-cyan-400 transition" title="Reroll name">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <!-- Server Description -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Server Description</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30" id="srv-desc-mode-tag">Default Auto</span>
                  </label>
                  <button type="button" onclick="admin.regenerateDeployServerDesc()" class="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition" title="Auto Generate Description">
                    <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Generate
                  </button>
                </div>
                <div class="relative">
                  <input type="text" id="srv-create-desc" value="${initialDesc}" placeholder="Server description" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs pr-8" oninput="admin.onServerDescInput()">
                  <button type="button" onclick="admin.regenerateDeployServerDesc()" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-purple-400 transition" title="Reroll description">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
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

            <!-- 4. Build Resources Limit (Memory, CPU, Disk) with Default Units & Step Fix -->
            <div class="space-y-3 pt-1">
              <label class="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="sliders" class="w-3.5 h-3.5 text-cyan-400"></i> Resource Allocations & Limits
                </span>
                <span class="text-[10px] text-slate-400">Default or Custom Units</span>
              </label>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <!-- Memory (RAM) Card - Default GB -->
                <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <i data-lucide="cpu" class="w-3.5 h-3.5 text-cyan-400"></i> Memory
                    </span>
                    <!-- Unit Switcher: Default GB -->
                    <div class="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-bold font-mono">
                      <button type="button" onclick="admin.setDeployRamUnit('GB')" id="btn-ram-unit-gb" class="px-2 py-0.5 rounded-md transition bg-cyan-500 text-black shadow font-bold">GB</button>
                      <button type="button" onclick="admin.setDeployRamUnit('MB')" id="btn-ram-unit-mb" class="px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white">MB</button>
                    </div>
                  </div>

                  <div>
                    <input type="number" id="srv-create-ram-val" value="2" min="0.25" max="128" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono font-bold text-cyan-300" required oninput="admin.updateDeployResourceSummary()">
                  </div>

                  <!-- Quick Presets -->
                  <div id="ram-presets-container" class="flex flex-wrap gap-1">
                    <button type="button" onclick="admin.setDeployRamValue(1)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">1 GB</button>
                    <button type="button" onclick="admin.setDeployRamValue(2)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition">2 GB</button>
                    <button type="button" onclick="admin.setDeployRamValue(4)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">4 GB</button>
                    <button type="button" onclick="admin.setDeployRamValue(8)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">8 GB</button>
                  </div>
                  <div id="ram-equiv-tag" class="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                    <span>Allocation:</span>
                    <span class="text-cyan-400 font-bold">2048 MB</span>
                  </div>
                </div>

                <!-- CPU Limit Card - Default % -->
                <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <i data-lucide="activity" class="w-3.5 h-3.5 text-purple-400"></i> CPU Limit
                    </span>
                    <!-- Unit Switcher: Default % -->
                    <div class="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-bold font-mono">
                      <button type="button" onclick="admin.setDeployCpuUnit('%')" id="btn-cpu-unit-pct" class="px-2 py-0.5 rounded-md transition bg-purple-600 text-white shadow font-bold">%</button>
                      <button type="button" onclick="admin.setDeployCpuUnit('cores')" id="btn-cpu-unit-cores" class="px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white">Cores</button>
                    </div>
                  </div>

                  <div>
                    <input type="number" id="srv-create-cpu-val" value="100" min="10" max="1600" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono font-bold text-purple-300" required oninput="admin.updateDeployResourceSummary()">
                  </div>

                  <!-- Quick Presets -->
                  <div id="cpu-presets-container" class="flex flex-wrap gap-1">
                    <button type="button" onclick="admin.setDeployCpuValue(50)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">50%</button>
                    <button type="button" onclick="admin.setDeployCpuValue(100)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold transition">100%</button>
                    <button type="button" onclick="admin.setDeployCpuValue(200)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">200%</button>
                    <button type="button" onclick="admin.setDeployCpuValue(400)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">400%</button>
                  </div>
                  <div id="cpu-equiv-tag" class="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                    <span>Allocation:</span>
                    <span class="text-purple-400 font-bold">1.0 Core</span>
                  </div>
                </div>

                <!-- Disk Limit Card - Default GB -->
                <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <i data-lucide="hard-drive" class="w-3.5 h-3.5 text-indigo-400"></i> Disk Limit
                    </span>
                    <!-- Unit Switcher: Default GB -->
                    <div class="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-bold font-mono">
                      <button type="button" onclick="admin.setDeployDiskUnit('GB')" id="btn-disk-unit-gb" class="px-2 py-0.5 rounded-md transition bg-indigo-600 text-white shadow font-bold">GB</button>
                      <button type="button" onclick="admin.setDeployDiskUnit('MB')" id="btn-disk-unit-mb" class="px-2 py-0.5 rounded-md transition text-slate-400 hover:text-white">MB</button>
                    </div>
                  </div>

                  <div>
                    <input type="number" id="srv-create-disk-val" value="10" min="0.5" max="500" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono font-bold text-indigo-300" required oninput="admin.updateDeployResourceSummary()">
                  </div>

                  <!-- Quick Presets -->
                  <div id="disk-presets-container" class="flex flex-wrap gap-1">
                    <button type="button" onclick="admin.setDeployDiskValue(5)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">5 GB</button>
                    <button type="button" onclick="admin.setDeployDiskValue(10)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold transition">10 GB</button>
                    <button type="button" onclick="admin.setDeployDiskValue(25)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">25 GB</button>
                    <button type="button" onclick="admin.setDeployDiskValue(50)" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition">50 GB</button>
                  </div>
                  <div id="disk-equiv-tag" class="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                    <span>Allocation:</span>
                    <span class="text-indigo-400 font-bold">10240 MB</span>
                  </div>
                </div>
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

  filterDeployQuickVersions(filter) {
    this.deployVerFilter = (filter || '').trim();
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
    // Update description if in auto mode
    const tag = document.getElementById('srv-desc-mode-tag');
    if (tag && tag.innerText === 'Default Auto') {
      const typeInput = document.querySelector('input[name="create_srv_type"]:checked');
      const type = typeInput ? typeInput.value : 'minecraft';
      const engine = document.getElementById('mc-jar-type')?.value || 'Paper';
      const descInput = document.getElementById('srv-create-desc');
      if (descInput) descInput.value = this.generateServerDesc(type, engine, version);
    }
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

    // If name and description are still in Auto mode, regenerate them
    const nameTag = document.getElementById('srv-name-mode-tag');
    if (nameTag && nameTag.innerText === 'Default Auto') {
      const nameInput = document.getElementById('srv-create-name');
      if (nameInput) nameInput.value = this.generateServerName(type);
    }
    const descTag = document.getElementById('srv-desc-mode-tag');
    if (descTag && descTag.innerText === 'Default Auto') {
      const descInput = document.getElementById('srv-create-desc');
      if (descInput) descInput.value = this.generateServerDesc(type);
    }
  }

  async handleCreateServer(e) {
    e.preventDefault();
    const typeInput = document.querySelector('input[name="create_srv_type"]:checked');
    const server_type = typeInput ? typeInput.value : 'minecraft';
    const name = document.getElementById('srv-create-name').value.trim();
    const description = document.getElementById('srv-create-desc').value.trim();
    const docker_image = document.getElementById('srv-docker-image').value;

    // Convert values based on active unit (Memory: default GB, CPU: default %, Disk: default GB)
    const ramVal = parseFloat(document.getElementById('srv-create-ram-val')?.value) || 2;
    const memory_mb = (this.deployRamUnit === 'GB') ? Math.round(ramVal * 1024) : Math.round(ramVal);

    const cpuVal = parseFloat(document.getElementById('srv-create-cpu-val')?.value) || 100;
    const cpu_limit = (this.deployCpuUnit === 'cores') ? Math.round(cpuVal * 100) : Math.round(cpuVal);

    const diskVal = parseFloat(document.getElementById('srv-create-disk-val')?.value) || 10;
    const disk_mb = (this.deployDiskUnit === 'GB') ? Math.round(diskVal * 1024) : Math.round(diskVal);

    // User Access / Server Access assignment
    const userSelect = document.getElementById('srv-create-user-id');
    const user_id = userSelect ? parseInt(userSelect.value, 10) : undefined;

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
          user_id,
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

  setUserViewMode(mode) {
    this.userViewMode = mode;
    localStorage.setItem('mpanel_user_view_mode', mode);
    this.renderUsersView();
  }

  // 3. User & Team Management View
  async renderUsersView() {
    this.userViewMode = this.userViewMode || localStorage.getItem('mpanel_user_view_mode') || 'card';
    const isCard = this.userViewMode === 'card';
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <div class="space-y-6 pb-12">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Management</span>
            <h2 class="text-xl sm:text-2xl font-black text-white mt-2 flex items-center gap-2.5">
              <i data-lucide="users" class="w-6 h-6 text-purple-400"></i> User & Team Management
            </h2>
            <p class="text-xs text-slate-400 mt-1 font-medium">Manage user accounts, resource allocations, auto-suspension states, and server access</p>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Card / List segmented switcher (Default: card) -->
            <div class="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner">
              <button onclick="admin.setUserViewMode('card')" class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${isCard ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Cards
              </button>
              <button onclick="admin.setUserViewMode('list')" class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${!isCard ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                <i data-lucide="list" class="w-3.5 h-3.5"></i> List
              </button>
            </div>

            <button onclick="admin.renderUsersView()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition" title="Refresh">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
            <button onclick="admin.showCreateUserModal()" class="btn-cyber-purple px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
              <i data-lucide="user-plus" class="w-4 h-4"></i> + Create User
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <i data-lucide="${isCard ? 'layout-grid' : 'list'}" class="w-4 h-4"></i>
            </div>
            <h3 class="text-base font-bold text-white tracking-wide">Users & Accounts</h3>
            <span id="adm-users-mgmt-count-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Loading...</span>
          </div>
        </div>

        <!-- View Content (Cards or List) -->
        <div id="adm-users-view-target">
          <div class="py-16 text-center text-slate-500">
            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400"></i>
            <span>Loading user profiles and resource metrics...</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    try {
      const [usersRes, serversRes] = await Promise.all([
        app.api('/api/admin/users'),
        app.api('/api/servers')
      ]);

      const users = usersRes.users || [];
      const servers = serversRes.servers || [];

      const countBadge = document.getElementById('adm-users-mgmt-count-badge');
      if (countBadge) countBadge.innerText = `${users.length} ${users.length === 1 ? 'User' : 'Users'}`;

      const userServersMap = {};
      servers.forEach(s => {
        const uid = s.user_id;
        if (!userServersMap[uid]) userServersMap[uid] = [];
        userServersMap[uid].push(s);
      });

      const target = document.getElementById('adm-users-view-target');
      if (!target) return;

      if (users.length === 0) {
        target.innerHTML = `
          <div class="glass-panel p-12 text-center rounded-3xl border border-white/10 max-w-md mx-auto space-y-3 shadow-xl">
            <i data-lucide="users" class="w-12 h-12 mx-auto text-purple-400/50"></i>
            <h3 class="text-base font-bold text-white">No Users Found</h3>
            <p class="text-xs text-slate-400">There are currently no additional user accounts registered in this panel.</p>
            <button onclick="admin.showCreateUserModal()" class="btn-cyber-purple px-4 py-2 rounded-xl text-xs font-bold">+ Create User</button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      if (isCard) {
        // Render Card Grid View (Default)
        target.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            ${users.map(u => {
              const userServers = userServersMap[u.id] || [];
              const isAdm = u.role === 'admin';
              const isSuspended = !!u.suspended;
              const ramFmt = (u.total_memory_mb >= 1024 ? (u.total_memory_mb / 1024).toFixed(1) + ' GiB' : (u.total_memory_mb || 0) + ' MB');
              const diskFmt = (u.total_disk_mb >= 1024 ? (u.total_disk_mb / 1024).toFixed(1) + ' GiB' : (u.total_disk_mb || 0) + ' MB');
              const cpuFmt = (u.total_cpu_limit || 0) + '%';

              // Auto-suspend & Expiration status pill
              let autoSuspendStatusHTML = '';
              if (isSuspended) {
                autoSuspendStatusHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>ACCOUNT SUSPENDED</span>`;
              } else if (u.suspended_server_count > 0) {
                autoSuspendStatusHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>${u.suspended_server_count} Auto-Suspended</span>`;
              } else if (u.expiring_soon_count > 0) {
                autoSuspendStatusHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>${u.expiring_soon_count} Expiring Soon</span>`;
              } else {
                autoSuspendStatusHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Auto-Suspend Active</span>`;
              }

              return `
                <div class="glass-panel p-5 rounded-3xl border border-white/10 hover:border-purple-500/30 transition shadow-xl space-y-4 flex flex-col justify-between group">
                  <div class="space-y-4">
                    <!-- 1. User Profile Section -->
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-11 h-11 rounded-2xl ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} flex items-center justify-center font-black text-base uppercase shrink-0 shadow-inner">
                          ${(u.username || 'U').substring(0, 1)}
                        </div>
                        <div class="min-w-0">
                          <h4 class="text-sm font-bold text-white truncate group-hover:text-purple-300 transition">${app.escapeHtml(u.username)}</h4>
                          <div class="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                            <span class="text-slate-500">UID #${u.id}</span>
                            <span>•</span>
                            <span class="truncate max-w-[130px]">${app.escapeHtml(u.email)}</span>
                            <button onclick="navigator.clipboard.writeText('${app.escapeHtml(u.email)}'); app.toast('Copied email', 'info');" class="text-slate-500 hover:text-purple-400" title="Copy Email">
                              <i data-lucide="copy" class="w-2.5 h-2.5"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-white/10'} shrink-0">
                        ${isAdm ? 'ADMIN' : 'CLIENT'}
                      </span>
                    </div>

                    <!-- Permissions & State Badges -->
                    <div class="flex flex-wrap items-center gap-1.5 pt-1">
                      ${u.two_factor_enabled
                        ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">2FA Active</span>'
                        : '<span class="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 border border-white/5">No 2FA</span>'}
                      ${autoSuspendStatusHTML}
                    </div>

                    <!-- 2. Resources limit = me auto suspend Resources -->
                    <div class="p-3.5 rounded-2xl bg-slate-900/70 border border-white/5 space-y-2.5">
                      <div class="flex items-center justify-between text-[11px] font-semibold">
                        <span class="text-slate-400 flex items-center gap-1.5">
                          <i data-lucide="activity" class="w-3.5 h-3.5 text-purple-400"></i> Resources Limit
                        </span>
                        <span class="text-[10px] font-mono text-purple-300">${userServers.length} Servers</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span class="text-[9px] uppercase font-bold text-slate-500 block">RAM</span>
                          <span class="text-xs font-mono font-bold text-cyan-300">${ramFmt}</span>
                        </div>
                        <div class="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span class="text-[9px] uppercase font-bold text-slate-500 block">CPU</span>
                          <span class="text-xs font-mono font-bold text-purple-300">${cpuFmt}</span>
                        </div>
                        <div class="p-2 rounded-xl bg-black/30 border border-white/5">
                          <span class="text-[9px] uppercase font-bold text-slate-500 block">DISK</span>
                          <span class="text-xs font-mono font-bold text-indigo-300">${diskFmt}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 3. Server Access Section -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <i data-lucide="server" class="w-3 h-3 text-cyan-400"></i> Server Access
                        </span>
                        <button onclick="admin.showUserServerAccessModal(${u.id}, '${app.escapeHtml(u.username)}')" class="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition">
                          Manage Access &rarr;
                        </button>
                      </div>
                      ${userServers.length === 0 ? `
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>0 servers assigned</span>
                          <button onclick="admin.showUserServerAccessModal(${u.id}, '${app.escapeHtml(u.username)}')" class="text-[10px] font-semibold text-purple-400 hover:underline">+ Assign</button>
                        </div>
                      ` : `
                        <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                          ${userServers.map(s => `
                            <button onclick="app.navigate('server-manage/${s.id}/console')" class="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition inline-flex items-center gap-1.5" title="Open Console: ${app.escapeHtml(s.name)}">
                              <i data-lucide="box" class="w-2.5 h-2.5 text-cyan-400"></i>
                              <span class="truncate max-w-[120px]">${app.escapeHtml(s.name)}</span>
                            </button>
                          `).join('')}
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- 4. Actions Toolbar (User List == Create User, User delete, Edit User, Suspended User, Server Access) -->
                  <div class="pt-3 border-t border-white/10 flex items-center justify-between gap-1.5">
                    <div class="flex items-center gap-1">
                      <button onclick="admin.showEditUserModal(${u.id})" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1 transition" title="Edit User">
                        <i data-lucide="edit-3" class="w-3 h-3 text-purple-400"></i> Edit User
                      </button>
                      <button onclick="admin.showUserServerAccessModal(${u.id}, '${app.escapeHtml(u.username)}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/10 transition" title="Server Access">
                        <i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="admin.showResetPasswordModal(${u.id}, '${app.escapeHtml(u.username)}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-white/10 transition" title="Reset Password">
                        <i data-lucide="key" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="admin.toggleSuspendUser(${u.id})" class="p-1.5 rounded-lg border transition ${isSuspended ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-400 border-white/10'}" title="${isSuspended ? 'Unsuspend User' : 'Suspend User'}">
                        <i data-lucide="${isSuspended ? 'check' : 'slash'}" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="admin.deleteUser(${u.id})" class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition" title="User Delete">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // Render List / Table View
        target.innerHTML = `
          <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th class="px-4 py-3">User Profile</th>
                    <th class="px-4 py-3">Resources Limit</th>
                    <th class="px-4 py-3">Server Access</th>
                    <th class="px-4 py-3">Permissions</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${users.map(u => {
                    const userServers = userServersMap[u.id] || [];
                    const isAdm = u.role === 'admin';
                    const isSuspended = !!u.suspended;
                    const ramFmt = (u.total_memory_mb >= 1024 ? (u.total_memory_mb / 1024).toFixed(1) + ' GiB' : (u.total_memory_mb || 0) + ' MB');
                    const diskFmt = (u.total_disk_mb >= 1024 ? (u.total_disk_mb / 1024).toFixed(1) + ' GiB' : (u.total_disk_mb || 0) + ' MB');

                    return `
                      <tr class="hover:bg-white/5 transition-colors">
                        <!-- User Profile -->
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-full ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              ${(u.username || 'U').substring(0, 1)}
                            </div>
                            <div class="min-w-0">
                              <span class="font-bold text-white block text-xs truncate">${app.escapeHtml(u.username)}</span>
                              <div class="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                                <span>UID #${u.id}</span>
                                <span>•</span>
                                <span class="truncate max-w-[130px]">${app.escapeHtml(u.email)}</span>
                                <button onclick="navigator.clipboard.writeText('${app.escapeHtml(u.email)}'); app.toast('Copied email', 'info');" class="text-slate-500 hover:text-purple-400">
                                  <i data-lucide="copy" class="w-2.5 h-2.5"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- Resources Limit & Auto Suspend -->
                        <td class="px-4 py-3 font-mono">
                          <div class="space-y-0.5 text-[11px]">
                            <div class="text-cyan-300 font-bold">${ramFmt} RAM • ${u.total_cpu_limit || 0}% CPU</div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>${diskFmt} Disk</span>
                              ${u.suspended_server_count > 0 ? `<span class="px-1 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">${u.suspended_server_count} Suspended</span>` : ''}
                            </div>
                          </div>
                        </td>

                        <!-- Server Access -->
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              ${userServers.length} Servers
                            </span>
                            <button onclick="admin.showUserServerAccessModal(${u.id}, '${app.escapeHtml(u.username)}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition">
                              Manage
                            </button>
                          </div>
                        </td>

                        <!-- Permissions -->
                        <td class="px-4 py-3">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${isAdm ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-white/10'}">
                              ${isAdm ? 'ADMIN' : 'CLIENT'}
                            </span>
                            ${u.two_factor_enabled ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">2FA</span>' : ''}
                            ${isSuspended
                              ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">SUSPENDED</span>'
                              : '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">ACTIVE</span>'}
                          </div>
                        </td>

                        <!-- Actions -->
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                          <div class="flex items-center justify-end gap-1.5">
                            <button onclick="admin.showEditUserModal(${u.id})" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-white/10 transition" title="Edit User">
                              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="admin.showUserServerAccessModal(${u.id}, '${app.escapeHtml(u.username)}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/10 transition" title="Server Access">
                              <i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="admin.toggleSuspendUser(${u.id})" class="p-1.5 rounded-lg border transition ${isSuspended ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-400 border-white/10'}" title="${isSuspended ? 'Unsuspend User' : 'Suspend User'}">
                              <i data-lucide="${isSuspended ? 'check' : 'slash'}" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="admin.showResetPasswordModal(${u.id}, '${app.escapeHtml(u.username)}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-white/10 transition" title="Reset Password">
                              <i data-lucide="key" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="admin.deleteUser(${u.id})" class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition" title="Delete User">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } catch (e) {
      console.error('Error rendering users view:', e);
      app.toast('Failed to load user management: ' + e.message, 'error');
    }

    if (window.lucide) lucide.createIcons();
  }

  async showEditUserModal(userId) {
    const modalContainer = document.getElementById('modal-container');
    try {
      const data = await app.api(`/api/admin/users/${userId}`);
      const u = data.user;
      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div class="glass-panel w-full max-w-lg p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
            <div class="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="edit-3" class="w-5 h-5 text-purple-400"></i> Edit User: ${app.escapeHtml(u.username)}
              </h3>
              <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <form onsubmit="admin.handleEditUser(event, ${u.id})" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input type="text" id="edit-user-name" value="${app.escapeHtml(u.username)}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input type="email" id="edit-user-email" value="${app.escapeHtml(u.email)}" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Role Permissions</label>
                  <select id="edit-user-role" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>Standard User</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Account State</label>
                  <select id="edit-user-suspended" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
                    <option value="0" ${!u.suspended ? 'selected' : ''}>Active</option>
                    <option value="1" ${u.suspended ? 'selected' : ''}>Suspended</option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-t border-white/10">
                <label class="block text-xs font-semibold text-slate-300 mb-1">New Password (optional)</label>
                <input type="password" id="edit-user-pass" placeholder="Leave empty to keep current password" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs">
              </div>

              <div class="flex gap-2 pt-2">
                <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2.5 rounded-xl text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold transition">Cancel</button>
                <button type="submit" class="btn-cyber-purple flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      app.toast(err.message || 'Failed to fetch user', 'error');
    }
  }

  async handleEditUser(e, userId) {
    e.preventDefault();
    const username = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const role = document.getElementById('edit-user-role').value;
    const suspended = parseInt(document.getElementById('edit-user-suspended').value, 10);
    const password = document.getElementById('edit-user-pass').value;

    const payload = { username, email, role, suspended };
    if (password && password.trim().length > 0) {
      payload.password = password.trim();
    }

    try {
      const res = await app.api(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('User updated successfully!', 'success');
        this.renderUsersView();
      }
    } catch (err) {
      app.toast(err.message || 'Failed to update user', 'error');
    }
  }

  async showUserServerAccessModal(userId, username) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="hard-drive" class="w-5 h-5 text-cyan-400"></i> Server Access: ${app.escapeHtml(username)}
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-slate-400">Manage and assign server access and ownership for this user account.</p>
          <div id="user-server-access-list" class="space-y-3 py-4 text-center text-slate-500">
            <i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto text-cyan-400"></i>
            <span>Loading server assignments...</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const srvRes = await app.api('/api/servers');
      const allServers = srvRes.servers || [];
      const assigned = allServers.filter(s => s.user_id === userId);
      const others = allServers.filter(s => s.user_id !== userId);

      const listContainer = document.getElementById('user-server-access-list');
      if (!listContainer) return;

      listContainer.className = "space-y-4";
      listContainer.innerHTML = `
        <!-- Assigned Servers Section -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Currently Assigned Servers (${assigned.length})
          </h4>
          ${assigned.length === 0 ? `
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-500 text-center">
              No servers currently assigned to ${app.escapeHtml(username)}.
            </div>
          ` : `
            <div class="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-slate-900/50">
              ${assigned.map(s => `
                <div class="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <i data-lucide="box" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-white text-xs truncate">${app.escapeHtml(s.name)}</div>
                      <div class="text-[10px] font-mono text-slate-400">${s.ip || '127.0.0.1'}:${s.port || 25565} • ${s.memory_mb} MB RAM</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button onclick="app.navigate('server-manage/${s.id}/console'); document.getElementById('modal-container').innerHTML='';" class="btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                      <i data-lucide="terminal" class="w-3 h-3"></i> Console
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Available to Assign Section -->
        ${others.length > 0 ? `
          <div class="space-y-2 pt-3 border-t border-white/10">
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span> Other Deployed Servers (${others.length})
            </h4>
            <div class="max-h-60 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-2xl bg-slate-900/50">
              ${others.map(s => `
                <div class="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                      <i data-lucide="box" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-slate-200 text-xs truncate">${app.escapeHtml(s.name)}</div>
                      <div class="text-[10px] font-mono text-slate-500">Owner: ${app.escapeHtml(s.owner_username || 'None')} • #${s.id}</div>
                    </div>
                  </div>
                  <button onclick="admin.handleTransferServer(${s.id}, ${userId}, '${app.escapeHtml(username)}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition shrink-0">
                    + Assign to ${app.escapeHtml(username)}
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      app.toast(err.message || 'Failed to load servers', 'error');
    }
  }

  async handleTransferServer(serverId, newUserId, username) {
    if (!confirm(`Assign server #${serverId} to user "${username}"?`)) return;
    try {
      const res = await app.api(`/api/servers/${serverId}`, {
        method: 'PUT',
        body: JSON.stringify({ user_id: newUserId })
      });
      if (res.success) {
        app.toast(`Server #${serverId} assigned to ${username}!`, 'success');
        this.showUserServerAccessModal(newUserId, username);
        this.renderUsersView();
      }
    } catch (err) {
      app.toast(err.message || 'Failed to reassign server', 'error');
    }
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
        list.innerHTML = nodes.map(n => {
          const usage = n.usage || { cpu_percent: 0, ram_percent: 0, ram_used_mb: 0, ram_total_mb: 0, load_avg: '0.00', uptime_hours: 0, cores: 1 };
          const cpuColor = usage.cpu_percent > 85 ? 'bg-rose-500' : (usage.cpu_percent > 65 ? 'bg-amber-500' : 'bg-purple-500');
          const ramColor = usage.ram_percent > 85 ? 'bg-rose-500' : (usage.ram_percent > 65 ? 'bg-amber-500' : 'bg-cyan-500');

          return `
          <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-purple-500/30 transition-all">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">${n.location_name || 'Local'}</span>
                <h4 class="text-base font-bold text-white">${n.name}</h4>
                <p class="text-xs font-mono text-slate-400">${n.fqdn}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                </span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                  ${usage.cores} CORES
                </span>
              </div>
            </div>

            <!-- Node Usage Status v1.0.2 Live Gauges -->
            <div class="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
              <div class="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span class="flex items-center gap-1.5"><i data-lucide="cpu" class="w-3.5 h-3.5 text-purple-400"></i> CPU Usage</span>
                <span class="font-mono text-purple-300 font-bold">${usage.cpu_percent}%</span>
              </div>
              <div class="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div class="${cpuColor} h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.max(2, usage.cpu_percent))}%"></div>
              </div>

              <div class="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span class="flex items-center gap-1.5"><i data-lucide="database" class="w-3.5 h-3.5 text-cyan-400"></i> RAM (${(usage.ram_used_mb / 1024).toFixed(1)} / ${(usage.ram_total_mb / 1024).toFixed(1)} GB)</span>
                <span class="font-mono text-cyan-300 font-bold">${usage.ram_percent}%</span>
              </div>
              <div class="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div class="${ramColor} h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.max(2, usage.ram_percent))}%"></div>
              </div>

              <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-white/5 font-mono">
                <span>Load Avg: <strong class="text-slate-200">${usage.load_avg}</strong></span>
                <span>Uptime: <strong class="text-slate-200">${usage.uptime_hours}h</strong></span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900/40 rounded-xl border border-white/5 font-mono">
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
                <i data-lucide="radio" class="w-3.5 h-3.5"></i> Allocations
              </button>
              <button onclick="admin.showNodeUsageModal(${n.id}, '${n.name}')" class="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 flex items-center justify-center gap-1.5 transition-all">
                <i data-lucide="activity" class="w-3.5 h-3.5"></i> Live Stats
              </button>
            </div>
          </div>
        `;
        }).join('');
      }
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  }

  showNodeUsageModal(nodeId, nodeName) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-lg p-6 rounded-3xl border border-purple-500/30 shadow-2xl space-y-5">
          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <i data-lucide="activity" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">${nodeName} - Live Usage Status</h3>
                <p class="text-[10px] text-slate-400 font-mono">NodeUsageStatus v1.0.2 Monitoring Engine</p>
              </div>
            </div>
            <button onclick="admin.closeNodeUsageModal()" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-4">
            <!-- CPU Box -->
            <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-purple-300 flex items-center gap-1.5"><i data-lucide="cpu" class="w-4 h-4"></i> Processor Load</span>
                <span id="live-node-cpu-val" class="font-mono font-bold text-white text-sm">--%</span>
              </div>
              <div class="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                <div id="live-node-cpu-bar" class="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span id="live-node-cpu-cores">Threads: --</span>
                <span id="live-node-load">Load: --</span>
              </div>
            </div>

            <!-- Memory Box -->
            <div class="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-cyan-300 flex items-center gap-1.5"><i data-lucide="database" class="w-4 h-4"></i> Memory (RAM) Allocation</span>
                <span id="live-node-ram-val" class="font-mono font-bold text-white text-sm">--%</span>
              </div>
              <div class="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-cyan-500/20">
                <div id="live-node-ram-bar" class="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span id="live-node-ram-detail">Used: -- / -- GB</span>
                <span id="live-node-status" class="text-emerald-400 font-bold">STATUS: OK</span>
              </div>
            </div>

            <!-- Host Overview -->
            <div class="grid grid-cols-2 gap-3 text-xs font-mono">
              <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span class="text-[10px] text-slate-400 block mb-1">Host Uptime</span>
                <span id="live-node-uptime" class="text-white font-bold">-- hrs</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span class="text-[10px] text-slate-400 block mb-1">Status Grade</span>
                <span id="live-node-grade" class="text-emerald-400 font-bold">Optimal</span>
              </div>
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button onclick="admin.closeNodeUsageModal()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Close</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const updateStats = async () => {
      try {
        const res = await app.api(`/api/admin/nodes/${nodeId}/stats`);
        if (res.success && res.stats) {
          const s = res.stats;
          const cpuVal = document.getElementById('live-node-cpu-val');
          const cpuBar = document.getElementById('live-node-cpu-bar');
          const cpuCores = document.getElementById('live-node-cpu-cores');
          const loadEl = document.getElementById('live-node-load');
          const ramVal = document.getElementById('live-node-ram-val');
          const ramBar = document.getElementById('live-node-ram-bar');
          const ramDetail = document.getElementById('live-node-ram-detail');
          const uptimeEl = document.getElementById('live-node-uptime');
          const gradeEl = document.getElementById('live-node-grade');

          if (cpuVal) cpuVal.textContent = `${s.cpu_percent}%`;
          if (cpuBar) cpuBar.style.width = `${Math.min(100, Math.max(2, s.cpu_percent))}%`;
          if (cpuCores) cpuCores.textContent = `Threads: ${s.cores}`;
          if (loadEl) loadEl.textContent = `Load: ${s.load_avg}`;
          if (ramVal) ramVal.textContent = `${s.ram_percent}%`;
          if (ramBar) ramBar.style.width = `${Math.min(100, Math.max(2, s.ram_percent))}%`;
          if (ramDetail) ramDetail.textContent = `Used: ${(s.ram_used_mb / 1024).toFixed(2)} / ${(s.ram_total_mb / 1024).toFixed(2)} GB`;
          if (uptimeEl) uptimeEl.textContent = `${s.uptime_hours} hrs`;
          if (gradeEl) {
            gradeEl.textContent = s.status === 'optimal' ? 'Optimal' : 'High Load';
            gradeEl.className = s.status === 'optimal' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
          }
        }
      } catch (err) {
        console.error('Node usage live fetch error:', err);
      }
    };

    updateStats();
    if (this._nodeUsageTimer) clearInterval(this._nodeUsageTimer);
    this._nodeUsageTimer = setInterval(updateStats, 2000);
  }

  closeNodeUsageModal() {
    if (this._nodeUsageTimer) {
      clearInterval(this._nodeUsageTimer);
      this._nodeUsageTimer = null;
    }
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
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
                  <input type="number" id="edit-srv-ram" value="${s.memory_mb || 1024}" min="128" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">CPU Limit (%)</label>
                  <input type="number" id="edit-srv-cpu" value="${s.cpu_limit || 100}" min="10" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Disk Limit (MB)</label>
                  <input type="number" id="edit-srv-disk" value="${s.disk_mb || 5120}" min="256" step="any" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required>
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

              <!-- SAGA Auto Suspension v1 Panel -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-purple-400"></i>
                    <span class="text-xs font-bold text-white">SAGA Auto-Suspension & Expiration</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.is_suspended ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                    ${s.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                </div>

                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Expiration Timestamp</label>
                  <input type="datetime-local" id="edit-srv-expiration" value="${s.expiration_date ? new Date(s.expiration_date).toISOString().slice(0, 16) : ''}" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-slate-200">
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <span class="text-[10px] text-slate-400 font-semibold">Quick Extend:</span>
                  <button type="button" onclick="admin.setModalExpirationDays(7)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">+7 Days</button>
                  <button type="button" onclick="admin.setModalExpirationDays(30)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">+30 Days</button>
                  <button type="button" onclick="admin.setModalExpirationDays(90)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">+90 Days</button>
                  <button type="button" onclick="admin.setModalExpirationDays(0)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-rose-600/30 text-rose-300 border border-rose-500/20">Never (Clear)</button>
                </div>

                <div class="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span class="text-xs text-slate-300">Force Server Suspension:</span>
                  <button type="button" onclick="admin.toggleServerSuspension(${s.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold ${s.is_suspended ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30' : 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'} flex items-center gap-1.5 transition">
                    <i data-lucide="${s.is_suspended ? 'unlock' : 'lock'}" class="w-3.5 h-3.5"></i>
                    ${s.is_suspended ? 'Unsuspend Server' : 'Suspend Server Now'}
                  </button>
                </div>
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

  setModalExpirationDays(days) {
    const expInput = document.getElementById('edit-srv-expiration');
    if (!expInput) return;
    if (days === 0) {
      expInput.value = '';
    } else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expInput.value = d.toISOString().slice(0, 16);
    }
  }

  async toggleServerSuspension(serverId) {
    try {
      const res = await app.api(`/api/servers/${serverId}/suspend`, { method: 'POST' });
      if (res.success) {
        app.toast(res.message, 'success');
        const modal = document.getElementById('modal-container');
        if (modal && modal.innerHTML.trim() !== '') {
          this.showEditServerModal(serverId);
        }
        this.renderServersView();
      }
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
    const expVal = document.getElementById('edit-srv-expiration').value;
    const expiration_date = expVal ? new Date(expVal).toISOString() : null;

    try {
      const data = await app.api(`/api/servers/${serverId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, memory_mb, cpu_limit, disk_mb, startup_cmd, docker_image, expiration_date })
      });
      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Server configuration & expiration updated!', 'success');
        this.renderServersView();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async deleteServer(serverId, serverName = '') {
    if (!confirm(`⚠️ Are you sure you want to permanently delete server "${serverName || '#' + serverId}"? This action cannot be undone and will erase all container storage.`)) {
      return;
    }
    try {
      const res = await app.api(`/api/servers/${serverId}`, { method: 'DELETE' });
      if (res.success) {
        app.toast(`Server #${serverId} deleted successfully`, 'success');
        this.renderServersView();
      }
    } catch (err) {
      app.toast(err.message || 'Failed to delete server', 'error');
    }
  }

  showResetPasswordModal(userId, username) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="key" class="w-5 h-5 text-purple-400"></i> Reset Password
            </h3>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-slate-300">Set a new password for user <span class="font-bold text-white font-mono">${app.escapeHtml(username)}</span>:</p>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
            <input type="password" id="reset-user-new-pass" placeholder="Min 6 characters" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono" required minlength="6">
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="admin.handleResetPassword(${userId})" class="btn-cyber-purple flex-1 py-2 rounded-xl text-xs font-semibold">Save Password</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleResetPassword(userId) {
    const password = document.getElementById('reset-user-new-pass')?.value;
    if (!password || password.length < 6) {
      return app.toast('Password must be at least 6 characters.', 'warning');
    }
    try {
      const res = await app.api(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ password })
      });
      if (res.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Password updated successfully!', 'success');
        this.renderServersView();
      }
    } catch (err) {
      app.toast(err.message || 'Failed to update password', 'error');
    }
  }
}

window.admin = new AdminManager();
