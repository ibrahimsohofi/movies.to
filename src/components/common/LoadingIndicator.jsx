import { Loader2 } from 'lucide-react';

export default function LoadingIndicator({
  text = 'Loading...',
  size = 'md',
  className = ''
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`}>
      <div className="relative">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-red-600/20 blur-md animate-pulse`} />

        {/* Spinner */}
        <Loader2
          className={`${sizeClasses[size]} text-red-600 animate-spin relative z-10`}
          strokeWidth={2.5}
        />
      </div>

      {text && (
        <p className={`${textSizeClasses[size]} text-muted-foreground font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}
