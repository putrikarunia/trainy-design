import { FEElement } from "./types";
interface LayersPanelProps {
    elements: FEElement[];
    selectedElementIds: Set<string>;
    onSelectElement: (id: string | null, addToSelection?: boolean) => void;
    onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
    onUpdateText?: (id: string, newText: string) => void;
    onFocusElement?: (id: string) => void;
    readOnly?: boolean;
}
export declare function LayersPanel({ elements, selectedElementIds, onSelectElement, onDragElement, onUpdateText, onFocusElement, readOnly, }: LayersPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LayersPanel.d.ts.map