"use client"

import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import type { ComponentProps } from "react"
import { classesCampo } from "@/components/ui/campo"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        classesCampo,
        "h-10 px-3 py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-tinta",
        "selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
