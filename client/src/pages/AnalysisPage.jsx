import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ArrowRight,
  Wand2,
  FileText,
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import SkillBadge from '../components/SkillBadge';
import { improveResume } from '../services/api';

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [bulletPoints, setBulletPoints] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [isImproving, setIsImproving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('currentAnalysis');
    if (stored) {
      setAnalysis(JSON.parse(stored));
    }
  }, []);

  const handleImprove = async () => {
    const resumeId = sessionStorage.getItem('currentResumeId');
    if (!resumeId || !bulletPoints.trim()) {
      toast.error('Please enter bullet points to improve.');
      return;
    }

    setIsImproving(true);
    try {
      const response = await improveResume(resumeId, bulletPoints);
      setImprovements(response.data.improvements || []);
      toast.success('Improvements generated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate improvements.');
    } finally {
      setIsImproving(false);
    }
  };

  /* ── Empty State ─────────────────────────────────────────────── */
  if (!analysis) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-6 sm:px-8">
          <div className="max-w-lg mx-auto glass-card p-10 sm:p-14 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">No Analysis Yet</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Upload and analyze a resume first to see results here.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-light transition-colors"
            >
              Upload Resume
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Analysis Results ────────────────────────────────────────── */
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Resume <span className="gradient-text">Analysis</span>
          </h1>
          <p className="text-text-secondary">{analysis.fileName}</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 animate-fade-in-up stagger-1">
          <div className="glass-card p-8 sm:p-10 flex flex-col items-center animate-pulse-glow">
            <ScoreRing score={analysis.overallScore} label="Overall" size={160} strokeWidth={12} />
            <p className="text-sm text-text-secondary mt-5 text-center max-w-[260px] leading-relaxed">
              Overall resume quality based on content, impact, and completeness
            </p>
          </div>
          <div className="glass-card p-8 sm:p-10 flex flex-col items-center animate-pulse-glow">
            <ScoreRing score={analysis.atsScore} label="ATS" size={160} strokeWidth={12} />
            <p className="text-sm text-text-secondary mt-5 text-center max-w-[260px] leading-relaxed">
              How well your resume passes Applicant Tracking Systems
            </p>
          </div>
        </div>

        {/* Summary */}
        {analysis.summary && (
          <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in-up stagger-2">
            <h3 className="text-lg font-semibold mb-3 text-text-primary">Summary</h3>
            <p className="text-text-secondary leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 animate-fade-in-up stagger-3">
          {/* Strengths */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                  <span className="text-sm text-text-secondary leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                <ThumbsDown className="w-4 h-4 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Weaknesses</h3>
            </div>
            <ul className="space-y-3">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                  <span className="text-sm text-text-secondary leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missing Skills */}
        <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Missing Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingSkills.map((skill, i) => (
              <SkillBadge key={i} skill={skill} type="missing" />
            ))}
          </div>
        </div>

        {/* Resume Improvement Section */}
        <div className="glass-card p-6 sm:p-8 mb-10 animate-fade-in-up stagger-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">AI Resume Improver</h3>
          </div>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            Paste your bullet points below and let AI rewrite them to be more professional and impactful.
          </p>

          <textarea
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            placeholder="• Managed a team of developers&#10;• Worked on various projects&#10;• Responsible for code reviews"
            className="w-full h-40 bg-bg-input border border-border rounded-xl p-4 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          />

          <button
            onClick={handleImprove}
            disabled={isImproving || !bulletPoints.trim()}
            className="mt-5 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isImproving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Improving...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Improve Bullet Points
              </>
            )}
          </button>

          {/* Improvements Results */}
          {improvements.length > 0 && (
            <div className="mt-8 space-y-4">
              <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Results
              </h4>
              {improvements.map((imp, i) => (
                <div key={i} className="bg-bg-input rounded-xl p-5 border border-border">
                  <div className="mb-4">
                    <span className="text-xs font-medium text-error uppercase tracking-wider">Original</span>
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{imp.original}</p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <span className="text-xs font-medium text-success uppercase tracking-wider">Improved</span>
                    <p className="text-sm text-text-primary mt-1.5 leading-relaxed">{imp.improved}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigate to Job Match */}
        <div className="text-center animate-fade-in-up">
          <button
            onClick={() => navigate('/match')}
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-accent/60 text-accent font-semibold rounded-xl hover:bg-accent/10 hover:border-accent transition-all duration-200"
          >
            Match Against a Job Description
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
