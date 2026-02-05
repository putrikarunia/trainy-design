import { FEElement, HtmlElement, ComponentElement } from "../types";
/**
 * Type guard to check if an element can have children
 */
export declare function hasChildren(element: FEElement): element is HtmlElement | ComponentElement;
/**
 * Cache structure for O(1) element lookups
 * Call buildElementCache once when elements change, then use the cache for all lookups
 */
export interface ElementCache {
    byId: Map<string, FEElement>;
    parentById: Map<string, string | null>;
}
/**
 * Build a cache for O(1) element and parent lookups
 * This is much faster than repeated tree traversals for large trees
 */
export declare function buildElementCache(elements: FEElement[]): ElementCache;
/**
 * Find element using cache (O(1)) with fallback to tree search
 */
export declare function findElementCached(elements: FEElement[], id: string, cache?: ElementCache): FEElement | null;
/**
 * Find parent ID using cache (O(1)) with fallback to tree search
 */
export declare function findParentIdCached(elements: FEElement[], childId: string, cache?: ElementCache): string | null;
/**
 * Find an element in the tree by ID (O(n) - use findElementCached when possible)
 */
export declare function findElement(elements: FEElement[], id: string): FEElement | null;
/**
 * Find the parent ID of an element (O(n) - use findParentIdCached when possible)
 */
export declare function findParentId(elements: FEElement[], childId: string): string | null;
/**
 * Check if an element is a descendant of another
 */
export declare function isDescendant(parentId: string, childId: string, elements: FEElement[]): boolean;
/**
 * Remove an element from the tree and return both the new tree and the removed element
 */
export declare function removeElement(elements: FEElement[], idToRemove: string): {
    tree: FEElement[];
    removed: FEElement | null;
};
/**
 * Update an element's position in the tree
 */
export declare function updateElementPosition(elements: FEElement[], id: string, position: {
    x: number;
    y: number;
}): FEElement[];
/**
 * Update an element's styles in the tree
 */
export declare function updateElementStyles(elements: FEElement[], id: string, styles: React.CSSProperties): FEElement[];
/**
 * Update an element's props in the tree
 */
export declare function updateElementProps(elements: FEElement[], id: string, props: Record<string, any>): FEElement[];
/**
 * Update text content of a text element
 */
export declare function updateElementText(elements: FEElement[], id: string, text: string): FEElement[];
/**
 * Update element size (and optionally position)
 */
export declare function updateElementSize(elements: FEElement[], id: string, size: {
    width: number;
    height: number;
}, pos?: {
    x: number;
    y: number;
}): FEElement[];
/**
 * Replace an element in the tree with a new element
 */
export declare function replaceElement(elements: FEElement[], idToReplace: string, newElement: FEElement): FEElement[];
/**
 * Insert an element as a child of a target element
 */
export declare function insertElementAsChild(elements: FEElement[], targetId: string, elementToInsert: FEElement): FEElement[];
/**
 * Insert an element before/after a target element, or inside it
 */
export declare function insertElement(elements: FEElement[], targetId: string, elementToInsert: FEElement, position: "before" | "after" | "inside"): FEElement[];
/**
 * Wrap multiple elements in a new div container
 * The wrapper div is placed at the topmost-leftmost position
 * Elements are ordered by their visual position (top-to-bottom or left-to-right)
 * Returns the new tree and the ID of the wrapper div
 */
export declare function wrapElementsInDiv(elements: FEElement[], idsToWrap: Set<string>): {
    tree: FEElement[];
    wrapperId: string;
} | null;
/**
 * Move an element within its siblings array by a given offset.
 * Returns the new tree, or null if the move is not possible.
 */
export declare function moveElementInSiblings(elements: FEElement[], elementId: string, offset: number): FEElement[] | null;
//# sourceMappingURL=treeUtils.d.ts.map