const express = require('express');
const router = express.Router();
const path = require('path');
const { query } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadBranding } = require('../middleware/upload');
const imagesConfig = require('../config/images');
const { logActivity } = require('../services/activityService');

// Get Public Settings (Accessible by all users and guests)
router.get('/public', async (req, res) => {
  try {
    const rows = await query.all('SELECT key, value FROM settings');
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    res.json({
      success: true,
      settings,
      wallpaperPresets: imagesConfig.categoriesWallpapers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load public settings.' });
  }
});

// Get All Settings (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM settings');
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    res.json({
      success: true,
      settings,
      wallpaperPresets: imagesConfig.categoriesWallpapers,
      dockerTemplates: {
        minecraft: imagesConfig.minecraft,
        nodejs: imagesConfig.nodejs,
        python: imagesConfig.python
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load admin settings.' });
  }
});

// Update Settings (Admin only)
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const allowedKeys = [
      'panel_name',
      'panel_logo',
      'favicon_name',
      'favicon_logo',
      'panel_bg',
      'panel_bg_type',
      'panel_bg_category',
      'panel_music_url',
      'panel_music_title',
      'panel_music_enabled',
      'panel_music_volume',
      'transparency_bar',
      'blur_bar',
      'registration_enabled'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key)) {
        await query.run(
          'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          [key, String(value)]
        );
      }
    }

    logActivity(req.user.id, null, 'SETTINGS_UPDATE', 'Updated global panel settings', req);

    res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
});

// Upload Branding Media (Logo, Favicon, Background image/video, Music)
router.post('/upload', authenticate, requireAdmin, uploadBranding.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/branding/${req.file.filename}`;
    const fileType = req.body.type; // 'logo' | 'favicon' | 'background' | 'music'

    if (fileType) {
      const keyMap = {
        logo: 'panel_logo',
        favicon: 'favicon_logo',
        background: 'panel_bg',
        music: 'panel_music_url'
      };
      const settingKey = keyMap[fileType];
      if (settingKey) {
        await query.run(
          'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          [settingKey, fileUrl]
        );
      }
    }

    res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload branding asset.' });
  }
});

module.exports = router;

