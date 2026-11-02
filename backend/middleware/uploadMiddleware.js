const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cleancity-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp'
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  const mimeType = (file.mimetype || '').toLowerCase().trim();
  const ext = path.extname(file.originalname || '').toLowerCase().trim();

  const isMimeValid =
    allowedMimeTypes.includes(mimeType) ||
    mimeType === 'image/jpeg' ||
    mimeType === 'image/jpg' ||
    mimeType === 'image/pjpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp';

  const isExtValid = allowedExts.includes(ext) || ext === '';

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    const err = new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed!');
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
