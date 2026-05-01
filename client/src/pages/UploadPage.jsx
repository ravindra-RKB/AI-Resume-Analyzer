import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Shield, Zap, Target } from 'lucide-react';
import FileDropzone from '../components/FileDropzone';
import { uploadResume, analyzeResume } from '../services/api';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = async (file) => {
    setUploadError('');
    setUploadResult(null);
    setIsUploading(true);

    // ── Client-side pre-validation ──────────────────────────────
    if (file.type !== 'application/pdf') {
      const msg = 'Invalid file type. Please upload a PDF file (.pdf).';
      setUploadError(msg);
      toast.error(msg);
      setIsUploading(false);
      return;
    }

    const MIN_SIZE = 10 * 1024; // 10 KB
    if (file.size < MIN_SIZE) {
      const msg = `File too small (${(file.size / 1024).toFixed(1)} KB). A valid resume should be at least 10 KB. The file may be corrupted.`;
      setUploadError(msg);
      toast.error(msg);
      setIsUploading(false);
      return;
    }

    // ── Upload to backend ──────────────────────────────────────
    try {
      const response = await uploadResume(file);
      setUploadResult(response.data);
      toast.success('Resume uploaded and parsed successfully!');
    } catch (error) {
      console.error('[Upload] Error:', error);

      let message;
      const serverError = error.response?.data?.error;

      if (error.response?.status === 0 || !error.response) {
        // Network error — server unreachable
        message = 'Cannot reach the server. Please ensure the backend is running and try again.';
      } else if (serverError) {
        // Use the backend's descriptive error directly
        message = serverError;
      } else {
        message = 'Failed to upload resume. Please try again.';
      }

      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadResult) return;
    setIsAnalyzing(true);

    try {
      let response;

      if (uploadResult.resumeId) {
        // Standard flow: analyze by DB id
        response = await analyzeResume(uploadResult.resumeId);
      } else {
        // Fallback flow: send text directly (no DB)
        response = await analyzeResume(null, uploadResult.textPreview, uploadResult.fileName);
      }

      sessionStorage.setItem('currentAnalysis', JSON.stringify(response.data));
      if (uploadResult.resumeId) {
        sessionStorage.setItem('currentResumeId', uploadResult.resumeId);
      }
      toast.success('Analysis complete!');
      navigate('/analysis');
    } catch (error) {
      console.error('[Analyze] Error:', error);
      const message = error.response?.data?.error || 'Analysis failed. Please try again.';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'AI Analysis',
      desc: 'Get strengths, weaknesses, and missing skills identified by AI',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      icon: Shield,
      title: 'ATS Score',
      desc: 'See how well your resume passes Applicant Tracking Systems',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: Zap,
      title: 'Smart Improvements',
      desc: 'AI rewrites your bullet points to be more impactful',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="hero-glow text-center max-w-3xl mx-auto mb-14 animate-fade-in-up">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Resume Analysis
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Analyze Your Resume
              <br />
              <span className="gradient-text">With AI Precision</span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
              Upload your resume and get instant AI-powered analysis, ATS scoring,
              and actionable improvement suggestions.
            </p>
          </div>
        </section>

        {/* ── Upload Area ─────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-1">
          <div className="glass-card glass-card-interactive p-8 sm:p-10">
            <FileDropzone
              onFileSelect={handleFileSelect}
              isLoading={isUploading}
              error={uploadError}
            />
          </div>
        </section>

        {/* ── Upload Result & Analyze Button ───────────────────────── */}
        {uploadResult && (
          <section className="max-w-2xl mx-auto mb-10 animate-fade-in-up">
            <div className="glass-card p-6 sm:p-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary truncate">
                    {uploadResult.fileName}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {uploadResult.wordCount} words • {uploadResult.numPages} page{uploadResult.numPages !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md shadow-accent/20 shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze with AI
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Text Preview */}
              <div className="mt-5 p-4 bg-bg-input rounded-xl border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                  Preview
                </p>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                  {uploadResult.textPreview}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Feature Cards ────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto mt-16 animate-fade-in-up stagger-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="glass-card glass-card-interactive p-6 sm:p-7 text-center sm:text-left"
              >
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 mx-auto sm:mx-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2 text-base">
                  {title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
