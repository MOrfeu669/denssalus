import { beforeEach, describe, expect, it } from "vitest";
import { caminhoDeReagendar, respostaReagendar } from "../../src/app/agendamentos/cancelar";
import { PERGUNTA_REAGENDAR } from "../../src/app/agendamentos/texto";
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
import { listarVisiveis } from "../../src/domain/notificacao/casos";
import { MENSAGEM_CANCELAMENTO_COMUNICAR } from "../../src/domain/notificacao/regras";
import { reverterDoAgendamento } from "../../src/domain/odontograma/casos";
import type { Dependencias as DependenciasOdontograma } from "../../src/domain/odontograma/portas";
import {
  MENSAGEM_REGISTROS_CONFIRMADOS,
  type RegistroOdontograma,
} from "../../src/domain/odontograma/tipos";
import { abrirProntuario } from "../../src/domain/prontuario/casos";
import type { Dependencias as DependenciasProntuario } from "../../src/domain/prontuario/portas";
import { NotificacoesMemoria, notificacoesVazias } from "./apoio-notificacao";

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
      notificacoes: notificacoesVazias(),
      retornos: { concluirPendentes: async () => {} },
      reverterDoAgendamento: async () => ({ ok: true, valor: undefined }),
      notificarAgendamentoCriado: async () => {},
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
      concluidoEm: null,
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

    const resultado = await cancelarAgendamento(memoria.deps(), ator, "ag-1", MOTIVO, AGORA, false);

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
        false,
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
      false,
    );

    expect(resultado.ok).toBe(true);
    expect(memoria.agendamentos.get("ag-1")?.motivoCancelamento).toBe(MOTIVO);
    expect(memoria.avisos[0].motivo).toBe(MOTIVO);
  });

  it("dado um agendamento cancelado às 14:00 na Cadeira 1, quando outro usuário agenda o mesmo intervalo e cadeira, então o agendamento novo é criado", async () => {
    memoria.semear({ id: "ag-1" });
    const deps = memoria.deps();

    await cancelarAgendamento(deps, sessao("recepcionista"), "ag-1", MOTIVO, AGORA, false);
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
        false,
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
      false,
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
      false,
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
      false,
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
        false,
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

    await cancelarAgendamento(deps, ator, "ag-1", MOTIVO, AGORA, false);
    expect(memoria.avisos).toHaveLength(1);
    await cancelarAgendamento(deps, ator, "ag-2", "Paciente viajou", AGORA, false);

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
        false,
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
      false,
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
      false,
    );

    expect(resultado.ok).toBe(true);
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("cancelado");
  });

  it("dado registro confirmado no odontograma, quando cancela sem confirmação extra, então bloqueia; com a confirmação, marca o registro como revertido", async () => {
    memoria.semear({ id: "ag-1", status: "iniciado" });
    const registros: RegistroOdontograma[] = [
      {
        id: "reg-1",
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_JOAO,
        dente: 26,
        quadrante: "superior_esquerdo",
        procedimentoId: "proc-1",
        origem: "atendimento",
        agendamentoId: "ag-1",
        status: "confirmado",
        registradoPor: "ator-dentista",
        registradoEm: AGORA.toISOString(),
      },
    ];
    const deps = memoria.deps();
    deps.reverterDoAgendamento = (clinicaId, agendamentoId, confirmouReversao) =>
      reverterDoAgendamento(depsOdontograma(registros), clinicaId, agendamentoId, confirmouReversao);

    const bloqueado = await cancelarAgendamento(deps, sessao("dentista"), "ag-1", MOTIVO, AGORA, false);

    expect(bloqueado).toEqual({ ok: false, mensagem: MENSAGEM_REGISTROS_CONFIRMADOS });
    expect(registros[0].status).toBe("confirmado");
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("iniciado");

    const confirmado = await cancelarAgendamento(deps, sessao("dentista"), "ag-1", MOTIVO, AGORA, true);

    expect(confirmado.ok).toBe(true);
    expect(registros[0].status).toBe("revertido");
    expect(memoria.agendamentos.get("ag-1")?.status).toBe("cancelado");
  });

  it("dado um cancelamento, quando abre o prontuário, então o histórico mostra a consulta cancelada com a data", async () => {
    memoria.semear({ id: "ag-1" });
    const deps = memoria.deps();
    const cancelado = await cancelarAgendamento(deps, sessao("recepcionista"), "ag-1", MOTIVO, AGORA, false);
    expect(cancelado.ok).toBe(true);

    const aberto = await abrirProntuario(depsProntuario(deps), sessao("recepcionista"), PACIENTE_JOAO);

    expect(aberto.ok).toBe(true);
    if (!aberto.ok) return;
    expect(aberto.valor.historico.map((item) => [item.id, item.status, item.inicio])).toEqual([
      ["ag-1", "cancelado", INICIO],
    ]);
  });

  it("dado um cancelamento confirmado, quando responde Sim, então reabre o agendamento com paciente, dentista e procedimento; Não não cria consulta", async () => {
    memoria.semear({ id: "ag-1", procedimentoId: "proc-limpeza" });
    const resultado = await cancelarAgendamento(
      memoria.deps(),
      sessao("recepcionista"),
      "ag-1",
      MOTIVO,
      AGORA,
      false,
    );
    expect(PERGUNTA_REAGENDAR).toBe("Deseja reagendar?");
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const caminho = respostaReagendar(resultado.valor, "sim");
    expect(caminho).toBe(caminhoDeReagendar(resultado.valor));
    const params = new URL(caminho ?? "", "http://localhost").searchParams;
    expect(params.get("paciente")).toBe(PACIENTE_JOAO);
    expect(params.get("dentista")).toBe(DENTISTA_CARLOS);
    expect(params.get("procedimento")).toBe("proc-limpeza");
    expect(respostaReagendar(resultado.valor, "nao")).toBeNull();
  });

  it("dado o retorno ainda pendente, quando o novo agendamento do paciente é criado, então o retorno pendente é concluído", async () => {
    memoria.semear({ id: "ag-1" });
    const deps = memoria.deps();
    await cancelarAgendamento(deps, sessao("recepcionista"), "ag-1", MOTIVO, AGORA, false);
    const chamadas: string[] = [];
    deps.retornos = {
      concluirPendentes: async (clinicaId, pacienteId) => {
        chamadas.push(`${clinicaId}:${pacienteId}`);
      },
    };

    const novo = await criarAgendamento(deps, sessao("recepcionista"), {
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: INICIO,
      fim: FIM,
    });

    expect(novo.ok).toBe(true);
    expect(chamadas).toEqual([`${CLINICA_ID}:${PACIENTE_JOAO}`]);
  });

  it("dado um cancelamento e uma recepcionista na clínica, quando a caixa de notificações lista, então ela vê o aviso de comunicar o paciente", async () => {
    memoria.semear({ id: "ag-1" });
    const caixa = new NotificacoesMemoria();
    caixa.usuarios = [{ id: "recep-1", papel: "recepcionista", ativo: true }];
    const deps = memoria.deps();
    deps.notificacoes = caixa.deps();

    const resultado = await cancelarAgendamento(deps, sessao("admin"), "ag-1", MOTIVO, AGORA, false);
    const visiveis = await listarVisiveis(caixa.deps(), CLINICA_ID, "recep-1");

    expect(resultado.ok).toBe(true);
    expect(visiveis.map((item) => [item.tipo, item.mensagem])).toEqual([
      ["cancelamento_comunicar", MENSAGEM_CANCELAMENTO_COMUNICAR],
    ]);
  });
});

function depsOdontograma(lista: RegistroOdontograma[]): DependenciasOdontograma {
  return {
    registros: {
      listarPorPaciente: async (clinicaId) => lista.filter((item) => item.clinicaId === clinicaId),
      listarPorAgendamento: async (clinicaId, agendamentoId) =>
        lista.filter((item) => item.clinicaId === clinicaId && item.agendamentoId === agendamentoId),
      buscarPorId: async (id) => lista.find((item) => item.id === id) ?? null,
      salvar: async (registro) => {
        const indice = lista.findIndex((item) => item.id === registro.id);
        if (indice >= 0) lista[indice] = registro;
      },
    },
    auditoria: { registrar: async () => {}, listar: async () => [] },
    pacientes: { buscarPorId: async () => null },
    procedimentos: { buscarPorId: async () => null },
    agendamentos: { buscarPorId: async () => null },
    ids: { novo: () => "odo-id" },
  };
}

function depsProntuario(
  agenda: Pick<Dependencias, "agendamentos" | "pacientes">,
): DependenciasProntuario {
  return {
    anamneses: { buscar: async () => null, salvar: async () => {} },
    evolucoes: { buscar: async () => null, listar: async () => [], salvar: async () => {} },
    auditoria: { registrar: async () => {}, listar: async () => [] },
    estoque: { baixar: async () => {} },
    concluirItensDoAgendamento: async () => {},
    gerarDebitosDoAtendimento: async () => {},
    agendamentos: agenda.agendamentos,
    pacientes: agenda.pacientes,
    ids: { novo: () => "pront-id" },
  };
}
