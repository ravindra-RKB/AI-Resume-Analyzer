const pdfParse = require('pdf-parse');
const { AppError } = require('../utils/errorHandler');

/** Minimum file size in bytes to consider a valid PDF (~10KB) */
const MIN_PDF_SIZE = 10 * 1024;

/** PDF magic bytes: %PDF */
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);

/**
 * Validate that a buffer looks like a real PDF before attempting to parse.
 * @param {Buffer} buffer
 * @param {number} fileSize - original file size from multer
 * @param {string} mimetype - mimetype from multer
 */
function validateBuffer(buffer, fileSize, mimetype) {
  if (!buffer || buffer.length === 0) {
    throw new AppError('No file data received. Please upload a valid PDF.', 400);
  }

  if (mimetype && mimetype !== 'application/pdf') {
    throw new AppError(
      `Invalid file type "${mimetype}". Only PDF files are accepted.`,
      400
    );
  }

  if (fileSize < MIN_PDF_SIZE) {
    throw new AppError(
      `File too small (${(fileSize / 1024).toFixed(1)} KB). A valid resume PDF should be at least 10 KB.`,
      400
    );
  }

  // Check PDF magic bytes (%PDF)
  if (!buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    throw new AppError(
      'File does not appear to be a valid PDF. Please upload a properly exported PDF document.',
      400
    );
  }
}

/**
 * Clean extracted text: collapse excessive whitespace, strip control chars.
 * @param {string} raw
 * @returns {string}
 */
function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')          // normalize line endings
    .replace(/[^\S\n]+/g, ' ')       // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')      // limit consecutive blank lines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .trim();
}

/**
 * Extract text content from a PDF buffer.
 *
 * @param {Buffer} buffer   - The PDF file buffer (from multer memoryStorage)
 * @param {Object} fileMeta - { size, mimetype, originalname } from req.file
 * @returns {Promise<{text: string, numPages: number, wordCount: number}>}
 */
async function parseResume(buffer, fileMeta = {}) {
  const { size = buffer.length, mimetype = 'application/pdf', originalname = 'unknown' } = fileMeta;

  console.log('[PDF Parse] ── Starting ──────────────────────────────');
  console.log(`[PDF Parse] File: ${originalname}`);
  console.log(`[PDF Parse] Size: ${(size / 1024).toFixed(1)} KB (${size} bytes)`);
  console.log(`[PDF Parse] MIME: ${mimetype}`);

  // ── Pre-parse validation ────────────────────────────────────────
  validateBuffer(buffer, size, mimetype);

  // ── Parse PDF ───────────────────────────────────────────────────
  let data;
  try {
    data = await pdfParse(buffer);
  } catch (parseError) {
    console.error('[PDF Parse] pdf-parse threw an error:', parseError.message);

    // Provide actionable fallback advice
    throw new AppError(
      'Failed to parse this PDF file. It may be corrupted, password-protected, or image-based. ' +
      'Try re-exporting your resume as a PDF from Word or Google Docs.',
      400
    );
  }

  // ── Post-parse validation ───────────────────────────────────────
  const rawText = data.text || '';
  const text = cleanText(rawText);

  console.log(`[PDF Parse] Pages: ${data.numpages}`);
  console.log(`[PDF Parse] Raw text length: ${rawText.length} chars`);
  console.log(`[PDF Parse] Cleaned text length: ${text.length} chars`);

  if (!text || text.length < 50) {
    console.warn('[PDF Parse] ⚠️  Extracted text is too short — likely image-based or encrypted.');
    throw new AppError(
      'Unable to extract text from this PDF. The resume may be image-based (scanned) or encrypted. ' +
      'Please upload a text-based PDF exported from Word, Google Docs, or a similar editor.',
      400
    );
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 15) {
    console.warn(`[PDF Parse] ⚠️  Only ${wordCount} words extracted — too few for a resume.`);
    throw new AppError(
      `Only ${wordCount} words were extracted. This doesn't appear to be a complete resume. ` +
      'Please upload a properly formatted PDF resume.',
      400
    );
  }

  console.log(`[PDF Parse] ✅ Success — ${wordCount} words, ${data.numpages} page(s)`);
  console.log(`[PDF Parse] Preview: "${text.substring(0, 120)}..."`);

  return {
    text,
    numPages: data.numpages || 1,
    wordCount,
  };
}

module.exports = { parseResume };
