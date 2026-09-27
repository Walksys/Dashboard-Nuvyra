const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Multer storage for branding uploads (logos, backgrounds, music, favicons)
const brandingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.UPLOADS_DIR, 'branding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const uploadBranding = multer({
  storage: brandingStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for background videos/audio
});

// Multer memory storage for server file manager uploads
const serverFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const serverId = req.params.serverId || req.params.id;
    const subPath = req.query.directory || req.body.directory || '';
    const safeSubPath = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '');
    const targetDir = path.join(config.SERVERS_DIR, `server${serverId}`, safeSubPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadServerFile = multer({
  storage: serverFileStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

const userMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.UPLOADS_DIR, 'user-media');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${req.user?.id || 'user'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const imageOnlyFilter = (req, file, cb) => {
  if (!/^image\/(png|jpe?g|gif|webp|avif)$/i.test(file.mimetype || '')) {
    return cb(new Error('Only PNG, JPG, GIF, WEBP, and AVIF images are allowed.'));
  }
  cb(null, true);
};

const uploadUserAvatar = multer({
  storage: userMediaStorage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

const uploadSupportAttachment = multer({
  storage: userMediaStorage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

module.exports = {
  uploadBranding,
  uploadServerFile,
  uploadUserAvatar,
  uploadSupportAttachment
};
