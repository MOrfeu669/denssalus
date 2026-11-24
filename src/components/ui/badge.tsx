"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-paper-sm border border-transparent px-2 text-sm leading-5 font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-destaque aria-invalid:border-perigo aria-invalid:outline-perigo [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-(--paper-primary-hover)",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-papel",
        destructive:
          "bg-perigo-fundo text-perigo-tinta focus-visible:outline-perigo [a]:hover:bg-perigo [a]:hover:text-primary-foreground",
        outline: "border-borda-papel bg-card text-tinta [a]:hover:bg-papel",
        ghost: "text-tinta hover:bg-papel",
        link: "text-link underline-offset-4 hover:underline",
        success: "bg-ok-fundo text-ok-tinta",
        warning: "bg-aviso-fundo text-aviso-tinta",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
