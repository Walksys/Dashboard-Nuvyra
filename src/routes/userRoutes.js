const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2, 15) };
const { query } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

// List all users (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await query.all(`
      SELECT u.id, u.uuid, u.username, u.email, u.role, u.two_factor_enabled,
             u.suspended, u.avatar, u.created_at, u.updated_at,
             COUNT(s.id) as server_count,
             COALESCE(SUM(s.memory_mb), 0) as total_memory_mb,
             COALESCE(SUM(s.cpu_limit), 0) as total_cpu_limit,
             COALESCE(SUM(s.disk_mb), 0) as total_disk_mb,
             COALESCE(SUM(CASE WHEN s.is_suspended = 1 OR s.status = 'suspended' THEN 1 ELSE 0 END), 0) as suspended_server_count,
             COALESCE(SUM(CASE WHEN s.is_suspended = 0 AND s.status != 'suspended' THEN 1 ELSE 0 END), 0) as active_server_count,
             COALESCE(SUM(CASE WHEN s.expiration_date IS NOT NULL AND s.expiration_date <= DATE_ADD(NOW(), INTERVAL 3 DAY) THEN 1 ELSE 0 END), 0) as expiring_soon_count
      FROM users u
      LEFT JOIN servers s ON s.user_id = u.id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    res.json({ success: true, users });
  } catch (err) {
    console.error('Failed to retrieve users error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
  }
});

// Create user (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
    }

    const existing = await query.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username or email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userUuid = uuidv4();
    const targetRole = role === 'admin' ? 'admin' : 'user';

    const result = await query.run(
      'INSERT INTO users (uuid, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userUuid, username, email, passwordHash, targetRole]
    );

    logActivity(req.user.id, null, 'USER_CREATE', `Created user: ${username} (${targetRole})`, req);

    res.json({
      success: true,
      message: 'User created successfully!',
      userId: result.lastID
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user details
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await query.get(
      'SELECT id, uuid, username, email, role, two_factor_enabled, suspended, avatar, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit user (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { username, email, password, role, suspended } = req.body;

    const current = await query.get('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    let newHash = current.password_hash;
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      }
      newHash = await bcrypt.hash(password, 10);
    }

    const newUsername = username || current.username;
    const newEmail = email || current.email;
    const newRole = role !== undefined ? role : current.role;
    const newSuspended = suspended !== undefined ? (suspended ? 1 : 0) : current.suspended;

    await query.run(`
      UPDATE users SET
        username = ?,
        email = ?,
        password_hash = ?,
        role = ?,
        suspended = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newUsername, newEmail, newHash, newRole, newSuspended, targetId]);

    logActivity(req.user.id, null, 'USER_EDIT', `Edited user ID: ${targetId} (${newUsername})`, req);

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle suspend user
router.post('/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (parseInt(targetId, 10) === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot suspend your own account.' });
    }

    const user = await query.get('SELECT suspended, username FROM users WHERE id = ?', [targetId]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const newSuspended = user.suspended ? 0 : 1;
    await query.run('UPDATE users SET suspended = ? WHERE id = ?', [newSuspended, targetId]);

    logActivity(req.user.id, null, newSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND', `${newSuspended ? 'Suspended' : 'Unsuspended'} user: ${user.username}`, req);

    res.json({ success: true, suspended: Boolean(newSuspended) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (parseInt(targetId, 10) === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
    }

    const user = await query.get('SELECT username FROM users WHERE id = ?', [targetId]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    await query.run('DELETE FROM users WHERE id = ?', [targetId]);
    logActivity(req.user.id, null, 'USER_DELETE', `Deleted user: ${user.username}`, req);

    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user activity / login history
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (req.user.role !== 'admin' && parseInt(targetId, 10) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const logs = await query.all(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [targetId]
    );

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

