import React, { Component, ReactNode } from 'react';

interface AudioErrorBoundaryProps {
    children: ReactNode;
}

interface AudioErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary component that catches audio-related errors
 * and allows the application to continue with non-reactive starfield.
 * 
 * Requirements: 7.1, 7.2, 7.4
 */
export class AudioErrorBoundary extends Component<AudioErrorBoundaryProps, AudioErrorBoundaryState> {
    constructor(props: AudioErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): AudioErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log the error for debugging
        console.error('AudioErrorBoundary: Caught audio-related error', {
            error,
            errorInfo,
            componentStack: errorInfo.componentStack,
        });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Render children without audio features
            // The starfield will display normally without pulsation
            console.warn('AudioErrorBoundary: Rendering without audio features due to error:', this.state.error?.message);
            return this.props.children;
        }

        return this.props.children;
    }
}
