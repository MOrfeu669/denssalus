import { cn } from "cn"
import type { ComponentProps } from "react"

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-paper-md border border-borda-papel bg-card shadow-paper-sm"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm text-tinta", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-papel [&_tr]:border-b [&_tr]:border-borda-papel", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-borda-papel bg-papel font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: ComponentProps<"tr"> & { "data-state"?: "selected" }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-borda-papel transition-colors hover:bg-papel data-[state=selected]:bg-secondary",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle text-sm font-medium whitespace-nowrap text-tinta [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 align-middle text-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-apagado", className)}
      {...props}
    />
  )
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
