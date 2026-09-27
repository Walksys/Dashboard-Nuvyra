const { query } = require('../database/db');

const WEBHOOK_KEY = 'discord_webhook_url';
const DISCORD_WEBHOOK_RE = /^https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/i;

function clean(value, fallback = 'Unknown') {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text ? text.slice(0, 1024) : fallback;
}

function validWebhookUrl(value) {
  return typeof value === 'string' && value.length <= 2048 && DISCORD_WEBHOOK_RE.test(value.trim());
}

async function getWebhookUrl() {
  const row = await query.get('SELECT `value` FROM settings WHERE `key` = ?', [WEBHOOK_KEY]);
  const value = row && row.value ? String(row.value).trim() : '';
  return validWebhookUrl(value) ? value : '';
}

async function send(payload) {
  try {
    const url = await getWebhookUrl();
    if (!url || typeof fetch !== 'function') return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': 'Nuvyra-Discord-Webhook/1.0' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) {
        console.warn(`Discord WebHook notification failed with HTTP ${response.status}`);
        return false;
      }
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.warn('Discord WebHook notification skipped:', error.name === 'AbortError' ? 'timeout' : error.message);
    return false;
  }
}

function userFields(user, label = 'User') {
  return [
    { name: `${label} Username`, value: clean(user && user.username), inline: true },
    { name: `${label} Email`, value: clean(user && user.email), inline: true },
    { name: `${label} ID`, value: clean(user && user.id), inline: true }
  ];
}

async function notifyUserRegistered({ user, provider = 'Panel', profile = null }) {
  const providerName = clean(provider, 'Panel');
  const fields = userFields(user, 'Panel User');
  fields.push({ name: 'Registration Method', value: providerName, inline: true });

  if (profile && profile.id) {
    fields.push({ name: `${providerName} Account ID`, value: clean(profile.id), inline: true });
  }
  if (providerName.toLowerCase() === 'discord' && profile && profile.id) {
    fields.push({ name: 'Discord Profile', value: `https://discord.com/users/${encodeURIComponent(profile.id)}`, inline: false });
  }

  return send({
    username: 'Nuvyra Notifications',
    avatar_url: user && user.avatar ? user.avatar : undefined,
    embeds: [{
      title: 'New User Registration',
      description: 'A new account was created on the panel.',
      color: providerName.toLowerCase() === 'discord' ? 0x5865f2 : 0x4285f4,
      fields,
      thumbnail: user && user.avatar ? { url: user.avatar } : undefined,
      timestamp: new Date().toISOString(),
      footer: { text: 'Nuvyra Panel' }
    }]
  });
}

async function notifyServerCreated({ server, actor, owner, source = 'Admin/API' }) {
  const fields = [
    { name: 'Server Name', value: clean(server && server.name), inline: true },
    { name: 'Server Type', value: clean(server && server.server_type), inline: true },
    { name: 'Server ID', value: clean(server && server.id), inline: true },
    { name: 'Created By', value: `${clean(actor && actor.username)} (${clean(actor && actor.email)})`, inline: false },
    { name: 'Owner', value: `${clean(owner && owner.username)} (${clean(owner && owner.email)})`, inline: false },
    { name: 'Source', value: clean(source), inline: true }
  ];

  return send({
    username: 'Nuvyra Notifications',
    avatar_url: owner && owner.avatar ? owner.avatar : undefined,
    embeds: [{
      title: 'Server Created',
      description: 'A new server was created on the panel.',
      color: 0x22c55e,
      fields,
      thumbnail: owner && owner.avatar ? { url: owner.avatar } : undefined,
      timestamp: new Date().toISOString(),
      footer: { text: 'Nuvyra Panel' }
    }]
  });
}

module.exports = {
  WEBHOOK_KEY,
  validWebhookUrl,
  getWebhookUrl,
  notifyUserRegistered,
  notifyServerCreated
};
