import { describe, expect, it, vi } from "vitest";
import { verAgenda } from "../../src/domain/agendamento/casos";
import type { Dependencias } from "../../src/domain/agendamento/portas";
import { filtrarGrade } from "../../src/domain/agendamento/regras";
import {
  TEXTO_ALERTA_HORARIO,
  type Agendamento,
  type BloqueioAgenda,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA, type Cadeira } from "../../src/domain/clinica/tipos";
import type { Dentista } from "../../src/domain/dentista/tipos";
import type { Paciente } from "../../src/domain/paciente/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const DATA = "2026-10-15";
const EXPEDIENTE = { horarioAbertura: "08:00", horarioFechamento: "18:00" };
const CONTEXTO = {
  cadeiras: [
    { id: "cadeira-1", ativa: true },
    { id: "cadeira-2", ativa: true },
  ],
  dentistas: [
    { id: "dentista-carlos", ativo: true },
    { id: "dentista-ana", ativo: true },
  ],
};

function agendamento(parcial: Partial<Agendamento> & Pick<Agendamento, "id">): Agendamento {
  return {
    clinicaId: CLINICA_ID,
    pacienteId: "paciente-joao",
    dentistaId: "dentista-carlos",
    cadeiraId: "cadeira-1",
    procedimentoId: null,
    inicio: `${DATA}T14:00`,
    fim: `${DATA}T14:30`,
    status: "agendado",
    iniciadoPor: null,
    emergencia: false,
    criadoPor: "ator-admin",
    alertaCadeira: false,
    alertaHorario: false,
    alertaDentista: false,
    motivoCancelamento: null,
    canceladoPor: null,
    canceladoEm: null,
    ...parcial,
  };
}

function bloqueio(parcial: Partial<BloqueioAgenda> & Pick<BloqueioAgenda, "id">): BloqueioAgenda {
  return {
    clinicaId: CLINICA_ID,
    dentistaId: "dentista-carlos",
    inicio: `${DATA}T09:00`,
    fim: `${DATA}T10:00`,
    motivo: null,
    criadoPor: "ator-carlos",
    ...parcial,
  };
}

function grade(
  modo: "dia" | "semana",
  origem: { agendamentos?: Agendamento[]; bloqueios?: BloqueioAgenda[] },
  filtro: { dentistaId?: string | null; cadeiraId?: string | null } = {},
) {
  return filtrarGrade(
    { data: DATA, dentistaId: null, cadeiraId: null, ...filtro, modo },
    { agendamentos: [], bloqueios: [], ...CONTEXTO, ...origem },
    EXPEDIENTE,
  );
}

function sessao(papel: Papel, ativo = true): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId: CLINICA_ID,
      ativo,
    },
  };
}

type Semente = {
  agendamentos?: Agendamento[];
  bloqueios?: BloqueioAgenda[];
  pacientes?: Pick<Paciente, "id" | "clinicaId">[];
  clinicaExiste?: boolean;
};

function deps(semente: Semente = {}) {
  const agendamentos = vi.fn(async (clinicaId: string, inicio: string, fim: string) =>
    (semente.agendamentos ?? []).filter(
      (item) => item.clinicaId === clinicaId && item.inicio < fim && item.fim > inicio,
    ),
  );
  const bloqueios = vi.fn(async (clinicaId: string, inicio: string, fim: string) =>
    (semente.bloqueios ?? []).filter(
      (item) => item.clinicaId === clinicaId && item.inicio < fim && item.fim > inicio,
    ),
  );
  const pacientes = semente.pacientes ?? [
    { id: "paciente-joao", clinicaId: CLINICA_ID },
    { id: "paciente-maria", clinicaId: CLINICA_ID },
  ];
  const dependencias = {
    agendamentos: { listarEntre: agendamentos },
    bloqueios: { listarEntre: bloqueios },
    clinicas: {
      buscarPorId: async (id: string) =>
        semente.clinicaExiste === false ? null : { id, nome: "Clínica", ...EXPEDIENTE },
    },
    cadeiras: {
      listar: async (clinicaId: string) =>
        CONTEXTO.cadeiras.map((item) => ({ ...item, clinicaId })) as Cadeira[],
    },
    dentistas: {
      listar: async (clinicaId: string) =>
        CONTEXTO.dentistas.map((item) => ({ ...item, clinicaId })) as Dentista[],
    },
    pacientes: { listar: async () => pacientes as Paciente[] },
  } as unknown as Dependencias;
  return { dependencias, agendamentos, bloqueios };
}

describe("visualizar agenda", () => {
  it("dado agendamentos em 2026-10-15 e 2026-10-16, quando vê o dia, então só os de 2026-10-15 aparecem com paciente, dentista, cadeira e status", () => {
    const resultado = grade("dia", {
      agendamentos: [
        agendamento({ id: "hoje", status: "em_espera" }),
        agendamento({ id: "amanha", inicio: "2026-10-16T14:00", fim: "2026-10-16T14:30" }),
      ],
    });

    expect(resultado.agendamentos).toHaveLength(1);
    expect(resultado.agendamentos[0]).toMatchObject({
      id: "hoje",
      pacienteId: "paciente-joao",
      dentistaId: "dentista-carlos",
      cadeiraId: "cadeira-1",
      status: "em_espera",
    });
  });

  it("dado dois dentistas no dia, quando filtra pelo Dr. Carlos, então esconde o agendamento e o bloqueio da Dra. Ana", () => {
    const origem = {
      agendamentos: [
        agendamento({ id: "carlos" }),
        agendamento({ id: "ana", dentistaId: "dentista-ana", cadeiraId: "cadeira-2" }),
      ],
      bloqueios: [bloqueio({ id: "b-carlos" }), bloqueio({ id: "b-ana", dentistaId: "dentista-ana" })],
    };

    const resultado = grade("dia", origem, { dentistaId: "dentista-carlos" });

    expect(resultado.agendamentos.map((item) => item.id)).toEqual(["carlos"]);
    expect(resultado.bloqueios.map((item) => item.id)).toEqual(["b-carlos"]);
  });

  it("dado duas cadeiras no dia, quando filtra pela cadeira 2, então esconde a outra cadeira e o bloqueio permanece", () => {
    const origem = {
      agendamentos: [
        agendamento({ id: "c1" }),
        agendamento({ id: "c2", cadeiraId: "cadeira-2", dentistaId: "dentista-ana" }),
      ],
      bloqueios: [bloqueio({ id: "b-carlos" })],
    };

    const resultado = grade("dia", origem, { cadeiraId: "cadeira-2" });

    expect(resultado.agendamentos.map((item) => item.id)).toEqual(["c2"]);
    expect(resultado.bloqueios.map((item) => item.id)).toEqual(["b-carlos"]);
  });

  it("dado a quinta 2026-10-15, quando vê a semana, então os dias vão de 2026-10-12 a 2026-10-18 e os itens da semana entram", () => {
    const resultado = grade("semana", {
      agendamentos: [
        agendamento({ id: "segunda", inicio: "2026-10-12T08:00", fim: "2026-10-12T08:30" }),
        agendamento({ id: "domingo", inicio: "2026-10-18T10:00", fim: "2026-10-18T10:30" }),
        agendamento({ id: "proxima", inicio: "2026-10-19T08:00", fim: "2026-10-19T08:30" }),
      ],
    });

    expect(resultado.dias).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(resultado.agendamentos.map((item) => item.id)).toEqual(["segunda", "domingo"]);
    expect(resultado).toMatchObject(EXPEDIENTE);
  });

  it("dado agendamentos de dois dentistas, quando o dentista abre a agenda sem filtro, então vê o agendamento do outro dentista da clínica", async () => {
    const { dependencias } = deps({
      agendamentos: [
        agendamento({ id: "ana", dentistaId: "dentista-ana", cadeiraId: "cadeira-2" }),
      ],
    });

    const resultado = await verAgenda(dependencias, sessao("dentista"), {
      data: DATA,
      dentistaId: null,
      cadeiraId: null,
    });

    expect(resultado.ok && resultado.valor.agendamentos.map((item) => item.id)).toEqual(["ana"]);
  });

  it("dado um agendamento cancelado no dia, quando vê a agenda, então ele permanece na lista", () => {
    const resultado = grade("dia", { agendamentos: [agendamento({ id: "x", status: "cancelado" })] });

    expect(resultado.agendamentos.map((item) => [item.id, item.status])).toEqual([
      ["x", "cancelado"],
    ]);
  });

  it("dado a cadeira inativa, quando vê a agenda, então o agendamento tem alerta sem texto", () => {
    const resultado = filtrarGrade(
      { data: DATA, dentistaId: null, cadeiraId: null, modo: "dia" },
      {
        agendamentos: [agendamento({ id: "x" })],
        bloqueios: [],
        cadeiras: [{ id: "cadeira-1", ativa: false }],
        dentistas: CONTEXTO.dentistas,
      },
      EXPEDIENTE,
    );

    expect(resultado.agendamentos[0]).toMatchObject({ alerta: true, textoAlerta: null });
  });

  it("dado o dentista inativo, quando vê a agenda, então o agendamento tem alerta sem texto", () => {
    const resultado = filtrarGrade(
      { data: DATA, dentistaId: null, cadeiraId: null, modo: "dia" },
      {
        agendamentos: [agendamento({ id: "x" })],
        bloqueios: [],
        cadeiras: CONTEXTO.cadeiras,
        dentistas: [{ id: "dentista-carlos", ativo: false }],
      },
      EXPEDIENTE,
    );

    expect(resultado.agendamentos[0]).toMatchObject({ alerta: true, textoAlerta: null });
  });

  it("dado alertaHorario ligado, quando vê a agenda, então o agendamento tem alerta com o texto fora de horário", () => {
    const resultado = grade("dia", { agendamentos: [agendamento({ id: "x", alertaHorario: true })] });

    expect(TEXTO_ALERTA_HORARIO).toBe("fora de horário");
    expect(resultado.agendamentos[0]).toMatchObject({ alerta: true, textoAlerta: "fora de horário" });
  });

  it("dado alertaCadeira ou alertaDentista ligado, quando vê a agenda, então tem alerta sem texto", () => {
    const resultado = grade("dia", {
      agendamentos: [
        agendamento({ id: "cadeira", alertaCadeira: true }),
        agendamento({ id: "dentista", alertaDentista: true, pacienteId: "paciente-maria" }),
      ],
    });

    expect(resultado.agendamentos.map((item) => [item.alerta, item.textoAlerta])).toEqual([
      [true, null],
      [true, null],
    ]);
  });

  it("dado agendamento sem alerta e com cadeira e dentista ativos, quando vê a agenda, então alerta é false", () => {
    const resultado = grade("dia", { agendamentos: [agendamento({ id: "x" })] });

    expect(resultado.agendamentos[0]).toMatchObject({ alerta: false, textoAlerta: null });
  });

  it("dado um bloqueio pontual do dentista na semana, quando vê a agenda, então ele entra na grade e a semana é lida em [segunda, segunda seguinte)", async () => {
    const { dependencias, agendamentos, bloqueios } = deps({
      bloqueios: [bloqueio({ id: "b1" })],
    });

    const resultado = await verAgenda(dependencias, sessao("recepcionista"), {
      data: DATA,
      dentistaId: null,
      cadeiraId: null,
    });

    expect(resultado.ok && resultado.valor.bloqueios.map((item) => item.id)).toEqual(["b1"]);
    expect(agendamentos).toHaveBeenCalledWith(CLINICA_ID, "2026-10-12T00:00", "2026-10-19T00:00");
    expect(bloqueios).toHaveBeenCalledWith(CLINICA_ID, "2026-10-12T00:00", "2026-10-19T00:00");
  });

  it("dado um agendamento cujo paciente é de outra clínica, quando vê a agenda, então ele não entra", async () => {
    const { dependencias } = deps({
      agendamentos: [
        agendamento({ id: "da-casa" }),
        agendamento({ id: "alheio", pacienteId: "paciente-alheio" }),
        agendamento({ id: "outra-clinica", clinicaId: OUTRA_CLINICA }),
      ],
      pacientes: [
        { id: "paciente-joao", clinicaId: CLINICA_ID },
        { id: "paciente-alheio", clinicaId: OUTRA_CLINICA },
      ],
    });

    const resultado = await verAgenda(dependencias, sessao("admin"), {
      data: DATA,
      dentistaId: null,
      cadeiraId: null,
    });

    expect(resultado.ok && resultado.valor.agendamentos.map((item) => item.id)).toEqual(["da-casa"]);
  });

  it("dado um usuário inativo, quando abre a agenda, então recebe a mensagem de papel", async () => {
    const { dependencias, agendamentos } = deps();

    const resultado = await verAgenda(dependencias, sessao("admin", false), {
      data: DATA,
      dentistaId: null,
      cadeiraId: null,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(MENSAGEM_PAPEL).toBe("Ação não permitida para seu papel");
    expect(agendamentos).not.toHaveBeenCalled();
  });

  it("dado uma clínica inexistente, quando abre a agenda, então recebe a mensagem de clínica não encontrada", async () => {
    const { dependencias } = deps({ clinicaExiste: false });

    const resultado = await verAgenda(dependencias, sessao("recepcionista"), {
      data: DATA,
      dentistaId: null,
      cadeiraId: null,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA });
  });

  it.todo(
    "Feature 006: bloqueio recorrente na grade — PENDENTE o formato da recorrência, ainda não definido",
  );
});
