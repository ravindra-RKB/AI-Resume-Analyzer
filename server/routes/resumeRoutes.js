const express = require('express');
const router = express.Router();
const { upload } = require('../utils/validators');
const {
  uploadResume,
  analyzeResume,
  matchJob,
  improveResume,
  getHistory,
} = require('../controllers/resumeController');

// Resume upload (PDF only, max 10MB)
router.post('/upload-resume', upload.single('resume'), uploadResume);

// AI analysis
router.post('/analyze-resume', analyzeResume);

// Job matching
router.post('/match-job', matchJob);

// Resume improvement
router.post('/improve-resume', improveResume);

// History
router.get('/history', getHistory);

module.exports = router;
