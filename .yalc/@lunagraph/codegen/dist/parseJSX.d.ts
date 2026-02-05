import type { FEElement, IconLibraryConfig } from './types.js';
/**
 * Parse JSX code into FEElement tree
 * @param code - JSX code string to parse
 * @param iconLibraries - Optional icon library configurations to detect icon elements
 * @param components - Optional components map to prioritize over icons
 * @param defaultIconLibrary - Default icon library name for data-icon syntax (e.g., "@phosphor-icons/react" or "lucide-react")
 */
export declare function parseJSX(code: string, iconLibraries?: Record<string, IconLibraryConfig>, components?: Record<string, any>, defaultIconLibrary?: string): FEElement[];
