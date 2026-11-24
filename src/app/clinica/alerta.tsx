"use client";

import { useEffect, useRef, type Ref } from "react";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { cn } from "@/lib/utils";
import { IconeErro } from "../login/icones";
import { IconeSucesso } from "../icone-sucesso";

type Props = {
  status: "vazio" | "erro" | "sucesso";
  mensagem: string;
  quando: number;
  ref?: Ref<HTMLDivElement | null>;
};

/** Aviso da tela. Recebe o foco depois da ação. */
export function Alerta({ status, mensagem, quando, ref }: Props) {
  const interno = useRef<HTMLDivElement>(null);
  const mostrar = status !== "vazio" && Boolean(mensagem);

  function definir(no: HTMLDivElement | null) {
    interno.current = no;
    if (typeof ref === "function") ref(no);
    else if (ref) ref.current = no;
  }

  useEffect(() => {
    if (!mostrar) return;
    const id = window.setTimeout(() => interno.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [mostrar, mensagem, quando]);

  if (!mostrar) return null;

  const erro = status === "erro";

  return (
    <div
      ref={definir}
      tabIndex={-1}
      role={erro ? "alert" : "status"}
      className={cn(
        "clinica-alerta mb-6 flex max-w-xl items-start gap-3 rounded-paper-md border p-4 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-destaque",
        erro
          ? "clinica-alerta-erro border-perigo bg-perigo-fundo"
          : "clinica-alerta-sucesso border-ok bg-ok-fundo",
      )}
    >
      {erro ? <IconeErro /> : <IconeSucesso />}
      <strong className={cn("text-sm leading-5 font-semibold", erro ? "text-perigo-tinta" : "text-ok-tinta")}>
        {mensagem}
      </strong>
    </div>
  );
}

/** Botão de envio: no gerúndio e inativo enquanto o formulário pai envia. */
export function BotaoAcao({
  rotulo,
  pendente,
  className,
  nomeAcessivel,
  variante = "default",
}: {
  rotulo: string;
  pendente: string;
  className: string;
  nomeAcessivel?: string;
  variante?: "default" | "outline" | "destructive";
}) {
  return (
    <BotaoEnviar
      rotulo={rotulo}
      pendente={pendente}
      className={className}
      nomeAcessivel={nomeAcessivel}
      variante={variante}
    />
  );
}
