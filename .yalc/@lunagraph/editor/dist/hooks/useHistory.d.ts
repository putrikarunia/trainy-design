import type { FEElement } from "../components/types";
import { type Operation } from "../components/utils/operations";
export interface HistoryState {
    /** Stack of operation batches for undo */
    undoStack: Operation[][];
    /** Stack of operation batches for redo */
    redoStack: Operation[][];
}
export interface UseHistoryOptions {
    /** Maximum number of undo steps to keep (default: 50) */
    maxHistory?: number;
    /** Callback when history changes */
    onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}
export interface UseHistoryResult {
    /** Get current history state */
    getHistory: () => HistoryState;
    /** Apply operation(s) and add to undo stack */
    pushOperation: (elements: FEElement[], ops: Operation | Operation[]) => FEElement[];
    /** Undo the last operation batch */
    undo: (elements: FEElement[]) => FEElement[];
    /** Redo the last undone operation batch */
    redo: (elements: FEElement[]) => FEElement[];
    /** Check if undo is available */
    canUndo: () => boolean;
    /** Check if redo is available */
    canRedo: () => boolean;
    /** Clear all history */
    clearHistory: () => void;
}
/**
 * Hook for managing undo/redo history using operations.
 *
 * This hook uses the Command pattern - instead of storing snapshots,
 * it stores operations that can be inverted for undo/redo.
 *
 * Usage:
 * ```tsx
 * const history = useHistory({ maxHistory: 50 });
 *
 * // Apply an operation (adds to undo stack)
 * const newElements = history.pushOperation(elements, {
 *   type: 'insert',
 *   element: newElement,
 *   parentId: null,
 *   index: elements.length,
 * });
 * setElements(newElements);
 *
 * // Undo
 * const undoneElements = history.undo(elements);
 * setElements(undoneElements);
 *
 * // Redo
 * const redoneElements = history.redo(elements);
 * setElements(redoneElements);
 * ```
 */
export declare function useHistory(options?: UseHistoryOptions): UseHistoryResult;
/**
 * Hook for managing per-tab history.
 * Each tab has its own undo/redo stack.
 */
export declare function useTabHistory(options?: UseHistoryOptions): {
    pushOperation: (tabId: string, elements: FEElement[], ops: Operation | Operation[]) => FEElement[];
    recordOperations: (tabId: string, ops: Operation | Operation[]) => void;
    undo: (tabId: string, elements: FEElement[]) => FEElement[];
    redo: (tabId: string, elements: FEElement[]) => FEElement[];
    canUndo: (tabId: string) => boolean;
    canRedo: (tabId: string) => boolean;
    clearHistory: (tabId: string) => void;
    clearAllHistory: () => void;
};
//# sourceMappingURL=useHistory.d.ts.map