// Core FEElement types (shared between editor and codegen)
// Note: Excludes canvas-specific properties like canvasPosition

export interface TextLeafNode {
  id: string;
  type: 'text';
  tag: 'span';
  styles?: Record<string, any>; // React.CSSProperties
  text?: string;
}

export interface HtmlElement {
  id: string;
  type: 'html';
  tag: string;
  props?: Record<string, any>; // HTML attributes like className, id, etc.
  styles?: Record<string, any>; // React.CSSProperties
  children?: FEElement[];
}

export interface ComponentElement {
  id: string;
  type: "component";
  componentName: string;
  props?: Record<string, any>;
  styles?: Record<string, any>; // React.CSSProperties
  children?: FEElement[];

  // Whether this component is registered in the components map (exact match)
  // true = user component from registry, render via createElement(Component, ...)
  // false = library component (e.g., Radix primitive), use componentRef to render
  isRegistered?: boolean;

  // For unregistered (library) components: the actual component reference
  // This allows us to render library components like ProgressPrimitive.Root directly
  // Note: This doesn't serialize to JSON, only used for in-memory rendering
  componentRef?: any; // React.ComponentType<any>
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
  styles?: Record<string, any>; // React.CSSProperties
}

export type FEElement = HtmlElement | ComponentElement | TextLeafNode | IconElement

// Icon library configuration (minimal version for codegen)
export interface IconLibraryConfig {
  /** The actual icon components object */
  icons: Record<string, any>;
  displayName?: string;
  defaultProps?: Record<string, any>;
  iconNames?: string[];
  propsSchema?: Record<string, any>;
}

// Canvas persistence types
export interface CanvasData {
  id: string                    // Slug: "homepage-hero"
  name: string                  // Display: "Homepage Hero"
  elements: FEElement[]
  createdAt: string
  updatedAt: string
  zoom?: number
  pan?: { x: number; y: number }
  metadata?: {
    description?: string
    tags?: string[]
  }
}
