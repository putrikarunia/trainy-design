import type { FEElement } from './types.js'

/**
 * Extract unique component names from FEElement tree
 */
export function extractComponentDependencies(elements: FEElement[]): Set<string> {
  const components = new Set<string>()

  function traverse(element: FEElement) {
    if (element.type === 'component') {
      components.add(element.componentName)
    }

    if ('children' in element && element.children) {
      element.children.forEach(traverse)
    }
  }

  elements.forEach(traverse)

  return components
}

/**
 * Extract icon dependencies from element tree
 * Returns a Map of library -> Set of icon names
 */
export function extractIconDependencies(elements: FEElement[]): Map<string, Set<string>> {
  const iconsByLibrary = new Map<string, Set<string>>()

  function traverse(element: FEElement) {
    if (element.type === 'icon') {
      if (!iconsByLibrary.has(element.library)) {
        iconsByLibrary.set(element.library, new Set())
      }
      iconsByLibrary.get(element.library)!.add(element.iconName)
    }

    if ('children' in element && element.children) {
      element.children.forEach(traverse)
    }
  }

  elements.forEach(traverse)

  return iconsByLibrary
}
