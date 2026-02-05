import { ViewportElement, IconLibraryConfig } from './types';
import { SelectionMode } from './utils/renderElement';
interface ViewportRendererProps {
    element: ViewportElement;
    options: {
        onSelectElement?: (id: string, addToSelection?: boolean) => void;
        onHoverElement?: (id: string | null) => void;
        onDoubleClickElement?: (id: string, x: number, y: number) => void;
        components?: Record<string, React.ComponentType<any>>;
        componentIndex?: Record<string, any>;
        iconLibraries?: Record<string, IconLibraryConfig>;
        onEditText?: (id: string, text: string) => void;
        editingTextId?: string | null;
        editingTextBounds?: {
            width: number;
            height: number;
        } | null;
        onStartEditText?: (id: string, bounds: {
            width: number;
            height: number;
        }) => void;
        onStopEditText?: () => void;
        selectionMode?: SelectionMode;
        selectedElementIds?: Set<string>;
        onResizeViewport?: (id: string, width: number, height: number) => void;
        canvasScale?: number;
        onResizeElement?: (id: string, size: {
            width: number;
            height: number;
        }) => void;
        onViewportPan?: (deltaX: number, deltaY: number) => void;
        devServerUrl?: string;
    };
}
/**
 * Get device category name based on width
 */
export declare function getDeviceNameForWidth(width: number): string;
/**
 * ViewportRenderer renders children inside an iframe using react-frame-component.
 */
export declare function ViewportRenderer({ element, options }: ViewportRendererProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ViewportRenderer.d.ts.map