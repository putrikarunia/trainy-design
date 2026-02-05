import * as React from "react";
import { Icon as PhosphorIcon } from "@phosphor-icons/react";
export declare const buttonVariants: {
    default: string;
    destructive: string;
    outline: string;
    secondary: string;
    ghost: string;
    link: string;
};
declare const sizes: {
    default: string;
    sm: string;
    xs: string;
    text: string;
    icon: string;
    "icon-sm": string;
    "icon-xs": string;
    "icon-2xs": string;
    "icon-lg": string;
};
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants;
    size?: keyof typeof sizes;
    LeftIcon?: PhosphorIcon;
    leftIconClassName?: string;
    leftIconSize?: number;
    RightIcon?: PhosphorIcon;
    rightIconClassName?: string;
    rightIconSize?: number;
    loading?: boolean;
    leftIconProps?: React.ComponentProps<PhosphorIcon>;
    rightIconProps?: React.ComponentProps<PhosphorIcon>;
    isChildText?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button };
//# sourceMappingURL=Button.d.ts.map