import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            padding: '12px',
            border: '2px dashed #ef4444',
            borderRadius: '4px',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Render Error</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.8 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error boundary specifically for canvas elements.
 * Shows a compact error message that fits in the element's place.
 */
export class ElementErrorBoundary extends Component<Props & { elementId?: string; elementName?: string }, State> {
  constructor(props: Props & { elementId?: string; elementName?: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ElementErrorBoundary] Error in element ${this.props.elementName || this.props.elementId}:`, error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error'
      // Truncate long error messages
      const shortMessage = errorMessage.length > 100
        ? errorMessage.substring(0, 100) + '...'
        : errorMessage

      return (
        <div
          style={{
            padding: '8px 12px',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontSize: '11px',
            minWidth: '120px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>
            {this.props.elementName || 'Component'} Error
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.8, wordBreak: 'break-word' }}>
            {shortMessage}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
