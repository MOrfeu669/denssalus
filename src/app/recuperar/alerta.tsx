"use client";

import { useEffect, useRef } from "react";
import { IconeErro, IconeOk } from "../login/icones";

type Props = {
  status: "vazio" | "erro" | "sucesso";
  mensagem: string;
  quando: number;
};

/** Aviso no visual do login (entrar-alerta). Recebe o foco depois da ação. */
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
      className={`entrar-alerta entrar-alerta-${status}`}
    >
      {status === "erro" ? <IconeErro /> : <IconeOk cor="#178A4C" />}
      <div className="entrar-alerta-texto">
        <strong>{mensagem}</strong>
      </div>
    </div>
  );
}
