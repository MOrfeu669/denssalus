import { describe, expect, it } from "vitest";
import { podeEvoluir } from "../../src/app/agendamentos/evolucao";
import {
  CAMINHO_AGENDA,
  PENDENTE_CANCELAR,
  PENDENTE_CHEGADA,
  PENDENTE_EVOLUCAO,
  PERGUNTA_REAGENDAR,
  RESPOSTA_NAO,
  RESPOSTA_SIM,
  ROTULO_CANCELAR,
  ROTULO_CHEGADA,
  ROTULO_EVOLUCAO,
  rotuloDoBotao,
} from "../../src/app/agendamentos/texto";
import type { Agendamento, StatusAgendamento } from "../../src/domain/agendamento/tipos";

const dentistas = [
  { id: "den-1", nome: "Ana", usuarioId: "usr-1" },
  { id: "den-2", nome: "Bia", usuarioId: "usr-2" },
];

function agendamento(status: StatusAgendamento): Agendamento {
  return {
    id: "ag-1",
    clinicaId: "cli-1",
    pacienteId: "pac-1",
    dentistaId: "den-1",
    cadeiraId: "cad-1",
    procedimentoId: null,
    inicio: "2026-11-10T09:00",
    fim: "2026-11-10T10:00",
    status,
    iniciadoPor: null,
    emergencia: false,
    criadoPor: "usr-1",
    alertaCadeira: false,
    alertaHorario: false,
    alertaDentista: false,
    motivoCancelamento: null,
    canceladoPor: null,
    canceladoEm: null,
    concluidoEm: null,
  };
}

describe("textos da consulta: cancelar, chegada e evolução", () => {
  it("dado o cancelamento, quando o botão aparece, então diz Cancelar e, pendente, Cancelando…", () => {
    expect(rotuloDoBotao(ROTULO_CANCELAR, PENDENTE_CANCELAR, false)).toBe("Cancelar");
    expect(rotuloDoBotao(ROTULO_CANCELAR, PENDENTE_CANCELAR, true)).toBe("Cancelando…");
  });

  it("dado a chegada, quando o botão aparece, então diz Marcar chegada e, pendente, o gerúndio", () => {
    expect(rotuloDoBotao(ROTULO_CHEGADA, PENDENTE_CHEGADA, false)).toBe("Marcar chegada");
    expect(rotuloDoBotao(ROTULO_CHEGADA, PENDENTE_CHEGADA, true)).toBe("Marcando chegada…");
  });

  it("dado a evolução, quando o botão aparece, então diz Salvar evolução e, pendente, Salvando…", () => {
    expect(rotuloDoBotao(ROTULO_EVOLUCAO, PENDENTE_EVOLUCAO, false)).toBe("Salvar evolução");
    expect(rotuloDoBotao(ROTULO_EVOLUCAO, PENDENTE_EVOLUCAO, true)).toBe("Salvando…");
  });

  it("dado o cancelamento feito, quando a pergunta aparece, então oferece Sim e Não e Não volta à agenda", () => {
    expect(PERGUNTA_REAGENDAR).toBe("Deseja reagendar?");
    expect(RESPOSTA_SIM).toBe("Sim");
    expect(RESPOSTA_NAO).toBe("Não");
    expect(CAMINHO_AGENDA).toBe("/agenda");
  });
});

describe("quem vê a evolução", () => {
  it("dado atendimento iniciado ou concluído, quando é o dentista responsável, então vê o campo", () => {
    expect(podeEvoluir(agendamento("iniciado"), "dentista", "usr-1", dentistas)).toBe(true);
    expect(podeEvoluir(agendamento("concluido"), "dentista", "usr-1", dentistas)).toBe(true);
  });

  it("dado atendimento iniciado, quando é o Admin, então vê o campo", () => {
    expect(podeEvoluir(agendamento("iniciado"), "admin", "usr-9", dentistas)).toBe(true);
  });

  it("dado atendimento iniciado, quando é outro dentista ou a Recepcionista, então não vê o campo", () => {
    expect(podeEvoluir(agendamento("iniciado"), "dentista", "usr-2", dentistas)).toBe(false);
    expect(podeEvoluir(agendamento("iniciado"), "recepcionista", "usr-3", dentistas)).toBe(false);
  });

  it("dado agendado, em espera ou cancelado, quando é o responsável, então não vê o campo", () => {
    for (const status of ["agendado", "em_espera", "cancelado"] as const) {
      expect(podeEvoluir(agendamento(status), "dentista", "usr-1", dentistas)).toBe(false);
    }
  });
});
