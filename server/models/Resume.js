const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema({
  jobTitle: { type: String, default: 'Untitled Position' },
  jobDescription: { type: String, required: true },
  matchScore: { type: Number, default: 0 },
  matchedSkills: [String],
  missingSkills: [String],
  recommendation: String,
  matchedAt: { type: Date, default: Date.now },
});

const improvementSchema = new mongoose.Schema({
  original: { type: String, required: true },
  improved: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const resumeSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalText: {
      type: String,
      required: [true, 'Resume text is required'],
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    analysis: {
      strengths: [String],
      weaknesses: [String],
      missingSkills: [String],
      overallScore: { type: Number, default: 0 },
      summary: String,
      isAnalyzed: { type: Boolean, default: false },
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    jobMatches: [jobMatchSchema],
    improvements: [improvementSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual for text preview (first 200 chars)
resumeSchema.virtual('textPreview').get(function () {
  return this.originalText ? this.originalText.substring(0, 200) + '...' : '';
});

// Ensure virtuals are included in JSON
resumeSchema.set('toJSON', { virtuals: true });
resumeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resume', resumeSchema);
