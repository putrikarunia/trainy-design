import * as React from "react";
import { cn } from "../../lib/utils";
import { CircleNotch, Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Text, Sizes, Weights } from "./Text";

export const buttonVariants = {
  default: "bg-ed-primary text-ed-primary-foreground hover:bg-ed-primary/90",
  destructive: "bg-ed-destructive text-white hover:bg-ed-destructive/90",
  outline:
    "border border-ed-border border-solid bg-ed-background text-ed-foreground hover:bg-ed-accent hover:text-ed-accent-foreground shadow-sm",
  secondary: "bg-ed-secondary text-ed-secondary-foreground hover:bg-ed-secondary/80",
  ghost: "text-ed-foreground hover:bg-ed-accent hover:text-ed-accent-foreground",
  link: "text-ed-primary underline-offset-2 hover:underline bg-transparent font-semibold",
};

const sizes = {
  default: "rounded-lg px-3 py-2",
  sm: "rounded-lg px-2 py-1.5",
  xs: "rounded-lg px-2 py-1",
  text: "p-0 m-0 border-none outline-none w-fit h-fit",
  icon: "size-9 p-0",
  "icon-sm": "rounded size-8 p-0",
  "icon-xs": "rounded size-4 p-0",  // Tiny icon button (16px)
  "icon-2xs": "rounded size-2 p-0", // Extra tiny icon button (8px) 
  "icon-lg": "rounded-lg size-10 p-0",
};

const textSizes: Record<keyof typeof sizes, { size: Sizes; weight: Weights }> =
{
  default: {
    size: "sm",
    weight: "medium",
  },
  sm: {
    size: "xs",
    weight: "medium",
  },
  xs: {
    size: "2xs",
    weight: "regular",
  },
  text: {
    size: "sm",
    weight: "medium",
  },
  icon: {
    size: "sm",
    weight: "medium",
  },
  "icon-sm": {
    size: "xs",
    weight: "medium",
  },
  "icon-xs": {
    size: "2xs",
    weight: "medium",
  },
  "icon-2xs": {
    size: "3xs",
    weight: "medium",
  },
  "icon-lg": {
    size: "sm",
    weight: "medium",
  },
};

const iconSizes: Record<keyof typeof sizes, number> = {
  default: 16,
  sm: 14,
  xs: 12,
  text: 16,
  icon: 20,
  "icon-sm": 16,
  "icon-xs": 12,
  "icon-2xs": 8,
  "icon-lg": 24,
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      LeftIcon,
      leftIconClassName,
      leftIconSize,
      RightIcon,
      rightIconClassName,
      rightIconSize,
      loading,
      leftIconProps,
      rightIconProps,
      isChildText = true,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-1.5 justify-center whitespace-nowrap text-sm font-medium outline-none border-none ring-offset-ed-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          buttonVariants[variant || "default"],
          sizes[size || "default"],
          className,
        )}
        ref={ref}
        {...props}
        disabled={loading || props.disabled}
      >
        {LeftIcon && !loading && (
          <LeftIcon
            size={leftIconSize || iconSizes[size || "default"]}
            weight="bold"
            className={cn("shrink-0", leftIconClassName)}
            {...leftIconProps}
          />
        )}
        {loading && <CircleNotch className="animate-spin" size={16} />}
        {props.children && isChildText ? (
          <Text
            size={textSizes[size || "default"].size}
            weight={textSizes[size || "default"].weight}
            className="text-inherit"
          >
            {props.children}
          </Text>
        ) : (
          props.children
        )}
        {RightIcon && (
          <RightIcon
            size={rightIconSize || iconSizes[size || "default"]}
            weight="bold"
            className={cn("shrink-0", rightIconClassName)}
            {...rightIconProps}
          />
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
