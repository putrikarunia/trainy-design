import { useCallback, useRef } from "react";
import { applyOperations, invertOperations, } from "../components/utils/operations";
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
export function useHistory(options = {}) {
    const { maxHistory = 50, onHistoryChange } = options;
    // Use ref to avoid re-renders when history changes
    const historyRef = useRef({
        undoStack: [],
        redoStack: [],
    });
    const notifyChange = useCallback(() => {
        onHistoryChange?.(historyRef.current.undoStack.length > 0, historyRef.current.redoStack.length > 0);
    }, [onHistoryChange]);
    const getHistory = useCallback(() => historyRef.current, []);
    const pushOperation = useCallback((elements, ops) => {
        const opsArray = Array.isArray(ops) ? ops : [ops];
        if (opsArray.length === 0)
            return elements;
        // Apply operations to get new state
        const newElements = applyOperations(elements, opsArray);
        // Add to undo stack
        historyRef.current.undoStack.push(opsArray);
        // Trim undo stack if over limit
        if (historyRef.current.undoStack.length > maxHistory) {
            historyRef.current.undoStack.shift();
        }
        // Clear redo stack (new action invalidates redo history)
        historyRef.current.redoStack = [];
        notifyChange();
        return newElements;
    }, [maxHistory, notifyChange]);
    const undo = useCallback((elements) => {
        const { undoStack, redoStack } = historyRef.current;
        if (undoStack.length === 0)
            return elements;
        // Pop last operation batch
        const lastOps = undoStack.pop();
        // Create inverse operations
        const inverseOps = invertOperations(lastOps);
        // Apply inverse operations
        const newElements = applyOperations(elements, inverseOps);
        // Push to redo stack
        redoStack.push(lastOps);
        notifyChange();
        return newElements;
    }, [notifyChange]);
    const redo = useCallback((elements) => {
        const { undoStack, redoStack } = historyRef.current;
        if (redoStack.length === 0)
            return elements;
        // Pop last undone operation batch
        const lastOps = redoStack.pop();
        // Reapply operations
        const newElements = applyOperations(elements, lastOps);
        // Push back to undo stack
        undoStack.push(lastOps);
        notifyChange();
        return newElements;
    }, [notifyChange]);
    const canUndo = useCallback(() => {
        return historyRef.current.undoStack.length > 0;
    }, []);
    const canRedo = useCallback(() => {
        return historyRef.current.redoStack.length > 0;
    }, []);
    const clearHistory = useCallback(() => {
        historyRef.current = {
            undoStack: [],
            redoStack: [],
        };
        notifyChange();
    }, [notifyChange]);
    return {
        getHistory,
        pushOperation,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
    };
}
/**
 * Hook for managing per-tab history.
 * Each tab has its own undo/redo stack.
 */
export function useTabHistory(options = {}) {
    const { maxHistory = 50, onHistoryChange } = options;
    // Map of tabId -> HistoryState
    const tabHistoriesRef = useRef(new Map());
    const getOrCreateHistory = useCallback((tabId) => {
        if (!tabHistoriesRef.current.has(tabId)) {
            tabHistoriesRef.current.set(tabId, {
                undoStack: [],
                redoStack: [],
            });
        }
        return tabHistoriesRef.current.get(tabId);
    }, []);
    const notifyChange = useCallback((tabId) => {
        const history = getOrCreateHistory(tabId);
        onHistoryChange?.(history.undoStack.length > 0, history.redoStack.length > 0);
    }, [getOrCreateHistory, onHistoryChange]);
    const pushOperation = useCallback((tabId, elements, ops) => {
        const opsArray = Array.isArray(ops) ? ops : [ops];
        if (opsArray.length === 0)
            return elements;
        const history = getOrCreateHistory(tabId);
        // Apply operations
        const newElements = applyOperations(elements, opsArray);
        // Add to undo stack
        history.undoStack.push(opsArray);
        // Trim if over limit
        if (history.undoStack.length > maxHistory) {
            history.undoStack.shift();
        }
        // Clear redo stack
        history.redoStack = [];
        notifyChange(tabId);
        return newElements;
    }, [getOrCreateHistory, maxHistory, notifyChange]);
    const undo = useCallback((tabId, elements) => {
        const history = getOrCreateHistory(tabId);
        if (history.undoStack.length === 0)
            return elements;
        const lastOps = history.undoStack.pop();
        const inverseOps = invertOperations(lastOps);
        const newElements = applyOperations(elements, inverseOps);
        history.redoStack.push(lastOps);
        notifyChange(tabId);
        return newElements;
    }, [getOrCreateHistory, notifyChange]);
    const redo = useCallback((tabId, elements) => {
        const history = getOrCreateHistory(tabId);
        if (history.redoStack.length === 0)
            return elements;
        const lastOps = history.redoStack.pop();
        const newElements = applyOperations(elements, lastOps);
        history.undoStack.push(lastOps);
        notifyChange(tabId);
        return newElements;
    }, [getOrCreateHistory, notifyChange]);
    const canUndo = useCallback((tabId) => {
        return getOrCreateHistory(tabId).undoStack.length > 0;
    }, [getOrCreateHistory]);
    const canRedo = useCallback((tabId) => {
        return getOrCreateHistory(tabId).redoStack.length > 0;
    }, [getOrCreateHistory]);
    const clearHistory = useCallback((tabId) => {
        tabHistoriesRef.current.set(tabId, {
            undoStack: [],
            redoStack: [],
        });
        notifyChange(tabId);
    }, [notifyChange]);
    const clearAllHistory = useCallback(() => {
        tabHistoriesRef.current.clear();
    }, []);
    /**
     * Record operations to history WITHOUT applying them.
     * Use this when changes were already applied (e.g., by drag).
     */
    const recordOperations = useCallback((tabId, ops) => {
        const opsArray = Array.isArray(ops) ? ops : [ops];
        if (opsArray.length === 0)
            return;
        const history = getOrCreateHistory(tabId);
        // Add to undo stack
        history.undoStack.push(opsArray);
        // Trim if over limit
        if (history.undoStack.length > maxHistory) {
            history.undoStack.shift();
        }
        // Clear redo stack
        history.redoStack = [];
        notifyChange(tabId);
    }, [getOrCreateHistory, maxHistory, notifyChange]);
    return {
        pushOperation,
        recordOperations,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
        clearAllHistory,
    };
}
