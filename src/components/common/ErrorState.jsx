import { AlertTriangle, WifiOff, ServerCrash, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ERROR_TYPES = {
  network: {
    icon: WifiOff,
    title: 'Network Error',
    description: 'Unable to connect to the server. Please check your internet connection.',
    color: 'text-orange-500'
  },
  server: {
    icon: ServerCrash,
    title: 'Server Error',
    description: 'The server encountered an error. Please try again in a moment.',
    color: 'text-red-500'
  },
  notFound: {
    icon: AlertTriangle,
    title: 'Not Found',
    description: 'The requested content could not be found.',
    color: 'text-yellow-500'
  },
  default: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    color: 'text-destructive'
  }
};

const getErrorType = (error) => {
  if (!error) return 'default';

  if (!error.response) return 'network';

  const status = error.response?.status;
  if (status === 404) return 'notFound';
  if (status >= 500) return 'server';

  return 'default';
};

export default function ErrorState({
  error,
  onRetry,
  onGoHome,
  className = '',
  title,
  message,
  showDetails = false
}) {
  const errorType = error ? getErrorType(error) : 'default';
  const config = ERROR_TYPES[errorType];
  const Icon = config.icon;

  const displayTitle = title || config.title;
  const displayMessage = message || error?.message || config.description;

  return (
    <div className={`container mx-auto px-4 py-12 ${className}`}>
      <Card className="max-w-lg mx-auto shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center ${config.color}`}>
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">{displayTitle}</CardTitle>
          <CardDescription className="text-base">
            {displayMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {/* Error Details */}
          {showDetails && error && import.meta.env.DEV && (
            <details className="mt-4 p-3 bg-muted/50 rounded-lg border text-sm">
              <summary className="cursor-pointer font-semibold text-xs mb-2 hover:text-primary">
                Error Details (Development)
              </summary>
              <pre className="text-xs overflow-auto p-2 bg-background rounded">
                {JSON.stringify(
                  {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
