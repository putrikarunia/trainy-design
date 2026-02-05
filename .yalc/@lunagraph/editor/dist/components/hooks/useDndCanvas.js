import { useState, useRef } from "react";
import { findParentId, isDescendant, removeElement, findElement } from "../utils/treeUtils";
import { isFullyInside, isCompletelyOutside, getElementRect, getCanvasRect } from "../utils/collisionUtils";
/**
 * Find the nearest selected ancestor of an element (or the element itself if selected)
 */
function findSelectedAncestor(elements, elementId, selectedIds) {
    // If the element itself is selected, return it
    if (selectedIds.has(elementId))
        return elementId;
    // Check each selected element to see if our element is a descendant
    for (const selectedId of selectedIds) {
        if (isDescendant(selectedId, elementId, elements)) {
            return selectedId;
        }
    }
    return null;
}
export function useDndCanvas({ elements, setElements, onSelectElement, onDragElement, canvasScale = 1, selectedElementIds = new Set(), hoverElementId = null, onPushOperations, }) {
    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [shouldDetach, setShouldDetach] = useState(false);
    // Store original state at drag start for undo
    const dragStartStateRef = useRef(new Map());
    // Get all IDs being dragged (either the selection if dragging a selected element, or just the single element)
    const getDraggedIds = (draggedId) => {
        if (selectedElementIds.has(draggedId) && selectedElementIds.size > 1) {
            // Dragging a selected element with multi-selection - drag all selected
            return selectedElementIds;
        }
        // Single element drag
        return new Set([draggedId]);
    };
    const handleDragStart = (event) => {
        const clickedElementId = event.active.id;
        let effectiveId = clickedElementId;
        // Check if the clicked element is inside a selected container
        // If so, drag the selected container instead
        const selectedAncestor = findSelectedAncestor(elements, clickedElementId, selectedElementIds);
        if (selectedAncestor && selectedAncestor !== clickedElementId) {
            // Dragging inside a selected container - drag the container
            effectiveId = selectedAncestor;
        }
        else if (selectedElementIds.size === 0 && hoverElementId && hoverElementId !== clickedElementId) {
            // Nothing selected - use hovered element if different from clicked
            // This handles the case where hover is on a parent but click registered on child
            effectiveId = hoverElementId;
        }
        setActiveId(effectiveId);
        setShouldDetach(false);
        // Record original state for undo
        dragStartStateRef.current.clear();
        const draggedIds = selectedElementIds.has(effectiveId) && selectedElementIds.size > 1
            ? selectedElementIds
            : new Set([effectiveId]);
        for (const id of draggedIds) {
            const el = findElement(elements, id);
            if (el) {
                const parentId = findParentId(elements, id);
                // Find index in parent's children or root
                let index = 0;
                if (parentId) {
                    const parent = findElement(elements, parentId);
                    if (parent && 'children' in parent && parent.children) {
                        index = parent.children.findIndex(c => c.id === id);
                    }
                }
                else {
                    index = elements.findIndex(e => e.id === id);
                }
                dragStartStateRef.current.set(id, {
                    position: el.canvasPosition ? { ...el.canvasPosition } : undefined,
                    parentId,
                    index: index >= 0 ? index : 0,
                });
            }
        }
        // Only select if not already part of selection (to preserve multi-select)
        if (onSelectElement && !selectedElementIds.has(effectiveId)) {
            onSelectElement(effectiveId);
        }
    };
    const handleDragEnd = (event) => {
        const { delta } = event;
        if (!delta || !activeId) {
            setActiveId(null);
            setOverId(null);
            return;
        }
        // Use the corrected activeId state, NOT event.active.id
        // activeId was set in handleDragStart to handle container selection
        const draggedId = activeId;
        const draggedIds = getDraggedIds(draggedId);
        const isMultiDrag = draggedIds.size > 1;
        // Convert screen-space delta to canvas-space delta
        const canvasDelta = {
            x: delta.x / canvasScale,
            y: delta.y / canvasScale,
        };
        // For multi-drag, we only support moving root elements together
        // Nesting and detaching are disabled for multi-drag to keep it simple
        if (isMultiDrag) {
            // Skip if no actual movement
            if (Math.abs(canvasDelta.x) < 1 && Math.abs(canvasDelta.y) < 1) {
                setActiveId(null);
                setOverId(null);
                setShouldDetach(false);
                dragStartStateRef.current.clear();
                return;
            }
            // Build operations for each moved element
            const ops = [];
            // Multi-drag: move all selected root elements by the same delta
            setElements((prevElements) => {
                return prevElements.map((el) => {
                    if (draggedIds.has(el.id) && el.type !== 'text') {
                        const startState = dragStartStateRef.current.get(el.id);
                        const oldPos = startState?.position || el.canvasPosition || { x: 0, y: 0 };
                        const newPos = {
                            x: (el.canvasPosition?.x || 0) + canvasDelta.x,
                            y: (el.canvasPosition?.y || 0) + canvasDelta.y,
                        };
                        // Create operation for history (only if we have valid old position)
                        ops.push({
                            type: 'set_position',
                            elementId: el.id,
                            oldPosition: { x: oldPos.x, y: oldPos.y }, // Ensure it's a copy
                            newPosition: newPos,
                        });
                        return {
                            ...el,
                            canvasPosition: newPos,
                        };
                    }
                    return el;
                });
            });
            // Push operations to history
            if (onPushOperations && ops.length > 0) {
                onPushOperations(ops);
            }
            setActiveId(null);
            setOverId(null);
            setShouldDetach(false);
            dragStartStateRef.current.clear();
            return;
        }
        // Single element drag - original logic
        const currentParentId = findParentId(elements, draggedId);
        // Decision tree:
        // 1. If fully inside another element (overId set) -> nest inside it
        // 2. If shouldDetach flag is true -> detach child to root canvas
        // 3. If root element -> just update position
        // 4. If child and still inside parent -> do nothing
        if (overId && onDragElement) {
            // Case 1: Nest inside another element
            onDragElement(draggedId, overId, "inside");
        }
        else if (shouldDetach) {
            // Case 2: Child was pulled outside parent -> detach to root at current drag position
            const startState = dragStartStateRef.current.get(draggedId);
            let newPosition;
            setElements((prevElements) => {
                const { tree, removed } = removeElement(prevElements, draggedId);
                if (removed) {
                    const draggedRect = getElementRect(draggedId);
                    const canvasRect = getCanvasRect();
                    if (draggedRect && canvasRect) {
                        newPosition = {
                            x: draggedRect.left - canvasRect.left + canvasDelta.x,
                            y: draggedRect.top - canvasRect.top + canvasDelta.y,
                        };
                        return [
                            ...tree,
                            {
                                ...removed,
                                canvasPosition: newPosition,
                            },
                        ];
                    }
                }
                return prevElements;
            });
            // Push move operation to history (from parent to root)
            if (onPushOperations && startState && startState.parentId !== null) {
                // This is a move from parent to root
                onPushOperations([{
                        type: 'move',
                        elementId: draggedId,
                        fromParentId: startState.parentId,
                        toParentId: null, // Moving to root
                        fromIndex: startState.index,
                        toIndex: elements.length, // Will be at end of root (approximate)
                    }]);
            }
        }
        else if (!currentParentId) {
            // Case 3: Root element moving on canvas
            const startState = dragStartStateRef.current.get(draggedId);
            // Skip if no actual movement
            if (Math.abs(canvasDelta.x) < 1 && Math.abs(canvasDelta.y) < 1) {
                setActiveId(null);
                setOverId(null);
                setShouldDetach(false);
                dragStartStateRef.current.clear();
                return;
            }
            let newPos;
            setElements((prevElements) => {
                const updatePosition = (elements) => {
                    return elements.map((el) => {
                        if (el.id === draggedId && el.type !== 'text') {
                            newPos = {
                                x: (el.canvasPosition?.x || 0) + canvasDelta.x,
                                y: (el.canvasPosition?.y || 0) + canvasDelta.y,
                            };
                            return {
                                ...el,
                                canvasPosition: newPos,
                            };
                        }
                        return el;
                    });
                };
                return updatePosition(prevElements);
            });
            // Push position change to history
            if (onPushOperations && newPos) {
                // Get old position (from start state or current element)
                const el = findElement(elements, draggedId);
                const oldPos = startState?.position || el?.canvasPosition || { x: 0, y: 0 };
                // Only record if position actually changed
                if (Math.abs(oldPos.x - newPos.x) > 0.1 || Math.abs(oldPos.y - newPos.y) > 0.1) {
                    onPushOperations([{
                            type: 'set_position',
                            elementId: draggedId,
                            oldPosition: { x: oldPos.x, y: oldPos.y }, // Ensure it's a copy
                            newPosition: newPos,
                        }]);
                }
            }
        }
        // If child is still inside parent and no new parent -> do nothing
        setActiveId(null);
        setOverId(null);
        setShouldDetach(false);
        dragStartStateRef.current.clear();
    };
    const handleDragMove = (event) => {
        const { over, delta } = event;
        if (!activeId || !delta) {
            setOverId(null);
            return;
        }
        // Use the corrected activeId state, NOT event.active.id
        // activeId was set in handleDragStart to handle container selection
        const currentParentId = findParentId(elements, activeId);
        // If element is a child, check if it's been dragged outside its parent
        if (currentParentId) {
            const activeRect = getElementRect(activeId);
            const parentRect = getElementRect(currentParentId);
            if (activeRect && parentRect) {
                const currentRect = {
                    left: activeRect.left + delta.x,
                    right: activeRect.right + delta.x,
                    top: activeRect.top + delta.y,
                    bottom: activeRect.bottom + delta.y,
                    width: activeRect.width,
                    height: activeRect.height,
                };
                // If completely outside parent, mark for detachment
                if (isCompletelyOutside(currentRect, parentRect)) {
                    setShouldDetach(true);
                }
                else {
                    // Still inside parent, don't detach
                    setShouldDetach(false);
                }
            }
        }
        // If not over anything, clear overId
        if (!over) {
            setOverId(null);
            return;
        }
        const currentOverId = over.id;
        // Don't nest inside self
        if (currentOverId === activeId) {
            setOverId(null);
            return;
        }
        // Prevent nesting parent inside its own descendant
        if (isDescendant(activeId, currentOverId, elements)) {
            setOverId(null);
            return;
        }
        // Check if dragged element is fully inside the over element
        const activeRect = getElementRect(activeId);
        const overRect = getElementRect(currentOverId);
        if (activeRect && overRect) {
            const currentRect = {
                left: activeRect.left + delta.x,
                right: activeRect.right + delta.x,
                top: activeRect.top + delta.y,
                bottom: activeRect.bottom + delta.y,
                width: activeRect.width,
                height: activeRect.height,
            };
            if (isFullyInside(currentRect, overRect)) {
                setOverId(currentOverId);
            }
            else {
                setOverId(null);
            }
        }
        else {
            setOverId(null);
        }
    };
    const handleDragCancel = () => {
        setActiveId(null);
        setOverId(null);
        setShouldDetach(false);
        dragStartStateRef.current.clear();
    };
    // Use the imported findElement from treeUtils
    const activeElement = activeId ? findElement(elements, activeId) : null;
    // Get all elements being dragged (for multi-drag preview)
    const draggedIds = activeId ? getDraggedIds(activeId) : new Set();
    const activeElements = [];
    for (const id of draggedIds) {
        const el = findElement(elements, id);
        if (el)
            activeElements.push(el);
    }
    return {
        activeId,
        activeElement,
        activeElements,
        draggedIds, // Set of all IDs being dragged (for hiding originals)
        overId,
        isDragging: !!activeId,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        handleDragCancel,
    };
}
