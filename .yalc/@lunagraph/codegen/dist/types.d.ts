export interface TextLeafNode {
    id: string;
    type: 'text';
    tag: 'span';
    styles?: Record<string, any>;
    text?: string;
}
export interface HtmlElement {
    id: string;
    type: 'html';
    tag: string;
    props?: Record<string, any>;
    styles?: Record<string, any>;
    children?: FEElement[];
}
export interface ComponentElement {
    id: string;
    type: "component";
    componentName: string;
    props?: Record<string, any>;
    styles?: Record<string, any>;
    children?: FEElement[];
    isRegistered?: boolean;
    componentRef?: any;
}
export interface IconElement {
    id: string;
    type: 'icon';
    library: string;
    iconName: string;
    props: Record<string, any>;
    styles?: Record<string, any>;
}
export type FEElement = HtmlElement | ComponentElement | TextLeafNode | IconElement;
export interface IconLibraryConfig {
    /** The actual icon components object */
    icons: Record<string, any>;
    displayName?: string;
    defaultProps?: Record<string, any>;
    iconNames?: string[];
    propsSchema?: Record<string, any>;
}
export interface CanvasData {
    id: string;
    name: string;
    elements: FEElement[];
    createdAt: string;
    updatedAt: string;
    zoom?: number;
    pan?: {
        x: number;
        y: number;
    };
    metadata?: {
        description?: string;
        tags?: string[];
    };
}
