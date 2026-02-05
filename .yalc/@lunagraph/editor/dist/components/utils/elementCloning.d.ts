import { FEElement } from "../types";
/**
 * Clone an element with new IDs for all nodes in the tree
 * Optionally offset canvas position
 */
export declare function cloneElementWithNewIds(element: FEElement, offsetPosition?: {
    x: number;
    y: number;
}): FEElement;
/**
 * Duplicate an element in the tree (insert right after the original)
 * Returns the new tree with the duplicated element
 */
export declare function duplicateElementInTree(elements: FEElement[], idToDuplicate: string): FEElement[];
//# sourceMappingURL=elementCloning.d.ts.map