"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";
import { cadastrar } from "./actions";

export function FormularioLaboratorio({ nomes }: { nomes: string[] }) {
  const roteador = useRouter();
  const foco = useRef<HTMLParagraphElement>(null);
  const [resposta, executar, pendente] = useActionState(cadastrar, estadoVazio);

  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
    if (resposta.status !== "vazio") foco.current?.focus();
  }, [resposta, roteador]);

  return (
    <div className="flex flex-col gap-4">
      <div ref={foco} tabIndex={-1}>
        <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      </div>
      <form action={executar} aria-busy={pendente} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nome do laboratório
          <input name="nome" required className="h-10 rounded-[10px] border border-linha px-3" />
        </label>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Cadastrar laboratório"}
        </Button>
      </form>
      {nomes.length === 0 ? (
        <p className="m-0 text-apagado">Nenhum laboratório cadastrado.</p>
      ) : (
        <ul className="m-0 list-disc pl-5">
          {nomes.map((nome) => (
            <li key={nome}>{nome}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
