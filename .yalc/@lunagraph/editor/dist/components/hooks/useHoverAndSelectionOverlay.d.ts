import { FEElement } from "../types";
export declare function useHoverAndSelectionOverlay({ canvasRef, elements, selectedElementIds, hoverElementId, handleResizeStart, transform, onSelectElement, onHoverElement, onUpdateElementStyles, onUpdateElementProps, readOnly, }: {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    elements: FEElement[];
    selectedElementIds: Set<string>;
    hoverElementId: string | null;
    handleResizeStart: (e: React.MouseEvent, id: string, handle: string, element: FEElement) => void;
    transform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
    onSelectElement?: (id: string | null, addToSelection?: boolean) => void;
    onHoverElement?: (id: string | null) => void;
    onUpdateElementStyles?: (elementId: string, styles: React.CSSProperties) => void;
    onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
    readOnly?: boolean;
}): {
    renderSelectionOverlay: () => import("react/jsx-runtime").JSX.Element | null;
    renderHoverOverlay: () => import("react/jsx-runtime").JSX.Element | null;
};
//# sourceMappingURL=useHoverAndSelectionOverlay.d.ts.map