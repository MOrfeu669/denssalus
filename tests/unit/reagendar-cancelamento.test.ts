import { describe, expect, it } from "vitest";
import { caminhoDeReagendar, respostaReagendar } from "../../src/app/agendamentos/cancelar";
import type { Agendamento } from "../../src/domain/agendamento/tipos";

function agendamento(procedimentoId: string | null = "proc-1"): Agendamento {
  return {
    id: "ag-1",
    clinicaId: "cli-1",
    pacienteId: "pac-1",
    dentistaId: "den-1",
    cadeiraId: "cad-1",
    procedimentoId,
    inicio: "2026-11-10T09:00",
    fim: "2026-11-10T10:00",
    status: "cancelado",
    iniciadoPor: null,
    emergencia: false,
    criadoPor: "usr-1",
    alertaCadeira: false,
    alertaHorario: false,
    alertaDentista: false,
    motivoCancelamento: "Paciente desmarcou",
    canceladoPor: "usr-1",
    canceladoEm: "2026-11-01T08:00",
  };
}

function parametros(caminho: string) {
  const url = new URL(caminho, "http://localhost");
  return { rota: url.pathname, params: url.searchParams };
}

describe("reagendar após cancelamento", () => {
  it("Sim abre /agendamentos com paciente, dentista e procedimento", () => {
    const caminho = respostaReagendar(agendamento(), "sim");
    expect(caminho).toBe(caminhoDeReagendar(agendamento()));
    const { rota, params } = parametros(caminho as string);
    expect(rota).toBe("/agendamentos");
    expect(params.get("paciente")).toBe("pac-1");
    expect(params.get("dentista")).toBe("den-1");
    expect(params.get("procedimento")).toBe("proc-1");
  });

  it("Sim sem procedimento mantém o parâmetro vazio", () => {
    const { params } = parametros(caminhoDeReagendar(agendamento(null)));
    expect(params.get("procedimento")).toBe("");
  });

  it("Não não abre fluxo nem cria consulta", () => {
    expect(respostaReagendar(agendamento(), "nao")).toBeNull();
  });
});
