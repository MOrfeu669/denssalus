"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Papel } from "../../domain/auth/tipos";
import type { Agendamento, OpcoesAgendamento } from "../../domain/agendamento/tipos";
import {
  CAMPO_EVOLUCAO,
  PENDENTE_EVOLUCAO,
  ROTULO_EVOLUCAO,
  rotuloDoBotao,
} from "./texto";

// Evolução abre com o atendimento iniciado e continua editável depois de concluído.
// Só o dentista responsável e o Admin; Recepcionista e outro dentista não veem o campo.
export function podeEvoluir(
  agendamento: Agendamento,
  papel: Papel,
  usuarioId: string,
  dentistas: OpcoesAgendamento["dentistas"],
): boolean {
  if (agendamento.status !== "iniciado" && agendamento.status !== "concluido") return false;
  if (papel === "admin") return true;
  return dentistas.some(
    (dentista) => dentista.id === agendamento.dentistaId && dentista.usuarioId === usuarioId,
  );
}

// Salvar a evolução conclui a consulta. Não há botão Concluir nem trava por estoque.
export function FormularioEvolucao({
  agendamento,
  acao,
  pendente,
}: {
  agendamento: Agendamento;
  acao: (formData: FormData) => void;
  pendente: boolean;
}) {
  return (
    <form action={acao} aria-busy={pendente} className="flex w-full basis-full flex-col items-stretch gap-2">
      <input type="hidden" name="pacienteId" value={agendamento.pacienteId} />
      <input type="hidden" name="agendamentoId" value={agendamento.id} />
      <Label className="flex-col items-stretch gap-1.5">
        {CAMPO_EVOLUCAO}
        <Textarea name="texto" rows={4} required />
      </Label>
      <Button type="submit" className="h-10 self-start" disabled={pendente}>
        {rotuloDoBotao(ROTULO_EVOLUCAO, PENDENTE_EVOLUCAO, pendente)}
      </Button>
    </form>
  );
}
