const OpenAI = require('openai');
const { AppError } = require('../utils/errorHandler');

// ── OpenAI Client Setup ──────────────────────────────────────────────
const API_KEY = process.env.OPENAI_API_KEY;
const HAS_REAL_KEY = API_KEY && !API_KEY.includes('your-') && API_KEY.startsWith('sk-');

let openai = null;
if (HAS_REAL_KEY) {
  openai = new OpenAI({ apiKey: API_KEY });
  console.log('[AI] ✅ OpenAI API key configured — real analysis enabled');
} else {
  console.warn('[AI] ⚠️  No valid OpenAI API key found — using smart demo analysis');
  console.warn('[AI]    Set OPENAI_API_KEY in .env to enable real AI analysis');
}

const MODEL = 'gpt-4o-mini';

/**
 * Helper to call OpenAI and parse JSON response.
 */
async function callAI(systemPrompt, userPrompt) {
  if (!openai) {
    throw new AppError('AI_NOT_CONFIGURED', 503);
  }

  try {
    console.log(`[AI] Calling OpenAI (${MODEL})...`);
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    console.log('[AI] ✅ Response received successfully');
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('[AI] OpenAI API Error:', error.message);
    throw new AppError('AI analysis failed. Please try again later.', 502);
  }
}

// ── Smart Demo Analysis ──────────────────────────────────────────────
// Generates realistic-looking analysis from the resume text itself.

/**
 * Extract keywords from resume text for demo analysis.
 */
function extractKeywords(text) {
  const techKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'typescript', 'sql', 'aws',
    'docker', 'kubernetes', 'git', 'html', 'css', 'mongodb', 'postgresql',
    'express', 'angular', 'vue', 'nextjs', 'graphql', 'rest', 'api',
    'machine learning', 'ai', 'data science', 'agile', 'scrum', 'ci/cd',
    'linux', 'c++', 'c#', '.net', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'firebase', 'redis', 'elasticsearch', 'terraform', 'jenkins',
  ];

  const lower = text.toLowerCase();
  const found = techKeywords.filter((kw) => lower.includes(kw));
  return found;
}

/**
 * Generate a demo analysis based on resume text content.
 */
function generateDemoAnalysis(resumeText) {
  const words = resumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const skills = extractKeywords(resumeText);
  const lower = resumeText.toLowerCase();

  // Heuristic scoring based on resume quality signals
  let score = 50;
  if (wordCount > 300) score += 10;
  if (wordCount > 500) score += 5;
  if (skills.length > 5) score += 10;
  if (skills.length > 10) score += 5;
  if (lower.includes('experience')) score += 3;
  if (lower.includes('education')) score += 3;
  if (lower.includes('project')) score += 3;
  if (/\d+%|\d+x|\$\d+/.test(resumeText)) score += 5; // quantified achievements
  if (lower.includes('lead') || lower.includes('managed')) score += 3;
  if (lower.includes('certified') || lower.includes('certification')) score += 3;
  score = Math.min(score, 92);

  let atsScore = 45;
  if (skills.length > 3) atsScore += 15;
  if (skills.length > 8) atsScore += 10;
  if (lower.includes('summary') || lower.includes('objective')) atsScore += 5;
  if (lower.includes('email') || lower.includes('@')) atsScore += 5;
  if (lower.includes('phone') || /\d{10}/.test(resumeText)) atsScore += 5;
  if (wordCount > 200) atsScore += 5;
  atsScore = Math.min(atsScore, 88);

  // Generate strengths based on actual content
  const strengths = [];
  if (skills.length > 3) strengths.push(`Strong technical skill set with ${skills.length} relevant technologies identified (${skills.slice(0, 4).join(', ')})`);
  if (wordCount > 400) strengths.push('Comprehensive resume with detailed experience descriptions');
  if (/\d+%|\d+x|\$\d+/.test(resumeText)) strengths.push('Good use of quantified achievements and metrics');
  if (lower.includes('lead') || lower.includes('managed') || lower.includes('team')) strengths.push('Demonstrates leadership and team management experience');
  if (lower.includes('project')) strengths.push('Includes project experience showcasing practical application of skills');
  if (lower.includes('education') || lower.includes('degree') || lower.includes('university')) strengths.push('Educational background is clearly documented');
  if (strengths.length < 3) strengths.push('Resume provides a foundation to build upon with more specific details');
  if (strengths.length < 3) strengths.push('Content covers basic professional information');

  // Generate weaknesses based on what's missing
  const weaknesses = [];
  if (!/\d+%|\d+x|\$\d+/.test(resumeText)) weaknesses.push('Lacks quantified achievements — add metrics like percentages, dollar amounts, or team sizes');
  if (!lower.includes('summary') && !lower.includes('objective')) weaknesses.push('Missing a professional summary or objective statement at the top');
  if (wordCount < 300) weaknesses.push('Resume is too brief — consider adding more details about accomplishments and responsibilities');
  if (skills.length < 4) weaknesses.push('Limited technical keywords detected — include more industry-specific terms for better ATS parsing');
  if (!lower.includes('lead') && !lower.includes('managed')) weaknesses.push('No leadership or management experience highlighted');
  if (!lower.includes('certified') && !lower.includes('certification')) weaknesses.push('Consider adding relevant certifications to strengthen credibility');
  if (weaknesses.length < 3) weaknesses.push('Consider using stronger action verbs at the beginning of each bullet point');

  // Missing skills (common ones not found)
  const allCommon = ['docker', 'aws', 'git', 'ci/cd', 'agile', 'typescript', 'sql', 'rest', 'graphql', 'kubernetes'];
  const missingSkills = allCommon.filter((s) => !lower.includes(s)).slice(0, 6);
  if (missingSkills.length < 3) missingSkills.push('Cloud Computing', 'System Design', 'Testing Frameworks');

  const summary = `This resume demonstrates ${skills.length > 5 ? 'a solid' : 'a developing'} technical background with ${wordCount} words of content across the document. ${
    score >= 70
      ? 'The resume is well-structured and covers key areas effectively.'
      : 'There is room for improvement in quantifying achievements and adding more technical depth.'
  } Focus on adding measurable outcomes and industry-specific keywords to improve ATS compatibility.`;

  return {
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    missingSkills: missingSkills.slice(0, 6),
    overallScore: score,
    atsScore,
    summary,
    isDemo: true,
  };
}

/**
 * Generate a demo job match.
 */
function generateDemoJobMatch(resumeText, jobDescription) {
  const resumeSkills = extractKeywords(resumeText);
  const jobSkills = extractKeywords(jobDescription);

  const matched = resumeSkills.filter((s) => jobSkills.includes(s));
  const missing = jobSkills.filter((s) => !resumeSkills.includes(s));

  const matchScore = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 80) + 15
    : 55;

  // Try to extract a job title
  const titleMatch = jobDescription.match(/(?:position|role|title|hiring|looking for)[:\s]+([^\n.]{5,50})/i);
  const jobTitle = titleMatch ? titleMatch[1].trim() : 'Target Position';

  return {
    matchScore: Math.min(matchScore, 95),
    matchedSkills: matched.length > 0 ? matched : ['General professional experience'],
    missingSkills: missing.length > 0 ? missing : ['Specific domain experience'],
    recommendation: `Based on the analysis, you match ${matched.length} of ${jobSkills.length || 'several'} key skills required for this role. ${
      missing.length > 0
        ? `Consider developing skills in: ${missing.slice(0, 3).join(', ')}. `
        : ''
    }Tailor your resume to highlight relevant experience and use keywords from the job description.`,
    jobTitle,
    isDemo: true,
  };
}

/**
 * Generate demo bullet point improvements.
 */
function generateDemoImprovements(bulletPoints) {
  const bullets = bulletPoints
    .split('\n')
    .map((b) => b.replace(/^[•\-*]\s*/, '').trim())
    .filter((b) => b.length > 5);

  const actionVerbs = ['Spearheaded', 'Engineered', 'Orchestrated', 'Delivered', 'Architected', 'Optimized', 'Drove', 'Championed'];

  return {
    improvements: bullets.slice(0, 5).map((original, i) => {
      const verb = actionVerbs[i % actionVerbs.length];
      // Simple improvement: add action verb + suggest metrics
      const improved = `${verb} ${original.charAt(0).toLowerCase() + original.slice(1)}${
        !/\d/.test(original) ? ', resulting in measurable impact across key metrics' : ''
      }`;
      return { original, improved };
    }),
    isDemo: true,
  };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Analyze a resume and return strengths, weaknesses, missing skills, and scores.
 */
async function analyzeResume(resumeText) {
  // Try real AI first, fallback to demo
  if (openai) {
    try {
      const systemPrompt = `You are an expert career coach and resume analyst. Analyze the given resume and provide detailed, actionable feedback. Return JSON with this exact structure:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "summary": "Brief 2-3 sentence summary of the resume quality"
}

Scoring guidelines:
- overallScore: Overall resume quality (formatting, content, impact, completeness)
- atsScore: How well the resume would pass Applicant Tracking Systems (keywords, formatting, structure)
- Provide 3-6 items for each of strengths, weaknesses, and missingSkills
- Be specific and actionable in your feedback`;

      return await callAI(systemPrompt, `Analyze this resume:\n\n${resumeText}`);
    } catch (err) {
      console.warn('[AI] Real analysis failed, falling back to demo:', err.message);
    }
  }

  console.log('[AI] Using smart demo analysis');
  return generateDemoAnalysis(resumeText);
}

/**
 * Match a resume against a job description.
 */
async function matchJob(resumeText, jobDescription) {
  if (openai) {
    try {
      const systemPrompt = `You are an expert recruiter and job matching specialist. Compare the resume against the job description and assess the fit. Return JSON with this exact structure:
{
  "matchScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "recommendation": "Detailed recommendation paragraph about fit and how to improve",
  "jobTitle": "Inferred job title from the description"
}

Be thorough in identifying both matched and missing skills. Consider technical skills, soft skills, experience level, and industry keywords.`;

      return await callAI(
        systemPrompt,
        `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
      );
    } catch (err) {
      console.warn('[AI] Real job match failed, falling back to demo:', err.message);
    }
  }

  console.log('[AI] Using demo job match');
  return generateDemoJobMatch(resumeText, jobDescription);
}

/**
 * Improve resume bullet points to be more professional and impactful.
 */
async function improveResume(bulletPoints) {
  if (openai) {
    try {
      const systemPrompt = `You are an expert resume writer. Rewrite each bullet point to be more professional, impactful, and ATS-friendly. Use strong action verbs, quantify achievements where possible, and follow the STAR method. Return JSON with this exact structure:
{
  "improvements": [
    {
      "original": "original bullet point",
      "improved": "improved version"
    }
  ]
}

Guidelines:
- Start each bullet with a strong action verb
- Include metrics/numbers wherever possible
- Keep each bullet concise (1-2 lines)
- Use industry-standard terminology
- Make achievements measurable and specific`;

      return await callAI(
        systemPrompt,
        `Improve these resume bullet points:\n\n${bulletPoints}`
      );
    } catch (err) {
      console.warn('[AI] Real improvement failed, falling back to demo:', err.message);
    }
  }

  console.log('[AI] Using demo improvements');
  return generateDemoImprovements(bulletPoints);
}

/**
 * Calculate a keyword-based ATS score.
 */
function calculateATSScore(resumeText, keywords) {
  if (!keywords || keywords.length === 0) return { score: 0, matched: [], missing: [] };

  const resumeLower = resumeText.toLowerCase();
  const matched = [];
  const missing = [];

  keywords.forEach((keyword) => {
    if (resumeLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  const score = Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}

module.exports = { analyzeResume, matchJob, improveResume, calculateATSScore };
