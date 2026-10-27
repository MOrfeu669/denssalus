import { beforeEach, describe, expect, it } from "vitest";
import { cancelarAgendamento, criarAgendamento } from "../../src/domain/agendamento/casos";
import type { AvisoRecepcionista, Dependencias } from "../../src/domain/agendamento/portas";
import { intervalosSobrepoem, ocupaAgenda } from "../../src/domain/agendamento/regras";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  MENSAGEM_JA_CONCLUIDO,
  MENSAGEM_MOTIVO_OBRIGATORIO,
  type Agendamento,
  type ConflitoAgenda,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const DENTISTA_CARLOS = "dentista-carlos";
const CADEIRA_1 = "cadeira-1";
const INICIO = "2026-10-15T14:00";
const FIM = "2026-10-15T14:30";
const MOTIVO = "Paciente remarcou por conflito de horário";
const AGORA = new Date("2026-10-15T12:00:00.000Z");

class Memoria {
  agendamentos = new Map<string, Agendamento>();
  avisos: AvisoRecepcionista[] = [];
  salvamentos = 0;
  clinica: Clinica = {
    id: CLINICA_ID,
    nome: "Clínica OdontoSmile",
    adminId: "ator-admin",
    diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
    horarioAbertura: "08:00",
    horarioFechamento: "18:00",
  };
  proximoId = 0;

  deps(): Dependencias {
    const daClinica = (clinicaId: string) =>
      [...this.agendamentos.values()].filter((item) => item.clinicaId === clinicaId);
    return {
      avisos: {
        avisarRecepcionista: async (aviso) => {
          this.avisos.push(aviso);
        },
      },
      agendamentos: {
        listar: async (clinicaId) => daClinica(clinicaId),
        listarEntre: async (clinicaId, inicio, fim) =>
          daClinica(clinicaId).filter((item) => item.inicio < fim && item.fim > inicio),
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.salvamentos += 1;
          if (ocupaAgenda(agendamento)) {
            const conflito = this.conflito(agendamento);
            if (conflito) return conflito;
          }
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      bloqueios: { listar: async () => [], listarEntre: async () => [], salvar: async () => {} },
      clinicas: { buscarPorId: async (id) => (id === CLINICA_ID ? this.clinica : null) },
      cadeiras: {
        listar: async (clinicaId) => [
          { id: CADEIRA_1, clinicaId, identificacao: "Cadeira 1", ativa: true },
        ],
      },
      dentistas: {
        listar: async () => [],
        buscarPorId: async (id) =>
          id === DENTISTA_CARLOS
            ? {
                id,
                clinicaId: CLINICA_ID,
                usuarioId: "ator-dentista",
                nome: "Dr. Carlos",
                cro: "CRO-SP 12345",
                telefone: "11 98888-0000",
                cpf: "123.456.789-09",
                especialidades: [],
                ativo: true,
              }
            : null,
      },
      pacientes: {
        listar: async () => [],
        buscarPorId: async (id) =>
          id.startsWith("paciente-")
            ? {
                id,
                clinicaId: CLINICA_ID,
                nome: "Paciente",
                canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
                cpf: null,
                endereco: null,
                dataNascimento: null,
                sexo: null,
                responsavel: null,
              }
            : null,
      },
      procedimentos: { listar: async () => [], buscarPorId: async () => null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semear(parcial: Partial<Agendamento> & Pick<Agendamento, "id">): Agendamento {
    const agendamento: Agendamento = {
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: INICIO,
      fim: FIM,
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
    this.agendamentos.set(agendamento.id, agendamento);
    return agendamento;
  }

  private conflito(agendamento: Agendamento): ConflitoAgenda | null {
    const outros = [...this.agendamentos.values()].filter(
      (item) =>
        item.id !== agendamento.id &&
        item.clinicaId === agendamento.clinicaId &&
        ocupaAgenda(item) &&
        intervalosSobrepoem(item, agendamento),
    );
    if (outros.some((item) => item.cadeiraId === agendamento.cadeiraId)) return "cadeira";
    if (outros.some((item) => item.dentistaId === agendamento.dentistaId)) return "dentista";
    if (outros.some((item) => item.pacienteId === agendamento.pacienteId)) return "paciente";
    return null;
  }
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

describe("cancelar agendamento", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
  });

  it("dado um agendamento agendado, quando cancela com motivo, então grava cancelado com motivo, autor e data, avisa uma vez e mantém o resto da linha", async () => {
    const original = memoria.semear({ id: "ag-1", alertaHorario: true });
    const ator = sessao("recepcionista");

    const resultado = await cancelarAgendamento(memoria.deps(), ator, "ag-1", MOTIVO, AGORA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toEqual({
      ...original,
      status: "cancelado",
      motivoCancelamento: MOTIVO,
      canceladoPor: ator.usuario.id,
      canceladoEm: AGORA.toISOString(),
    });
    expect(memoria.agendamentos.get("ag-1")).toEqual(resultado.valor);
    expect(memoria.avisos).toEqual([
      { clinicaId: CLINICA_ID, agendamentoId: "ag-1", pacienteId: PACIENTE_JOAO, motivo: MOTIVO },
    ]);
  });

  it.each(["", "   "])(
    "dado um agendamento agendado, quando o motivo é %j, então bloqueia com Informe o motivo, mantém o status e não avisa",
    async (motivo) => {
      memoria.semear({ id: "ag-1" });

      const resultado = await cancelarAgendamento(
        memoria.deps(),
        sessao("recepcionista"),
        "ag-1",
        motivo,
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_MOTIVO_OBRIGATORIO });
      expect(MENSAGEM_MOTIVO_OBRIGATORIO).toBe("Informe o motivo");
      expect(memoria.agendamentos.get("ag-1")?.status).toBe("agendado");
      expect(memoria.salvamentos).toBe(0);
      expect(memoria.avisos).toEqual([]);
    },
  );

  it("dado motivo com espaços nas pontas, quando cancela, então grava e avisa o texto já trimado", async () => {
    memoria.semear({ id: "ag-1" });

    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("admin"),
      "ag-1",
      `  ${MOTIVO}  `,
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    expect(memoria.agendamentos.get("ag-1")?.motivoCancelamento).toBe(MOTIVO);
    expect(memoria.avisos[0].motivo).toBe(MOTIVO);
  });

  it("dado um agendamento cancelado às 14:00 na Cadeira 1, quando outro usuário agenda o mesmo intervalo e cadeira, então o agendamento novo é criado", async () => {
    memoria.semear({ id: "ag-1" });
    const deps = memoria.deps();

    await cancelarAgendamento(deps, sessao("recepcionista"), "ag-1", MOTIVO, AGORA);
    const novo = await criarAgendamento(deps, sessao("dentista"), {
      pacienteId: "paciente-maria",
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: INICIO,
      fim: FIM,
    });

    expect(novo.ok).toBe(true);
    if (!novo.ok) return;
    expect(novo.valor).toMatchObject({ cadeiraId: CADEIRA_1, inicio: INICIO, fim: FIM, status: "agendado" });
    expect(memoria.agendamentos.get(novo.valor.id)).toEqual(novo.valor);
  });

  it.each(["iniciado", "em_espera"] as const)(
    "dado um agendamento %s, quando cancela com motivo, então vira cancelado e avisa",
    async (status) => {
      memoria.semear({ id: "ag-1", status });

      const resultado = await cancelarAgendamento(
        memoria.deps(),
        sessao("admin"),
        "ag-1",
        MOTIVO,
        AGORA,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.agendamentos.get("ag-1")?.status).toBe("cancelado");
      expect(memoria.avisos).toHaveLength(1);
    },
  );

  it("dado um agendamento concluido, quando tenta cancelar, então bloqueia com a mensagem da spec, não grava e não avisa", async () => {
    memoria.semear({ id: "ag-1", status: "concluido" });

    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("admin"),
      "ag-1",
      MOTIVO,
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_JA_CONCLUIDO });
    expect(MENSAGEM_JA_CONCLUIDO).toBe("Agendamento já concluído não pode ser cancelado");
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("concluido");
    expect(memoria.salvamentos).toBe(0);
    expect(memoria.avisos).toEqual([]);
  });

  it("dado um agendamento já cancelado, quando tenta cancelar de novo, então devolve Agendamento não encontrado e não avisa", async () => {
    memoria.semear({ id: "ag-1", status: "cancelado", motivoCancelamento: "Primeiro motivo" });

    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("admin"),
      "ag-1",
      MOTIVO,
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    expect(memoria.agendamentos.get("ag-1")?.motivoCancelamento).toBe("Primeiro motivo");
    expect(memoria.avisos).toEqual([]);
  });

  it("dado um id inexistente, quando tenta cancelar, então devolve Agendamento não encontrado", async () => {
    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("admin"),
      "ag-inexistente",
      MOTIVO,
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    expect(memoria.avisos).toEqual([]);
  });

  it.each(["agendado", "concluido"] as const)(
    "dado um agendamento %s de outra clínica, quando tenta cancelar, então devolve Agendamento não encontrado e não muda nada",
    async (status) => {
      memoria.semear({ id: "ag-outra", clinicaId: OUTRA_CLINICA, status });

      const resultado = await cancelarAgendamento(
        memoria.deps(),
        sessao("admin"),
        "ag-outra",
        MOTIVO,
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
      expect(memoria.agendamentos.get("ag-outra")?.status).toBe(status);
      expect(memoria.avisos).toEqual([]);
    },
  );

  it("dado dois agendamentos do mesmo paciente, quando cancela os dois, então cada um gera só o seu aviso e nenhum alerta é ligado", async () => {
    memoria.semear({ id: "ag-1" });
    memoria.semear({ id: "ag-2", inicio: "2026-10-16T14:00", fim: "2026-10-16T14:30" });
    const deps = memoria.deps();
    const ator = sessao("recepcionista");

    await cancelarAgendamento(deps, ator, "ag-1", MOTIVO, AGORA);
    expect(memoria.avisos).toHaveLength(1);
    await cancelarAgendamento(deps, ator, "ag-2", "Paciente viajou", AGORA);

    expect(memoria.avisos).toEqual([
      { clinicaId: CLINICA_ID, agendamentoId: "ag-1", pacienteId: PACIENTE_JOAO, motivo: MOTIVO },
      {
        clinicaId: CLINICA_ID,
        agendamentoId: "ag-2",
        pacienteId: PACIENTE_JOAO,
        motivo: "Paciente viajou",
      },
    ]);
    for (const id of ["ag-1", "ag-2"]) {
      expect(memoria.agendamentos.get(id)).toMatchObject({
        alertaCadeira: false,
        alertaHorario: false,
        alertaDentista: false,
      });
    }
  });

  it.each(["recepcionista", "dentista", "admin"] as const)(
    "dado um usuário %s ativo, quando cancela, então o agendamento fica cancelado",
    async (papel) => {
      memoria.semear({ id: "ag-1" });

      const resultado = await cancelarAgendamento(
        memoria.deps(),
        sessao(papel),
        "ag-1",
        MOTIVO,
        AGORA,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.agendamentos.get("ag-1")).toMatchObject({
        status: "cancelado",
        canceladoPor: `ator-${papel}`,
      });
    },
  );

  it("dado um usuário inativo, quando tenta cancelar, então recebe Ação não permitida para seu papel e o status não muda", async () => {
    memoria.semear({ id: "ag-1" });

    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("admin", false),
      "ag-1",
      MOTIVO,
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("agendado");
    expect(memoria.salvamentos).toBe(0);
    expect(memoria.avisos).toEqual([]);
  });

  it("dado um horário no passado em relação ao relógio, quando cancela, então o cancelamento não é bloqueado", async () => {
    memoria.semear({ id: "ag-1", inicio: "2026-01-05T14:00", fim: "2026-01-05T14:30" });

    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("recepcionista"),
      "ag-1",
      MOTIVO,
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("cancelado");
  });

  it.todo("Feature 011: dado registro confirmado no odontograma, quando cancela, então exige confirmação extra e marca o registro como revertido");
  it.todo("Feature 010: dado um cancelamento, quando vê o histórico de consultas do paciente, então o cancelamento aparece");
  it.todo("Feature 009: dado um cancelamento confirmado, quando o sistema pergunta Deseja reagendar?, então o retorno programado é tratado");
  it.todo("Feature 018: dado um cancelamento, quando a caixa de notificações existir, então ela substitui avisos_recepcao");
});
