import { findElement, findParentId, hasChildren, removeElement, } from "./treeUtils";
// =============================================================================
// Apply Operations
// =============================================================================
/**
 * Apply a single operation to the element tree, returning the new tree.
 */
export function applyOperation(elements, op) {
    switch (op.type) {
        case "insert":
            return applyInsert(elements, op);
        case "remove":
            return applyRemove(elements, op);
        case "move":
            return applyMove(elements, op);
        case "set_position":
            return applySetPosition(elements, op);
        case "set_styles":
            return applySetStyles(elements, op);
        case "set_props":
            return applySetProps(elements, op);
        case "set_text":
            return applySetText(elements, op);
        case "replace":
            return applyReplace(elements, op);
        default:
            return elements;
    }
}
/**
 * Apply multiple operations in sequence.
 */
export function applyOperations(elements, ops) {
    return ops.reduce((tree, op) => applyOperation(tree, op), elements);
}
// -----------------------------------------------------------------------------
// Apply Helpers
// -----------------------------------------------------------------------------
function applyInsert(elements, op) {
    const { element, parentId, index } = op;
    // Safety check: don't insert if element with this ID already exists
    if (findElement(elements, element.id)) {
        console.warn(`[operations] Skipping insert - element ${element.id} already exists`);
        return elements;
    }
    if (parentId === null) {
        // Insert at root level
        const newElements = [...elements];
        // Clamp index to valid range
        const safeIndex = Math.min(index, newElements.length);
        newElements.splice(safeIndex, 0, element);
        return newElements;
    }
    // Insert as child of parent
    return elements.map((el) => {
        if (el.id === parentId && hasChildren(el)) {
            const newChildren = [...(el.children || [])];
            // Clamp index to valid range
            const safeIndex = Math.min(index, newChildren.length);
            newChildren.splice(safeIndex, 0, element);
            return { ...el, children: newChildren };
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applyInsert(el.children, op) };
        }
        return el;
    });
}
function applyRemove(elements, op) {
    const { elementId } = op;
    return removeElement(elements, elementId).tree;
}
function applyMove(elements, op) {
    const { elementId, toParentId, toIndex } = op;
    // First, remove the element
    const { tree: treeWithoutElement, removed } = removeElement(elements, elementId);
    if (!removed)
        return elements;
    // Then insert at new location
    const insertOp = {
        type: "insert",
        element: removed,
        parentId: toParentId,
        index: toIndex,
    };
    return applyInsert(treeWithoutElement, insertOp);
}
function applySetPosition(elements, op) {
    const { elementId, newPosition } = op;
    return elements.map((el) => {
        if (el.id === elementId) {
            return { ...el, canvasPosition: newPosition };
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applySetPosition(el.children, op) };
        }
        return el;
    });
}
function applySetStyles(elements, op) {
    const { elementId, newStyles } = op;
    return elements.map((el) => {
        if (el.id === elementId) {
            return { ...el, styles: newStyles };
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applySetStyles(el.children, op) };
        }
        return el;
    });
}
function applySetProps(elements, op) {
    const { elementId, newProps } = op;
    return elements.map((el) => {
        if (el.id === elementId &&
            (el.type === "component" || el.type === "html" || el.type === "icon")) {
            // Merge new props with existing props (don't replace entirely)
            return { ...el, props: { ...el.props, ...newProps } };
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applySetProps(el.children, op) };
        }
        return el;
    });
}
function applySetText(elements, op) {
    const { elementId, newText } = op;
    return elements.map((el) => {
        if (el.id === elementId && el.type === "text") {
            return { ...el, text: newText };
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applySetText(el.children, op) };
        }
        return el;
    });
}
function applyReplace(elements, op) {
    const { oldElement, newElement } = op;
    return elements.map((el) => {
        if (el.id === oldElement.id) {
            return newElement;
        }
        if (hasChildren(el) && el.children) {
            return { ...el, children: applyReplace(el.children, op) };
        }
        return el;
    });
}
// =============================================================================
// Invert Operations
// =============================================================================
/**
 * Create the inverse of an operation (for undo).
 */
export function invertOperation(op) {
    switch (op.type) {
        case "insert":
            // Inverse of insert is remove
            return {
                type: "remove",
                elementId: op.element.id,
                element: op.element,
                parentId: op.parentId,
                index: op.index,
            };
        case "remove":
            // Inverse of remove is insert
            return {
                type: "insert",
                element: op.element,
                parentId: op.parentId,
                index: op.index,
            };
        case "move":
            // Inverse of move is move back
            return {
                type: "move",
                elementId: op.elementId,
                fromParentId: op.toParentId,
                toParentId: op.fromParentId,
                fromIndex: op.toIndex,
                toIndex: op.fromIndex,
            };
        case "set_position":
            return {
                type: "set_position",
                elementId: op.elementId,
                oldPosition: op.newPosition,
                newPosition: op.oldPosition || { x: 0, y: 0 },
            };
        case "set_styles":
            return {
                type: "set_styles",
                elementId: op.elementId,
                oldStyles: op.newStyles,
                newStyles: op.oldStyles || {},
            };
        case "set_props":
            return {
                type: "set_props",
                elementId: op.elementId,
                oldProps: op.newProps,
                newProps: op.oldProps || {},
            };
        case "set_text":
            return {
                type: "set_text",
                elementId: op.elementId,
                oldText: op.newText,
                newText: op.oldText || "",
            };
        case "replace":
            return {
                type: "replace",
                oldElement: op.newElement,
                newElement: op.oldElement,
                parentId: op.parentId,
                index: op.index,
            };
        default:
            return op;
    }
}
/**
 * Invert a batch of operations (reverse order and invert each).
 */
export function invertOperations(ops) {
    return ops.map(invertOperation).reverse();
}
// =============================================================================
// Operation Creators (Helpers to create operations from current state)
// =============================================================================
/**
 * Create an insert operation for adding an element.
 */
export function createInsertOperation(element, parentId, index) {
    return {
        type: "insert",
        element: structuredClone(element),
        parentId,
        index,
    };
}
/**
 * Create a remove operation by finding the element's current location.
 */
export function createRemoveOperation(elements, elementId) {
    const element = findElement(elements, elementId);
    if (!element)
        return null;
    const parentId = findParentId(elements, elementId);
    const siblings = parentId
        ? findElement(elements, parentId)?.children || []
        : elements;
    const index = siblings.findIndex((el) => el.id === elementId);
    return {
        type: "remove",
        elementId,
        element: structuredClone(element),
        parentId,
        index,
    };
}
/**
 * Create a move operation.
 */
export function createMoveOperation(elements, elementId, toParentId, toIndex) {
    const fromParentId = findParentId(elements, elementId);
    const fromSiblings = fromParentId
        ? findElement(elements, fromParentId)?.children || []
        : elements;
    const fromIndex = fromSiblings.findIndex((el) => el.id === elementId);
    if (fromIndex === -1)
        return null;
    return {
        type: "move",
        elementId,
        fromParentId,
        toParentId,
        fromIndex,
        toIndex,
    };
}
/**
 * Create a set_position operation.
 */
export function createSetPositionOperation(elements, elementId, newPosition) {
    const element = findElement(elements, elementId);
    if (!element)
        return null;
    return {
        type: "set_position",
        elementId,
        oldPosition: element.canvasPosition
            ? { ...element.canvasPosition }
            : undefined,
        newPosition,
    };
}
/**
 * Create a set_styles operation.
 */
export function createSetStylesOperation(elements, elementId, newStyles) {
    const element = findElement(elements, elementId);
    if (!element)
        return null;
    return {
        type: "set_styles",
        elementId,
        oldStyles: element.styles ? { ...element.styles } : undefined,
        newStyles,
    };
}
/**
 * Create a set_props operation.
 */
export function createSetPropsOperation(elements, elementId, newProps) {
    const element = findElement(elements, elementId);
    if (!element)
        return null;
    if (element.type === "text")
        return null;
    const oldProps = element.type === "icon"
        ? element.props
        : element.props;
    return {
        type: "set_props",
        elementId,
        oldProps: oldProps ? { ...oldProps } : undefined,
        newProps,
    };
}
/**
 * Create a set_text operation.
 */
export function createSetTextOperation(elements, elementId, newText) {
    const element = findElement(elements, elementId);
    if (!element || element.type !== "text")
        return null;
    return {
        type: "set_text",
        elementId,
        oldText: element.text,
        newText,
    };
}
/**
 * Create a replace operation.
 */
export function createReplaceOperation(elements, oldElementId, newElement) {
    const oldElement = findElement(elements, oldElementId);
    if (!oldElement)
        return null;
    const parentId = findParentId(elements, oldElementId);
    const siblings = parentId
        ? findElement(elements, parentId)?.children || []
        : elements;
    const index = siblings.findIndex((el) => el.id === oldElementId);
    return {
        type: "replace",
        oldElement: structuredClone(oldElement),
        newElement: structuredClone(newElement),
        parentId,
        index,
    };
}
