import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('Berghazi ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF8] text-[#16222E] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E5E4DF] rounded-xl p-8 space-y-4">
            <div className="text-2xl font-tifinagh text-[#C68B1C]">ⵣ</div>
            <h1 className="text-xl font-semibold">Application Recovery</h1>
            <p className="text-sm text-[#4A5568] leading-relaxed">
              A component encountered a recoverable error while communicating with platform services.
            </p>
            <div className="text-xs font-mono bg-[#F4F3EF] p-3 rounded-lg text-[#16222E] overflow-auto max-h-32">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1D3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#16222E] transition-colors"
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
