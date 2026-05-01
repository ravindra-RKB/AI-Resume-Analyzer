const Resume = require('../models/Resume');
const { parseResume } = require('./pdfService');
const aiService = require('./aiService');
const { AppError } = require('../utils/errorHandler');

/**
 * Upload and parse a PDF resume, save to database.
 * If MongoDB is unavailable, parsing still succeeds and results are returned
 * (resumeId will be null, so AI features won't work until DB is connected).
 */
async function uploadResume(file) {
  const fileMeta = {
    size: file.size,
    mimetype: file.mimetype,
    originalname: file.originalname,
  };

  // ── 1. Parse PDF (always works, no DB needed) ──────────────────
  const { text, numPages, wordCount } = await parseResume(file.buffer, fileMeta);

  // ── 2. Attempt to save to database ─────────────────────────────
  let resumeId = null;
  let savedFileName = file.originalname;

  try {
    const resume = await Resume.create({
      fileName: file.originalname,
      originalText: text,
      wordCount,
    });
    resumeId = resume._id;
    savedFileName = resume.fileName;
    console.log('[ResumeService] ✅ Saved to MongoDB — id:', resumeId);
  } catch (dbError) {
    console.warn('[ResumeService] ⚠️  MongoDB save failed:', dbError.message);
    console.warn('[ResumeService] Returning parsed data without database persistence.');
  }

  return {
    resumeId,
    fileName: savedFileName,
    textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    wordCount,
    numPages,
  };
}

/**
 * Analyze resume text directly (without DB lookup).
 * Used when MongoDB is unavailable and no resumeId exists.
 */
async function analyzeResumeText(resumeText, fileName) {
  const analysis = await aiService.analyzeResume(resumeText);

  return {
    resumeId: null,
    fileName,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    missingSkills: analysis.missingSkills || [],
    overallScore: analysis.overallScore || 0,
    atsScore: analysis.atsScore || 0,
    summary: analysis.summary || '',
    isDemo: analysis.isDemo || false,
  };
}

/**
 * Run AI analysis on a saved resume (requires DB).
 */
async function analyzeResume(resumeId) {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError('Resume not found.', 404);

  const analysis = await aiService.analyzeResume(resume.originalText);

  resume.analysis = {
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    missingSkills: analysis.missingSkills || [],
    overallScore: analysis.overallScore || 0,
    summary: analysis.summary || '',
    isAnalyzed: true,
  };
  resume.atsScore = analysis.atsScore || 0;

  await resume.save();

  return {
    resumeId: resume._id,
    fileName: resume.fileName,
    strengths: resume.analysis.strengths,
    weaknesses: resume.analysis.weaknesses,
    missingSkills: resume.analysis.missingSkills,
    overallScore: resume.analysis.overallScore,
    atsScore: resume.atsScore,
    summary: resume.analysis.summary,
  };
}

/**
 * Match a resume against a job description.
 */
async function matchJob(resumeId, jobDescription) {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError('Resume not found.', 404);

  const match = await aiService.matchJob(resume.originalText, jobDescription);

  const jobMatch = {
    jobTitle: match.jobTitle || 'Untitled Position',
    jobDescription,
    matchScore: match.matchScore || 0,
    matchedSkills: match.matchedSkills || [],
    missingSkills: match.missingSkills || [],
    recommendation: match.recommendation || '',
    matchedAt: new Date(),
  };

  resume.jobMatches.push(jobMatch);
  await resume.save();

  return {
    resumeId: resume._id,
    ...jobMatch,
  };
}

/**
 * Match resume text against a job description directly (without DB).
 */
async function matchJobText(resumeText, jobDescription) {
  const match = await aiService.matchJob(resumeText, jobDescription);

  return {
    resumeId: null,
    jobTitle: match.jobTitle || 'Target Position',
    jobDescription,
    matchScore: match.matchScore || 0,
    matchedSkills: match.matchedSkills || [],
    missingSkills: match.missingSkills || [],
    recommendation: match.recommendation || '',
    isDemo: match.isDemo || false,
  };
}

/**
 * Improve resume bullet points using AI.
 */
async function improveResume(resumeId, bulletPoints) {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new AppError('Resume not found.', 404);

  const result = await aiService.improveResume(bulletPoints);

  if (result.improvements && result.improvements.length > 0) {
    result.improvements.forEach((imp) => {
      resume.improvements.push({
        original: imp.original,
        improved: imp.improved,
      });
    });
    await resume.save();
  }

  return {
    resumeId: resume._id,
    improvements: result.improvements || [],
  };
}

/**
 * Fetch analysis history for the dashboard.
 */
async function getHistory() {
  try {
    const resumes = await Resume.find()
      .select('fileName analysis.overallScore atsScore jobMatches.matchScore jobMatches.jobTitle createdAt analysis.isAnalyzed')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const totalResumes = resumes.length;
    const analyzedResumes = resumes.filter((r) => r.analysis?.isAnalyzed);

    const avgAtsScore =
      analyzedResumes.length > 0
        ? Math.round(analyzedResumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / analyzedResumes.length)
        : 0;

    const allMatches = resumes.flatMap((r) => r.jobMatches || []);
    const avgMatchScore =
      allMatches.length > 0
        ? Math.round(allMatches.reduce((sum, m) => sum + (m.matchScore || 0), 0) / allMatches.length)
        : 0;

    return {
      stats: {
        totalResumes,
        totalAnalyzed: analyzedResumes.length,
        totalMatches: allMatches.length,
        avgAtsScore,
        avgMatchScore,
      },
      resumes: resumes.map((r) => ({
        id: r._id,
        fileName: r.fileName,
        overallScore: r.analysis?.overallScore || 0,
        atsScore: r.atsScore || 0,
        isAnalyzed: r.analysis?.isAnalyzed || false,
        matchCount: r.jobMatches?.length || 0,
        latestMatch: r.jobMatches?.[r.jobMatches.length - 1] || null,
        createdAt: r.createdAt,
      })),
    };
  } catch (error) {
    console.warn('[ResumeService] ⚠️ Failed to fetch history, database might be down:', error.message);
    return {
      stats: {
        totalResumes: 0,
        totalAnalyzed: 0,
        totalMatches: 0,
        avgAtsScore: 0,
        avgMatchScore: 0,
      },
      resumes: [],
    };
  }
}

module.exports = { uploadResume, analyzeResume, analyzeResumeText, matchJob, matchJobText, improveResume, getHistory };
