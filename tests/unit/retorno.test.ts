import { beforeEach, describe, expect, it } from "vitest";
import { criarAgendamento } from "../../src/domain/agendamento/casos";
import type {
  AvisoRecepcionista,
  Dependencias as DependenciasAgenda,
} from "../../src/domain/agendamento/portas";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  type Agendamento,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import type { Paciente } from "../../src/domain/paciente/tipos";
import {
  configurarPrazo,
  listarRetornosPendentes,
  marcarRetorno,
  obterPrazo,
  reagendarPorNovoAgendamento,
  removerRetorno,
  verificarRetornos,
} from "../../src/domain/retorno/casos";
import type { Dependencias } from "../../src/domain/retorno/portas";
import { dataFutura, dataIso, dentroDoPrazo, somarDias } from "../../src/domain/retorno/regras";
import {
  MENSAGEM_DATA_FUTURA,
  MENSAGEM_JA_TEM_RETORNO,
  MENSAGEM_PRAZO,
  MENSAGEM_RETORNO_IMUTAVEL,
  PRAZO_PADRAO,
  type ConfiguracaoRetorno,
  type Retorno,
} from "../../src/domain/retorno/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const DENTISTA_CARLOS = "dentista-carlos";
const CADEIRA_1 = "cadeira-1";
const CONSULTA = "consulta-001";
const PREVISTA = "2026-12-01";
const HOJE = new Date(2026, 10, 20);

class Memoria {
  agendamentos = new Map<string, Agendamento>();
  pacientes = new Map<string, Paciente>();
  retornos = new Map<string, Retorno>();
  configuracoes = new Map<string, ConfiguracaoRetorno>();
  avisos: AvisoRecepcionista[] = [];
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
    return {
      retornos: {
        listar: async (clinicaId) =>
          [...this.retornos.values()].filter((item) => item.clinicaId === clinicaId),
        listarPorStatus: async (status) =>
          [...this.retornos.values()].filter((item) => item.status === status),
        buscarPorAgendamentoOrigem: async (id) =>
          [...this.retornos.values()].find((item) => item.agendamentoOrigemId === id) ?? null,
        salvar: async (retorno) => {
          this.retornos.set(retorno.id, retorno);
        },
      },
      configuracoes: {
        buscar: async (clinicaId) => this.configuracoes.get(clinicaId) ?? null,
        salvar: async (config) => {
          this.configuracoes.set(config.clinicaId, config);
        },
      },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      avisos: {
        avisarRecepcionista: async (aviso) => {
          this.avisos.push(aviso);
        },
      },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  depsAgenda(): DependenciasAgenda {
    const daClinica = <T extends { clinicaId: string }>(mapa: Map<string, T>, clinicaId: string) =>
      [...mapa.values()].filter((item) => item.clinicaId === clinicaId);
    const retornos = this.deps();
    return {
      avisos: retornos.avisos,
      retornos: {
        concluirPendentes: (clinicaId, pacienteId) =>
          reagendarPorNovoAgendamento(retornos, clinicaId, pacienteId),
      },
      agendamentos: {
        listar: async (clinicaId) => daClinica(this.agendamentos, clinicaId),
        listarEntre: async (clinicaId, inicio, fim) =>
          daClinica(this.agendamentos, clinicaId).filter(
            (item) => item.inicio < fim && item.fim > inicio,
          ),
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
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
        buscarPorId: async (id) => this.pacientes.get(id) ?? null,
      },
      procedimentos: { listar: async () => [], buscarPorId: async () => null },
      ids: retornos.ids,
    };
  }

  semearConsulta(parcial: Partial<Agendamento> = {}): Agendamento {
    const agendamento: Agendamento = {
      id: CONSULTA,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: "2026-10-15T14:00",
      fim: "2026-10-15T14:30",
      status: "concluido",
      iniciadoPor: "ator-dentista",
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

  semearRetorno(parcial: Partial<Retorno> = {}): Retorno {
    const retorno: Retorno = {
      id: "retorno-001",
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      agendamentoOrigemId: CONSULTA,
      marcadoPor: "ator-dentista",
      dataPrevista: PREVISTA,
      status: "pendente",
      ...parcial,
    };
    this.retornos.set(retorno.id, retorno);
    return retorno;
  }
}

function sessao(papel: Papel, ativo = true, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId,
      ativo,
    },
  };
}

function paciente(id: string, nome: string, clinicaId = CLINICA_ID): Paciente {
  return {
    id,
    clinicaId,
    nome,
    canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
  };
}

describe("retorno programado", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, "João"));
    memoria.semearConsulta();
  });

  it("dado uma consulta concluída, quando o dentista marca retorno, então grava pendente com paciente, dentista, origem e marcadoPor", async () => {
    const resultado = await marcarRetorno(
      memoria.deps(),
      sessao("dentista"),
      { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
      HOJE,
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toMatchObject({
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      agendamentoOrigemId: CONSULTA,
      marcadoPor: "ator-dentista",
      dataPrevista: PREVISTA,
      status: "pendente",
    });
    expect(memoria.retornos.get(resultado.valor.id)).toEqual(resultado.valor);
  });

  it("dado o admin, quando marca retorno, então grava", async () => {
    const resultado = await marcarRetorno(
      memoria.deps(),
      sessao("admin"),
      { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
      HOJE,
    );
    expect(resultado.ok).toBe(true);
  });

  it("dado uma recepcionista, quando marca retorno, então recebe bloqueio de papel e nada grava", async () => {
    const resultado = await marcarRetorno(
      memoria.deps(),
      sessao("recepcionista"),
      { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
      HOJE,
    );
    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.retornos.size).toBe(0);
  });

  it("dado um dentista inativo, quando marca retorno, então recebe bloqueio de papel", async () => {
    const resultado = await marcarRetorno(
      memoria.deps(),
      sessao("dentista", false),
      { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
      HOJE,
    );
    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it.each(["2026-11-20", "2026-11-19", "01/12/2026", "2026-02-31", ""])(
    "dado a data %s, quando marca retorno, então devolve Informe uma data futura",
    async (dataPrevista) => {
      const resultado = await marcarRetorno(
        memoria.deps(),
        sessao("dentista"),
        { agendamentoOrigemId: CONSULTA, dataPrevista },
        HOJE,
      );
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DATA_FUTURA });
      expect(memoria.retornos.size).toBe(0);
    },
  );

  it.each(["agendado", "em_espera", "iniciado", "cancelado"] as const)(
    "dado uma consulta %s, quando marca retorno, então devolve Agendamento não encontrado",
    async (status) => {
      memoria.semearConsulta({ status });
      const resultado = await marcarRetorno(
        memoria.deps(),
        sessao("dentista"),
        { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
        HOJE,
      );
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    },
  );

  it("dado uma consulta de outra clínica, quando marca retorno, então devolve Agendamento não encontrado", async () => {
    memoria.semearConsulta({ clinicaId: OUTRA_CLINICA });
    const resultado = await marcarRetorno(
      memoria.deps(),
      sessao("dentista"),
      { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA },
      HOJE,
    );
    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    expect(memoria.retornos.size).toBe(0);
  });

  it("dado um retorno já marcado, quando marca de novo na mesma consulta, então devolve Esta consulta já tem retorno e continua uma linha", async () => {
    const entrada = { agendamentoOrigemId: CONSULTA, dataPrevista: PREVISTA };
    await marcarRetorno(memoria.deps(), sessao("dentista"), entrada, HOJE);

    const segundo = await marcarRetorno(memoria.deps(), sessao("admin"), entrada, HOJE);

    expect(segundo).toEqual({ ok: false, mensagem: MENSAGEM_JA_TEM_RETORNO });
    expect(memoria.retornos.size).toBe(1);
  });

  it("dado um retorno programado, quando tenta remover, então devolve Retorno programado não pode ser removido e a linha continua", async () => {
    const retorno = memoria.semearRetorno();

    const resultado = await removerRetorno();

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_RETORNO_IMUTAVEL });
    expect(memoria.retornos.get(retorno.id)).toEqual(retorno);
  });
});

describe("regras de data do retorno", () => {
  it("dado um Date local, quando formata, então usa o dia local", () => {
    expect(dataIso(new Date(2026, 10, 24, 23, 59))).toBe("2026-11-24");
  });

  it("dado 2026-12-01, quando subtrai 7 dias, então vira 2026-11-24", () => {
    expect(somarDias("2026-12-01", -7)).toBe("2026-11-24");
  });

  it("dado a data de hoje, quando confere se é futura, então não é", () => {
    expect(dataFutura("2026-11-20", HOJE)).toBe(false);
    expect(dataFutura("2026-11-21", HOJE)).toBe(true);
  });

  it("dado prazo 7, quando hoje é 24/11, então está dentro do prazo e 23/11 não", () => {
    expect(dentroDoPrazo(PREVISTA, 7, new Date(2026, 10, 24))).toBe(true);
    expect(dentroDoPrazo(PREVISTA, 7, new Date(2026, 10, 23))).toBe(false);
  });
});

describe("verificar retornos", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, "João"));
    memoria.semearConsulta();
  });

  it("dado prazo 7 e retorno para 2026-12-01, quando roda em 2026-11-24, então avisa a recepcionista e vira notificado", async () => {
    const retorno = memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 24));

    expect(memoria.avisos).toEqual([
      {
        clinicaId: CLINICA_ID,
        agendamentoId: CONSULTA,
        pacienteId: PACIENTE_JOAO,
        motivo: "Paciente João precisa ser reagendado",
      },
    ]);
    expect(memoria.retornos.get(retorno.id)?.status).toBe("notificado");
  });

  it("dado prazo 7, quando roda em 2026-11-23, então não avisa e continua pendente", async () => {
    const retorno = memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 23));

    expect(memoria.avisos).toEqual([]);
    expect(memoria.retornos.get(retorno.id)?.status).toBe("pendente");
  });

  it("dado que a rotina não rodou em 24/11, quando roda em 2026-11-26 com o retorno ainda pendente, então avisa", async () => {
    const retorno = memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 26));

    expect(memoria.avisos).toHaveLength(1);
    expect(memoria.retornos.get(retorno.id)?.status).toBe("notificado");
  });

  it("dado um retorno já notificado, quando a rotina roda de novo no mesmo dia, então não cria outro aviso", async () => {
    memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 24));
    await verificarRetornos(memoria.deps(), new Date(2026, 10, 24));

    expect(memoria.avisos).toHaveLength(1);
  });

  it("dado um paciente sem nome, quando a rotina roda no prazo, então não avisa e deixa pendente", async () => {
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, ""));
    const retorno = memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 24));

    expect(memoria.avisos).toEqual([]);
    expect(memoria.retornos.get(retorno.id)?.status).toBe("pendente");
  });

  it("dado prazo 3 salvo pela clínica, quando roda em 2026-11-24, então não avisa; em 2026-11-28 avisa", async () => {
    memoria.configuracoes.set(CLINICA_ID, { clinicaId: CLINICA_ID, diasAntecedencia: 3 });
    memoria.semearRetorno();

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 24));
    expect(memoria.avisos).toEqual([]);

    await verificarRetornos(memoria.deps(), new Date(2026, 10, 28));
    expect(memoria.avisos).toHaveLength(1);
  });

  it("dado uma clínica sem configuração salva, quando obtém o prazo, então usa 7", async () => {
    expect(await obterPrazo(memoria.deps(), CLINICA_ID)).toBe(PRAZO_PADRAO);
    expect(PRAZO_PADRAO).toBe(7);
  });
});

describe("configurar prazo", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
  });

  it("dado o admin, quando configura 10 dias, então salva e obterPrazo devolve 10", async () => {
    const resultado = await configurarPrazo(memoria.deps(), sessao("admin"), 10);

    expect(resultado).toEqual({
      ok: true,
      valor: { clinicaId: CLINICA_ID, diasAntecedencia: 10 },
    });
    expect(await obterPrazo(memoria.deps(), CLINICA_ID)).toBe(10);
  });

  it.each(["dentista", "recepcionista"] as const)(
    "dado um %s, quando configura o prazo, então recebe bloqueio de papel",
    async (papel) => {
      const resultado = await configurarPrazo(memoria.deps(), sessao(papel), 10);
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.configuracoes.size).toBe(0);
    },
  );

  it.each([0, -3, 2.5, Number.NaN])(
    "dado o prazo %s, quando o admin configura, então devolve Informe o prazo",
    async (dias) => {
      const resultado = await configurarPrazo(memoria.deps(), sessao("admin"), dias);
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PRAZO });
      expect(memoria.configuracoes.size).toBe(0);
    },
  );

  it("dado o admin, quando configura o prazo, então o objeto Clinica não muda", async () => {
    const antes = structuredClone(memoria.clinica);
    await configurarPrazo(memoria.deps(), sessao("admin"), 10);
    expect(memoria.clinica).toEqual(antes);
  });
});

describe("listar retornos pendentes", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, "João"));
    memoria.semearConsulta();
  });

  it("dado um retorno notificado sem agendamento novo, quando a recepcionista lista, então ele continua com o texto do aviso", async () => {
    memoria.semearRetorno({ status: "notificado" });

    const resultado = await listarRetornosPendentes(memoria.deps(), sessao("recepcionista"));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toHaveLength(1);
    expect(resultado.valor[0]).toMatchObject({
      status: "notificado",
      texto: "Paciente João precisa ser reagendado",
    });
  });

  it("dado um retorno de outra clínica, quando lista, então ele não aparece", async () => {
    memoria.semearRetorno({ clinicaId: OUTRA_CLINICA, status: "notificado" });

    const resultado = await listarRetornosPendentes(memoria.deps(), sessao("recepcionista"));

    expect(resultado).toEqual({ ok: true, valor: [] });
  });

  it("dado um usuário inativo, quando lista, então recebe bloqueio de papel", async () => {
    const resultado = await listarRetornosPendentes(memoria.deps(), sessao("admin", false));
    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado um retorno notificado, quando o paciente ganha agendamento novo, então vira reagendado, sai da lista e nada é avisado", async () => {
    const retorno = memoria.semearRetorno({ status: "notificado" });
    memoria.avisos.length = 0;

    const novo = await criarAgendamento(memoria.depsAgenda(), sessao("recepcionista"), {
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: "2026-12-02T14:00",
      fim: "2026-12-02T14:30",
    });

    expect(novo.ok).toBe(true);
    expect(memoria.retornos.get(retorno.id)?.status).toBe("reagendado");
    const lista = await listarRetornosPendentes(memoria.deps(), sessao("recepcionista"));
    expect(lista).toEqual({ ok: true, valor: [] });
    expect(memoria.avisos).toEqual([]);
  });

  it("dado um retorno de outro paciente, quando um paciente ganha agendamento novo, então o outro retorno continua", async () => {
    memoria.pacientes.set("paciente-maria", paciente("paciente-maria", "Maria"));
    const retorno = memoria.semearRetorno({ pacienteId: "paciente-maria", status: "pendente" });

    await criarAgendamento(memoria.depsAgenda(), sessao("recepcionista"), {
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: null,
      inicio: "2026-12-02T14:00",
      fim: "2026-12-02T14:30",
    });

    expect(memoria.retornos.get(retorno.id)?.status).toBe("pendente");
  });

  it.todo("Feature 018: a caixa de notificações substitui esta lista de retornos");
  it.todo("Feature 020: confirmar que não há mensagem ao paciente sobre o retorno");
});
