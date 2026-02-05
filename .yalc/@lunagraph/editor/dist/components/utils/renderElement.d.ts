import { FEElement, IconLibraryConfig } from "../types";
export type SelectionMode = 'topmost' | 'deepest';
export declare function renderElement(element: FEElement, options?: {
    isDragPreview?: boolean;
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
    isSVGContext?: boolean;
    selectedElementIds?: Set<string>;
    onResizeViewport?: (id: string, width: number, height: number) => void;
    canvasScale?: number;
    onResizeElement?: (id: string, size: {
        width: number;
        height: number;
    }) => void;
    onViewportPan?: (deltaX: number, deltaY: number) => void;
    devServerUrl?: string;
}): React.ReactNode;
//# sourceMappingURL=renderElement.d.ts.map