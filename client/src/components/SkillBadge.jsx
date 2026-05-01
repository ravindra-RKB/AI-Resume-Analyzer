import { Check, X } from 'lucide-react';

/**
 * Colored badge for displaying matched or missing skills.
 * @param {{ skill: string, type?: 'matched' | 'missing' }} props
 */
export default function SkillBadge({ skill, type = 'matched' }) {
  const isMatched = type === 'matched';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        isMatched
          ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
          : 'bg-error/10 text-error border border-error/20 hover:bg-error/20'
      }`}
    >
      {isMatched ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {skill}
    </span>
  );
}
