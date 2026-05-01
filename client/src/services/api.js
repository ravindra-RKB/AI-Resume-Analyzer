import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

/**
 * Upload a PDF resume file.
 * NOTE: Do NOT manually set Content-Type — axios auto-sets it with the
 * correct multipart boundary when it detects a FormData body.
 */
export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('resume', file);

  console.log('[Upload] Sending file:', file.name, `(${(file.size / 1024).toFixed(1)} KB)`);

  const response = await api.post('/upload-resume', formData);
  console.log('[Upload] Server response:', response.data);
  return response.data;
}

/**
 * Run AI analysis on a saved resume.
 * Supports two modes:
 *   1. By ID: analyzeResume(resumeId)
 *   2. Direct text: analyzeResume(null, resumeText, fileName)
 */
export async function analyzeResume(resumeId, resumeText, fileName) {
  const body = {};
  if (resumeId) body.resumeId = resumeId;
  if (resumeText) body.resumeText = resumeText;
  if (fileName) body.fileName = fileName;

  const response = await api.post('/analyze-resume', body);
  return response.data;
}

/**
 * Match a resume against a job description.
 * Supports:
 *   1. By ID: matchJob(resumeId, jobDescription)
 *   2. Direct text: matchJob(null, jobDescription, resumeText)
 */
export async function matchJob(resumeId, jobDescription, resumeText) {
  const body = { jobDescription };
  if (resumeId) body.resumeId = resumeId;
  if (resumeText) body.resumeText = resumeText;

  const response = await api.post('/match-job', body);
  return response.data;
}

/**
 * Improve resume bullet points.
 */
export async function improveResume(resumeId, bulletPoints) {
  const response = await api.post('/improve-resume', { resumeId, bulletPoints });
  return response.data;
}

/**
 * Fetch analysis history.
 */
export async function getHistory() {
  const response = await api.get('/history');
  return response.data;
}

export default api;
