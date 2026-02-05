import { cn } from '../../lib/utils';
import React, { createElement } from 'react';
const variantClasses = {
    primary: 'text-ed-foreground',
    secondary: 'text-ed-secondary-foreground',
    tertiary: 'text-ed-muted-foreground',
    accent: 'text-ed-accent-foreground',
    white: 'text-white',
    danger: 'text-ed-destructive',
    success: 'text-green-600 dark:text-green-400',
    selection: 'text-selection'
};
const sizeClasses = {
    '3xs': 'text-[11px] leading-4 tracking-[-0.01em]',
    '2xs': 'text-xs leading-4 tracking-[-0.01em]',
    xs: 'text-[13px] leading-5 tracking-[-0.01em]',
    sm: 'text-sm leading-5 tracking-[-0.01em]',
    md: 'text-base leading-6 tracking-[-0.02em]',
    lg: 'text-lg leading-7 tracking-[-0.02em]',
    xl: 'text-xl leading-7 tracking-[-0.02em]',
    '2xl': 'text-2xl leading-9 tracking-[-0.02em] font-lora',
    '2.5xl': 'text-[28px] leading-10 tracking-[-0.02em] font-lora',
    '3xl': 'text-3xl leading-10 tracking-[-0.02em] font-lora',
    '3.5xl': 'text-[32px] leading-10 tracking-[-0.02em] font-lora',
};
const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
};
/**
 * @example
 * <Text variant={'error'} size={'lg'} weight={'medium'} />
 */
const Text = React.forwardRef(({ as, className, style, variant = 'primary', size = 'md', weight = 'regular', ...props }, ref) => {
    return createElement(as ?? 'span', {
        ref,
        className: cn('p-0 m-0', variantClasses[variant], sizeClasses[size], weightClasses[weight], className),
        style,
        ...props,
    }, props.children);
});
Text.displayName = 'Text';
export { Text };
