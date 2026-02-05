import React from "react";
import { FEElement, IconLibraryConfig } from "./types";
export declare function Canvas({ elements, selectedElementIds, hoverElementId, onSelectElement, onHoverElement, onResizeElement, onEditText, editingTextId, editingTextBounds, onStartEditText, onStopEditText, isDragging, draggedIds, potentialParentId, components, componentIndex, iconLibraries, editingFile, onCloseEdit, onZoomChange, cmdPressed, onDoubleClickDrillIn, snapshotContent, renderMode, onRenderError, onAddElement, onTransformChange, canvasRefProp, viewportRefProp, readOnly, initialTransform, onUpdateElementStyles, onUpdateElementProps, }: {
    elements: FEElement[];
    selectedElementIds: Set<string>;
    hoverElementId: string | null;
    onSelectElement: (id: string | null, addToSelection?: boolean) => void;
    onHoverElement: (id: string | null) => void;
    onResizeElement: (id: string, size: {
        width: number;
        height: number;
    }, position?: {
        x: number;
        y: number;
    }) => void;
    onEditText: (id: string, text: string) => void;
    editingTextId: string | null;
    editingTextBounds: {
        width: number;
        height: number;
    } | null;
    onStartEditText: (id: string, bounds: {
        width: number;
        height: number;
    }) => void;
    onStopEditText: () => void;
    isDragging?: boolean;
    draggedIds?: Set<string>;
    potentialParentId?: string | null;
    components?: Record<string, React.ComponentType<any>>;
    componentIndex?: Record<string, any>;
    iconLibraries?: Record<string, IconLibraryConfig>;
    editingFile?: string | null;
    onCloseEdit?: () => void;
    onZoomChange?: (zoom: number) => void;
    cmdPressed?: boolean;
    onDoubleClickDrillIn?: (elementId: string, x: number, y: number) => void;
    /** For snapshot tabs: render this content directly instead of FEElements */
    snapshotContent?: React.ReactNode;
    /** Rendering mode for file tabs: 'felement' (editable) or 'snapshot' (read-only fallback) */
    renderMode?: 'felement' | 'snapshot';
    /** Callback when FElement rendering fails - triggers switch to snapshot mode */
    onRenderError?: () => void;
    /** Callback when an element is added (e.g., via drag-drop) */
    onAddElement?: (element: FEElement) => void;
    /** Callback when transform changes (zoom/pan) */
    onTransformChange?: (transform: {
        scale: number;
        positionX: number;
        positionY: number;
    }) => void;
    /** Ref to access canvas element for coordinate conversion */
    canvasRefProp?: React.RefObject<HTMLDivElement | null>;
    /** Ref to access viewport element (visible area) */
    viewportRefProp?: React.RefObject<HTMLDivElement | null>;
    /** Read-only mode - disables editing and resizing */
    readOnly?: boolean;
    /** Initial transform state for the canvas */
    initialTransform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
    /** Callback to update element styles */
    onUpdateElementStyles?: (elementId: string, styles: React.CSSProperties) => void;
    /** Callback to update element props */
    onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Canvas.d.ts.map