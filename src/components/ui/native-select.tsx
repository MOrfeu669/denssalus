import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { classesCampo } from "@/components/ui/campo"

type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-full", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          classesCampo,
          "h-10 appearance-none py-0 pr-8 pl-3 data-[size=sm]:h-8",
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        data-slot="native-select-icon"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-apagado group-has-[:disabled]/native-select:text-desabilitado-tinta"
      />
    </div>
  )
}

function NativeSelectOption({ className, ...props }: ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({ className, ...props }: ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
