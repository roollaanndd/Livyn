import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground rounded-xl shadow-[var(--shadow-md)] hover:bg-primary-hover hover:shadow-[var(--shadow-lg)]",
        secondary:
          "bg-surface-muted text-foreground rounded-xl hover:bg-border",
        outline:
          "border border-border bg-transparent text-foreground rounded-xl hover:bg-surface-muted",
        ghost:
          "bg-transparent text-foreground rounded-xl hover:bg-surface-muted",
        destructive:
          "bg-error text-white rounded-xl hover:opacity-90",
        accent:
          "bg-accent text-accent-foreground rounded-xl shadow-[var(--shadow-md)] hover:opacity-90",
        glass:
          "glass text-foreground rounded-xl hover:opacity-90",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 text-sm rounded-xl",
        sm: "h-9 px-4 text-[13px] rounded-lg",
        lg: "h-[52px] px-8 text-[15px] rounded-2xl",
        xl: "h-14 px-10 text-base rounded-2xl",
        icon: "h-10 w-10 shrink-0 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
