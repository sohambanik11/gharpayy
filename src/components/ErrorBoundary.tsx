import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to your error tracking service (e.g., Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle size={36} className="text-destructive" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-display font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Our team has been notified.
              </p>
            </div>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left p-4 rounded-xl bg-destructive/5 border border-destructive/15">
                <p className="text-xs font-mono text-destructive font-medium mb-1">
                  {this.state.error.message}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground leading-relaxed line-clamp-6">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-colors"
              >
                <Home size={14} />
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error state for smaller components
export const InlineError = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/15">
    <AlertTriangle size={15} className="text-destructive shrink-0" />
    <p className="text-xs text-destructive flex-1">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs text-destructive underline hover:no-underline"
      >
        Retry
      </button>
    )}
  </div>
);
