import { FEElement } from "../types";
import { removeElement, insertElement } from "./treeUtils";

/**
 * Move an element from one position to another in the tree
 */
export function dragElement(
  elements: FEElement[],
  draggedId: string,
  targetId: string | null,
  position: "before" | "after" | "inside"
): FEElement[] {
  // First, remove the dragged element
  const { tree: treeWithoutDragged, removed: draggedElement } = removeElement(elements, draggedId);

  if (!draggedElement || !targetId) {
    return elements; // Can't complete drag
  }

  // Then insert it at the new position
  return insertElement(treeWithoutDragged, targetId, draggedElement, position);
}

/**
 * Get a structural signature for an element (ignores props values, just structure)
 */
function getStructuralSignature(el: FEElement): string {
  if (el.type === 'text') {
    return 'text'
  }
  if (el.type === 'icon') {
    return `icon:${el.iconName}`
  }
  if (el.type === 'viewport') {
    const childSigs = el.children?.map(getStructuralSignature).join(',') || ''
    return `viewport:${el.viewportWidth}(${childSigs})`
  }
  const childSigs = el.children?.map(getStructuralSignature).join(',') || ''
  const tag = el.type === 'html' ? el.tag : el.componentName
  return `${tag}(${childSigs})`
}

/**
 * Check if two element trees have the same structure
 */
export function hasStructureChanged(existing: FEElement[], snapshot: FEElement[]): boolean {
  const existingSig = existing.map(getStructuralSignature).join('|')
  const snapshotSig = snapshot.map(getStructuralSignature).join('|')
  return existingSig !== snapshotSig
}

/**
 * Recursively merge a single element, updating props/styles from snapshot.
 * Text content is updated from snapshot since it may come from props.
 */
function mergeElement(existing: FEElement, snapshot: FEElement): FEElement {
  // Text elements: use snapshot text (it may come from props like `title`)
  if (existing.type === 'text' && snapshot.type === 'text') {
    return {
      ...existing,
      text: snapshot.text,  // Update text from snapshot
    };
  }

  // Mismatched types shouldn't happen if structure check passed, but handle it
  if (existing.type === 'text' || snapshot.type === 'text') {
    return snapshot;
  }

  // Icon elements: update props/styles from snapshot
  if (existing.type === 'icon' || snapshot.type === 'icon') {
    return {
      ...existing,
      props: { ...(existing as any).props, ...(snapshot as any).props },
      styles: { ...existing.styles, ...(snapshot as any).styles },
    } as FEElement;
  }

  // Viewport elements: recursively merge children only (no props)
  if (existing.type === 'viewport' || snapshot.type === 'viewport') {
    const existingChildren = existing.children || [];
    const snapshotChildren = snapshot.children || [];

    const mergedChildren = existingChildren.length > 0 && snapshotChildren.length > 0
      ? existingChildren.map((child, i) => {
        const snapshotChild = snapshotChildren[i];
        return snapshotChild ? mergeElement(child, snapshotChild) : child;
      })
      : existingChildren.length > 0
        ? existingChildren
        : undefined;

    return {
      ...existing,
      styles: { ...existing.styles, ...snapshot.styles },
      children: mergedChildren,
    } as FEElement;
  }

  // HTML/Component elements: update props/styles and recursively merge children
  const existingChildren = existing.children || [];
  const snapshotChildren = snapshot.children || [];

  // Recursively merge children
  const mergedChildren = existingChildren.length > 0 && snapshotChildren.length > 0
    ? existingChildren.map((child, i) => {
      const snapshotChild = snapshotChildren[i];
      return snapshotChild ? mergeElement(child, snapshotChild) : child;
    })
    : existingChildren.length > 0
      ? existingChildren
      : undefined;

  // Type narrow: at this point, both are html or component (have props)
  const existingWithProps = existing as { props?: Record<string, any>; styles?: React.CSSProperties; children?: FEElement[] };
  const snapshotWithProps = snapshot as { props?: Record<string, any>; styles?: React.CSSProperties };

  return {
    ...existing,
    props: { ...existingWithProps.props, ...snapshotWithProps.props },
    styles: { ...existing.styles, ...snapshot.styles },
    children: mergedChildren,
  } as FEElement;
}

/**
 * Merge snapshot-rendered elements with existing canvas elements.
 * Preserves user-added children while updating props from the snapshot.
 *
 * If the snapshot structure changed (e.g., conditional rendering), use snapshot directly.
 * If structure is the same, recursively merge props/styles from snapshot.
 */
export function mergeSnapshotWithExisting(
  existing: FEElement[],
  snapshot: FEElement[]
): FEElement[] {
  if (existing.length === 0) return snapshot;
  if (snapshot.length === 0) return existing;

  // Check if structure changed - if so, use snapshot directly
  if (hasStructureChanged(existing, snapshot)) {
    return snapshot
  }

  // Structure is the same - recursively merge props/styles
  return existing.map((existingEl, i) => {
    const snapshotEl = snapshot[i];
    if (!snapshotEl) return existingEl;
    return mergeElement(existingEl, snapshotEl);
  });
}

/**
 * Helper to generate canvas slug from name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
