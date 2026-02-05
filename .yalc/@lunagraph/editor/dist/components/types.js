// Common viewport presets
export const VIEWPORT_PRESETS = {
    desktop: { width: 1512, height: 800, name: 'Desktop' },
    laptop: { width: 1280, height: 720, name: 'Laptop' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    mobile: { width: 390, height: 844, name: 'Mobile' },
};
// Common schemas for popular libraries
export const PHOSPHOR_PROPS_SCHEMA = {
    size: { type: 'number', default: 16, label: 'Size' },
    weight: {
        type: 'enum',
        options: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
        default: 'regular',
        label: 'Weight'
    },
    color: { type: 'color', label: 'Color' },
    mirrored: { type: 'boolean', default: false, label: 'Mirrored' }
};
export const LUCIDE_PROPS_SCHEMA = {
    size: { type: 'number', default: 16, label: 'Size' },
    strokeWidth: { type: 'number', default: 2, label: 'Stroke Width' },
    color: { type: 'color', label: 'Color' },
    absoluteStrokeWidth: { type: 'boolean', default: false, label: 'Absolute Stroke' }
};
