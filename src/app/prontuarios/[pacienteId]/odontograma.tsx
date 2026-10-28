"use client";

import { useState } from "react";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { fileiras } from "../../../domain/odontograma/regras";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import { FormulariosDoDente } from "./form-odontograma";
import { instante } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

function Fileira({
  titulo,
  dentes,
  selecionado,
  comRegistro,
  aoEscolher,
}: {
  titulo: string;
  dentes: number[];
  selecionado: number | null;
  comRegistro: Set<number>;
  aoEscolher: (dente: number) => void;
}) {
  const metade = dentes.length / 2;
  const botao = (dente: number) => (
    <button
      key={dente}
      type="button"
      aria-label={`Dente ${dente}`}
      aria-pressed={selecionado === dente}
      className={comRegistro.has(dente) ? "dente com-registro" : "dente"}
      onClick={() => aoEscolher(dente)}
    >
      {dente}
    </button>
  );
  return (
    <div role="group" aria-label={titulo} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
      {dentes.slice(0, metade).map(botao)}
      <span aria-hidden="true" style={{ borderLeft: "2px solid currentColor", alignSelf: "stretch" }} />
      {dentes.slice(metade).map(botao)}
    </div>
  );
}

function Historico({
  registros,
  procedimentos,
}: {
  registros: RegistroOdontograma[];
  procedimentos: ProcedimentoOpcao[];
}) {
  if (registros.length === 0) return <p>Nenhum registro neste dente.</p>;
  return (
    <ul className="lista">
      {registros.map((registro) => {
        const nome = procedimentos.find((item) => item.id === registro.procedimentoId)?.nome;
        return (
          <li key={registro.id}>
            {[
              nome ?? registro.procedimentoId,
              registro.origem === "pre_existente" ? "pré-existente" : "atendimento",
              registro.status,
              instante(registro.registradoEm),
            ].join(" · ")}
          </li>
        );
      })}
    </ul>
  );
}

export function Odontograma({
  pacienteId,
  registros,
  procedimentos,
  agendamentos,
  podeEscrever,
}: {
  pacienteId: string;
  registros: RegistroOdontograma[];
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  podeEscrever: boolean;
}) {
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const { superior, inferior } = fileiras();
  const comRegistro = new Set(registros.map((registro) => registro.dente));
  const doDente = registros.filter((registro) => registro.dente === selecionado);

  return (
    <>
      <div role="group" aria-label="Dentes">
        <Fileira
          titulo="Arcada superior"
          dentes={superior}
          selecionado={selecionado}
          comRegistro={comRegistro}
          aoEscolher={setSelecionado}
        />
        <Fileira
          titulo="Arcada inferior"
          dentes={inferior}
          selecionado={selecionado}
          comRegistro={comRegistro}
          aoEscolher={setSelecionado}
        />
      </div>
      {selecionado === null ? (
        <p>Selecione um dente.</p>
      ) : (
        <section aria-label={`Registros do dente ${selecionado}`}>
          <h3>Dente {selecionado}</h3>
          <Historico registros={doDente} procedimentos={procedimentos} />
          {podeEscrever ? (
            <FormulariosDoDente
              key={selecionado}
              pacienteId={pacienteId}
              dente={selecionado}
              confirmados={doDente.filter((registro) => registro.status === "confirmado")}
              procedimentos={procedimentos}
              agendamentos={agendamentos}
            />
          ) : (
            <p>{MENSAGEM_PAPEL}</p>
          )}
        </section>
      )}
    </>
  );
}
