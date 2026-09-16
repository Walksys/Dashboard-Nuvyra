// PteroX V2 Billing & Subscriptions Portal Module
class BillingManager {
  constructor() {
    this.balance = parseFloat(localStorage.getItem('mpanel_wallet_balance') || '25.00');
    this.invoices = JSON.parse(localStorage.getItem('mpanel_invoices') || 'null') || [
      { id: 'INV-2026-0901', date: '2026-09-01', description: 'Monthly Server Plan (Performance Pro - 4GB)', amount: 6.00, method: 'Wallet Balance', status: 'Paid' },
      { id: 'INV-2026-0815', date: '2026-08-15', description: 'Wallet Funds Top-up', amount: 25.00, method: 'PayPal', status: 'Paid' },
      { id: 'INV-2026-0801', date: '2026-08-01', description: 'Monthly Server Plan (Starter Node - 2GB)', amount: 3.00, method: 'Credit Card', status: 'Paid' }
    ];
  }

  save() {
    localStorage.setItem('mpanel_wallet_balance', this.balance.toFixed(2));
    localStorage.setItem('mpanel_invoices', JSON.stringify(this.invoices));
  }

  renderBillingView() {
    if (window.admin && typeof window.admin.stopOverviewPolling === 'function') {
      window.admin.stopOverviewPolling();
    }

    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 pb-12 max-w-7xl mx-auto">
        <!-- Top Titlebar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#ff5108] bg-[#ff5108]/10 px-2.5 py-0.5 rounded-full border border-[#ff5108]/20">PteroX Billing</span>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active Account</span>
            </div>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <i data-lucide="credit-card" class="w-6 h-6 text-[#ff5108]"></i> Billing &amp; Subscriptions
            </h2>
            <p class="text-xs text-slate-400 mt-1">Manage wallet credits, deployed server subscriptions, invoices, and plan upgrades.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="billingManager.openTopupModal()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Add Credits</span>
            </button>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Balance -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-emerald-400">
              <span class="text-[11px] font-bold uppercase text-slate-400">Wallet Balance</span>
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
            <h3 class="text-2xl sm:text-3xl font-black text-emerald-400">$${this.balance.toFixed(2)}</h3>
            <p class="text-[10px] text-slate-400 font-mono">Available for renewals &amp; add-ons</p>
          </div>

          <!-- Active Subscriptions -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-cyan-400">
              <span class="text-[11px] font-bold uppercase text-slate-400">Active Plans</span>
              <i data-lucide="server" class="w-4 h-4"></i>
            </div>
            <h3 class="text-2xl sm:text-3xl font-black text-white">1 Server</h3>
            <p class="text-[10px] text-slate-400 font-mono">1 Auto-renewal enabled</p>
          </div>

          <!-- Monthly Burn -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-amber-400">
              <span class="text-[11px] font-bold uppercase text-slate-400">Monthly Cost</span>
              <i data-lucide="trending-up" class="w-4 h-4"></i>
            </div>
            <h3 class="text-2xl sm:text-3xl font-black text-amber-400">$6.00 <span class="text-xs font-normal text-slate-400">/ mo</span></h3>
            <p class="text-[10px] text-slate-400 font-mono">Performance Pro plan</p>
          </div>

          <!-- Next Invoice Due -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-purple-400">
              <span class="text-[11px] font-bold uppercase text-slate-400">Next Renewal</span>
              <i data-lucide="calendar" class="w-4 h-4"></i>
            </div>
            <h3 class="text-xl sm:text-2xl font-black text-white">Oct 01, 2026</h3>
            <p class="text-[10px] text-slate-400 font-mono text-emerald-400">Funds available for auto-renew</p>
          </div>
        </div>

        <!-- Section 1: Active Server Subscriptions -->
        <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div class="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <i data-lucide="layers" class="w-4 h-4 text-cyan-400"></i>
              <h3 class="text-sm font-bold text-white">Active Server Subscriptions</h3>
            </div>
            <span class="text-[11px] text-slate-400 font-mono">Billed monthly from wallet</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-black/30 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th class="px-5 py-3">Server</th>
                  <th class="px-4 py-3">Plan Tier</th>
                  <th class="px-4 py-3">Allocated Specs</th>
                  <th class="px-4 py-3">Monthly Rate</th>
                  <th class="px-4 py-3">Next Renewal</th>
                  <th class="px-4 py-3">Auto-Renew</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr class="hover:bg-white/[0.02] transition">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <i data-lucide="server" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <span class="font-bold text-white">Main Paper Server</span>
                        <div class="text-[10px] text-slate-400 font-mono">ID #1 &bull; 127.0.0.1:25565</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Performance Pro</span>
                  </td>
                  <td class="px-4 py-3.5 font-mono text-slate-300">
                    4 GB RAM &bull; 2 vCPU &bull; 25 GB NVMe
                  </td>
                  <td class="px-4 py-3.5 font-bold text-white">
                    $6.00 / month
                  </td>
                  <td class="px-4 py-3.5 font-mono text-slate-300">
                    2026-10-01
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <button onclick="billingManager.renewSubscription('Main Paper Server', 6.00)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition">
                      Renew Early
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Available Plan Tiers -->
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i> Available PteroX Hosting Tiers
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Instant provisioning with MariaDB, SFTP, and live resource telemetry</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Tier 1: Starter -->
            <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition flex flex-col justify-between space-y-5">
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entry Tier</span>
                    <h4 class="text-lg font-extrabold text-white mt-0.5">Starter Node</h4>
                  </div>
                  <span class="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <i data-lucide="box" class="w-4 h-4"></i>
                  </span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-black text-white">$3.00</span>
                  <span class="text-xs text-slate-400">/ month</span>
                </div>
                <ul class="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> <strong>2 GB</strong> DDR4 RAM</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> <strong>1 vCPU</strong> Core (100%)</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> <strong>10 GB</strong> NVMe SSD</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> 1 Snapshot Backup</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> 1 MariaDB Database</li>
                </ul>
              </div>
              <button onclick="billingManager.selectPlan('Starter Node', 3.00, 2048, 100, 10240)" class="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition">
                Select Starter
              </button>
            </div>

            <!-- Tier 2: Performance Pro (Popular) -->
            <div class="glass-card p-6 rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 to-slate-900/40 relative shadow-2xl flex flex-col justify-between space-y-5">
              <div class="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500 text-black shadow-md">
                Most Popular
              </div>
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Recommended</span>
                    <h4 class="text-lg font-extrabold text-white mt-0.5">Performance Pro</h4>
                  </div>
                  <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <i data-lucide="zap" class="w-4 h-4"></i>
                  </span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-black text-cyan-300">$6.00</span>
                  <span class="text-xs text-slate-400">/ month</span>
                </div>
                <ul class="space-y-2 text-xs text-slate-200 pt-2 border-t border-white/5">
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> <strong>4 GB</strong> DDR4 RAM</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> <strong>2 vCPU</strong> Cores (200%)</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> <strong>25 GB</strong> Gen4 NVMe SSD</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> 3 Snapshot Backups</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> 2 MariaDB Databases</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i> High Priority CPU Quota</li>
                </ul>
              </div>
              <button onclick="billingManager.selectPlan('Performance Pro', 6.00, 4096, 200, 25600)" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25">
                Deploy Performance Pro
              </button>
            </div>

            <!-- Tier 3: Extreme Ultimate -->
            <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-purple-500/40 transition flex flex-col justify-between space-y-5">
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-purple-400">Heavy Gaming &amp; Networks</span>
                    <h4 class="text-lg font-extrabold text-white mt-0.5">Extreme Ultimate</h4>
                  </div>
                  <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <i data-lucide="flame" class="w-4 h-4"></i>
                  </span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-black text-white">$12.00</span>
                  <span class="text-xs text-slate-400">/ month</span>
                </div>
                <ul class="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-400"></i> <strong>8 GB</strong> DDR4 RAM</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-400"></i> <strong>4 vCPU</strong> Cores (400%)</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-400"></i> <strong>60 GB</strong> Enterprise NVMe</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-400"></i> Unlimited Backups</li>
                  <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-purple-400"></i> Dedicated Port &amp; Custom IP</li>
                </ul>
              </div>
              <button onclick="billingManager.selectPlan('Extreme Ultimate', 12.00, 8192, 400, 61440)" class="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600/80 hover:bg-purple-600 text-white transition">
                Select Extreme
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Invoices & Receipts -->
        <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div class="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <i data-lucide="receipt" class="w-4 h-4 text-[#ff5108]"></i>
              <h3 class="text-sm font-bold text-white">Invoices &amp; Receipts History</h3>
            </div>
            <span class="text-[11px] text-slate-400 font-mono">${this.invoices.length} invoices issued</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-black/30 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th class="px-5 py-3">Invoice #</th>
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Description</th>
                  <th class="px-4 py-3">Payment Method</th>
                  <th class="px-4 py-3">Amount</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${this.invoices.map(inv => `
                  <tr class="hover:bg-white/[0.02] transition">
                    <td class="px-5 py-3.5 font-mono font-bold text-white">${inv.id}</td>
                    <td class="px-4 py-3.5 font-mono text-slate-400">${inv.date}</td>
                    <td class="px-4 py-3.5 font-medium text-slate-200">${inv.description}</td>
                    <td class="px-4 py-3.5 text-slate-400">${inv.method}</td>
                    <td class="px-4 py-3.5 font-bold text-white">$${inv.amount.toFixed(2)}</td>
                    <td class="px-4 py-3.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ${inv.status}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-right">
                      <button onclick="billingManager.downloadReceipt('${inv.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1.5 ml-auto">
                        <i data-lucide="file-text" class="w-3 h-3"></i>
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  openTopupModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="topup-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 shadow-2xl relative space-y-4">
          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <i data-lucide="wallet" class="w-4 h-4"></i>
              </div>
              <h3 class="text-base font-bold text-white">Add Wallet Credits</h3>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-2">Select Amount</label>
              <div class="grid grid-cols-4 gap-2">
                <button type="button" onclick="document.getElementById('topup-amount-input').value='5.00'" class="py-2 rounded-xl border border-white/10 bg-slate-900/60 text-white font-bold hover:border-cyan-500/40">$5</button>
                <button type="button" onclick="document.getElementById('topup-amount-input').value='10.00'" class="py-2 rounded-xl border border-white/10 bg-slate-900/60 text-white font-bold hover:border-cyan-500/40">$10</button>
                <button type="button" onclick="document.getElementById('topup-amount-input').value='25.00'" class="py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-bold">$25</button>
                <button type="button" onclick="document.getElementById('topup-amount-input').value='50.00'" class="py-2 rounded-xl border border-white/10 bg-slate-900/60 text-white font-bold hover:border-cyan-500/40">$50</button>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Custom Amount ($)</label>
              <input type="number" step="1.00" min="1.00" id="topup-amount-input" value="25.00" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono" placeholder="25.00">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <select id="topup-method-select" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
                <option value="PayPal">PayPal</option>
                <option value="Credit Card (Stripe)">Credit Card (Stripe)</option>
                <option value="Cryptocurrency">Cryptocurrency (BTC/ETH/USDT)</option>
              </select>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/5 font-semibold">Cancel</button>
              <button type="button" onclick="billingManager.processTopup()" class="btn-cyber px-5 py-2 rounded-xl font-bold flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Complete Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  processTopup() {
    const input = document.getElementById('topup-amount-input');
    const methodSelect = document.getElementById('topup-method-select');
    const amt = parseFloat(input ? input.value : '0');
    const method = methodSelect ? methodSelect.value : 'PayPal';

    if (isNaN(amt) || amt <= 0) {
      app.toast('Please enter a valid payment amount.', 'error');
      return;
    }

    this.balance += amt;
    const invId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];

    this.invoices.unshift({
      id: invId,
      date: dateStr,
      description: `Wallet Funds Top-up ($${amt.toFixed(2)})`,
      amount: amt,
      method: method,
      status: 'Paid'
    });

    this.save();
    document.getElementById('modal-container').innerHTML = '';
    app.toast(`Added $${amt.toFixed(2)} to wallet successfully!`, 'success');
    this.renderBillingView();
  }

  selectPlan(planName, price, ramMb, cpuPercent, diskMb) {
    if (this.balance < price) {
      if (confirm(`Your wallet balance ($${this.balance.toFixed(2)}) is lower than the plan rate ($${price.toFixed(2)}).\nWould you like to top-up funds first?`)) {
        this.openTopupModal();
      }
      return;
    }

    if (confirm(`Deploy or upgrade to ${planName} for $${price.toFixed(2)}/month?\nAmount will be deducted from your wallet balance.`)) {
      this.balance -= price;
      const invId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().split('T')[0];

      this.invoices.unshift({
        id: invId,
        date: dateStr,
        description: `Server Plan Subscription (${planName})`,
        amount: price,
        method: 'Wallet Balance',
        status: 'Paid'
      });

      this.save();
      app.toast(`Subscribed to ${planName}! Creating or upgrading server resources...`, 'success');
      this.renderBillingView();

      // If user has admin rights or can create server, navigate to server creation pre-filled
      if (app.user && app.user.role === 'admin') {
        setTimeout(() => {
          app.navigate('admin-servers');
        }, 1200);
      }
    }
  }

  renewSubscription(serverName, price) {
    if (this.balance < price) {
      alert(`Insufficient wallet balance to renew. Please add at least $${(price - this.balance).toFixed(2)} to your wallet.`);
      this.openTopupModal();
      return;
    }

    if (confirm(`Renew subscription for ${serverName} ($${price.toFixed(2)}) for an additional 30 days?`)) {
      this.balance -= price;
      const invId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().split('T')[0];

      this.invoices.unshift({
        id: invId,
        date: dateStr,
        description: `Early Subscription Renewal (${serverName})`,
        amount: price,
        method: 'Wallet Balance',
        status: 'Paid'
      });

      this.save();
      app.toast(`Subscription for ${serverName} extended by 30 days!`, 'success');
      this.renderBillingView();
    }
  }

  downloadReceipt(id) {
    const inv = this.invoices.find(i => i.id === id);
    if (!inv) return;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="receipt-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative space-y-5 bg-[#0f1424]">
          <div class="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-[#ff5108]">PteroX Billing Invoice</div>
              <h3 class="text-xl font-black text-white mt-0.5">${inv.id}</h3>
              <p class="text-[11px] text-slate-400 font-mono">Date: ${inv.date}</p>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <div class="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">Description:</span>
                <span class="font-bold text-white">${inv.description}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Payment Method:</span>
                <span class="text-slate-200">${inv.method}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Payment Status:</span>
                <span class="text-emerald-400 font-bold">${inv.status}</span>
              </div>
              <div class="border-t border-white/10 pt-2 flex justify-between text-sm">
                <span class="font-bold text-white">Total Paid:</span>
                <span class="font-black text-emerald-400">$${inv.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-white/10">
            <span class="text-[11px] text-slate-400 font-mono">Thank you for your business!</span>
            <div class="flex gap-2">
              <button onclick="window.print()" class="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1.5">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                <span>Print</span>
              </button>
              <button onclick="document.getElementById('modal-container').innerHTML=''" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }
}

window.billingManager = new BillingManager();

