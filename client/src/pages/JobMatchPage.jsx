import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Send, FileText, ArrowRight, Lightbulb } from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import SkillBadge from '../components/SkillBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { matchJob } from '../services/api';

export default function JobMatchPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const navigate = useNavigate();
  const resumeId = sessionStorage.getItem('currentResumeId');
  const storedAnalysis = sessionStorage.getItem('currentAnalysis');

  // Check if we have resume data (either via DB id or stored text)
  const hasResume = resumeId || storedAnalysis;

  const handleMatch = async () => {
    if (!hasResume) { toast.error('Upload a resume first.'); navigate('/'); return; }
    if (jobDescription.trim().length < 20) { toast.error('Job description must be at least 20 characters.'); return; }
    setIsMatching(true);
    try {
      let response;

      if (resumeId) {
        // Standard flow: match by DB id
        response = await matchJob(resumeId, jobDescription);
      } else {
        // Fallback flow: send resume text directly
        const analysis = JSON.parse(storedAnalysis);
        const resumeText = analysis?.summary || analysis?.textPreview || '';
        response = await matchJob(null, jobDescription, resumeText);
      }

      setMatchResult(response.data);
      toast.success('Job matching complete!');
    } catch (error) {
      console.error('[Match] Error:', error);
      toast.error(error.response?.data?.error || 'Matching failed.');
    } finally { setIsMatching(false); }
  };

  /* ── Empty State ─────────────────────────────────────────────── */
  if (!hasResume) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-6 sm:px-8">
          <div className="max-w-lg mx-auto glass-card p-10 sm:p-14 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">No Resume Found</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Upload and analyze a resume first.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-light transition-colors"
            >
              Upload Resume <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Content ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Job <span className="gradient-text">Match</span>
          </h1>
          <p className="text-text-secondary">
            Paste a job description to see how well your resume matches
          </p>
        </div>

        {/* Job Description Input */}
        <div className="glass-card p-6 sm:p-8 mb-10 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Job Description</h3>
          </div>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-52 bg-bg-input border border-border rounded-xl p-4 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          />

          <div className="flex items-center justify-between mt-5">
            <span className="text-xs text-text-muted">{jobDescription.length} characters</span>
            <button
              onClick={handleMatch}
              disabled={isMatching || jobDescription.trim().length < 20}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md shadow-accent/20"
            >
              {isMatching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Match Resume
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isMatching && <LoadingSpinner message="Comparing resume with job description..." />}

        {/* Match Results */}
        {matchResult && !isMatching && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score + Title */}
            <div className="glass-card p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="shrink-0">
                <ScoreRing score={matchResult.matchScore} label="Match" size={180} strokeWidth={14} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-text-primary mb-3">{matchResult.jobTitle}</h2>
                <p className="text-text-secondary leading-relaxed">{matchResult.recommendation}</p>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-success mb-5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  Matched Skills ({matchResult.matchedSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchResult.matchedSkills?.map((s, i) => (
                    <SkillBadge key={i} skill={s} type="matched" />
                  ))}
                </div>
              </div>
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-error mb-5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error" />
                  Missing Skills ({matchResult.missingSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchResult.missingSkills?.map((s, i) => (
                    <SkillBadge key={i} skill={s} type="missing" />
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Recommendation</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">{matchResult.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
