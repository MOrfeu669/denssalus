import { cn } from "cn"
import type { ComponentProps } from "react"

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-5 font-semibold text-tinta select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-desabilitado-tinta",
        "peer-disabled:cursor-not-allowed peer-disabled:text-desabilitado-tinta",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
