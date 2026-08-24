const express = require('express');
const router = express.Router({ mergeParams: true });
const path = require('path');
const fs = require('fs');
const fileManagerService = require('../services/fileManagerService');
const { authenticate, requireServerAccess } = require('../middleware/auth');
const { uploadServerFile } = require('../middleware/upload');
const { logActivity } = require('../services/activityService');

// List directory
router.get('/', authenticate, requireServerAccess('files.read'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const directory = req.query.directory || '';
    const files = await fileManagerService.listFiles(serverId, directory);
    res.json({ success: true, files, directory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Read file content
router.get('/content', authenticate, requireServerAccess('files.read'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const filePath = req.query.file;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path query parameter is required.' });
    }
    const content = await fileManagerService.readFileContent(serverId, filePath);
    res.json({ success: true, content, filePath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Download raw file
router.get('/download', authenticate, requireServerAccess('files.read'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const filePath = req.query.file;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path required.' });
    }
    const safePath = fileManagerService.getSafePath(serverId, filePath);
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }
    res.download(safePath, path.basename(safePath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save file content
router.post('/content', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'filePath is required.' });
    }
    await fileManagerService.writeFileContent(serverId, filePath, content || '');
    logActivity(req.user.id, serverId, 'FILE_EDIT', `Edited file: ${filePath}`, req);
    res.json({ success: true, message: 'File saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Directory
router.post('/directory', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { dirPath } = req.body;
    if (!dirPath) {
      return res.status(400).json({ success: false, error: 'dirPath is required.' });
    }
    await fileManagerService.createDirectory(serverId, dirPath);
    logActivity(req.user.id, serverId, 'FILE_MKDIR', `Created folder: ${dirPath}`, req);
    res.json({ success: true, message: 'Folder created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rename file/folder
router.post('/rename', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, error: 'oldPath and newPath are required.' });
    }
    await fileManagerService.renameItem(serverId, oldPath, newPath);
    logActivity(req.user.id, serverId, 'FILE_RENAME', `Renamed ${oldPath} to ${newPath}`, req);
    res.json({ success: true, message: 'Item renamed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete file/folder
router.post('/delete', authenticate, requireServerAccess('files.delete'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { itemPath } = req.body;
    if (!itemPath) {
      return res.status(400).json({ success: false, error: 'itemPath is required.' });
    }
    await fileManagerService.deleteItem(serverId, itemPath);
    logActivity(req.user.id, serverId, 'FILE_DELETE', `Deleted: ${itemPath}`, req);
    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload File
router.post('/upload', authenticate, requireServerAccess('files.write'), uploadServerFile.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }
    const serverId = req.params.serverId;
    logActivity(req.user.id, serverId, 'FILE_UPLOAD', `Uploaded: ${req.file.originalname}`, req);
    res.json({ success: true, fileName: req.file.originalname });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Compress / Zip Files
router.post('/compress', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { files, outputName } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Files array is required.' });
    }
    const result = await fileManagerService.compressFiles(serverId, files, outputName || 'archive.zip');
    logActivity(req.user.id, serverId, 'FILE_COMPRESS', `Compressed ${files.length} items`, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Extract Zip File
router.post('/extract', authenticate, requireServerAccess('files.write'), async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { zipFilePath, destPath } = req.body;
    if (!zipFilePath) {
      return res.status(400).json({ success: false, error: 'zipFilePath is required.' });
    }
    await fileManagerService.extractZip(serverId, zipFilePath, destPath || '');
    logActivity(req.user.id, serverId, 'FILE_EXTRACT', `Extracted ${zipFilePath}`, req);
    res.json({ success: true, message: 'Archive extracted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

