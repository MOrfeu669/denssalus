"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Agendamento } from "../../domain/agendamento/tipos";
import { MENSAGEM_REGISTROS_CONFIRMADOS } from "../../domain/odontograma/tipos";
import type { EstadoFormulario } from "../formulario";
import {
  CAMINHO_AGENDA,
  CAMPO_MOTIVO,
  PENDENTE_CANCELAR,
  PERGUNTA_REAGENDAR,
  RESPOSTA_NAO,
  RESPOSTA_SIM,
  ROTULO_CANCELAR,
  rotuloDoBotao,
} from "./texto";

export function podeCancelar(agendamento: Agendamento): boolean {
  return (
    agendamento.status === "agendado" ||
    agendamento.status === "em_espera" ||
    agendamento.status === "iniciado"
  );
}

export function FormularioCancelar({
  id,
  acao,
  pendente,
  estado,
}: {
  id: string;
  acao: (formData: FormData) => void;
  pendente: boolean;
  estado: EstadoFormulario;
}) {
  const [motivo, setMotivo] = useState("");
  const pedeConfirmacao =
    estado.status === "erro" &&
    estado.detalhe === id &&
    estado.mensagem === MENSAGEM_REGISTROS_CONFIRMADOS;
  const mensagemRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (pedeConfirmacao) mensagemRef.current?.focus();
  }, [pedeConfirmacao, estado.quando]);

  return (
    <form action={acao} aria-busy={pendente}>
      <input type="hidden" name="id" value={id} />
      {pedeConfirmacao ? <input type="hidden" name="confirmouReversao" value="sim" /> : null}
      <label>
        {CAMPO_MOTIVO}
        <input
          name="motivo"
          value={motivo}
          required
          onChange={(evento) => setMotivo(evento.target.value)}
        />
      </label>
      {pedeConfirmacao ? (
        <>
          <p
            ref={mensagemRef}
            role="alert"
            tabIndex={-1}
            className="agendamentos-aviso agendamentos-aviso-erro"
          >
            {estado.mensagem}
          </p>
          <button type="submit" className="agendamentos-perigo" disabled={pendente}>
            Confirmar reversão
          </button>
        </>
      ) : (
        <button type="submit" className="agendamentos-perigo" disabled={pendente}>
          {rotuloDoBotao(ROTULO_CANCELAR, PENDENTE_CANCELAR, pendente)}
        </button>
      )}
    </form>
  );
}

export function caminhoDeReagendar(agendamento: Agendamento): string {
  const params = new URLSearchParams({
    paciente: agendamento.pacienteId,
    dentista: agendamento.dentistaId,
    procedimento: agendamento.procedimentoId ?? "",
  });
  return `/agendamentos?${params.toString()}`;
}

// "nao" não abre fluxo nem cria consulta; "sim" leva ao fluxo de novo agendamento.
export function respostaReagendar(
  agendamento: Agendamento,
  resposta: "sim" | "nao",
): string | null {
  return resposta === "sim" ? caminhoDeReagendar(agendamento) : null;
}

export function PerguntaReagendar({
  estado,
  agendamentos,
}: {
  estado: EstadoFormulario;
  agendamentos: Agendamento[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idPergunta = useId();
  const [dispensada, setDispensada] = useState(0);
  const visivel = estado.status === "sucesso" && estado.quando !== dispensada;

  useEffect(() => {
    if (visivel) ref.current?.focus();
  }, [visivel, estado.quando]);

  if (!visivel) return null;
  const agendamento = agendamentos.find((item) => item.id === estado.detalhe);
  if (!agendamento) return null;

  function dispensar() {
    setDispensada(estado.quando);
  }

  return (
    <div ref={ref} tabIndex={-1} role="group" aria-labelledby={idPergunta} className="agendamentos-pergunta">
      <p id={idPergunta}>{PERGUNTA_REAGENDAR}</p>
      <Link href={CAMINHO_AGENDA} onClick={dispensar} className="agendamentos-pergunta-nao">
        {RESPOSTA_NAO}
      </Link>
      <Link href={caminhoDeReagendar(agendamento)} onClick={dispensar}>
        {RESPOSTA_SIM}
      </Link>
    </div>
  );
}
