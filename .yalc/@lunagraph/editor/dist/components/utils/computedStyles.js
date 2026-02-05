/**
 * Utilities for extracting and filtering computed CSS styles
 */
// Properties to IGNORE (internal browser stuff we don't want to show)
const IGNORE_PROPERTIES = [
    // Vendor prefixes
    'webkit-appearance',
    'webkit-box-orient',
    'webkit-line-clamp',
    'webkit-tap-highlight-color',
    'moz-appearance',
    // Logical property longhands (redundant - we show the shorthand)
    'border-block-start-width',
    'border-block-end-width',
    'border-inline-start-width',
    'border-inline-end-width',
    'border-block-start-style',
    'border-block-end-style',
    'border-inline-start-style',
    'border-inline-end-style',
    'border-block-start-color',
    'border-block-end-color',
    'border-inline-start-color',
    'border-inline-end-color',
    'padding-block-start',
    'padding-block-end',
    'padding-inline-start',
    'padding-inline-end',
    'margin-block-start',
    'margin-block-end',
    'margin-inline-start',
    'margin-inline-end',
    'inset-block-start',
    'inset-block-end',
    'inset-inline-start',
    'inset-inline-end',
    // Note: We DON'T ignore padding/margin/border longhands
    // Instead we combine them into shorthands later
    // Border radius longhands (show border-radius instead)
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-start-start-radius',
    'border-start-end-radius',
    'border-end-start-radius',
    'border-end-end-radius',
    // Logical size properties (redundant with width/height)
    'block-size',
    'inline-size',
    // Canvas transform properties (from parent container)
    'perspective-origin',
    'transform-origin',
    // Animation properties (too verbose)
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    // Transition properties (too verbose)
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
];
// Default values that we should ignore (browser defaults)
const DEFAULT_VALUES = {
    position: ['static'],
    zIndex: ['auto'],
    opacity: ['1'],
    cursor: ['auto'],
    overflow: ['visible'],
    overflowX: ['visible'],
    overflowY: ['visible'],
    margin: ['0px'],
    marginTop: ['0px'],
    marginRight: ['0px'],
    marginBottom: ['0px'],
    marginLeft: ['0px'],
    padding: ['0px'],
    paddingTop: ['0px'],
    paddingRight: ['0px'],
    paddingBottom: ['0px'],
    paddingLeft: ['0px'],
    border: ['0px none', 'none'],
    borderWidth: ['0px'],
    borderStyle: ['none'],
    borderRadius: ['0px'],
    backgroundColor: ['rgba(0, 0, 0, 0)', 'transparent'],
    backgroundImage: ['none'],
    fontWeight: ['400'],
    textAlign: ['start', 'left'],
    textDecoration: ['none solid', 'none'],
    textTransform: ['none'],
    whiteSpace: ['normal'],
    letterSpacing: ['normal'],
    lineHeight: ['normal'],
    boxShadow: ['none'],
    transform: ['none'],
    transition: ['all 0s ease 0s', 'none'],
};
/**
 * Check if a computed style value is a default (should be hidden)
 */
function isDefaultValue(property, value) {
    const defaults = DEFAULT_VALUES[property];
    if (!defaults)
        return false;
    const normalizedValue = value.trim().toLowerCase();
    return defaults.some(defaultVal => {
        const normalizedDefault = defaultVal.toLowerCase();
        return normalizedValue === normalizedDefault || normalizedValue.includes(normalizedDefault);
    });
}
/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
/**
 * Combine longhand properties into shorthand
 * e.g., padding-top, padding-right, padding-bottom, padding-left → padding
 * If any longhands exist, fetch all 4 from computed styles to combine properly
 */
function combineShorthands(styles, computed) {
    const styleMap = new Map(styles.map(s => [s.property, s]));
    const result = [];
    const processed = new Set();
    for (const style of styles) {
        if (processed.has(style.property))
            continue;
        // Check for padding shorthand
        if (style.property.startsWith('padding') && style.property !== 'padding') {
            // If any padding longhand exists, combine all 4
            const top = styleMap.get('paddingTop') || {
                property: 'paddingTop',
                value: computed.paddingTop,
                isUserOverride: false,
                isInlineStyle: false
            };
            const right = styleMap.get('paddingRight') || {
                property: 'paddingRight',
                value: computed.paddingRight,
                isUserOverride: false,
                isInlineStyle: false
            };
            const bottom = styleMap.get('paddingBottom') || {
                property: 'paddingBottom',
                value: computed.paddingBottom,
                isUserOverride: false,
                isInlineStyle: false
            };
            const left = styleMap.get('paddingLeft') || {
                property: 'paddingLeft',
                value: computed.paddingLeft,
                isUserOverride: false,
                isInlineStyle: false
            };
            const shorthand = createShorthand('padding', top.value, right.value, bottom.value, left.value);
            result.push({
                property: 'padding',
                displayProperty: 'padding',
                value: shorthand,
                isUserOverride: top.isUserOverride || right.isUserOverride || bottom.isUserOverride || left.isUserOverride,
                isInlineStyle: top.isInlineStyle || right.isInlineStyle ||
                    bottom.isInlineStyle || left.isInlineStyle
            });
            processed.add('paddingTop');
            processed.add('paddingRight');
            processed.add('paddingBottom');
            processed.add('paddingLeft');
            continue;
        }
        // Check for margin shorthand
        if (style.property.startsWith('margin') && style.property !== 'margin') {
            const top = styleMap.get('marginTop') || {
                property: 'marginTop',
                value: computed.marginTop,
                isUserOverride: false,
                isInlineStyle: false
            };
            const right = styleMap.get('marginRight') || {
                property: 'marginRight',
                value: computed.marginRight,
                isUserOverride: false,
                isInlineStyle: false
            };
            const bottom = styleMap.get('marginBottom') || {
                property: 'marginBottom',
                value: computed.marginBottom,
                isUserOverride: false,
                isInlineStyle: false
            };
            const left = styleMap.get('marginLeft') || {
                property: 'marginLeft',
                value: computed.marginLeft,
                isUserOverride: false,
                isInlineStyle: false
            };
            const shorthand = createShorthand('margin', top.value, right.value, bottom.value, left.value);
            result.push({
                property: 'margin',
                displayProperty: 'margin',
                value: shorthand,
                isUserOverride: top.isUserOverride || right.isUserOverride || bottom.isUserOverride || left.isUserOverride,
                isInlineStyle: top.isInlineStyle || right.isInlineStyle ||
                    bottom.isInlineStyle || left.isInlineStyle
            });
            processed.add('marginTop');
            processed.add('marginRight');
            processed.add('marginBottom');
            processed.add('marginLeft');
            continue;
        }
        // Check for border-width shorthand
        if (style.property.startsWith('borderTop') || style.property.startsWith('borderRight') ||
            style.property.startsWith('borderBottom') || style.property.startsWith('borderLeft')) {
            // Skip individual border longhands, we'll show border-radius or nothing
            processed.add(style.property);
            continue;
        }
        // Check for gap shorthand (row-gap + column-gap)
        if (style.property === 'rowGap' || style.property === 'columnGap') {
            const rowGap = styleMap.get('rowGap') || {
                property: 'rowGap',
                value: computed.rowGap,
                isUserOverride: false,
                isInlineStyle: false
            };
            const columnGap = styleMap.get('columnGap') || {
                property: 'columnGap',
                value: computed.columnGap,
                isUserOverride: false,
                isInlineStyle: false
            };
            if (rowGap.value === columnGap.value) {
                result.push({
                    property: 'gap',
                    displayProperty: 'gap',
                    value: rowGap.value,
                    isUserOverride: rowGap.isUserOverride || columnGap.isUserOverride,
                    isInlineStyle: rowGap.isInlineStyle || columnGap.isInlineStyle
                });
                processed.add('rowGap');
                processed.add('columnGap');
            }
            else {
                // Show separately if different
                if (!processed.has('rowGap')) {
                    result.push(rowGap);
                    processed.add('rowGap');
                }
                if (!processed.has('columnGap')) {
                    result.push(columnGap);
                    processed.add('columnGap');
                }
            }
            continue;
        }
        // Not part of a shorthand, add as-is
        result.push(style);
        processed.add(style.property);
    }
    return result;
}
/**
 * Create CSS shorthand from 4 values (top, right, bottom, left)
 */
function createShorthand(property, top, right, bottom, left) {
    // All same: "24px"
    if (top === right && right === bottom && bottom === left) {
        return top;
    }
    // Top/bottom same, left/right same: "24px 12px"
    if (top === bottom && right === left) {
        return `${top} ${right}`;
    }
    // Top same as left/right, bottom different: "24px 12px 0px"
    if (right === left) {
        return `${top} ${right} ${bottom}`;
    }
    // All different: "10px 20px 30px 40px"
    return `${top} ${right} ${bottom} ${left}`;
}
/**
 * Get cascade sources for a specific CSS property
 * Tests each class individually to see what it contributes
 * Only called when user expands the chevron (lazy-loaded)
 */
export function getCascadeForProperty(element, property, kebabProperty, computedValue) {
    const sources = [];
    const tagName = element.tagName.toLowerCase();
    // 1. Check inline style
    const inlineValue = element.style.getPropertyValue(kebabProperty);
    if (inlineValue) {
        sources.push({
            selector: 'inline',
            value: inlineValue,
            type: 'inline',
            isActive: inlineValue === computedValue
        });
    }
    // 2. Test each class individually
    const classes = element.className.split(/\s+/).filter(Boolean);
    for (const className of classes) {
        // Create temporary element with ONLY this class
        const temp = document.createElement(tagName);
        temp.className = className;
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.pointerEvents = 'none';
        document.body.appendChild(temp);
        const tempComputed = window.getComputedStyle(temp);
        const tempValue = tempComputed.getPropertyValue(kebabProperty);
        // Get baseline (no classes) to compare
        const baseline = document.createElement(tagName);
        baseline.style.visibility = 'hidden';
        baseline.style.position = 'absolute';
        baseline.style.pointerEvents = 'none';
        document.body.appendChild(baseline);
        const baselineComputed = window.getComputedStyle(baseline);
        const baselineValue = baselineComputed.getPropertyValue(kebabProperty);
        // Cleanup
        document.body.removeChild(temp);
        document.body.removeChild(baseline);
        // If this class changes the property from baseline, it contributes
        if (tempValue && tempValue !== baselineValue) {
            sources.push({
                selector: className,
                value: tempValue,
                type: 'class',
                isActive: tempValue === computedValue
            });
        }
    }
    return sources;
}
/**
 * Extract significant computed styles from a DOM element
 * Uses baseline comparison to filter out inherited/default styles
 */
export function extractComputedStyles(element, userOverrides = {}) {
    // For components, we might be querying a wrapper div
    // The actual component is the child with data-slot attribute
    let targetElement = element;
    if (element.children.length === 1) {
        const child = element.children[0];
        // If child has data-slot, it's the actual component (not our wrapper)
        if (child.hasAttribute('data-slot')) {
            targetElement = child;
        }
    }
    const computed = window.getComputedStyle(targetElement);
    const styles = [];
    // Create TWO baselines:
    // 1. Empty baseline (no className, no styles) - to see browser defaults
    // 2. ClassName baseline (className only, no user styles) - to see what className contributes
    const tagName = targetElement.tagName.toLowerCase();
    const emptyBaseline = document.createElement(tagName);
    emptyBaseline.style.visibility = 'hidden';
    emptyBaseline.style.position = 'absolute';
    emptyBaseline.style.pointerEvents = 'none';
    document.body.appendChild(emptyBaseline);
    const classNameBaseline = document.createElement(tagName);
    classNameBaseline.className = targetElement.className;
    classNameBaseline.style.visibility = 'hidden';
    classNameBaseline.style.position = 'absolute';
    classNameBaseline.style.pointerEvents = 'none';
    document.body.appendChild(classNameBaseline);
    const emptyComputed = window.getComputedStyle(emptyBaseline);
    const classNameComputed = window.getComputedStyle(classNameBaseline);
    // Iterate through computed properties
    for (let i = 0; i < computed.length; i++) {
        const kebabProperty = computed[i];
        // Skip CSS custom properties (variables) - too noisy
        if (kebabProperty.startsWith('--')) {
            continue;
        }
        // Skip ignored properties (check in kebab-case)
        if (IGNORE_PROPERTIES.includes(kebabProperty)) {
            continue;
        }
        const property = kebabToCamel(kebabProperty);
        // Get values from all three sources
        const actualValue = computed.getPropertyValue(kebabProperty);
        const classNameValue = classNameComputed.getPropertyValue(kebabProperty);
        const emptyValue = emptyComputed.getPropertyValue(kebabProperty);
        if (!actualValue)
            continue;
        // Check if this property is actually set as an inline style (real user override)
        // This filters out layout-induced values (width from flex, etc.)
        const hasInlineStyle = targetElement.style.getPropertyValue(kebabProperty) !== '';
        // Detect if this is a user override: must be in inline styles AND differ from className
        const isUserOverride = hasInlineStyle && actualValue !== classNameValue;
        // Include if:
        // - User overrode it (in inline styles)
        // - Or className changed it from default (className differs from empty)
        const isDifferent = actualValue !== emptyValue;
        // Skip noisy "auto" properties unless user explicitly set them
        const isNoisyAuto = !isUserOverride && (actualValue === 'auto' ||
            actualValue === 'normal' ||
            actualValue === 'none' ||
            actualValue === 'static' ||
            actualValue === 'visible' ||
            actualValue === 'default' // cursor: default
        );
        if ((isUserOverride || isDifferent) && !isNoisyAuto) {
            styles.push({
                property,
                displayProperty: kebabProperty,
                value: actualValue,
                isUserOverride,
                isInlineStyle: hasInlineStyle,
            });
        }
    }
    // Cleanup
    document.body.removeChild(emptyBaseline);
    document.body.removeChild(classNameBaseline);
    // Combine longhands into shorthands
    return combineShorthands(styles, computed);
}
