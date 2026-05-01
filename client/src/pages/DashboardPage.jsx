import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, FileText, Target, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getHistory } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getHistory();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load history.');
    } finally { setIsLoading(false); }
  };

  /* ── Loading State ───────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || { totalResumes: 0, totalAnalyzed: 0, totalMatches: 0, avgAtsScore: 0, avgMatchScore: 0 };
  const resumes = data?.resumes || [];

  const statCards = [
    { label: 'Resumes Uploaded', value: stats.totalResumes, icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Analyzed', value: stats.totalAnalyzed, icon: BarChart3, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Job Matches', value: stats.totalMatches, icon: Target, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Avg ATS Score', value: stats.avgAtsScore, icon: TrendingUp, color: 'text-accent-light', bg: 'bg-accent/10' },
  ];

  const chartData = resumes
    .filter(r => r.isAnalyzed)
    .slice(0, 10)
    .map(r => ({
      name: r.fileName.length > 15 ? r.fileName.slice(0, 15) + '...' : r.fileName,
      ats: r.atsScore,
      overall: r.overallScore,
    }));

  const barColors = ['#6c63ff', '#8b83ff', '#a78bfa', '#6c63ff', '#8b83ff'];

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-text-secondary">
            Overview of your resume analyses and job matches
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10 animate-fade-in-up stagger-1">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card p-5 sm:p-6">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="glass-card p-6 sm:p-8 mb-10 animate-fade-in-up stagger-2">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Score Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={8}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9595b0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#9595b0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a45',
                    borderRadius: 12,
                    color: '#f0f0f5',
                  }}
                  cursor={{ fill: 'rgba(108, 99, 255, 0.05)' }}
                />
                <Bar dataKey="overall" name="Overall" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
                <Bar dataKey="ats" name="ATS" radius={[6, 6, 0, 0]} fill="#10b981" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History Table */}
        <div className="glass-card p-6 sm:p-8 animate-fade-in-up stagger-3">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Recent Analyses</h3>

          {resumes.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-bg-card flex items-center justify-center mx-auto mb-5">
                <Clock className="w-7 h-7 text-text-muted" />
              </div>
              <p className="text-text-secondary mb-6">
                No analyses yet. Upload your first resume!
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-light transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">File</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">Overall</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">ATS</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">Matches</th>
                    <th className="text-right py-3 px-4 text-text-muted font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((r) => (
                    <tr key={r.id} className="border-b border-border/40 hover:bg-bg-card/40 transition-colors">
                      <td className="py-3.5 px-4 text-text-primary font-medium max-w-[200px] truncate">
                        {r.fileName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold ${r.overallScore >= 70 ? 'text-success' : r.overallScore >= 50 ? 'text-warning' : 'text-error'}`}>
                          {r.isAnalyzed ? r.overallScore : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold ${r.atsScore >= 70 ? 'text-success' : r.atsScore >= 50 ? 'text-warning' : 'text-error'}`}>
                          {r.isAnalyzed ? r.atsScore : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-text-secondary">{r.matchCount}</td>
                      <td className="py-3.5 px-4 text-right text-text-muted">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
