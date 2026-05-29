import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="glass-panel" 
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: '8px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
            <AlertOctagon size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              Component Render Failure: {this.props.componentName || 'Unknown'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleReset}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              alignSelf: 'flex-start',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={12} />
            Reset Node
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
