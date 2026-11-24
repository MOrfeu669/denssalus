"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variante = "default" | "outline" | "secondary" | "ghost" | "destructive";

/** Envio do formulário pai: "Salvando…" e inativo enquanto a ação não volta. */
export function BotaoEnviar({
  rotulo,
  children,
  pendente = "Salvando…",
  className,
  nomeAcessivel,
  variante = "default",
}: {
  rotulo?: string;
  children?: ReactNode;
  pendente?: string;
  className?: string;
  nomeAcessivel?: string;
  variante?: Variante;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variante}
      className={cn("h-11 px-5 text-[15px] leading-6 font-semibold", className)}
      disabled={pending}
      aria-busy={pending}
      aria-label={nomeAcessivel}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50"
            aria-hidden="true"
          />
          {pendente}
        </span>
      ) : (
        (rotulo ?? children)
      )}
    </Button>
  );
}
