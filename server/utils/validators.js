const { AppError } = require('./errorHandler');
const multer = require('multer');
const path = require('path');

/**
 * Multer configuration for PDF uploads.
 * - Stores files in memory (buffer)
 * - Accepts only PDF files
 * - Max file size: 10MB
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new AppError('Only PDF files are allowed.', 400), false);
  }
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError('Invalid file type. Only PDF files are accepted.', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Validates that required fields exist on the request body.
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }
    next();
  };
};

/**
 * Validates a MongoDB ObjectId parameter.
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.body[paramName] || req.params[paramName];
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(`Invalid ${paramName}. Please provide a valid ID.`, 400));
    }
    next();
  };
};

module.exports = { upload, validateRequired, validateObjectId };
