"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { IconeErro, IconeOk } from "../login/icones";

type Props = {
  status: "vazio" | "erro" | "sucesso";
  mensagem: string;
  quando: number;
};

/** Aviso no visual do login. Recebe o foco depois da ação. */
export function Alerta({ status, mensagem, quando }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mostrar = status !== "vazio" && Boolean(mensagem);

  useEffect(() => {
    if (mostrar) ref.current?.focus();
  }, [mostrar, mensagem, quando]);

  if (!mostrar) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={status === "erro" ? "alert" : "status"}
      className={`clinica-alerta clinica-alerta-${status}`}
    >
      {status === "erro" ? <IconeErro /> : <IconeOk cor="#178A4C" />}
      <strong>{mensagem}</strong>
    </div>
  );
}

/** Botão de envio: no gerúndio e inativo enquanto o formulário pai envia. */
export function BotaoAcao({
  rotulo,
  pendente,
  className,
  nomeAcessivel,
}: {
  rotulo: string;
  pendente: string;
  className: string;
  nomeAcessivel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-label={nomeAcessivel}>
      {pending ? pendente : rotulo}
    </button>
  );
}
