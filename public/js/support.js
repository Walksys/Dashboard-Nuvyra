class SupportChatManager {
  constructor() { this.adminConversationId = null; this.poller = null; }
  esc(value) { return app.escapeHtml(value || ''); }
  avatar(user, size = 'w-9 h-9') {
    const src = user?.avatar || '';
    return src ? `<img src="${this.esc(src)}" class="${size} rounded-full object-cover border border-white/10" alt="">` : `<div class="${size} rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">${this.esc((user?.username || 'U')[0].toUpperCase())}</div>`;
  }
  stopPolling() { if (this.poller) { clearInterval(this.poller); this.poller = null; } }
  messageHtml(m) {
    const staff = m.sender_type === 'staff';
    const ai = m.sender_type === 'ai';
    return `<div class="flex ${staff || ai ? 'justify-end' : 'justify-start'} mb-3">
      <div class="max-w-[88%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 ${staff ? 'bg-purple-500/20 border-purple-400/30' : ai ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-white/5 border-white/10'} border">
        <div class="flex items-center gap-2 mb-1 text-[10px] text-slate-400"><strong class="${staff ? 'text-purple-300' : ai ? 'text-emerald-300' : 'text-cyan-300'}">${staff ? 'Staff' : ai ? 'AI Assistant' : this.esc(m.sender_username || 'User')}</strong><span>${this.esc(m.created_at)}</span></div>
        ${m.body ? `<div class="text-sm text-slate-200 whitespace-pre-wrap break-words">${this.esc(m.body)}</div>` : ''}
        ${m.attachment_url ? `<a href="${this.esc(m.attachment_url)}" target="_blank" rel="noopener" class="mt-2 block"><img src="${this.esc(m.attachment_url)}" class="max-h-64 max-w-full rounded-xl border border-white/10 object-contain" alt="${this.esc(m.attachment_name)}"><span class="text-[10px] text-cyan-300 mt-1 inline-block">${this.esc(m.attachment_name || 'Image')}</span></a>` : ''}
      </div>
    </div>`;
  }
  composer(action, prefix) {
    return `<form id="${prefix}-form" onsubmit="supportChat.send(event, '${action}')" class="flex items-end gap-2">
      <input type="file" id="${prefix}-file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" class="hidden">
      <button type="button" onclick="document.getElementById('${prefix}-file').click()" class="w-10 h-10 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center" title="Attach image"><i data-lucide="paperclip" class="w-4 h-4"></i></button>
      <button type="button" onclick="supportChat.addEmoji('${prefix}-body')" class="w-10 h-10 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center" title="Add emoji">😊</button>
      <textarea id="${prefix}-body" rows="1" required placeholder="Write a message..." class="flex-1 glass-input px-3 py-2.5 rounded-xl text-sm resize-none"></textarea>
      <button class="h-10 px-4 rounded-xl btn-cyber text-xs font-bold flex items-center gap-1.5"><i data-lucide="send" class="w-4 h-4"></i> Send</button>
    </form>`;
  }
  async renderUser() {
    this.stopPolling();
    const c = document.getElementById('view-container');
    c.innerHTML = `<div class="space-y-5 pb-12"><div><span class="text-xs uppercase tracking-widest text-cyan-400">Support</span><h1 class="text-2xl font-black text-white mt-2 flex items-center gap-2"><i data-lucide="message-circle" class="text-cyan-400"></i> Staff Chat</h1><p class="text-xs text-slate-400 mt-1">Your conversation is private and visible only to you and staff.</p></div><div class="glass-panel rounded-2xl border border-white/10 overflow-hidden"><div id="support-user-messages" class="p-4 min-h-[360px] max-h-[55vh] overflow-y-auto"><div class="text-center text-slate-500 text-sm">Loading conversation...</div></div><div class="p-3 border-t border-white/10">${this.composer('user', 'support-user')}</div></div></div>`;
    if (window.lucide) lucide.createIcons();
    await this.loadUser();
    this.poller = setInterval(() => this.loadUser(true), 10000);
  }
  async loadUser(silent = false) {
    try {
      const d = await app.api('/api/support/conversation');
      const el = document.getElementById('support-user-messages');
      const form = document.getElementById('support-user-form');
      if (!el) return;
      if (d.conversation?.support_mode === 'pending') {
        if (form) form.classList.add('hidden');
        el.innerHTML = `<div class="h-64 flex flex-col items-center justify-center text-center gap-4"><div><h3 class="text-white font-bold">How would you like help?</h3><p class="text-xs text-slate-400 mt-1">Choose who should answer your support question.</p></div><div class="flex flex-col sm:flex-row gap-3"><button onclick="supportChat.chooseMode('ai')" class="px-5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-xs font-bold"><i data-lucide="bot" class="w-4 h-4 inline-block mr-1"></i> AI Assistant<br><span class="text-[10px] font-normal text-emerald-300/70">Instant automated help</span></button><button onclick="supportChat.chooseMode('human')" class="px-5 py-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 text-xs font-bold"><i data-lucide="headphones" class="w-4 h-4 inline-block mr-1"></i> Human Support<br><span class="text-[10px] font-normal text-purple-300/70">Talk to Staff</span></button></div></div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }
      if (form) form.classList.remove('hidden');
      const banner = d.conversation?.support_mode === 'ai'
        ? `<div class="mb-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 px-3 py-2"><span class="text-[11px] text-emerald-200"><strong>AI Assistant</strong> · Replies follow your first message language.</span><button onclick="supportChat.chooseMode('human')" class="text-[10px] font-bold text-purple-300 hover:text-white">Transfer to Staff</button></div>`
        : `<div class="mb-4 rounded-xl bg-purple-500/10 border border-purple-400/20 px-3 py-2 text-[11px] text-purple-200"><strong>Human Support</strong> · Staff will reply in the language of your first message.</div>`;
      el.innerHTML = banner + (d.messages?.length ? d.messages.map(m => this.messageHtml(m)).join('') : '<div class="h-64 flex items-center justify-center text-slate-500 text-sm">Send a message to Staff Support.</div>');
      el.scrollTop = el.scrollHeight;
    } catch (e) { if (!silent) app.toast(e.message, 'error'); }
  }
  async chooseMode(mode) { try { await app.api('/api/support/conversation/mode', { method: 'POST', body: { mode } }); await this.loadUser(); } catch (e) { app.toast(e.message, 'error'); } }
  async renderAdmin() {
    this.stopPolling();
    const c = document.getElementById('view-container');
    c.innerHTML = `<div class="space-y-5 pb-12"><div><span class="text-xs uppercase tracking-widest text-purple-400">Administration</span><h1 class="text-2xl font-black text-white mt-2 flex items-center gap-2"><i data-lucide="messages-square" class="text-purple-400"></i> Staff Chat</h1><p class="text-xs text-slate-400 mt-1">Every user has a separate private support thread.</p></div><div class="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)] gap-4"><div class="glass-panel rounded-2xl border border-white/10 overflow-hidden"><div class="p-3 border-b border-white/10 text-xs font-bold text-slate-200">Conversations</div><div id="support-admin-list" class="max-h-[65vh] overflow-y-auto"><div class="p-5 text-slate-500 text-sm">Loading...</div></div></div><div class="glass-panel rounded-2xl border border-white/10 overflow-hidden"><div id="support-admin-head" class="p-3 border-b border-white/10 text-sm text-slate-500">Select a conversation</div><div id="support-admin-messages" class="p-4 min-h-[360px] max-h-[55vh] overflow-y-auto"><div class="h-64 flex items-center justify-center text-slate-500 text-sm">Choose a user from the inbox.</div></div><div class="p-3 border-t border-white/10">${this.composer('admin', 'support-admin')}</div></div></div></div>`;
    if (window.lucide) lucide.createIcons();
    await this.loadAdminList();
    this.poller = setInterval(() => this.loadAdminList(true), 10000);
  }
  async loadAdminList(silent = false) {
    try { const d = await app.api('/api/admin/support/conversations'); const el = document.getElementById('support-admin-list'); if (!el) return; el.innerHTML = d.conversations?.length ? d.conversations.map(x => `<button onclick="supportChat.selectAdmin(${x.id})" class="w-full text-left p-3 border-b border-white/5 hover:bg-white/5 ${Number(this.adminConversationId) === Number(x.id) ? 'bg-purple-500/15' : ''}"><div class="flex items-center gap-2">${this.avatar(x, 'w-8 h-8')}<div class="min-w-0"><div class="text-xs font-bold text-white truncate">${this.esc(x.username)}</div><div class="text-[10px] text-slate-500 truncate">${this.esc(x.email)}</div></div><span class="ml-auto text-[9px] text-slate-500">${x.message_count || 0}</span></div></button>`).join('') : '<div class="p-5 text-slate-500 text-sm">No support messages yet.</div>'; } catch (e) { if (!silent) app.toast(e.message, 'error'); }
  }
  async selectAdmin(id) { this.adminConversationId = id; await this.loadAdminConversation(); await this.loadAdminList(true); }
  async loadAdminConversation() { if (!this.adminConversationId) return; try { const d = await app.api(`/api/admin/support/conversations/${this.adminConversationId}/messages`); const h = document.getElementById('support-admin-head'); const m = document.getElementById('support-admin-messages'); if (!m) return; if (h) h.innerHTML = `<div class="flex items-center gap-2">${this.avatar(d.conversation, 'w-8 h-8')}<div><strong class="text-white">${this.esc(d.conversation.username)}</strong><div class="text-[10px] text-slate-500">${this.esc(d.conversation.email)}</div></div></div>`; m.innerHTML = d.messages?.length ? d.messages.map(x => this.messageHtml(x)).join('') : '<div class="h-64 flex items-center justify-center text-slate-500 text-sm">No messages yet.</div>'; m.scrollTop = m.scrollHeight; } catch (e) { app.toast(e.message, 'error'); } }
  async send(event, action) { event.preventDefault(); const prefix = action === 'admin' ? 'support-admin' : 'support-user'; const body = document.getElementById(`${prefix}-body`); const file = document.getElementById(`${prefix}-file`); const form = new FormData(); if (body?.value.trim()) form.append('body', body.value.trim()); if (file?.files[0]) form.append('attachment', file.files[0]); try { if (action === 'admin' && !this.adminConversationId) throw new Error('Select a conversation first.'); const url = action === 'admin' ? `/api/admin/support/conversations/${this.adminConversationId}/messages` : '/api/support/conversation/messages'; await app.api(url, { method: 'POST', body: form }); body.value = ''; file.value = ''; action === 'admin' ? await this.loadAdminConversation() : await this.loadUser(); if (action === 'admin') await this.loadAdminList(true); } catch (e) { app.toast(e.message, 'error'); } }
  addEmoji(id) { const el = document.getElementById(id); if (el) { el.value += `${el.value ? ' ' : ''}😊`; el.focus(); } }
}
window.supportChat = new SupportChatManager();
