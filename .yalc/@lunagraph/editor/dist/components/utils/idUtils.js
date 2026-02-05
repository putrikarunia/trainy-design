import { nanoid } from 'nanoid';
/**
 * Generate a unique ID using nanoid (21 chars by default)
 */
export function generateId() {
    return nanoid();
}
/**
 * Generate an ID with a prefix (e.g., "element-", "component-")
 */
export function generatePrefixedId(prefix) {
    return `${prefix}-${nanoid()}`;
}
