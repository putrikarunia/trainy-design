import { FEElement } from "../types";
import { generatePrefixedId } from "./idUtils";
import { hasChildren } from "./treeUtils";

/**
 * Clone an element with new IDs for all nodes in the tree
 * Optionally offset canvas position
 */
export function cloneElementWithNewIds(
  element: FEElement,
  offsetPosition = { x: 20, y: 20 }
): FEElement {
  const el = structuredClone(element);
  const newId = generatePrefixedId(el.type);

  if (!hasChildren(el)) {
    return {
      ...el,
      id: newId,
    };
  }

  return {
    ...el,
    id: newId,
    children: el.children && el.children.length > 0
      ? el.children.map(child => cloneElementWithNewIds(child, offsetPosition))
      : undefined,
    // Offset canvas position if it exists
    canvasPosition: el.canvasPosition
      ? { x: el.canvasPosition.x + offsetPosition.x, y: el.canvasPosition.y + offsetPosition.y }
      : undefined
  } as FEElement;
}

/**
 * Duplicate an element in the tree (insert right after the original)
 * Returns the new tree with the duplicated element
 */
export function duplicateElementInTree(
  elements: FEElement[],
  idToDuplicate: string
): FEElement[] {
  const result: FEElement[] = [];

  for (const el of elements) {
    if (el.id === idToDuplicate) {
      // Found it! Add original and duplicate
      result.push(el);
      const duplicate = cloneElementWithNewIds(el);
      result.push(duplicate);
    } else if (hasChildren(el) && el.children) {
      // Recursively search in children
      const childResult = duplicateElementInTree(el.children, idToDuplicate);
      const childFound = childResult.length !== el.children.length;

      if (childFound) {
        result.push({
          ...el,
          children: childResult
        });
      } else {
        result.push(el);
      }
    } else {
      result.push(el);
    }
  }

  return result;
}
