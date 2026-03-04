'use client';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ progress, className = '', showLabel = true }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-purple transition-all duration-1000 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted mt-1">{clampedProgress}% funded</p>
      )}
    </div>
  );
}
