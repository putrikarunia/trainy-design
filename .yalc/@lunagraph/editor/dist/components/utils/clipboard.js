import { cloneElementWithNewIds } from "./elementCloning";
import { insertElementAsChild } from "./treeUtils";
import { generatePrefixedId } from "./idUtils";
// Compression settings
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB - compress images larger than this
const MAX_DIMENSION = 2000; // Max width/height after compression
const JPEG_QUALITY = 0.85;
/**
 * Compress an image using Canvas API
 * Resizes to max dimension and converts to JPEG
 */
async function compressImage(dataUrl, mimeType) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                }
                else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }
            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG (better compression) unless it's a PNG with transparency we want to keep
            // For simplicity, we'll use JPEG for photos and keep PNG for potentially transparent images
            const outputType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
            const quality = outputType === 'image/jpeg' ? JPEG_QUALITY : undefined;
            resolve(canvas.toDataURL(outputType, quality));
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
    });
}
/**
 * Get the size of a base64 data URL in bytes
 */
function getDataUrlSizeBytes(dataUrl) {
    // Remove the data URL prefix to get just the base64 data
    const base64 = dataUrl.split(',')[1] || dataUrl;
    // Base64 encodes 3 bytes into 4 characters
    return Math.round((base64.length * 3) / 4);
}
/**
 * Upload an asset (image) to the dev server
 * Returns structured result with URL or error info
 */
export async function uploadAsset(data, // base64 data URL
devServerUrl, mimeType) {
    try {
        const response = await fetch(`${devServerUrl}/api/asset/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data,
                mimeType,
            }),
        });
        // Check for 413 Payload Too Large
        if (response.status === 413) {
            return {
                url: null,
                error: 'payload_too_large',
                errorMessage: 'Image is too large to upload. Please use a smaller image.'
            };
        }
        const result = await response.json();
        if (result.success && result.url) {
            // Return relative path only - will be resolved to current dev server at render time
            return { url: result.url };
        }
        console.error('Asset upload failed:', result.error);
        return {
            url: null,
            error: 'upload_failed',
            errorMessage: result.error || 'Failed to upload image'
        };
    }
    catch (error) {
        console.error('Asset upload error:', error);
        return {
            url: null,
            error: 'upload_failed',
            errorMessage: error instanceof Error ? error.message : 'Failed to upload image'
        };
    }
}
/**
 * Convert an image file to a data URL
 */
export async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
/**
 * Convert an image file to a URL (uploaded to server) or data URL fallback
 * If devServerUrl is provided, uploads to server; otherwise returns base64 data URL
 * Automatically compresses large images before upload
 * Returns structured result with error info
 */
export async function fileToUrl(file, devServerUrl) {
    let dataUrl = await fileToDataUrl(file);
    // Compress large images before upload
    const sizeBytes = getDataUrlSizeBytes(dataUrl);
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
        try {
            console.log(`Compressing image: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB`);
            dataUrl = await compressImage(dataUrl, file.type);
            const newSize = getDataUrlSizeBytes(dataUrl);
            console.log(`Compressed to: ${(newSize / 1024 / 1024).toFixed(1)}MB`);
        }
        catch (err) {
            console.error('Image compression failed:', err);
            return {
                src: null,
                error: 'compression_failed',
                errorMessage: 'Failed to compress image. Try a smaller image.'
            };
        }
    }
    if (devServerUrl) {
        const result = await uploadAsset(dataUrl, devServerUrl, file.type);
        if (result.url) {
            return { src: result.url };
        }
        // Return the error from upload
        return {
            src: null,
            error: result.error,
            errorMessage: result.errorMessage
        };
    }
    return { src: dataUrl };
}
/**
 * Create an image element from a src URL or data URL
 */
export function createImageElement(src, position) {
    return {
        id: generatePrefixedId('img'),
        type: 'html',
        tag: 'img',
        props: {
            src,
            alt: 'Image',
        },
        styles: {
            maxWidth: 400,
            height: 'auto',
            display: 'block',
        },
        canvasPosition: position ?? { x: 100, y: 100 },
    };
}
/**
 * Extract image from a drop event
 * Returns the image source (uploaded URL, external URL, or data URL fallback) with error info
 * If devServerUrl is provided, uploads local files to the server
 */
export async function getImageFromDropEvent(e, devServerUrl) {
    // Check for files (dragged from desktop/finder)
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) {
        return await fileToUrl(imageFile, devServerUrl);
    }
    // Check for image URL (dragged from browser)
    const html = e.dataTransfer.getData('text/html');
    const urlMatch = html?.match(/<img[^>]+src="([^"]+)"/);
    if (urlMatch) {
        return { src: urlMatch[1] };
    }
    // Check for plain URL
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
        return { src: url };
    }
    return { src: null };
}
/**
 * Copy an element to the system clipboard
 */
export async function copyElementToClipboard(element) {
    const clipboardData = {
        __lunagraph: true,
        element: element
    };
    try {
        await navigator.clipboard.writeText(JSON.stringify(clipboardData));
        return true;
    }
    catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}
/**
 * Read element from the system clipboard
 * Returns null if clipboard doesn't contain valid Lunagraph data or images
 * If devServerUrl is provided, uploads pasted images to the server
 */
export async function readElementFromClipboard(devServerUrl) {
    try {
        // First try to read clipboard items (for images)
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            // Check for image types
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                const file = new File([blob], 'pasted-image', { type: imageType });
                const result = await fileToUrl(file, devServerUrl);
                if (result.error) {
                    return {
                        element: null,
                        error: result.error,
                        errorMessage: result.errorMessage
                    };
                }
                if (result.src) {
                    return { element: createImageElement(result.src) };
                }
            }
        }
    }
    catch (err) {
        // clipboard.read() might not be supported or permission denied
        // Fall through to try text
    }
    // Try to read as text (Lunagraph JSON data)
    let clipboardText;
    try {
        clipboardText = await navigator.clipboard.readText();
    }
    catch (err) {
        console.error('Failed to read from clipboard:', err);
        return { element: null };
    }
    // Try to parse clipboard data
    let clipboardData;
    try {
        clipboardData = JSON.parse(clipboardText);
    }
    catch {
        // Not valid JSON
        return { element: null };
    }
    // Check if it's Lunagraph data
    if (!clipboardData.__lunagraph || !clipboardData.element) {
        return { element: null };
    }
    return { element: clipboardData.element };
}
/**
 * Paste element from clipboard into the tree
 * If targetId is provided, paste as child of that element
 * Otherwise, paste at root level near the given position
 * If devServerUrl is provided, uploads pasted images to the server
 */
export async function pasteElementIntoTree(elements, targetId, position, devServerUrl) {
    const result = await readElementFromClipboard(devServerUrl);
    if (result.error) {
        return {
            elements: null,
            error: result.error,
            errorMessage: result.errorMessage
        };
    }
    if (!result.element) {
        return { elements: null };
    }
    // Clone with new IDs
    const pastedElement = cloneElementWithNewIds(result.element);
    if (!targetId) {
        // No element selected: paste at root level near cursor position
        pastedElement.canvasPosition = position ?? { x: 20, y: 20 };
        return { elements: [...elements, pastedElement] };
    }
    // Element selected: paste as child
    return { elements: insertElementAsChild(elements, targetId, pastedElement) };
}
