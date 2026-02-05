/**
 * Whitelist of important HTML props per element type.
 * These are commonly used props that should be shown in the props panel.
 *
 * Used by:
 * - CLI scanner: to extract important props for components extending HTML elements
 * - Editor PropsPanel: to show editable props for HTML elements
 */
export const importantHtmlProps = {
    input: ['type', 'placeholder', 'name', 'value', 'defaultValue', 'disabled', 'required', 'readOnly', 'autoFocus', 'autoComplete'],
    textarea: ['placeholder', 'name', 'value', 'defaultValue', 'rows', 'cols', 'disabled', 'required', 'readOnly', 'autoFocus'],
    button: ['type', 'disabled'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    video: ['src', 'controls', 'autoPlay', 'loop', 'muted', 'poster', 'width', 'height'],
    audio: ['src', 'controls', 'autoPlay', 'loop', 'muted'],
    iframe: ['src', 'title', 'width', 'height', 'sandbox', 'allow', 'allowFullScreen', 'loading', 'referrerPolicy'],
    form: ['action', 'method', 'onSubmit'],
    label: ['htmlFor'],
    select: ['name', 'value', 'defaultValue', 'disabled', 'required', 'multiple'],
    option: ['value', 'disabled', 'selected'],
};
/**
 * Schema with type information for PropsPanel rendering.
 * Maps element tag to array of prop definitions with type and label.
 */
export const htmlPropsSchema = {
    img: [
        { type: 'string', label: 'src' },
        { type: 'string', label: 'alt' },
        { type: 'number', label: 'width' },
        { type: 'number', label: 'height' },
    ],
    a: [
        { type: 'string', label: 'href' },
        { type: 'string', label: 'target' },
        { type: 'string', label: 'rel' },
    ],
    input: [
        { type: 'string', label: 'type' },
        { type: 'string', label: 'placeholder' },
        { type: 'string', label: 'name' },
        { type: 'string', label: 'value' },
        { type: 'boolean', label: 'disabled' },
        { type: 'boolean', label: 'required' },
    ],
    textarea: [
        { type: 'string', label: 'placeholder' },
        { type: 'string', label: 'name' },
        { type: 'number', label: 'rows' },
        { type: 'number', label: 'cols' },
        { type: 'boolean', label: 'disabled' },
        { type: 'boolean', label: 'required' },
    ],
    button: [
        { type: 'string', label: 'type' },
        { type: 'boolean', label: 'disabled' },
    ],
    video: [
        { type: 'string', label: 'src' },
        { type: 'boolean', label: 'controls' },
        { type: 'boolean', label: 'autoplay' },
        { type: 'boolean', label: 'loop' },
        { type: 'boolean', label: 'muted' },
    ],
    audio: [
        { type: 'string', label: 'src' },
        { type: 'boolean', label: 'controls' },
        { type: 'boolean', label: 'autoplay' },
        { type: 'boolean', label: 'loop' },
    ],
    iframe: [
        { type: 'string', label: 'src' },
        { type: 'string', label: 'title' },
        { type: 'number', label: 'width' },
        { type: 'number', label: 'height' },
        { type: 'string', label: 'sandbox' },
        { type: 'string', label: 'allow' },
        { type: 'boolean', label: 'allowFullScreen' },
        { type: 'string', label: 'loading' },
        { type: 'string', label: 'referrerPolicy' },
        { type: 'boolean', label: 'data-use-proxy' },
        { type: 'number', label: 'data-scale' },
    ],
};
