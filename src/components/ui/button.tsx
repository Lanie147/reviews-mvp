import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // BASE (applies to all variants)
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium " +
    "transition-colors duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] " +
    "focus-visible:ring-offset-2 ring-offset-[hsl(var(--background))] " +
    "disabled:pointer-events-none cursor-pointer disabled:opacity-50",
  {
    variants: {
      variant: {
        // shadcn "default"
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm " +
          "hover:bg-[hsl(var(--primary)/0.85)]",

        // alias so <Button variant='primary'> works too
        primary:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm " +
          "hover:bg-[hsl(var(--primary)/0.85)]",

        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-sm " +
          "hover:bg-[hsl(var(--destructive)/0.9)]",

        outline:
          "border border-[hsl(var(--input))] bg-[hsl(var(--background))] " +
          "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",

        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-sm " +
          "hover:bg-[hsl(var(--secondary)/0.85)]",

        ghost:
          "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",

        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }), // compute first
          className // then merge caller classes after (so you can still override)
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
