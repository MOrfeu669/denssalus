"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { ModeloMensagem } from "../../domain/mensagem/tipos";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";
import { salvar } from "./actions";

const TIPOS = ["confirmacao_agendamento", "lembrete_24h", "lembrete_5h"] as const;

const ROTULO: Record<(typeof TIPOS)[number], string> = {
  confirmacao_agendamento: "Confirmação de agendamento",
  lembrete_24h: "Lembrete de 24h",
  lembrete_5h: "Lembrete de 5h",
};

export function Mensagens({ modelos }: { modelos: ModeloMensagem[] }) {
  const conteudo = new Map(modelos.map((modelo) => [modelo.tipo, modelo.conteudo]));

  return (
    <>
      {TIPOS.map((tipo) => (
        <Modelo key={tipo} tipo={tipo} conteudo={conteudo.get(tipo) ?? ""} />
      ))}
    </>
  );
}

function Modelo({
  tipo,
  conteudo,
}: {
  tipo: (typeof TIPOS)[number];
  conteudo: string;
}) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(salvar, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <>
      <Aviso tipo={resultado.status} mensagem={resultado.mensagem} />
      <form action={acao} aria-busy={pendente}>
        <input type="hidden" name="tipo" value={tipo} />
        <label>
          {ROTULO[tipo]}
          <textarea key={conteudo} name="conteudo" rows={6} defaultValue={conteudo} />
        </label>
        <button type="submit" disabled={pendente}>
          Salvar modelo
        </button>
      </form>
    </>
  );
}
