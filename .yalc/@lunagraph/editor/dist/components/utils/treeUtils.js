import { generatePrefixedId } from "./idUtils";
/**
 * Type guard to check if an element can have children
 */
export function hasChildren(element) {
    return element.type !== 'text' && element.type !== 'icon';
}
/**
 * Build a cache for O(1) element and parent lookups
 * This is much faster than repeated tree traversals for large trees
 */
export function buildElementCache(elements) {
    const byId = new Map();
    const parentById = new Map();
    const traverse = (els, parentId) => {
        for (const el of els) {
            byId.set(el.id, el);
            parentById.set(el.id, parentId);
            if ('children' in el && el.children) {
                traverse(el.children, el.id);
            }
        }
    };
    traverse(elements, null);
    return { byId, parentById };
}
/**
 * Find element using cache (O(1)) with fallback to tree search
 */
export function findElementCached(elements, id, cache) {
    if (cache) {
        return cache.byId.get(id) || null;
    }
    return findElement(elements, id);
}
/**
 * Find parent ID using cache (O(1)) with fallback to tree search
 */
export function findParentIdCached(elements, childId, cache) {
    if (cache) {
        return cache.parentById.get(childId) ?? null;
    }
    return findParentId(elements, childId);
}
// ============================================================================
// TREE SEARCH (fallback for when cache is not available)
// ============================================================================
/**
 * Find an element in the tree by ID (O(n) - use findElementCached when possible)
 */
export function findElement(elements, id) {
    for (const el of elements) {
        if (el.id === id)
            return el;
        if ('children' in el && el.children) {
            const found = findElement(el.children, id);
            if (found)
                return found;
        }
    }
    return null;
}
/**
 * Find the parent ID of an element (O(n) - use findParentIdCached when possible)
 */
export function findParentId(elements, childId) {
    for (const el of elements) {
        if ('children' in el && el.children) {
            for (const child of el.children) {
                if (child.id === childId)
                    return el.id;
            }
            const foundInChildren = findParentId(el.children, childId);
            if (foundInChildren)
                return foundInChildren;
        }
    }
    return null;
}
/**
 * Check if an element is a descendant of another
 */
export function isDescendant(parentId, childId, elements) {
    const parent = findElement(elements, parentId);
    if (!parent || !('children' in parent) || !parent.children)
        return false;
    return !!findElement(parent.children, childId);
}
/**
 * Remove an element from the tree and return both the new tree and the removed element
 */
export function removeElement(elements, idToRemove) {
    let removedElement = null;
    const remove = (elements) => {
        const result = [];
        for (const el of elements) {
            if (el.id === idToRemove) {
                removedElement = el;
            }
            else if (hasChildren(el)) {
                result.push({
                    ...el,
                    children: el.children ? remove(el.children) : [],
                });
            }
            else {
                result.push(el);
            }
        }
        return result;
    };
    return { tree: remove(elements), removed: removedElement };
}
/**
 * Update an element's position in the tree
 */
export function updateElementPosition(elements, id, position) {
    return elements.map((el) => {
        if (el.id === id) {
            return {
                ...el,
                canvasPosition: position,
            };
        }
        if (hasChildren(el)) {
            return { ...el, children: el.children ? updateElementPosition(el.children, id, position) : [] };
        }
        return el;
    });
}
/**
 * Update an element's styles in the tree
 */
export function updateElementStyles(elements, id, styles) {
    return elements.map((el) => {
        if (el.id === id) {
            return {
                ...el,
                styles,
            };
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? updateElementStyles(el.children, id, styles) : []
            };
        }
        return el;
    });
}
/**
 * Update an element's props in the tree
 */
export function updateElementProps(elements, id, props) {
    return elements.map((el) => {
        if (el.id === id && (el.type === 'component' || el.type === 'html' || el.type === 'icon')) {
            return {
                ...el,
                props,
            };
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? updateElementProps(el.children, id, props) : []
            };
        }
        return el;
    });
}
/**
 * Update text content of a text element
 */
export function updateElementText(elements, id, text) {
    return elements.map((el) => {
        if (el.id === id && el.type === 'text') {
            return {
                ...el,
                text,
            };
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? updateElementText(el.children, id, text) : []
            };
        }
        return el;
    });
}
/**
 * Update element size (and optionally position)
 */
export function updateElementSize(elements, id, size, pos) {
    return elements.map((el) => {
        if (el.id === id) {
            return {
                ...el,
                styles: {
                    ...(el.styles || {}),
                    width: size.width,
                    height: size.height
                },
                canvasPosition: pos ? { x: pos.x, y: pos.y } : el.canvasPosition
            };
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? updateElementSize(el.children, id, size, pos) : []
            };
        }
        return el;
    });
}
/**
 * Replace an element in the tree with a new element
 */
export function replaceElement(elements, idToReplace, newElement) {
    return elements.map((el) => {
        if (el.id === idToReplace) {
            return newElement;
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? replaceElement(el.children, idToReplace, newElement) : []
            };
        }
        return el;
    });
}
/**
 * Insert an element as a child of a target element
 */
export function insertElementAsChild(elements, targetId, elementToInsert) {
    return elements.map((el) => {
        if (el.id === targetId) {
            if (!hasChildren(el)) {
                // Can't insert into text or icon node
                return el;
            }
            return {
                ...el,
                children: [...(el.children || []), elementToInsert]
            };
        }
        if (hasChildren(el)) {
            return {
                ...el,
                children: el.children ? insertElementAsChild(el.children, targetId, elementToInsert) : []
            };
        }
        return el;
    });
}
/**
 * Insert an element before/after a target element, or inside it
 */
export function insertElement(elements, targetId, elementToInsert, position) {
    const result = [];
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.id === targetId) {
            if (position === "before") {
                result.push(elementToInsert);
                result.push(el);
            }
            else if (position === "after") {
                result.push(el);
                result.push(elementToInsert);
            }
            else if (position === "inside") {
                if (hasChildren(el)) {
                    result.push({
                        ...el,
                        children: [...(el.children || []), elementToInsert],
                    });
                }
                else {
                    result.push(el);
                }
            }
        }
        else {
            if (hasChildren(el)) {
                result.push({
                    ...el,
                    children: el.children ? insertElement(el.children, targetId, elementToInsert, position) : [],
                });
            }
            else {
                result.push(el);
            }
        }
    }
    return result;
}
/**
 * Wrap multiple elements in a new div container
 * The wrapper div is placed at the topmost-leftmost position
 * Elements are ordered by their visual position (top-to-bottom or left-to-right)
 * Returns the new tree and the ID of the wrapper div
 */
export function wrapElementsInDiv(elements, idsToWrap) {
    if (idsToWrap.size === 0)
        return null;
    const wrapperId = generatePrefixedId('html');
    // Collect all elements to wrap with their positions
    const toWrapWithPos = [];
    // Find and collect elements to wrap
    const findElementsToWrap = (els) => {
        for (const el of els) {
            if (idsToWrap.has(el.id)) {
                const pos = el.canvasPosition || { x: 0, y: 0 };
                // Remove canvasPosition since it'll be inside wrapper now
                const { canvasPosition, ...rest } = el;
                toWrapWithPos.push({ element: rest, position: pos });
            }
            if (hasChildren(el) && el.children) {
                findElementsToWrap(el.children);
            }
        }
    };
    findElementsToWrap(elements);
    if (toWrapWithPos.length === 0)
        return null;
    // Determine flex direction based on element arrangement
    const flexDirection = determineFlexDirection(toWrapWithPos.map(e => ({ ...e.element, canvasPosition: e.position })));
    // Sort elements by position to preserve visual order
    // For column layout: sort by Y (top to bottom), then X
    // For row layout: sort by X (left to right), then Y
    toWrapWithPos.sort((a, b) => {
        if (flexDirection === 'column') {
            return a.position.y !== b.position.y
                ? a.position.y - b.position.y
                : a.position.x - b.position.x;
        }
        else {
            return a.position.x !== b.position.x
                ? a.position.x - b.position.x
                : a.position.y - b.position.y;
        }
    });
    const toWrap = toWrapWithPos.map(e => e.element);
    // Find the topmost-leftmost position for the wrapper
    const wrapperPosition = toWrapWithPos.reduce((min, curr) => ({
        x: Math.min(min.x, curr.position.x),
        y: Math.min(min.y, curr.position.y),
    }), { x: Infinity, y: Infinity });
    // Check if all wrapped elements are at root level
    const allAtRoot = toWrapWithPos.every(e => findParentId(elements, e.element.id) === null);
    // Create wrapper div
    const wrapperDiv = {
        id: wrapperId,
        type: 'html',
        tag: 'div',
        styles: {
            display: 'flex',
            flexDirection,
            gap: 8,
        },
        children: toWrap,
        // Only set canvasPosition if wrapper is at root level
        ...(allAtRoot && { canvasPosition: wrapperPosition }),
    };
    // Remove all wrapped elements and insert wrapper at first encountered element's position
    let wrapperInserted = false;
    const rebuildTree = (els) => {
        const result = [];
        for (const el of els) {
            if (idsToWrap.has(el.id)) {
                // This element is being wrapped
                // Insert wrapper at the first wrapped element we encounter
                if (!wrapperInserted) {
                    result.push(wrapperDiv);
                    wrapperInserted = true;
                }
                // Skip adding this element (it's now in the wrapper)
                continue;
            }
            if (hasChildren(el) && el.children) {
                // Recurse and rebuild children
                result.push({ ...el, children: rebuildTree(el.children) });
            }
            else {
                result.push(el);
            }
        }
        return result;
    };
    const newTree = rebuildTree(elements);
    // If wrapper wasn't inserted (shouldn't happen), add at root
    if (!wrapperInserted) {
        newTree.push(wrapperDiv);
    }
    return { tree: newTree, wrapperId };
}
/**
 * Move an element within its siblings array by a given offset.
 * Returns the new tree, or null if the move is not possible.
 */
export function moveElementInSiblings(elements, elementId, offset // -1 = move up/left, +1 = move down/right
) {
    const parentId = findParentId(elements, elementId);
    // Find the parent element (or use root if at root level)
    if (parentId === null) {
        // Element is at root level
        const index = elements.findIndex(el => el.id === elementId);
        if (index === -1)
            return null;
        const newIndex = index + offset;
        if (newIndex < 0 || newIndex >= elements.length)
            return null;
        // Swap positions in the array
        const newElements = [...elements];
        const [removed] = newElements.splice(index, 1);
        newElements.splice(newIndex, 0, removed);
        return newElements;
    }
    // Element is inside a parent
    const parent = findElement(elements, parentId);
    if (!parent || !hasChildren(parent) || !parent.children)
        return null;
    const index = parent.children.findIndex(el => el.id === elementId);
    if (index === -1)
        return null;
    const newIndex = index + offset;
    if (newIndex < 0 || newIndex >= parent.children.length)
        return null;
    // Create new children array with element moved
    const newChildren = [...parent.children];
    const [removed] = newChildren.splice(index, 1);
    newChildren.splice(newIndex, 0, removed);
    // Update the tree with new children
    const updateChildren = (els) => {
        return els.map(el => {
            if (el.id === parentId && hasChildren(el)) {
                return { ...el, children: newChildren };
            }
            if (hasChildren(el) && el.children) {
                return { ...el, children: updateChildren(el.children) };
            }
            return el;
        });
    };
    return updateChildren(elements);
}
/**
 * Determine if elements should be wrapped in flex-row or flex-col
 * based on their visual arrangement
 */
function determineFlexDirection(elements) {
    // If elements have canvasPosition, use that to determine layout
    const withPositions = elements.filter(el => el.canvasPosition);
    if (withPositions.length >= 2) {
        // Calculate horizontal vs vertical spread
        const xs = withPositions.map(el => el.canvasPosition.x);
        const ys = withPositions.map(el => el.canvasPosition.y);
        const xSpread = Math.max(...xs) - Math.min(...xs);
        const ySpread = Math.max(...ys) - Math.min(...ys);
        // If more horizontal spread, use row
        return xSpread > ySpread ? 'row' : 'column';
    }
    // Default to column (most common for UI layouts)
    return 'column';
}
