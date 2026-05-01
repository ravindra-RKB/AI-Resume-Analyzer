/**
 * Full-page loading spinner for AI operations.
 * @param {{ message?: string }} props
 */
export default function LoadingSpinner({ message = 'Analyzing with AI...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative w-20 h-20 mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-accent/20 rounded-full" />
        {/* Spinning ring */}
        <div className="absolute inset-0 border-2 border-transparent border-t-accent rounded-full animate-spin" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
      <p className="text-lg font-medium text-text-primary">{message}</p>
      <p className="text-sm text-text-muted mt-2">This may take a few seconds</p>
    </div>
  );
}
