import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AgendamentoNaGrade } from "../../src/domain/agendamento/tipos";
import { SalaEspera } from "../../src/app/agenda/sala";
import { BarraAgenda } from "../../src/app/agenda/barra";
import { exibeChamar, podeIniciarAtendimento } from "../../src/app/agendamentos/permissao-atendimento";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push: () => undefined, replace: () => undefined }),
}));

vi.mock("../../src/app/agendamentos/actions", () => ({
  iniciar: vi.fn(),
}));

const espera: AgendamentoNaGrade = {
  id: "ag-1",
  clinicaId: "c1",
  pacienteId: "pac-1",
  dentistaId: "den-1",
  cadeiraId: "cad-1",
  procedimentoId: null,
  inicio: "2026-11-24T09:00",
  fim: "2026-11-24T09:30",
  status: "em_espera",
  iniciadoPor: null,
  emergencia: false,
  criadoPor: "user-1",
  alertaCadeira: false,
  alertaHorario: false,
  alertaDentista: false,
  motivoCancelamento: null,
  canceladoPor: null,
  canceladoEm: null,
  concluidoEm: null,
  alerta: false,
  textoAlerta: null,
};

describe("chamar na sala de espera", () => {
  it("dado a recepcionista, quando o paciente está em espera, então ela pode chamar; agendado continua só com admin e dentista responsável", () => {
    expect(podeIniciarAtendimento("em_espera", "recepcionista", "rec-1", "den-user")).toBe(true);
    expect(podeIniciarAtendimento("agendado", "recepcionista", "rec-1", "den-user")).toBe(false);
    expect(podeIniciarAtendimento("em_espera", "admin", "adm-1", null)).toBe(true);
    expect(podeIniciarAtendimento("agendado", "admin", "adm-1", null)).toBe(true);
    expect(podeIniciarAtendimento("agendado", "dentista", "den-user", "den-user")).toBe(true);
    expect(podeIniciarAtendimento("em_espera", "dentista", "outra", "den-user")).toBe(false);
    expect(podeIniciarAtendimento("iniciado", "recepcionista", "rec-1", "den-user")).toBe(false);
    expect(exibeChamar("recepcionista")).toBe(true);
    expect(exibeChamar("admin")).toBe(true);
    expect(exibeChamar("dentista")).toBe(true);
  });

  it("dado a sala de espera, quando a recepcionista vê o paciente, então o botão Chamar aparece", () => {
    const html = renderToStaticMarkup(
      createElement(SalaEspera, {
        itens: [espera],
        nomes: { pacientes: { "pac-1": "João Pereira" }, dentistas: { "den-1": "Dra. Ana" } },
        papel: "recepcionista",
      }),
    );

    expect(html).toContain("Chamar");
    expect(html).toContain("João Pereira");
    expect(html).toContain('name="id"');
  });
});

describe("visão da agenda", () => {
  it("dado a barra da agenda, quando a tela abre, então só existem Dia e Semana", () => {
    const html = renderToStaticMarkup(
      createElement(BarraAgenda, {
        data: "2026-11-24",
        visao: "dia",
        dentistaId: null,
        cadeiraId: null,
        dentistas: [],
        cadeiras: [],
        dias: ["2026-11-23", "2026-11-24"],
        onVisao: () => undefined,
        onFiltrar: () => undefined,
      }),
    );

    expect(html).toContain("Dia");
    expect(html).toContain("Semana");
    expect(html).not.toContain(">Mês<");
  });
});
