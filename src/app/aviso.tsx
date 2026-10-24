"use client";

import { useEffect, useRef } from "react";

export function Aviso({
  tipo,
  mensagem,
}: {
  tipo: "vazio" | "erro" | "sucesso";
  mensagem: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (tipo !== "vazio" && mensagem) ref.current?.focus();
  }, [tipo, mensagem]);

  if (tipo === "vazio" || !mensagem) return null;

  return (
    <p ref={ref} tabIndex={-1} role={tipo === "erro" ? "alert" : "status"} className={tipo}>
      {mensagem}
    </p>
  );
}
