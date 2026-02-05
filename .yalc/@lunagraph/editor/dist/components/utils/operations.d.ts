import type { FEElement } from "../types";
export type Position = {
    x: number;
    y: number;
};
export type Size = {
    width: number;
    height: number;
};
/**
 * Insert an element at a specific position in the tree.
 * - parentId: null = root level
 * - index: position in parent's children or root array
 */
export interface InsertOperation {
    type: "insert";
    element: FEElement;
    parentId: string | null;
    index: number;
}
/**
 * Remove an element from the tree.
 * Stores the removed element and its location for undo.
 */
export interface RemoveOperation {
    type: "remove";
    elementId: string;
    element: FEElement;
    parentId: string | null;
    index: number;
}
/**
 * Move an element to a new location.
 * Can move between parents or reorder within siblings.
 */
export interface MoveOperation {
    type: "move";
    elementId: string;
    fromParentId: string | null;
    toParentId: string | null;
    fromIndex: number;
    toIndex: number;
}
/**
 * Update element's canvas position.
 */
export interface SetPositionOperation {
    type: "set_position";
    elementId: string;
    oldPosition: Position | undefined;
    newPosition: Position;
}
/**
 * Update element's styles.
 */
export interface SetStylesOperation {
    type: "set_styles";
    elementId: string;
    oldStyles: React.CSSProperties | undefined;
    newStyles: React.CSSProperties;
}
/**
 * Update element's props.
 */
export interface SetPropsOperation {
    type: "set_props";
    elementId: string;
    oldProps: Record<string, any> | undefined;
    newProps: Record<string, any>;
}
/**
 * Update text content of a text element.
 */
export interface SetTextOperation {
    type: "set_text";
    elementId: string;
    oldText: string | undefined;
    newText: string;
}
/**
 * Replace an element with another (e.g., extract to component).
 */
export interface ReplaceOperation {
    type: "replace";
    oldElement: FEElement;
    newElement: FEElement;
    parentId: string | null;
    index: number;
}
export type Operation = InsertOperation | RemoveOperation | MoveOperation | SetPositionOperation | SetStylesOperation | SetPropsOperation | SetTextOperation | ReplaceOperation;
/**
 * Apply a single operation to the element tree, returning the new tree.
 */
export declare function applyOperation(elements: FEElement[], op: Operation): FEElement[];
/**
 * Apply multiple operations in sequence.
 */
export declare function applyOperations(elements: FEElement[], ops: Operation[]): FEElement[];
/**
 * Create the inverse of an operation (for undo).
 */
export declare function invertOperation(op: Operation): Operation;
/**
 * Invert a batch of operations (reverse order and invert each).
 */
export declare function invertOperations(ops: Operation[]): Operation[];
/**
 * Create an insert operation for adding an element.
 */
export declare function createInsertOperation(element: FEElement, parentId: string | null, index: number): InsertOperation;
/**
 * Create a remove operation by finding the element's current location.
 */
export declare function createRemoveOperation(elements: FEElement[], elementId: string): RemoveOperation | null;
/**
 * Create a move operation.
 */
export declare function createMoveOperation(elements: FEElement[], elementId: string, toParentId: string | null, toIndex: number): MoveOperation | null;
/**
 * Create a set_position operation.
 */
export declare function createSetPositionOperation(elements: FEElement[], elementId: string, newPosition: Position): SetPositionOperation | null;
/**
 * Create a set_styles operation.
 */
export declare function createSetStylesOperation(elements: FEElement[], elementId: string, newStyles: React.CSSProperties): SetStylesOperation | null;
/**
 * Create a set_props operation.
 */
export declare function createSetPropsOperation(elements: FEElement[], elementId: string, newProps: Record<string, any>): SetPropsOperation | null;
/**
 * Create a set_text operation.
 */
export declare function createSetTextOperation(elements: FEElement[], elementId: string, newText: string): SetTextOperation | null;
/**
 * Create a replace operation.
 */
export declare function createReplaceOperation(elements: FEElement[], oldElementId: string, newElement: FEElement): ReplaceOperation | null;
//# sourceMappingURL=operations.d.ts.map