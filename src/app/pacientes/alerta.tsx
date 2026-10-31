"use client";

import { useEffect, useRef } from "react";
import type { EstadoFormulario } from "../formulario";
import { textoAviso } from "./texto";

// Aviso local da tela. O foco vai para ele a cada resposta nova da action (campo `quando`).
export function Alerta({ estado }: { estado: EstadoFormulario }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const visivel = estado.status !== "vazio" && estado.mensagem !== "";

  useEffect(() => {
    if (visivel) ref.current?.focus();
  }, [visivel, estado.quando]);

  if (!visivel) return null;

  const erro = estado.status === "erro";
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={erro ? "alert" : "status"}
      className={`pacientes-aviso ${erro ? "pacientes-aviso-erro" : "pacientes-aviso-sucesso"}`}
    >
      {textoAviso(estado.mensagem, estado.detalhe)}
    </p>
  );
}
