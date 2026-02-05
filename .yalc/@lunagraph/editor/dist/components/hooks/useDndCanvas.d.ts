import { DragEndEvent, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";
import { FEElement } from "../types";
import { type Operation } from "../utils/operations";
export declare function useDndCanvas({ elements, setElements, onSelectElement, onDragElement, canvasScale, selectedElementIds, hoverElementId, onPushOperations, }: {
    elements: FEElement[];
    setElements: (elements: FEElement[] | ((prev: FEElement[]) => FEElement[])) => void;
    onSelectElement?: (id: string | null) => void;
    onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
    canvasScale?: number;
    selectedElementIds?: Set<string>;
    hoverElementId?: string | null;
    /** Callback to push operations to history (for undo/redo) */
    onPushOperations?: (ops: Operation[]) => void;
}): {
    activeId: string | null;
    activeElement: FEElement | null;
    activeElements: FEElement[];
    draggedIds: Set<string>;
    overId: string | null;
    isDragging: boolean;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragMove: (event: DragMoveEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    handleDragCancel: () => void;
};
//# sourceMappingURL=useDndCanvas.d.ts.map