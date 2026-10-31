"use client";

import { useEffect, useRef } from "react";

// Mensagem de erro ou sucesso que recebe o foco quando aparece (ou quando uma nova chega).
export function Alerta({
  tipo,
  mensagem,
  quando = 0,
  classe,
}: {
  tipo: "erro" | "sucesso";
  mensagem: string;
  quando?: number;
  classe?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (mensagem) ref.current?.focus();
  }, [tipo, mensagem, quando]);

  if (!mensagem) return null;

  return (
    <p ref={ref} tabIndex={-1} role={tipo === "erro" ? "alert" : "status"} className={classe}>
      {mensagem}
    </p>
  );
}
