import { cn } from "cn"
import type { ComponentProps } from "react"
import { classesCampo } from "@/components/ui/campo"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        classesCampo,
        "min-h-24 px-3 py-2 selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
