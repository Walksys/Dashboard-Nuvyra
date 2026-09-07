const axios = require('axios');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const config = require('../config/config');
const fileManagerService = require('./fileManagerService');

const CURSEFORGE_BASE_URL = 'https://api.curseforge.com/v1';
const MINECRAFT_GAME_ID = 432;

// CurseForge Class IDs for Minecraft
const CLASS_IDS = {
  plugins: 5,
  mods: 6,
  resourcepacks: 12,
  worlds: 17,
  modpacks: 4471,
  datapacks: 6945
};

class CurseForgeService {
  constructor() {
    this.apiKey = config.CURSEFORGE_API_KEY || '$2a$10$iZYWa6jrmyz7hN69sfmInes1FAqrn2ycR.ZdrKKrtOpz/Tn9ETMcK';
  }

  getClient() {
    return axios.create({
      baseURL: CURSEFORGE_BASE_URL,
      timeout: 15000,
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Mpanel-Game-Server-Panel/1.0.0'
      }
    });
  }

  /**
   * Search CurseForge for worlds, maps, mods, or plugins
   */
  async search({ classId = 17, query = '', gameVersion = '', pageSize = 20, index = 0, sortField = 2, sortOrder = 'desc' }) {
    try {
      const client = this.getClient();
      const params = {
        gameId: MINECRAFT_GAME_ID,
        classId: Number(classId),
        pageSize: Math.min(Number(pageSize) || 20, 50),
        index: Number(index) || 0,
        sortField: Number(sortField) || 2, // 1: Featured, 2: Popularity, 3: LastUpdated, 4: Name, 5: TotalDownloads
        sortOrder: sortOrder || 'desc'
      };

      if (query && query.trim()) {
        params.searchFilter = query.trim();
      }
      if (gameVersion && gameVersion !== 'all') {
        params.gameVersion = gameVersion;
      }

      const res = await client.get('/mods/search', { params });
      const rawData = res.data?.data || [];
      const pagination = res.data?.pagination || {};

      const items = rawData.map(item => {
        const latestFile = (item.latestFiles || [])[0] || null;
        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          summary: item.summary,
          downloadCount: item.downloadCount,
          thumbsUpCount: item.thumbsUpCount,
          logoUrl: item.logo?.thumbnailUrl || item.logo?.url || '/assets/favicon.svg',
          authors: (item.authors || []).map(a => a.name).join(', '),
          websiteUrl: item.links?.websiteUrl || `https://www.curseforge.com/minecraft/worlds/${item.slug}`,
          categories: (item.categories || []).map(c => ({ id: c.id, name: c.name, slug: c.slug })),
          latestFile: latestFile ? {
            id: latestFile.id,
            displayName: latestFile.displayName,
            fileName: latestFile.fileName,
            downloadUrl: latestFile.downloadUrl,
            fileLength: latestFile.fileLength,
            gameVersions: latestFile.gameVersions || []
          } : null,
          source: 'curseforge'
        };
      });

      return {
        success: true,
        source: 'curseforge',
        totalHits: pagination.totalCount || items.length,
        index: pagination.index || index,
        pageSize: pagination.pageSize || pageSize,
        items
      };
    } catch (err) {
      console.warn('[CurseForgeService] search error:', err.response?.data || err.message);
      return {
        success: false,
        source: 'curseforge',
        error: err.response?.data?.message || err.message,
        items: [],
        totalHits: 0
      };
    }
  }

  /**
   * Search CurseForge specifically for Minecraft Worlds / Maps (classId: 17)
   */
  async searchWorlds({ query = '', gameVersion = '', pageSize = 24, index = 0 }) {
    return this.search({
      classId: CLASS_IDS.worlds,
      query,
      gameVersion,
      pageSize,
      index,
      sortField: 2, // Downloads / popularity
      sortOrder: 'desc'
    });
  }

  /**
   * Get single project details from CurseForge
   */
  async getMod(modId) {
    try {
      const client = this.getClient();
      const res = await client.get(`/mods/${encodeURIComponent(modId)}`);
      return res.data?.data || null;
    } catch (err) {
      console.warn('[CurseForgeService] getMod error:', err.response?.data || err.message);
      throw new Error(`Failed to load CurseForge project: ${err.message}`);
    }
  }

  /**
   * Get project downloadable files
   */
  async getModFiles(modId, gameVersion = null) {
    try {
      const client = this.getClient();
      const params = {};
      if (gameVersion) params.gameVersion = gameVersion;
      const res = await client.get(`/mods/${encodeURIComponent(modId)}/files`, { params });
      return res.data?.data || [];
    } catch (err) {
      console.warn('[CurseForgeService] getModFiles error:', err.message);
      throw new Error(`Failed to fetch CurseForge files: ${err.message}`);
    }
  }

  /**
   * Download and install a CurseForge world directly into server
   */
  async installCurseForgeWorld(serverId, { modId, fileId, customName = '', setActive = true }) {
    const client = this.getClient();
    let downloadUrl = null;
    let fileName = 'world.zip';

    if (fileId) {
      const fileRes = await client.get(`/mods/${modId}/files/${fileId}`);
      downloadUrl = fileRes.data?.data?.downloadUrl;
      fileName = fileRes.data?.data?.fileName || fileName;
    } else {
      const mod = await this.getMod(modId);
      const primaryFile = (mod.latestFiles || [])[0];
      downloadUrl = primaryFile?.downloadUrl;
      fileName = primaryFile?.fileName || fileName;
    }

    if (!downloadUrl) {
      // CurseForge requires direct browser download for authors who opt out of API distribution
      throw new Error('This map does not allow automated direct API download by author policy. Please use "Direct URL" with the CurseForge file link.');
    }

    // Call worldService.installWorldFromUrl
    const worldService = require('./worldService');
    return worldService.installWorldFromUrl(serverId, {
      downloadUrl,
      customName,
      setActive
    });
  }
}

module.exports = new CurseForgeService();

