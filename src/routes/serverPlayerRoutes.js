const express = require('express');
const router = express.Router({ mergeParams: true });
const playerService = require('../services/playerService');
const { authenticate, requireServerAccess } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

// Get all player data for a server
router.get('/', authenticate, requireServerAccess(), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.params.id;
    const data = await playerService.getServerPlayersData(serverId);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('[serverPlayerRoutes] Fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get specific player details: Inventory, Statistics & Advancements
router.get('/:player/details', authenticate, requireServerAccess(), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.params.id;
    const player = req.params.player;
    const details = await playerService.getPlayerDetails(serverId, player);
    res.json({ success: true, ...details });
  } catch (err) {
    console.error('[serverPlayerRoutes] Player details error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute player management action
router.post('/action', authenticate, requireServerAccess(), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.params.id;
    const { action, username } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action parameter is required.' });
    }

    const result = await playerService.executeAction(serverId, req.body);
    
    // Log activity
    logActivity(
      req.user.id,
      serverId,
      'PLAYER_' + action.toUpperCase().replace(/-/g, '_'),
      result.message || `Executed ${action} on ${username || 'server'}`,
      req
    );

    res.json(result);
  } catch (err) {
    console.error('[serverPlayerRoutes] Action error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
