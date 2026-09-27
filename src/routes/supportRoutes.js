const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadSupportAttachment } = require('../middleware/upload');

async function getOrCreateConversation(userId) {
  let conversation = await query.get(
    'SELECT id, user_id, status, last_message_at, created_at, updated_at FROM support_conversations WHERE user_id = ?',
    [userId]
  );
  if (!conversation) {
    const result = await query.run('INSERT INTO support_conversations (user_id) VALUES (?)', [userId]);
    conversation = await query.get(
      'SELECT id, user_id, status, last_message_at, created_at, updated_at FROM support_conversations WHERE id = ?',
      [result.lastID]
    );
  }
  return conversation;
}

function canAccess(conversation, user) {
  return Boolean(conversation && (user.role === 'admin' || Number(conversation.user_id) === Number(user.id)));
}

async function listMessages(conversationId) {
  return query.all(`
    SELECT m.id, m.conversation_id, m.sender_id, m.sender_type, m.body,
           m.attachment_url, m.attachment_name, m.attachment_mime, m.attachment_size, m.created_at,
           u.username AS sender_username, u.email AS sender_email, u.avatar AS sender_avatar
    FROM support_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC
  `, [conversationId]);
}

async function addMessage(conversation, user, file, body) {
  const text = String(body || '').trim();
  if (!text && !file) throw new Error('Message text or an image is required.');
  const senderType = user.role === 'admin' ? 'staff' : 'user';
  const attachmentUrl = file ? `/uploads/user-media/${file.filename}` : null;
  await query.run(`
    INSERT INTO support_messages
      (conversation_id, sender_id, sender_type, body, attachment_url, attachment_name, attachment_mime, attachment_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [conversation.id, user.id, senderType, text || null, attachmentUrl, file?.originalname || null, file?.mimetype || null, file?.size || null]);
  await query.run("UPDATE support_conversations SET status = 'open', last_message_at = CURRENT_TIMESTAMP WHERE id = ?", [conversation.id]);
  return listMessages(conversation.id);
}

// User-facing private thread. There is exactly one conversation per user.
router.get('/support/conversation', authenticate, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.user.id);
    res.json({ success: true, conversation, messages: await listMessages(conversation.id) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load Staff Chat.' });
  }
});

router.post('/support/conversation/messages', authenticate, uploadSupportAttachment.single('attachment'), async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.user.id);
    const messages = await addMessage(conversation, req.user, req.file, req.body.body);
    res.json({ success: true, conversation: await query.get('SELECT * FROM support_conversations WHERE id = ?', [conversation.id]), messages });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Could not send message.' });
  }
});

// Admin inbox: each user is a separate selectable thread.
router.get('/admin/support/conversations', authenticate, requireAdmin, async (req, res) => {
  try {
    const conversations = await query.all(`
      SELECT c.id, c.user_id, c.status, c.last_message_at, c.created_at, c.updated_at,
             u.username, u.email, u.avatar,
             (SELECT COUNT(*) FROM support_messages m WHERE m.conversation_id = c.id AND m.sender_type = 'user') AS message_count
      FROM support_conversations c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.last_message_at DESC, c.id DESC
    `);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load Staff Chat inbox.' });
  }
});

router.get('/admin/support/conversations/:conversationId/messages', authenticate, requireAdmin, async (req, res) => {
  try {
    const conversation = await query.get(`
      SELECT c.*, u.username, u.email, u.avatar FROM support_conversations c
      JOIN users u ON u.id = c.user_id WHERE c.id = ?
    `, [req.params.conversationId]);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
    res.json({ success: true, conversation, messages: await listMessages(conversation.id) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load conversation.' });
  }
});

router.post('/admin/support/conversations/:conversationId/messages', authenticate, requireAdmin, uploadSupportAttachment.single('attachment'), async (req, res) => {
  try {
    const conversation = await query.get('SELECT * FROM support_conversations WHERE id = ?', [req.params.conversationId]);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
    const messages = await addMessage(conversation, req.user, req.file, req.body.body);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Could not send staff message.' });
  }
});

router.patch('/admin/support/conversations/:conversationId', authenticate, requireAdmin, async (req, res) => {
  const status = ['open', 'closed'].includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Status must be open or closed.' });
  await query.run('UPDATE support_conversations SET status = ? WHERE id = ?', [status, req.params.conversationId]);
  res.json({ success: true });
});

module.exports = router;
