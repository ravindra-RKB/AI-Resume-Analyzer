const resumeService = require('../services/resumeService');
const { catchAsync } = require('../utils/errorHandler');
const { AppError } = require('../utils/errorHandler');

/**
 * POST /api/upload-resume
 * Upload and parse a PDF resume.
 */
const uploadResume = catchAsync(async (req, res) => {
  console.log('[Upload] ── POST /api/upload-resume ──────────────────');

  // ── 1. File existence check ─────────────────────────────────────
  if (!req.file) {
    console.warn('[Upload] ⚠️  No file found on request');
    throw new AppError('No file uploaded. Please select a PDF resume to upload.', 400);
  }

  const { originalname, mimetype, size, buffer } = req.file;
  console.log(`[Upload] File: ${originalname}`);
  console.log(`[Upload] Type: ${mimetype}`);
  console.log(`[Upload] Size: ${(size / 1024).toFixed(1)} KB (${size} bytes)`);
  console.log(`[Upload] Buffer: ${buffer ? `${buffer.length} bytes` : 'missing'}`);

  // ── 2. MIME type validation ─────────────────────────────────────
  if (mimetype !== 'application/pdf') {
    console.warn(`[Upload] ⚠️  Rejected — invalid MIME type: ${mimetype}`);
    throw new AppError(
      `Invalid file type "${mimetype}". Only PDF files are accepted. Please upload a .pdf file.`,
      400
    );
  }

  // ── 3. Minimum size check (reject near-empty files) ─────────────
  const MIN_SIZE = 10 * 1024; // 10 KB
  if (size < MIN_SIZE) {
    console.warn(`[Upload] ⚠️  Rejected — file too small: ${size} bytes`);
    throw new AppError(
      `File too small (${(size / 1024).toFixed(1)} KB). A valid resume PDF should be at least 10 KB. The file may be corrupted.`,
      400
    );
  }

  // ── 4. Parse & save ─────────────────────────────────────────────
  const result = await resumeService.uploadResume(req.file);

  console.log(`[Upload] ✅ Success — resumeId: ${result.resumeId}, ${result.wordCount} words, ${result.numPages} page(s)`);

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and parsed successfully.',
    data: result,
  });
});

/**
 * POST /api/analyze-resume
 * Run AI analysis on a saved resume.
 * Accepts either { resumeId } (from DB) or { resumeText, fileName } (direct text).
 */
const analyzeResume = catchAsync(async (req, res) => {
  const { resumeId, resumeText, fileName } = req.body;

  console.log('[Analyze] ── POST /api/analyze-resume ──────────────────');
  console.log(`[Analyze] resumeId: ${resumeId || 'none'}, textLength: ${resumeText?.length || 0}`);

  let result;

  if (resumeId) {
    // Standard flow: fetch from DB and analyze
    result = await resumeService.analyzeResume(resumeId);
  } else if (resumeText && resumeText.trim().length > 50) {
    // Direct text flow: analyze without DB (fallback when MongoDB is unavailable)
    result = await resumeService.analyzeResumeText(resumeText, fileName || 'Resume');
  } else {
    throw new AppError('Please provide a resumeId or resume text to analyze.', 400);
  }

  console.log(`[Analyze] ✅ Analysis complete — score: ${result.overallScore}, atsScore: ${result.atsScore}`);

  res.status(200).json({
    success: true,
    message: 'Resume analyzed successfully.',
    data: result,
  });
});

/**
 * POST /api/match-job
 * Match a resume against a job description.
 * Accepts either { resumeId, jobDescription } or { resumeText, jobDescription }.
 */
const matchJob = catchAsync(async (req, res) => {
  const { resumeId, resumeText, jobDescription } = req.body;

  console.log('[Match] ── POST /api/match-job ──────────────────');

  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new AppError('Job description must be at least 20 characters long.', 400);
  }

  let result;

  if (resumeId) {
    result = await resumeService.matchJob(resumeId, jobDescription.trim());
  } else if (resumeText && resumeText.trim().length > 50) {
    result = await resumeService.matchJobText(resumeText, jobDescription.trim());
  } else {
    throw new AppError('Please provide a resumeId or resume text to match.', 400);
  }

  console.log(`[Match] ✅ Complete — score: ${result.matchScore}`);

  res.status(200).json({
    success: true,
    message: 'Job matching completed.',
    data: result,
  });
});

/**
 * POST /api/improve-resume
 * AI-rewrite bullet points.
 */
const improveResume = catchAsync(async (req, res) => {
  const { resumeId, bulletPoints } = req.body;

  if (!resumeId) {
    throw new AppError('resumeId is required.', 400);
  }
  if (!bulletPoints || bulletPoints.trim().length < 10) {
    throw new AppError('Please provide bullet points to improve (at least 10 characters).', 400);
  }

  const result = await resumeService.improveResume(resumeId, bulletPoints.trim());

  res.status(200).json({
    success: true,
    message: 'Resume improvements generated.',
    data: result,
  });
});

/**
 * GET /api/history
 * Fetch past analyses and match scores.
 */
const getHistory = catchAsync(async (req, res) => {
  const result = await resumeService.getHistory();

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = { uploadResume, analyzeResume, matchJob, improveResume, getHistory };
