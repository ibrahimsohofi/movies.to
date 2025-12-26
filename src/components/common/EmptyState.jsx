import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  illustration,
  className = ''
}) {
  const renderIllustration = () => {
    switch (illustration) {
      case 'watchlist':
        return (
          <div className="flex justify-center opacity-60 animate-float">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="35" width="80" height="70" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-primary/40" />
              <path d="M70 50 L70 85 M52.5 67.5 L87.5 67.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
              <circle cx="70" cy="67.5" r="20" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-primary/20" />
            </svg>
          </div>
        );

      case 'search':
        return (
          <div className="flex justify-center opacity-60 animate-float">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-primary/40" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
              <path d="M55 55 L65 65 M65 55 L55 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-destructive/60" />
            </svg>
          </div>
        );

      case 'movies':
        return (
          <div className="flex justify-center opacity-60 animate-float">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="40" width="80" height="60" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-primary/40" />
              <circle cx="55" cy="60" r="8" fill="currentColor" className="text-primary/30" />
              <circle cx="85" cy="60" r="8" fill="currentColor" className="text-primary/30" />
              <rect x="35" y="75" width="70" height="3" fill="currentColor" className="text-primary/20" />
              <rect x="35" y="82" width="50" height="3" fill="currentColor" className="text-primary/20" />
            </svg>
          </div>
        );

      case 'browse':
        return (
          <div className="flex justify-center opacity-60 animate-float">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="30" width="35" height="45" rx="3" stroke="currentColor" strokeWidth="2" className="text-primary/30" />
              <rect x="65" y="30" width="35" height="45" rx="3" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
              <rect x="25" y="80" width="35" height="45" rx="3" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
              <rect x="65" y="80" width="35" height="45" rx="3" stroke="currentColor" strokeWidth="2" className="text-primary/30" />
            </svg>
          </div>
        );

      case 'filter':
        return (
          <div className="flex justify-center opacity-60 animate-float">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 45 L100 45 L80 70 L80 100 L60 100 L60 70 Z" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-primary/40" />
              <line x1="40" y1="45" x2="100" y2="45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[450px] p-4 ${className}`}>
      <Card className="max-w-lg w-full border-dashed border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="pt-14 pb-14 text-center space-y-7">
          {Icon && !illustration && (
            <div className="flex justify-center">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner animate-float">
                <Icon className="h-14 w-14 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          )}

          {illustration && renderIllustration()}

          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              {description}
            </p>
          </div>

          {(actionLabel && (actionHref || onAction)) && (
            <div className="pt-3">
              {actionHref ? (
                <Button
                  asChild
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Link to={actionHref}>{actionLabel}</Link>
                </Button>
              ) : (
                <Button
                  onClick={onAction}
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {actionLabel}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
