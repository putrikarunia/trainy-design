declare module 'react-frame-component' {
  import * as React from 'react';

  export interface FrameContextValue {
    document: Document | null;
    window: Window | null;
  }

  export interface FrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
    /** Content to inject into the iframe's <head> */
    head?: React.ReactNode;
    /** Initial HTML content for the iframe (defaults to basic HTML structure) */
    initialContent?: string;
    /** CSS selector for where to mount children in the iframe body */
    mountTarget?: string;
    /** Callback when iframe content is mounted */
    contentDidMount?: () => void;
    /** Callback when iframe content is updated */
    contentDidUpdate?: () => void;
    /** Children to render inside the iframe */
    children?: React.ReactNode;
  }

  export const FrameContext: React.Context<FrameContextValue>;

  export const FrameContextConsumer: React.Consumer<FrameContextValue>;

  const Frame: React.FC<FrameProps>;
  export default Frame;
}

