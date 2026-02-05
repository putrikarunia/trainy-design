import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { style: {
                    padding: '12px',
                    border: '2px dashed #ef4444',
                    borderRadius: '4px',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    fontSize: '12px',
                }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: '4px' }, children: "Render Error" }), _jsx("div", { style: { fontFamily: 'monospace', fontSize: '11px', opacity: 0.8 }, children: this.state.error?.message || 'Unknown error' })] }));
        }
        return this.props.children;
    }
}
/**
 * Error boundary specifically for canvas elements.
 * Shows a compact error message that fits in the element's place.
 */
export class ElementErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error(`[ElementErrorBoundary] Error in element ${this.props.elementName || this.props.elementId}:`, error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || 'Unknown error';
            // Truncate long error messages
            const shortMessage = errorMessage.length > 100
                ? errorMessage.substring(0, 100) + '...'
                : errorMessage;
            return (_jsxs("div", { style: {
                    padding: '8px 12px',
                    border: '1px solid #fca5a5',
                    borderRadius: '4px',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    fontSize: '11px',
                    minWidth: '120px',
                }, children: [_jsxs("div", { style: { fontWeight: 600, marginBottom: '2px' }, children: [this.props.elementName || 'Component', " Error"] }), _jsx("div", { style: { fontFamily: 'monospace', fontSize: '10px', opacity: 0.8, wordBreak: 'break-word' }, children: shortMessage })] }));
        }
        return this.props.children;
    }
}
