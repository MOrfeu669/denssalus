"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { StatusAgendamento } from "@/domain/agendamento/tipos"

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

const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  agendado: "agendado",
  em_espera: "em espera",
  iniciado: "iniciado",
  concluido: "concluído",
  cancelado: "cancelado",
}

const CLASSE_STATUS: Record<StatusAgendamento, string> = {
  agendado: "border-transparent bg-paper-status-agendado-fundo text-paper-status-agendado-tinta",
  em_espera: "border-transparent bg-paper-status-em-espera-fundo text-paper-status-em-espera-tinta",
  iniciado: "border-transparent bg-paper-status-iniciado-fundo text-paper-status-iniciado-tinta",
  concluido: "border-transparent bg-paper-status-concluido-fundo text-paper-status-concluido-tinta",
  cancelado:
    "border-paper-status-cancelado-borda bg-paper-status-cancelado-fundo text-paper-status-cancelado-tinta line-through",
}

const PONTO_STATUS: Record<StatusAgendamento, string> = {
  agendado: "bg-paper-status-agendado",
  em_espera: "bg-paper-status-em-espera",
  iniciado: "bg-paper-status-iniciado-tinta",
  concluido: "bg-paper-status-concluido",
  cancelado: "bg-paper-status-cancelado",
}

function BadgeStatus({ status }: { status: StatusAgendamento }) {
  return (
    <Badge
      data-status={status}
      className={cn("h-[22px] gap-1.5 rounded-full px-2 text-xs leading-4 font-medium", CLASSE_STATUS[status])}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", PONTO_STATUS[status])} />
      {ROTULO_STATUS[status]}
    </Badge>
  )
}

export { Badge, BadgeStatus, badgeVariants }
