import { describe, expect, it } from "vitest";
import {
  TEXTO_AGUARDANDO_ADMIN,
  baseExiste,
  concluidosDoGuia,
  guiaDoInicio,
  indicePassoAtual,
  passosDoGuia,
} from "../../src/app/inicio-guia";
import type { BaseDaClinica } from "../../src/domain/inicio/tipos";

function base(parcial: Partial<BaseDaClinica> = {}): BaseDaClinica {
  return {
    nome: "Clínica Sorriso",
    temClinica: true,
    temCadeiraAtiva: true,
    temDentistaAtivo: true,
    temPaciente: false,
    temAgendamento: false,
    ...parcial,
  };
}

const SEM_CLINICA = base({
  nome: null,
  temClinica: false,
  temCadeiraAtiva: false,
  temDentistaAtivo: false,
});

describe("passos do guia", () => {
  it("Dado o Admin, Então os cinco passos seguem a ordem do caminho mínimo", () => {
    expect(passosDoGuia("admin")).toEqual([
      { rotulo: "Configurar a clínica", href: "/clinica" },
      { rotulo: "Cadastrar dentista", href: "/dentistas" },
      { rotulo: "Cadastrar paciente", href: "/pacientes" },
      { rotulo: "Criar agendamento", href: "/agendamentos" },
      { rotulo: "Ver na agenda", href: "/agenda" },
    ]);
  });

  it("Dado Dentista ou Recepcionista, Então o guia começa em Cadastrar paciente", () => {
    for (const papel of ["dentista", "recepcionista"] as const) {
      expect(passosDoGuia(papel).map((passo) => passo.rotulo)).toEqual([
        "Cadastrar paciente",
        "Criar agendamento",
        "Ver na agenda",
      ]);
    }
  });
});

describe("indicePassoAtual", () => {
  it("devolve o índice do primeiro passo não concluído", () => {
    expect(indicePassoAtual([true, true, false, false, false])).toBe(2);
    expect(indicePassoAtual([false, true, true])).toBe(0);
  });

  it("devolve o último quando todos estão concluídos", () => {
    expect(indicePassoAtual([true, true, true])).toBe(2);
  });
});

describe("concluídos do guia", () => {
  it("Admin: clínica sem cadeira ativa não conclui o primeiro passo", () => {
    expect(concluidosDoGuia("admin", base({ temCadeiraAtiva: false }))[0]).toBe(false);
  });

  it("Admin: sem clínica, o passo atual é Configurar a clínica", () => {
    const concluidos = concluidosDoGuia("admin", SEM_CLINICA);
    expect(concluidos).toEqual([false, false, false, false, false]);
    expect(indicePassoAtual(concluidos)).toBe(0);
  });

  it("Admin: com clínica e cadeira ativa, o passo atual é Cadastrar dentista", () => {
    const concluidos = concluidosDoGuia("admin", base({ temDentistaAtivo: false }));
    expect(concluidos).toEqual([true, false, false, false, false]);
    expect(indicePassoAtual(concluidos)).toBe(1);
  });

  it("Admin: com agendamento criado, o passo atual é Ver na agenda", () => {
    const concluidos = concluidosDoGuia("admin", base({ temPaciente: true, temAgendamento: true }));
    expect(concluidos).toEqual([true, true, true, true, false]);
    expect(indicePassoAtual(concluidos)).toBe(4);
  });

  it("Dentista com base e sem paciente: o passo atual é Cadastrar paciente", () => {
    const concluidos = concluidosDoGuia("dentista", base());
    expect(concluidos).toEqual([false, false, false]);
    expect(indicePassoAtual(concluidos)).toBe(0);
  });

  it("Recepcionista com paciente e sem agendamento: o passo atual é Criar agendamento", () => {
    const concluidos = concluidosDoGuia("recepcionista", base({ temPaciente: true }));
    expect(concluidos).toEqual([true, false, false]);
    expect(indicePassoAtual(concluidos)).toBe(1);
  });
});

describe("guia do Início", () => {
  it("a base existe só com clínica, cadeira ativa e dentista ativo", () => {
    expect(baseExiste(base())).toBe(true);
    expect(baseExiste(SEM_CLINICA)).toBe(false);
    expect(baseExiste(base({ temCadeiraAtiva: false }))).toBe(false);
    expect(baseExiste(base({ temDentistaAtivo: false }))).toBe(false);
  });

  it("Dentista sem base vê o texto de espera e nenhum passo com link", () => {
    for (const papel of ["dentista", "recepcionista"] as const) {
      for (const sem of [
        SEM_CLINICA,
        base({ temCadeiraAtiva: false }),
        base({ temDentistaAtivo: false }),
      ]) {
        const guia = guiaDoInicio(papel, sem);
        expect(guia).toEqual({ tipo: "aguardando", texto: TEXTO_AGUARDANDO_ADMIN });
      }
    }
    expect(TEXTO_AGUARDANDO_ADMIN).toBe(
      "O Admin ainda precisa configurar a clínica e cadastrar um dentista.",
    );
  });

  it("Dentista com base recebe o guia a partir de Cadastrar paciente, sem /clinica nem /dentistas", () => {
    const guia = guiaDoInicio("dentista", base({ temPaciente: true }));
    expect(guia.tipo).toBe("passos");
    if (guia.tipo !== "passos") return;
    expect(guia.atual).toBe(1);
    const hrefs = guia.passos.map((passo) => passo.href);
    expect(hrefs).toEqual(["/pacientes", "/agendamentos", "/agenda"]);
  });

  it("Admin sem base ainda recebe o guia, começando em Configurar a clínica", () => {
    const guia = guiaDoInicio("admin", SEM_CLINICA);
    expect(guia.tipo).toBe("passos");
    if (guia.tipo !== "passos") return;
    expect(guia.atual).toBe(0);
    expect(guia.passos[guia.atual].rotulo).toBe("Configurar a clínica");
  });
});
