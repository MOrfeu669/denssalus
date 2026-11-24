"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { fileiras } from "../../../domain/odontograma/regras";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import type { Protese } from "../../../domain/protese/tipos";
import { DenteFigura } from "./dente";
import { FormulariosDoDente } from "./form-odontograma";
import {
  aparenciaDe,
  denteMaisRecente,
  fileirasDeciduas,
  nomeDoDente,
  resumoDoDente,
  semAcento,
  type Aparencia,
  type ItemVisual,
} from "./ficha-dados";
import { ImagensDoDente } from "./imagens";
import { ProtesesDoDente } from "./proteses";
import { RegistrosClinicos } from "./registros";
import type { ImagemDoDente } from "./tipos-imagem";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

const VAZIA: Aparencia = { faces: {}, ausente: false, coroa: false, canal: false };

function nomeProcedimento(procedimentos: ProcedimentoOpcao[], id: string): string {
  return procedimentos.find((item) => item.id === id)?.nome ?? "";
}

function proteseNoDente(proteses: Protese[], dente: number): string | null {
  const ativas = proteses.filter((item) => item.status !== "descontinuada" && item.dentes.includes(dente));
  if (ativas.length === 0) return null;
  return ativas.map((item) => item.tipo).join(", ");
}

function Fileira({
  titulo,
  dentes,
  superior,
  selecionado,
  aparencias,
  aoEscolher,
}: {
  titulo: string;
  dentes: number[];
  superior: boolean;
  selecionado: number | null;
  aparencias: Map<number, Aparencia>;
  aoEscolher: (dente: number) => void;
}) {
  const metade = dentes.length / 2;
  const botao = (dente: number) => {
    const aparencia = aparencias.get(dente) ?? VAZIA;
    const ativo = selecionado === dente;
    return (
      <button
        key={dente}
        type="button"
        className="dente"
        aria-label={`Dente ${dente}, ${nomeDoDente(dente)}`}
        aria-pressed={ativo}
        data-com-registro={
          aparencia.ausente || aparencia.canal || aparencia.coroa || Object.keys(aparencia.faces).length > 0
            ? "true"
            : undefined
        }
        onClick={() => aoEscolher(dente)}
      >
        {superior ? <span className="dente-numero">{dente}</span> : null}
        <DenteFigura aparencia={aparencia} superior={superior} selecionado={ativo} />
        {superior ? null : <span className="dente-numero">{dente}</span>}
      </button>
    );
  };
  return (
    <div role="group" aria-label={titulo} className={`odontograma-fileira ${superior ? "superior" : "inferior"}`}>
      {dentes.slice(0, metade).map(botao)}
      <span aria-hidden="true" className="odontograma-meio" />
      {dentes.slice(metade).map(botao)}
    </div>
  );
}

export function Odontograma({
  pacienteId,
  registros,
  procedimentos,
  agendamentos,
  imagens = [],
  proteses = [],
  itensPlano = [],
  podeEscrever,
}: {
  pacienteId: string;
  registros: RegistroOdontograma[];
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  imagens?: ImagemDoDente[];
  proteses?: Protese[];
  itensPlano?: ItemVisual[];
  podeEscrever: boolean;
}) {
  const [arcada, setArcada] = useState<"permanente" | "decidua">("permanente");
  const [selecionado, setSelecionado] = useState<number | null>(() => denteMaisRecente(registros));
  const [formularioAberto, setFormularioAberto] = useState(false);
  const permanente = arcada === "permanente";
  const linhas = permanente ? fileiras() : fileirasDeciduas();
  const visuais = registros.map((registro) => ({
    dente: registro.dente,
    procedimentoNome: nomeProcedimento(procedimentos, registro.procedimentoId),
    status: registro.status,
    registradoEm: registro.registradoEm,
  }));
  const aparencias = new Map<number, Aparencia>();
  for (const dente of [...linhas.superior, ...linhas.inferior]) {
    const base = aparenciaDe(visuais, itensPlano, dente);
    const protese = proteseNoDente(proteses, dente);
    const coroa = base.coroa || (protese !== null && /\bcoroa\b/.test(semAcento(protese).toLowerCase()));
    aparencias.set(dente, { ...base, coroa });
  }
  const aparencia = selecionado === null ? null : (aparencias.get(selecionado) ?? VAZIA);
  const protese = selecionado === null ? null : proteseNoDente(proteses, selecionado);

  function escolherArcada(proxima: "permanente" | "decidua") {
    setArcada(proxima);
    setSelecionado(proxima === "permanente" ? denteMaisRecente(registros) : null);
    setFormularioAberto(false);
  }

  function escolherDente(dente: number) {
    setSelecionado(dente);
    setFormularioAberto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-paper-md border border-borda-papel bg-card shadow-paper-sm" aria-labelledby="odontograma">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
          <div>
            <h2 id="odontograma" className="m-0 font-heading text-lg leading-6 font-semibold text-tinta">
              Odontograma
            </h2>
            <p className="mt-1 mb-0 text-[13px] leading-[18px] text-paper-ink-3">
              Notação FDI · clique num dente para ver ou registrar procedimentos
            </p>
          </div>
          <div className="inline-flex rounded-controle bg-[#E6E6DA] p-1" role="group" aria-label="Dentição">
            {(
              [
                ["permanente", "Permanente"],
                ["decidua", "Decídua"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                aria-pressed={arcada === id}
                className={`h-7 rounded-paper-sm border-0 px-3 text-sm ${
                  arcada === id ? "bg-card font-medium text-tinta shadow-paper-sm" : "bg-transparent font-normal text-paper-ink-2"
                }`}
                onClick={() => escolherArcada(id)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="odontograma px-4 pt-4 pb-2">
          <div className="mb-2 flex justify-between gap-4 font-mono text-[11px] tracking-wide text-paper-ink-3 uppercase">
            <span>Arcada superior</span>
            <span>Direita ← → Esquerda</span>
          </div>
          <Fileira
            titulo="superior direito e superior esquerdo"
            dentes={linhas.superior}
            superior
            selecionado={selecionado}
            aparencias={aparencias}
            aoEscolher={escolherDente}
          />
          <div className="odontograma-divisoria" aria-hidden="true" />
          <Fileira
            titulo="inferior direito e inferior esquerdo"
            dentes={linhas.inferior}
            superior={false}
            selecionado={selecionado}
            aparencias={aparencias}
            aoEscolher={escolherDente}
          />
          <p className="mt-2 mb-0 font-mono text-[11px] tracking-wide text-paper-ink-3 uppercase">Arcada inferior</p>
        </div>

        {permanente ? null : (
          <p className="mx-6 mb-0 text-sm text-paper-ink-2" role="status">
            A dentição decídua aparece só para consulta. O odontograma grava os dentes permanentes, de 11 a 48.
          </p>
        )}

        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 border-t border-borda-papel px-6 py-4">
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-carie" aria-hidden="true" />
            Cárie
          </li>
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-rest" aria-hidden="true" />
            Restauração
          </li>
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-plan" aria-hidden="true" />
            Planejado
          </li>
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-canal" aria-hidden="true" />
            Tratamento de canal
          </li>
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-coroa" aria-hidden="true" />
            Coroa
          </li>
          <li className="flex items-center gap-2 text-[13px] text-paper-ink-2">
            <span className="amostra amostra-ausente" aria-hidden="true" />
            Ausente
          </li>
        </ul>

        <div className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-paper-md border border-[#DDD6FE] bg-paper-tint-agendado px-4 py-3">
          {selecionado === null || aparencia === null ? (
            <p className="m-0 text-sm text-paper-ink-2">Selecione um dente.</p>
          ) : (
            <div>
              <p className="m-0 text-sm font-semibold text-tinta">
                {`Dente ${selecionado} · ${nomeDoDente(selecionado)}`}
              </p>
              <p className="mt-1 mb-0 text-[13px] text-paper-ink-2">{resumoDoDente(aparencia, protese)}</p>
            </div>
          )}
          <Button
            type="button"
            className="h-10 gap-2 rounded-paper-sm bg-destaque px-4 text-white hover:bg-[#7C3AED]"
            disabled={!podeEscrever || !permanente || selecionado === null}
            onClick={() => setFormularioAberto(true)}
          >
            <Plus aria-hidden="true" />
            Registrar procedimento
          </Button>
        </div>

        {formularioAberto && permanente && selecionado !== null ? (
          <div id="registro-procedimento" tabIndex={-1} className="px-6 pb-6 outline-none">
            <ImagensDoDente imagens={imagens} dente={selecionado} />
            <ProtesesDoDente proteses={proteses} dente={selecionado} />
            {podeEscrever ? (
              <FormulariosDoDente
                key={selecionado}
                pacienteId={pacienteId}
                dente={selecionado}
                confirmados={registros.filter((registro) => registro.dente === selecionado && registro.status === "confirmado")}
                procedimentos={procedimentos}
                agendamentos={agendamentos}
              />
            ) : (
              <p>{MENSAGEM_PAPEL}</p>
            )}
          </div>
        ) : null}
      </section>
      <RegistrosClinicos registros={registros} procedimentos={procedimentos} selecionado={selecionado} />
    </div>
  );
}
