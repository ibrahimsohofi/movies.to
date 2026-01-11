import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PremiumBadge({ className, size = 'default', showText = false }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1',
      className
    )}>
      <div className="relative">
        <Crown className={cn(
          sizeClasses[size],
          'text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
        )} />
      </div>
      {showText && (
        <span className="text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          Premium
        </span>
      )}
    </div>
  );
}
