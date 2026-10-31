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
  const titulo = `mensagens-titulo-${tipo}`;

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <section className="mensagens-modelo" aria-labelledby={titulo}>
      <h2 id={titulo}>{ROTULO[tipo]}</h2>
      <Aviso key={resultado.quando} tipo={resultado.status} mensagem={resultado.mensagem} />
      <form className="mensagens-form" action={acao} aria-busy={pendente}>
        <input type="hidden" name="tipo" value={tipo} />
        <label className="mensagens-campo">
          {`Texto do modelo de ${ROTULO[tipo]}`}
          <textarea key={conteudo} name="conteudo" rows={5} defaultValue={conteudo} />
        </label>
        <button
          type="submit"
          className="mensagens-botao"
          aria-label={`Salvar modelo de ${ROTULO[tipo]}`}
          disabled={pendente}
        >
          {pendente ? "Salvando…" : "Salvar modelo"}
        </button>
      </form>
    </section>
  );
}
