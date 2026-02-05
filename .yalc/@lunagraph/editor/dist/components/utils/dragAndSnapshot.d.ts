import { FEElement } from "../types";
/**
 * Move an element from one position to another in the tree
 */
export declare function dragElement(elements: FEElement[], draggedId: string, targetId: string | null, position: "before" | "after" | "inside"): FEElement[];
/**
 * Check if two element trees have the same structure
 */
export declare function hasStructureChanged(existing: FEElement[], snapshot: FEElement[]): boolean;
/**
 * Merge snapshot-rendered elements with existing canvas elements.
 * Preserves user-added children while updating props from the snapshot.
 *
 * If the snapshot structure changed (e.g., conditional rendering), use snapshot directly.
 * If structure is the same, recursively merge props/styles from snapshot.
 */
export declare function mergeSnapshotWithExisting(existing: FEElement[], snapshot: FEElement[]): FEElement[];
/**
 * Helper to generate canvas slug from name
 */
export declare function slugify(text: string): string;
//# sourceMappingURL=dragAndSnapshot.d.ts.map