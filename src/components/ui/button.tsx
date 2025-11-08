import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { playClick, playHover } from "@/lib/sound";
import e from "express";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        hero: "bg-gradient-magical text-foreground font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-primary/50 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, onMouseEnter, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      try {
        // play hover sound effect
        playHover();
      } catch {
        // swallow errors so hover still works
      }
      onMouseEnter?.(e);
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      try {
        playClick(); // play global sfx
      } catch {
        // swallow errors so clicks still work
      }
      onClick?.(e);
    };
    return <Comp 
      className={cn(buttonVariants({ variant, size, className }))} 
      ref={ref} {...props} 
      onMouseEnter={handleMouseEnter}
      onClick={handleClick} 
      />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
