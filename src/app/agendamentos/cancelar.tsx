"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Agendamento } from "../../domain/agendamento/tipos";
import { MENSAGEM_REGISTROS_CONFIRMADOS } from "../../domain/odontograma/tipos";
import type { EstadoFormulario } from "../formulario";

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
        Motivo
        <input name="motivo" value={motivo} onChange={(evento) => setMotivo(evento.target.value)} />
      </label>
      {pedeConfirmacao ? (
        <>
          <p ref={mensagemRef} role="alert" tabIndex={-1}>
            {estado.mensagem}
          </p>
          <button type="submit" disabled={pendente}>
            Confirmar reversão
          </button>
        </>
      ) : (
        <button type="submit" disabled={pendente}>
          Cancelar agendamento
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
    <div ref={ref} tabIndex={-1} role="group" aria-labelledby={idPergunta} className="sucesso">
      <p id={idPergunta}>Deseja reagendar?</p>
      <button type="button" onClick={dispensar}>
        Não
      </button>
      <Link href={caminhoDeReagendar(agendamento)} onClick={dispensar}>
        Sim
      </Link>
    </div>
  );
}
