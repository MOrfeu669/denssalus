"use client";

import { Mic } from "lucide-react";

/** Dispara o botão fixo já integrado. Não abre outra sessão nem outra chave. */
export function AtalhoVoz() {
  return (
    <button
      type="button"
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-controle border border-borda-papel bg-card p-0 text-tinta shadow-paper-sm"
      aria-label="Assistente de voz"
      title="Assistente de voz"
      onClick={() => {
        document.querySelector<HTMLButtonElement>("[data-voz-flutuante]")?.click();
      }}
    >
      <Mic className="size-[18px]" aria-hidden="true" />
    </button>
  );
}
