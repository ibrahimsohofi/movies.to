import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service (Sentry, etc.)
      console.error('Production error:', { error, errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription className="text-base">
                {errorCount > 2
                  ? "This error keeps happening. Please try going back to the home page."
                  : "We're sorry for the inconvenience. The page encountered an unexpected error."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  onClick={this.handleReset}
                  className="gap-2"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="gap-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              {/* Error Details in Development */}
              {isDevelopment && error && (
                <details className="mt-6 p-4 bg-muted/50 rounded-lg border">
                  <summary className="cursor-pointer font-semibold text-sm mb-2 hover:text-primary">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-destructive mb-1">Error:</p>
                      <pre className="overflow-auto p-2 bg-background rounded border text-wrap">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <p className="font-semibold text-destructive mb-1">Stack Trace:</p>
                        <pre className="overflow-auto p-2 bg-background rounded border text-xs whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                If this problem persists, try clearing your browser cache or contact support.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
