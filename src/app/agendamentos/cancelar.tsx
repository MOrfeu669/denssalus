"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Agendamento } from "../../domain/agendamento/tipos";
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
}: {
  id: string;
  acao: (formData: FormData) => void;
  pendente: boolean;
}) {
  return (
    <form action={acao} aria-busy={pendente}>
      <input type="hidden" name="id" value={id} />
      <label>
        Motivo
        <input name="motivo" />
      </label>
      <button type="submit" disabled={pendente}>
        Cancelar agendamento
      </button>
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
