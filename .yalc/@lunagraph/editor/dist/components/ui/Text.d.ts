import React, { CSSProperties } from 'react';
type Variants = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'white' | 'danger' | 'success' | 'selection';
export type Sizes = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '2.5xl' | '3xl' | '3.5xl';
export type Weights = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
type TextType = HTMLParagraphElement | HTMLHeadingElement | HTMLSpanElement;
/**
 * @example
 * <Text variant={'error'} size={'lg'} weight={'medium'} />
 */
declare const Text: React.ForwardRefExoticComponent<{
    id?: string;
    as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
    variant?: Variants;
    size?: Sizes;
    weight?: Weights;
} & {
    children?: React.ReactNode | undefined;
} & React.RefAttributes<TextType>>;
export { Text };
//# sourceMappingURL=Text.d.ts.map