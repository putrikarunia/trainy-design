import type { FEElement } from './types.js';
/**
 * Extract unique component names from FEElement tree
 */
export declare function extractComponentDependencies(elements: FEElement[]): Set<string>;
/**
 * Extract icon dependencies from element tree
 * Returns a Map of library -> Set of icon names
 */
export declare function extractIconDependencies(elements: FEElement[]): Map<string, Set<string>>;
