export interface TextLeafNode {
  id: string;
  type: 'text';
  tag: 'span';

  // Common
  styles?: React.CSSProperties;
  text?: string;
  canvasPosition?: { // if root in canvas, not inside another element
    x: number,
    y: number,
  }
}

export interface HtmlElement {
  id: string;
  type: 'html';
  tag: HTMLElement['tagName'];

  // Common
  props?: Record<string, any>;
  styles?: React.CSSProperties;
  children?: FEElement[];
  canvasPosition?: { // if root in canvas, not inside another element
    x: number,
    y: number,
  }
}

export interface ComponentElement {
  id: string;
  type: "component";

  // For component elements
  componentName: string;
  props?: Record<string, any>;

  // Whether this component is registered in the components map (exact match)
  // true = user component from registry, render via createElement(Component, ...)
  // false = library component (e.g., Radix primitive), use componentRef to render
  isRegistered?: boolean;

  // For unregistered (library) components: the actual component reference
  // This allows us to render library components like ProgressPrimitive.Root directly
  // Note: This doesn't serialize to JSON, only used for in-memory rendering
  componentRef?: React.ComponentType<any>;

  // Common
  styles?: React.CSSProperties;
  children?: FEElement[];
  canvasPosition?: { // if root in canvas, not inside another element
    x: number,
    y: number,
  }
}

export interface IconElement {
  id: string;
  type: 'icon';

  // Icon identification
  library: string;       // "@phosphor-icons/react", "lucide-react"
  iconName: string;      // "PlusCircle", "Check", "X"

  // Icon-specific props (size, weight, color, strokeWidth, etc.)
  props: Record<string, any>;

  // Common element properties
  styles?: React.CSSProperties;
  canvasPosition?: { // if root in canvas, not inside another element
    x: number;
    y: number;
  };

  // Icons cannot have children
}

export interface ViewportElement {
  id: string;
  type: 'viewport';

  // Viewport dimensions - these become the iframe's viewport for CSS media queries
  viewportWidth: number;   // e.g., 1512 for desktop, 398 for mobile
  viewportHeight?: number; // optional, defaults to 'auto' (content height)

  // Device preset name for display (optional)
  deviceName?: string;     // "Desktop", "Tablet", "Mobile", etc.

  // Common element properties
  styles?: React.CSSProperties;
  children?: FEElement[];
  canvasPosition?: {
    x: number;
    y: number;
  };
}

// Common viewport presets
export const VIEWPORT_PRESETS = {
  desktop: { width: 1512, height: 800, name: 'Desktop' },
  laptop: { width: 1280, height: 720, name: 'Laptop' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  mobile: { width: 390, height: 844, name: 'Mobile' },
} as const;

export type FEElement = HtmlElement | ComponentElement | TextLeafNode | IconElement | ViewportElement

// Icon library configuration
export interface IconPropsSchema {
  [propName: string]: {
    type: 'number' | 'string' | 'boolean' | 'enum' | 'color';
    options?: string[];  // For enum type
    default?: any;
    label?: string;
  };
}

export interface IconLibraryConfig {
  /** The actual icon components object (e.g., import * as Icons from 'library') */
  icons: Record<string, any>;

  /** Display name shown in UI (e.g., "Phosphor", "Lucide") */
  displayName: string;

  /** Default props for new icons from this library */
  defaultProps?: Record<string, any>;

  /** Optional: explicit list of icon names if auto-detection fails */
  iconNames?: string[];

  /** Optional: props schema for the props panel */
  propsSchema?: IconPropsSchema;
}

// Common schemas for popular libraries
export const PHOSPHOR_PROPS_SCHEMA: IconPropsSchema = {
  size: { type: 'number', default: 16, label: 'Size' },
  weight: {
    type: 'enum',
    options: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
    default: 'regular',
    label: 'Weight'
  },
  color: { type: 'color', label: 'Color' },
  mirrored: { type: 'boolean', default: false, label: 'Mirrored' }
};

export const LUCIDE_PROPS_SCHEMA: IconPropsSchema = {
  size: { type: 'number', default: 16, label: 'Size' },
  strokeWidth: { type: 'number', default: 2, label: 'Stroke Width' },
  color: { type: 'color', label: 'Color' },
  absoluteStrokeWidth: { type: 'boolean', default: false, label: 'Absolute Stroke' }
};

export type DraggingState = {
  id: string;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

export type ResizingState = {
  id: string;
  handle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}
