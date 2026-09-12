const express = require('express');
const router = express.Router({ mergeParams: true });
const fs = require('fs');
const path = require('path');
const marketplaceService = require('../services/marketplaceService');
const worldService = require('../services/worldService');
const curseforgeService = require('../services/curseforgeService');
const playitService = require('../services/playitService');
const spigotService = require('../services/spigotService');
const propertiesService = require('../services/propertiesService');
const fileManagerService = require('../services/fileManagerService');
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
    const { query, categoryId, gameVersion, pageSize, page, index, sortField, sortBy, sortOrder } = req.query;
    const result = await curseforgeService.searchWorlds({
      query: query || '',
      categoryId: categoryId || null,
      gameVersion: gameVersion || '',
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      page: page ? parseInt(page, 10) : 1,
      index: index !== undefined ? parseInt(index, 10) : null,
      sortField: sortField ? parseInt(sortField, 10) : null,
      sortBy: sortBy || 'relevancy',
      sortOrder: sortOrder || 'desc'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CurseForge General Search (worlds, mods, plugins, modpacks, etc.)
router.get('/curseforge/search', async (req, res) => {
  try {
    const { classId, class: classParam, categoryId, query, gameVersion, pageSize, page, index, sortField, sortBy, sortOrder } = req.query;
    const targetClass = classParam || classId || 17;
    const result = await curseforgeService.search({
      classId: targetClass,
      categoryId: categoryId || null,
      query: query || '',
      gameVersion: gameVersion || '',
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      page: page ? parseInt(page, 10) : 1,
      index: index !== undefined ? parseInt(index, 10) : null,
      sortField: sortField ? parseInt(sortField, 10) : null,
      sortBy: sortBy || 'relevancy',
      sortOrder: sortOrder || 'desc'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CurseForge Install World
router.post('/curseforge/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
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

// CurseForge Universal Addon Install (plugins, mods, datapacks, resourcepacks)
router.post('/curseforge/install-addon', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
    const { modId, fileId, targetType, customName, projectName } = req.body;
    if (!modId) {
      return res.status(400).json({ success: false, error: 'modId is required.' });
    }

    const result = await curseforgeService.installCurseForgeAddon(serverId, {
      modId,
      fileId,
      targetType: targetType || 'plugin',
      customName
    });
    logActivity(req.user.id, serverId, 'CURSEFORGE_INSTALL', `Installed CurseForge ${targetType || 'addon'} "${projectName || modId}"`, req);
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
    const serverId = req.server?.id || req.params.serverId || req.query?.serverId || req.body?.serverId;
    const installed = await marketplaceService.listInstalled(serverId);
    res.json({ success: true, installed, serverId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Server-Specific: 1-Click Install Item
router.post('/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
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
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
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

// -----------------------------------------------------------------------------
// SPIGOTMC (SPIGET API V2) INTEGRATION ROUTES
// -----------------------------------------------------------------------------

// SpigotMC Search
router.get('/spigot/search', async (req, res) => {
  try {
    const { query, page, size, sort, gameVersion } = req.query;
    const result = await spigotService.search({
      query: query || '',
      page: page ? parseInt(page, 10) : 0,
      size: size ? parseInt(size, 10) : 24,
      sort: sort || '-downloads',
      gameVersion: gameVersion || ''
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SpigotMC Resource Details
router.get('/spigot/resource/:id', async (req, res) => {
  try {
    const resource = await spigotService.getResourceDetails(req.params.id);
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SpigotMC Resource Versions
router.get('/spigot/resource/:id/versions', async (req, res) => {
  try {
    const versions = await spigotService.getResourceVersions(req.params.id);
    res.json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SpigotMC 1-Click Install Plugin
router.post('/spigot/install', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId || req.body.serverId;
    const { resourceId, customName } = req.body;

    if (!resourceId) {
      return res.status(400).json({ success: false, error: 'resourceId is required.' });
    }

    const result = await spigotService.installSpigotPlugin(serverId, resourceId, customName);
    logActivity(
      req.user.id,
      serverId,
      'SPIGOT_INSTALL',
      `Installed Spigot plugin #${resourceId} (${result.fileName})`,
      req
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// PROPERTIES UI (GRAPHICAL SERVER.PROPERTIES)
// -----------------------------------------------------------------------------

// Get server.properties
router.get('/properties', authenticate, requireServerAccess('files.read'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.query?.serverId || req.body?.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }
    const data = propertiesService.getProperties(serverId);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save server.properties
router.post('/properties', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
    const { updates, raw } = req.body;

    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const data = propertiesService.saveProperties(serverId, updates, raw);
    logActivity(
      req.user.id,
      serverId,
      'PROPERTIES_UPDATE',
      'Updated Minecraft server.properties configuration',
      req
    );

    res.json({ success: true, message: 'Configuration saved successfully.', ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// SERVER TOOLS & UTILITIES
// -----------------------------------------------------------------------------

// Clean server logs and crash dumps
router.post('/tools/clean-logs', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'Server ID is required.' });
    }

    const serverRoot = fileManagerService.getServerRoot(serverId);
    let deletedCount = 0;
    let freedBytes = 0;

    // Clean old archived logs
    const logsDir = path.join(serverRoot, 'logs');
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      for (const f of files) {
        if (f.endsWith('.log.gz') || (f.endsWith('.log') && f !== 'latest.log')) {
          try {
            const fPath = path.join(logsDir, f);
            const st = fs.statSync(fPath);
            freedBytes += st.size;
            fs.unlinkSync(fPath);
            deletedCount++;
          } catch (e) {}
        }
      }
    }

    // Clean crash reports
    const crashDir = path.join(serverRoot, 'crash-reports');
    if (fs.existsSync(crashDir)) {
      const files = fs.readdirSync(crashDir);
      for (const f of files) {
        try {
          const fPath = path.join(crashDir, f);
          const st = fs.statSync(fPath);
          freedBytes += st.size;
          fs.unlinkSync(fPath);
          deletedCount++;
        } catch (e) {}
      }
    }

    logActivity(
      req.user.id,
      serverId,
      'LOGS_CLEAN',
      `Cleaned ${deletedCount} archived logs and crash reports (${(freedBytes / (1024 * 1024)).toFixed(2)} MB freed)`,
      req
    );

    res.json({
      success: true,
      deletedCount,
      freedBytes,
      freedMb: (freedBytes / (1024 * 1024)).toFixed(2),
      message: `Cleaned ${deletedCount} archived logs and crash dumps (${(freedBytes / (1024 * 1024)).toFixed(2)} MB freed).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Install curated essential tool preset
router.post('/tools/install-preset', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.server?.id || req.params.serverId || req.body?.serverId || req.query?.serverId;
    const { presetId } = req.body;

    if (!serverId || !presetId) {
      return res.status(400).json({ success: false, error: 'serverId and presetId are required.' });
    }

    const PRESETS = {
      viaversion: {
        name: 'ViaVersion',
        downloadUrl: 'https://hangarcdn.papermc.io/plugins/ViaVersion/ViaVersion/versions/5.2.1/PAPER/ViaVersion-5.2.1.jar',
        fileName: 'ViaVersion.jar',
        targetType: 'plugin',
        fallbackSpigotId: 19254
      },
      viabackwards: {
        name: 'ViaBackwards',
        downloadUrl: 'https://hangarcdn.papermc.io/plugins/ViaVersion/ViaBackwards/versions/5.2.1/PAPER/ViaBackwards-5.2.1.jar',
        fileName: 'ViaBackwards.jar',
        targetType: 'plugin',
        fallbackSpigotId: 27448
      },
      spark: {
        name: 'Spark Profiler',
        downloadUrl: 'https://ci.lucko.me/job/spark/lastSuccessfulBuild/artifact/spark-bukkit/build/libs/spark-bukkit.jar',
        fileName: 'spark.jar',
        targetType: 'plugin',
        fallbackSpigotId: 57242
      },
      chunky: {
        name: 'Chunky World Pre-generator',
        downloadUrl: 'https://hangarcdn.papermc.io/plugins/pop4959/Chunky/versions/1.4.28/PAPER/Chunky-1.4.28.jar',
        fileName: 'Chunky.jar',
        targetType: 'plugin',
        fallbackSpigotId: 81534
      },
      luckperms: {
        name: 'LuckPerms',
        downloadUrl: 'https://download.luckperms.net/1556/bukkit/loader/LuckPerms-Bukkit-5.4.145.jar',
        fileName: 'LuckPerms.jar',
        targetType: 'plugin',
        fallbackSpigotId: 28140
      },
      skinsrestorer: {
        name: 'SkinsRestorer',
        downloadUrl: 'https://github.com/SkinsRestorer/SkinsRestorer/releases/latest/download/SkinsRestorer.jar',
        fileName: 'SkinsRestorer.jar',
        targetType: 'plugin',
        fallbackSpigotId: 2124
      }
    };

    const preset = PRESETS[presetId];
    if (!preset) {
      return res.status(400).json({ success: false, error: `Unknown tool preset: ${presetId}` });
    }

    try {
      const result = await marketplaceService.installItem(serverId, {
        downloadUrl: preset.downloadUrl,
        fileName: preset.fileName,
        targetType: preset.targetType
      });
      logActivity(req.user.id, serverId, 'TOOL_INSTALL', `Installed tool preset "${preset.name}"`, req);
      return res.json({ success: true, ...result, toolName: preset.name });
    } catch (installErr) {
      if (preset.fallbackSpigotId) {
        const spigotResult = await spigotService.installSpigotPlugin(serverId, preset.fallbackSpigotId, preset.fileName);
        logActivity(req.user.id, serverId, 'TOOL_INSTALL', `Installed tool preset "${preset.name}" via SpigotMC`, req);
        return res.json({ success: true, ...spigotResult, toolName: preset.name });
      }
      throw installErr;
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
