const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const config = require('../config/config');

class FileManagerService {
  getServerRoot(serverId) {
    const root = path.join(config.SERVERS_DIR, `server${serverId}`);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return root;
  }

  getSafePath(serverId, subPath = '') {
    const root = this.getServerRoot(serverId);
    const resolved = path.resolve(root, subPath.replace(/^[\/\\]+/, ''));
    if (!resolved.startsWith(root)) {
      throw new Error('Access denied: Path is outside server root directory.');
    }
    return resolved;
  }

  async listFiles(serverId, subPath = '') {
    const safePath = this.getSafePath(serverId, subPath);
    if (!fs.existsSync(safePath)) {
      return [];
    }

    const items = await fs.promises.readdir(safePath, { withFileTypes: true });
    const result = [];

    for (const item of items) {
      const fullPath = path.join(safePath, item.name);
      try {
        const stats = await fs.promises.stat(fullPath);
        result.push({
          name: item.name,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          isSymlink: item.isSymbolicLink(),
          size: item.isDirectory() ? 0 : stats.size,
          mode: stats.mode.toString(8),
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
          extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase().replace('.', '')
        });
      } catch (err) {
        // Skip unreadable files
      }
    }

    // Sort: directories first, then alphabetically
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  async readFileContent(serverId, filePath) {
    const safePath = this.getSafePath(serverId, filePath);
    const stats = await fs.promises.stat(safePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB limit for text editor
      throw new Error('File is too large to edit in the web browser (Limit: 10MB).');
    }
    return fs.promises.readFile(safePath, 'utf8');
  }

  async writeFileContent(serverId, filePath, content) {
    const safePath = this.getSafePath(serverId, filePath);
    const parentDir = path.dirname(safePath);
    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }
    await fs.promises.writeFile(safePath, content, 'utf8');
    return { success: true, path: filePath };
  }

  async createDirectory(serverId, dirPath) {
    const safePath = this.getSafePath(serverId, dirPath);
    if (fs.existsSync(safePath)) {
      throw new Error('Directory or file already exists.');
    }
    await fs.promises.mkdir(safePath, { recursive: true });
    return { success: true };
  }

  async renameItem(serverId, oldPath, newPath) {
    const safeOld = this.getSafePath(serverId, oldPath);
    const safeNew = this.getSafePath(serverId, newPath);
    if (!fs.existsSync(safeOld)) {
      throw new Error('Original file/directory does not exist.');
    }
    if (fs.existsSync(safeNew)) {
      throw new Error('Target destination name already exists.');
    }
    await fs.promises.rename(safeOld, safeNew);
    return { success: true };
  }

  async deleteItem(serverId, itemPath) {
    const safePath = this.getSafePath(serverId, itemPath);
    if (!fs.existsSync(safePath)) {
      throw new Error('File or directory not found.');
    }
    const root = this.getServerRoot(serverId);
    if (safePath === root) {
      throw new Error('Cannot delete the root server directory.');
    }
    const stats = await fs.promises.stat(safePath);
    if (stats.isDirectory()) {
      await fs.promises.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(safePath);
    }
    return { success: true };
  }

  async compressFiles(serverId, targetFiles = [], outputName = 'archive.zip') {
    const root = this.getServerRoot(serverId);
    const zipPath = path.join(root, outputName.endsWith('.zip') ? outputName : `${outputName}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve({ success: true, zipFile: path.basename(zipPath), size: archive.pointer() }));
      archive.on('error', err => reject(err));

      archive.pipe(output);

      for (const item of targetFiles) {
        const itemSafe = this.getSafePath(serverId, item);
        const stat = fs.statSync(itemSafe);
        if (stat.isDirectory()) {
          archive.directory(itemSafe, path.basename(item));
        } else {
          archive.file(itemSafe, { name: path.basename(item) });
        }
      }

      archive.finalize();
    });
  }

  async extractZip(serverId, zipFilePath, destSubPath = '') {
    const safeZip = this.getSafePath(serverId, zipFilePath);
    const destPath = this.getSafePath(serverId, destSubPath);

    if (!fs.existsSync(safeZip)) {
      throw new Error('Zip file not found.');
    }

    return new Promise((resolve, reject) => {
      fs.createReadStream(safeZip)
        .pipe(unzipper.Extract({ path: destPath }))
        .on('close', () => resolve({ success: true }))
        .on('error', err => reject(err));
    });
  }
}

module.exports = new FileManagerService();

