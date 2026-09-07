const express = require('express');
const router = express.Router({ mergeParams: true });
const marketplaceService = require('../services/marketplaceService');
const worldService = require('../services/worldService');
const curseforgeService = require('../services/curseforgeService');
const playitService = require('../services/playitService');
const { authenticate, requireServerAccess } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

// Curated Worlds & Maps
router.get('/maps', async (req, res) => {
  try {
    const data = worldService.getCuratedMaps();
    res.json({ success: true, ...data, curseForgeConfigured: Boolean(curseforgeService.apiKey) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CurseForge Worlds Search
router.get('/curseforge/worlds', async (req, res) => {
  try {
    const { query, gameVersion, pageSize, index } = req.query;
    const result = await curseforgeService.searchWorlds({
      query: query || '',
      gameVersion: gameVersion || '',
      pageSize: pageSize ? parseInt(pageSize, 10) : 24,
      index: index ? parseInt(index, 10) : 0
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CurseForge General Search (mods, plugins, modpacks, etc.)
router.get('/curseforge/search', async (req, res) => {
  try {
    const { classId, query, gameVersion, pageSize, index } = req.query;
    const result = await curseforgeService.search({
      classId: classId || 17,
      query: query || '',
      gameVersion: gameVersion || '',
      pageSize: pageSize ? parseInt(pageSize, 10) : 24,
      index: index ? parseInt(index, 10) : 0
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CurseForge Install World
router.post('/curseforge/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { modId, fileId, customName, setActive } = req.body;
    const result = await curseforgeService.installCurseForgeWorld(serverId, {
      modId,
      fileId,
      customName,
      setActive: setActive !== false
    });
    logActivity(req.user.id, serverId, 'CURSEFORGE_INSTALL', `Installed CurseForge world (${modId}) as "${result.worldName}"`, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Public / Authenticated Search
router.get('/search', async (req, res) => {
  try {
    const { query, projectType, loader, gameVersion, limit, offset, sort } = req.query;
    const result = await marketplaceService.search({
      query: query || '',
      projectType: projectType || 'plugin',
      loader: loader || '',
      gameVersion: gameVersion || '',
      limit: limit ? parseInt(limit, 10) : 24,
      offset: offset ? parseInt(offset, 10) : 0,
      sort: sort || 'downloads'
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Project Details
router.get('/project/:id', async (req, res) => {
  try {
    const project = await marketplaceService.getProjectDetails(req.params.id);
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Project Versions
router.get('/project/:id/versions', async (req, res) => {
  try {
    const { gameVersion, loader } = req.query;
    const versions = await marketplaceService.getProjectVersions(req.params.id, gameVersion, loader);
    res.json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Server-Specific: List Installed Items
router.get('/installed', authenticate, requireServerAccess('files.read'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const installed = await marketplaceService.listInstalled(serverId);
    res.json({ success: true, installed, serverId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Server-Specific: 1-Click Install Item
router.post('/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { downloadUrl, fileName, targetType, projectName } = req.body;

    if (!downloadUrl || !fileName) {
      return res.status(400).json({ success: false, error: 'downloadUrl and fileName are required.' });
    }

    let finalTargetType = targetType || 'plugin';
    const jarType = (req.server?.jar_type || '').toLowerCase();
    const isPluginServer = ['paper', 'purpur', 'spigot', 'bukkit', 'craftbukkit', 'folia', 'pufferfish', 'leaf', 'leaves', 'divinemc', 'velocity', 'bungeecord', 'waterfall'].includes(jarType);
    const isModServer = ['fabric', 'forge', 'neoforge', 'quilt'].includes(jarType);

    if (isPluginServer && (finalTargetType === 'mod' || finalTargetType === 'plugin')) {
      finalTargetType = 'plugin';
    } else if (isModServer && (finalTargetType === 'plugin' || finalTargetType === 'mod')) {
      finalTargetType = 'mod';
    }

    const result = await marketplaceService.installItem(serverId, {
      downloadUrl,
      fileName,
      targetType: finalTargetType
    });

    logActivity(
      req.user.id,
      serverId,
      'MARKETPLACE_INSTALL',
      `Installed ${projectName || fileName} to ${result.directory}/`,
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Server-Specific: Uninstall Item
router.post('/uninstall', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { fileName, directory, targetType } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: 'fileName is required.' });
    }

    const result = await marketplaceService.uninstallItem(serverId, {
      fileName,
      directory,
      targetType
    });

    logActivity(
      req.user.id,
      serverId,
      'MARKETPLACE_UNINSTALL',
      `Uninstalled ${fileName}`,
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// PLAYIT.GG TUNNEL INTEGRATION ROUTES
// -----------------------------------------------------------------------------

// Playit Tunnel Status
router.get('/playit/status', authenticate, async (req, res) => {
  try {
    const serverId = req.params.serverId || req.query.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }
    const status = playitService.getStatus(serverId);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Playit Install
router.post('/playit/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.body.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const result = await playitService.install(serverId, req.body);
    logActivity(
      req.user.id,
      serverId,
      'PLAYIT_INSTALL',
      'Installed Playit.gg tunnel plugin',
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Playit Configure Secret Key
router.post('/playit/configure', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.body.serverId;
    const { secretKey } = req.body;

    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const result = playitService.configure(serverId, { secretKey });
    logActivity(
      req.user.id,
      serverId,
      'PLAYIT_CONFIGURE',
      'Configured Playit.gg tunnel secret key',
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Playit Uninstall
router.post('/playit/uninstall', authenticate, requireServerAccess('files.delete'), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.body.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const result = playitService.uninstall(serverId);
    logActivity(
      req.user.id,
      serverId,
      'PLAYIT_UNINSTALL',
      'Uninstalled Playit.gg tunnel plugin',
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/playit/uninstall', authenticate, requireServerAccess('files.delete'), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.body.serverId || req.query.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const result = playitService.uninstall(serverId);
    logActivity(
      req.user.id,
      serverId,
      'PLAYIT_UNINSTALL',
      'Uninstalled Playit.gg tunnel plugin',
      req
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
