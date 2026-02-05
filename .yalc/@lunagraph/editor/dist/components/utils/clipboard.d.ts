import { FEElement, HtmlElement } from "../types";
/** Result of image upload with error info */
export interface UploadResult {
    url: string | null;
    error?: 'payload_too_large' | 'upload_failed' | 'compression_failed';
    errorMessage?: string;
}
/** Result of getting image from drop/paste with error info */
export interface ImageResult {
    src: string | null;
    error?: 'payload_too_large' | 'upload_failed' | 'compression_failed';
    errorMessage?: string;
}
/**
 * Upload an asset (image) to the dev server
 * Returns structured result with URL or error info
 */
export declare function uploadAsset(data: string, // base64 data URL
devServerUrl: string, mimeType?: string): Promise<UploadResult>;
/**
 * Convert an image file to a data URL
 */
export declare function fileToDataUrl(file: File): Promise<string>;
/**
 * Convert an image file to a URL (uploaded to server) or data URL fallback
 * If devServerUrl is provided, uploads to server; otherwise returns base64 data URL
 * Automatically compresses large images before upload
 * Returns structured result with error info
 */
export declare function fileToUrl(file: File, devServerUrl?: string): Promise<ImageResult>;
/**
 * Create an image element from a src URL or data URL
 */
export declare function createImageElement(src: string, position?: {
    x: number;
    y: number;
}): HtmlElement;
/**
 * Extract image from a drop event
 * Returns the image source (uploaded URL, external URL, or data URL fallback) with error info
 * If devServerUrl is provided, uploads local files to the server
 */
export declare function getImageFromDropEvent(e: React.DragEvent, devServerUrl?: string): Promise<ImageResult>;
/**
 * Copy an element to the system clipboard
 */
export declare function copyElementToClipboard(element: FEElement): Promise<boolean>;
/** Result of reading element from clipboard */
export interface ClipboardReadResult {
    element: FEElement | null;
    error?: 'payload_too_large' | 'upload_failed' | 'compression_failed';
    errorMessage?: string;
}
/**
 * Read element from the system clipboard
 * Returns null if clipboard doesn't contain valid Lunagraph data or images
 * If devServerUrl is provided, uploads pasted images to the server
 */
export declare function readElementFromClipboard(devServerUrl?: string): Promise<ClipboardReadResult>;
/** Result of paste operation */
export interface PasteResult {
    elements: FEElement[] | null;
    error?: 'payload_too_large' | 'upload_failed' | 'compression_failed';
    errorMessage?: string;
}
/**
 * Paste element from clipboard into the tree
 * If targetId is provided, paste as child of that element
 * Otherwise, paste at root level near the given position
 * If devServerUrl is provided, uploads pasted images to the server
 */
export declare function pasteElementIntoTree(elements: FEElement[], targetId: string | null, position?: {
    x: number;
    y: number;
}, devServerUrl?: string): Promise<PasteResult>;
//# sourceMappingURL=clipboard.d.ts.map