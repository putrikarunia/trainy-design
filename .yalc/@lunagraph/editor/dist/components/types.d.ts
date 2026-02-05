export interface TextLeafNode {
    id: string;
    type: 'text';
    tag: 'span';
    styles?: React.CSSProperties;
    text?: string;
    canvasPosition?: {
        x: number;
        y: number;
    };
}
export interface HtmlElement {
    id: string;
    type: 'html';
    tag: HTMLElement['tagName'];
    props?: Record<string, any>;
    styles?: React.CSSProperties;
    children?: FEElement[];
    canvasPosition?: {
        x: number;
        y: number;
    };
}
export interface ComponentElement {
    id: string;
    type: "component";
    componentName: string;
    props?: Record<string, any>;
    isRegistered?: boolean;
    componentRef?: React.ComponentType<any>;
    styles?: React.CSSProperties;
    children?: FEElement[];
    canvasPosition?: {
        x: number;
        y: number;
    };
}
export interface IconElement {
    id: string;
    type: 'icon';
    library: string;
    iconName: string;
    props: Record<string, any>;
    styles?: React.CSSProperties;
    canvasPosition?: {
        x: number;
        y: number;
    };
}
export interface ViewportElement {
    id: string;
    type: 'viewport';
    viewportWidth: number;
    viewportHeight?: number;
    deviceName?: string;
    styles?: React.CSSProperties;
    children?: FEElement[];
    canvasPosition?: {
        x: number;
        y: number;
    };
}
export declare const VIEWPORT_PRESETS: {
    readonly desktop: {
        readonly width: 1512;
        readonly height: 800;
        readonly name: "Desktop";
    };
    readonly laptop: {
        readonly width: 1280;
        readonly height: 720;
        readonly name: "Laptop";
    };
    readonly tablet: {
        readonly width: 768;
        readonly height: 1024;
        readonly name: "Tablet";
    };
    readonly mobile: {
        readonly width: 390;
        readonly height: 844;
        readonly name: "Mobile";
    };
};
export type FEElement = HtmlElement | ComponentElement | TextLeafNode | IconElement | ViewportElement;
export interface IconPropsSchema {
    [propName: string]: {
        type: 'number' | 'string' | 'boolean' | 'enum' | 'color';
        options?: string[];
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
export declare const PHOSPHOR_PROPS_SCHEMA: IconPropsSchema;
export declare const LUCIDE_PROPS_SCHEMA: IconPropsSchema;
export type DraggingState = {
    id: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
};
export type ResizingState = {
    id: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
};
//# sourceMappingURL=types.d.ts.map