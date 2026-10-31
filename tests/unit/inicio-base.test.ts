import { describe, expect, it } from "vitest";
import type { Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Cadeira, Clinica } from "../../src/domain/clinica/tipos";
import type { Dentista } from "../../src/domain/dentista/tipos";
import { lerBaseDaClinica, type Dependencias } from "../../src/domain/inicio/casos";
import type { Paciente } from "../../src/domain/paciente/tipos";

const CLINICA_A = "clinica-a";
const CLINICA_B = "clinica-b";

function sessao(papel: Papel, clinicaId: string, ativo = true): Sessao {
  return {
    usuario: { id: `u-${papel}`, nome: "Fulano", email: "f@x.test", papel, clinicaId, ativo },
  };
}

function clinica(id: string, nome: string): Clinica {
  return {
    id,
    nome,
    adminId: `admin-${id}`,
    diasAtendimento: ["segunda"],
    horarioAbertura: "08:00",
    horarioFechamento: "18:00",
  };
}

function cadeira(clinicaId: string, ativa: boolean): Cadeira {
  return { id: `cad-${clinicaId}-${ativa}`, clinicaId, identificacao: "Cadeira 1", ativa };
}

function dentista(clinicaId: string, ativo: boolean): Dentista {
  return {
    id: `den-${clinicaId}-${ativo}`,
    usuarioId: "u",
    clinicaId,
    nome: "Dra. Ana",
    cro: "CRO-1",
    telefone: "1",
    cpf: "1",
    especialidades: [],
    ativo,
  };
}

function paciente(clinicaId: string): Paciente {
  return {
    id: `pac-${clinicaId}`,
    clinicaId,
    nome: "Paciente",
    canais: [],
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
  };
}

function agendamento(clinicaId: string): Agendamento {
  return {
    id: `ag-${clinicaId}`,
    clinicaId,
    pacienteId: `pac-${clinicaId}`,
    dentistaId: `den-${clinicaId}-true`,
    cadeiraId: `cad-${clinicaId}-true`,
    procedimentoId: null,
    inicio: "2026-11-02T09:00:00",
    fim: "2026-11-02T10:00:00",
    status: "agendado",
    iniciadoPor: null,
    emergencia: false,
    criadoPor: "u",
    alertaCadeira: false,
    alertaDentista: false,
    alertaHorario: false,
    motivoCancelamento: null,
    canceladoPor: null,
    canceladoEm: null,
    concluidoEm: null,
  };
}

type Dados = {
  clinicas?: Clinica[];
  cadeiras?: Cadeira[];
  dentistas?: Dentista[];
  pacientes?: Paciente[];
  agendamentos?: Agendamento[];
};

function montar(dados: Dados) {
  const consultadas: string[] = [];
  const registrar = (clinicaId: string) => {
    consultadas.push(clinicaId);
  };
  const deps: Dependencias = {
    clinicas: {
      buscarPorId: async (id) => {
        registrar(id);
        return (dados.clinicas ?? []).find((item) => item.id === id) ?? null;
      },
    },
    cadeiras: {
      listar: async (id) => {
        registrar(id);
        return (dados.cadeiras ?? []).filter((item) => item.clinicaId === id);
      },
    },
    dentistas: {
      listar: async (id) => {
        registrar(id);
        return (dados.dentistas ?? []).filter((item) => item.clinicaId === id);
      },
    },
    pacientes: {
      listar: async (id) => {
        registrar(id);
        return (dados.pacientes ?? []).filter((item) => item.clinicaId === id);
      },
    },
    agendamentos: {
      listar: async (id) => {
        registrar(id);
        return (dados.agendamentos ?? []).filter((item) => item.clinicaId === id);
      },
    },
  };
  return { deps, consultadas };
}

const SEM_NADA = {
  nome: null,
  temClinica: false,
  temCadeiraAtiva: false,
  temDentistaAtivo: false,
  temPaciente: false,
  temAgendamento: false,
};

describe("leitura da base da clínica para o Início", () => {
  it("Dado usuário sem clínica (id vazio), Então a base vem vazia e não é erro", async () => {
    const { deps, consultadas } = montar({ clinicas: [clinica(CLINICA_A, "Sorriso")] });
    const resultado = await lerBaseDaClinica(deps, sessao("admin", ""));
    expect(resultado).toEqual({ ok: true, valor: SEM_NADA });
    expect(consultadas).toEqual([]);
  });

  it("Dado id de clínica que não existe, Então a base vem vazia e não é erro", async () => {
    const { deps } = montar({});
    const resultado = await lerBaseDaClinica(deps, sessao("recepcionista", CLINICA_A));
    expect(resultado).toEqual({ ok: true, valor: SEM_NADA });
  });

  it("Dado clínica com cadeira inativa e dentista inativo, Então traz o nome e nenhum ativo", async () => {
    const { deps } = montar({
      clinicas: [clinica(CLINICA_A, "Sorriso")],
      cadeiras: [cadeira(CLINICA_A, false)],
      dentistas: [dentista(CLINICA_A, false)],
    });
    const resultado = await lerBaseDaClinica(deps, sessao("dentista", CLINICA_A));
    expect(resultado).toEqual({
      ok: true,
      valor: { ...SEM_NADA, nome: "Sorriso", temClinica: true },
    });
  });

  it("Dado base completa com paciente e agendamento, Então tudo é verdadeiro", async () => {
    const { deps } = montar({
      clinicas: [clinica(CLINICA_A, "Sorriso")],
      cadeiras: [cadeira(CLINICA_A, false), cadeira(CLINICA_A, true)],
      dentistas: [dentista(CLINICA_A, true)],
      pacientes: [paciente(CLINICA_A)],
      agendamentos: [agendamento(CLINICA_A)],
    });
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const resultado = await lerBaseDaClinica(deps, sessao(papel, CLINICA_A));
      expect(resultado).toEqual({
        ok: true,
        valor: {
          nome: "Sorriso",
          temClinica: true,
          temCadeiraAtiva: true,
          temDentistaAtivo: true,
          temPaciente: true,
          temAgendamento: true,
        },
      });
    }
  });

  it("Dado usuário inativo, Então recebe a mensagem de papel e nada é lido", async () => {
    const { deps, consultadas } = montar({ clinicas: [clinica(CLINICA_A, "Sorriso")] });
    const resultado = await lerBaseDaClinica(deps, sessao("admin", CLINICA_A, false));
    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(consultadas).toEqual([]);
  });

  it("Dado dados de duas clínicas, Então só consulta e conta a clínica da sessão", async () => {
    const { deps, consultadas } = montar({
      clinicas: [clinica(CLINICA_A, "Sorriso"), clinica(CLINICA_B, "Outra")],
      cadeiras: [cadeira(CLINICA_B, true)],
      dentistas: [dentista(CLINICA_B, true)],
      pacientes: [paciente(CLINICA_B)],
      agendamentos: [agendamento(CLINICA_B)],
    });
    const resultado = await lerBaseDaClinica(deps, sessao("admin", CLINICA_A));
    expect(resultado).toEqual({
      ok: true,
      valor: { ...SEM_NADA, nome: "Sorriso", temClinica: true },
    });
    expect(new Set(consultadas)).toEqual(new Set([CLINICA_A]));
  });

  it("A função não aceita id de outra clínica: só recebe deps e a sessão", () => {
    expect(lerBaseDaClinica.length).toBe(2);
  });
});
