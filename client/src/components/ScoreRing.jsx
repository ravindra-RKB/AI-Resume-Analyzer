import { useEffect, useState } from 'react';

/**
 * Animated circular score indicator using SVG.
 * @param {{ score: number, size?: number, strokeWidth?: number, label?: string, color?: string }} props
 */
export default function ScoreRing({ score = 0, size = 140, strokeWidth = 10, label = 'Score', color }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getColor = () => {
    if (color) return color;
    if (animatedScore >= 80) return '#10b981';
    if (animatedScore >= 60) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(Math.min(score, 100)), 200);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(108, 99, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${getColor()}40)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-text-primary">{animatedScore}</span>
          <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
}
