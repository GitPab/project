import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-[#003AB7] text-white hover:bg-[#002A8F] active:bg-[#001F70] shadow-sm hover:shadow-md active:shadow-inner",
        destructive:
          "bg-[#DC3545] text-white hover:bg-[#C82333] active:bg-[#B02A37] focus-visible:ring-[#DC3545]/20 dark:focus-visible:ring-[#DC3545]/40 active:shadow-inner",
        outline:
          "border border-[#003AB7] bg-white text-[#003AB7] hover:bg-[#003AB7] hover:text-white active:bg-[#002A8F] active:text-white active:border-[#002A8F] shadow-sm hover:shadow-md active:shadow-inner",
        secondary:
          "bg-[#F8F9FA] text-[#003AB7] hover:bg-[#003AB7] hover:text-white active:bg-[#002A8F] active:text-white border border-[#003AB7] shadow-sm hover:shadow-md active:shadow-inner",
        ghost:
          "text-[#003AB7] hover:bg-[#F0F7FF] hover:text-[#002A8F] active:bg-[#E6F3FF] active:text-[#001F70]",
        link: "text-[#003AB7] underline-offset-4 hover:underline active:text-[#002A8F]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
