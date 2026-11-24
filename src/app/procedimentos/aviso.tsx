"use client";

import { useEffect, useRef } from "react";
import type { EstadoFormulario } from "../formulario";

export function AvisoLocal({
  tipo,
  mensagem,
  quando,
}: {
  tipo: EstadoFormulario["status"];
  mensagem: string;
  quando: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (tipo === "vazio" || !mensagem) return;
    const id = window.setTimeout(() => ref.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [tipo, mensagem, quando]);

  if (tipo === "vazio" || !mensagem) return null;

  const erro = tipo === "erro";

  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={erro ? "alert" : "status"}
      className={
        erro
          ? "procedimentos-aviso procedimentos-aviso-erro mb-6 rounded-paper-md border border-perigo bg-perigo-fundo px-4 py-3 text-sm leading-5 font-semibold text-perigo-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          : "procedimentos-aviso procedimentos-aviso-sucesso mb-6 rounded-paper-md border border-ok bg-ok-fundo px-4 py-3 text-sm leading-5 font-semibold text-ok-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      }
    >
      {mensagem}
    </p>
  );
}
