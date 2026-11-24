"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form className="flex flex-wrap items-end gap-2" action={acao} aria-busy={pendente}>
      <input type="hidden" name="id" value={id} />
      {pedeConfirmacao ? <input type="hidden" name="confirmouReversao" value="sim" /> : null}
      <Label className="flex-col items-stretch gap-1 text-xs">
        {CAMPO_MOTIVO}
        <Input
          name="motivo"
          className="h-9 w-52"
          value={motivo}
          required
          onChange={(evento) => setMotivo(evento.target.value)}
        />
      </Label>
      {pedeConfirmacao ? (
        <>
          <p
            ref={mensagemRef}
            role="alert"
            tabIndex={-1}
            className="basis-full rounded-paper-md border border-perigo bg-perigo-fundo px-4 py-3 text-sm font-semibold text-perigo-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-perigo"
          >
            {estado.mensagem}
          </p>
          <Button type="submit" variant="destructive" className="h-9" disabled={pendente}>
            Confirmar reversão
          </Button>
        </>
      ) : (
        <Button type="submit" variant="destructive" className="h-9" disabled={pendente}>
          {rotuloDoBotao(ROTULO_CANCELAR, PENDENTE_CANCELAR, pendente)}
        </Button>
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
  return `/agenda?${params.toString()}`;
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
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-labelledby={idPergunta}
      className="flex flex-wrap items-center gap-3 rounded-paper-md border border-ok bg-ok-fundo px-4 py-3 font-semibold text-ok-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-destaque"
    >
      <p id={idPergunta} className="m-0 flex-1 text-sm leading-5">
        {PERGUNTA_REAGENDAR}
      </p>
      <Link
        href={CAMINHO_AGENDA}
        onClick={dispensar}
        className="inline-flex h-9 items-center rounded-paper-md border border-borda-papel bg-card px-3 text-sm font-medium text-tinta no-underline hover:bg-papel"
      >
        {RESPOSTA_NAO}
      </Link>
      <Link
        href={caminhoDeReagendar(agendamento)}
        onClick={dispensar}
        className="inline-flex h-9 items-center rounded-paper-md bg-primary px-3 text-sm font-medium text-primary-foreground no-underline hover:bg-(--paper-primary-hover)"
      >
        {RESPOSTA_SIM}
      </Link>
    </div>
  );
}
