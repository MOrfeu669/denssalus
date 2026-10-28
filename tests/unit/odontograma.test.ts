import { beforeEach, describe, expect, it } from "vitest";
import { cancelarAgendamento } from "../../src/domain/agendamento/casos";
import type { Dependencias as DependenciasAgenda } from "../../src/domain/agendamento/portas";
import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO, type Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import {
  MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO,
  type Procedimento,
} from "../../src/domain/procedimento/tipos";
import type { RegistroAuditoria } from "../../src/domain/prontuario/tipos";
import {
  editarRegistro,
  historicoDoDente,
  listarOdontograma,
  registrarNoDente,
  registrarPreExistente,
  reverterDoAgendamento,
} from "../../src/domain/odontograma/casos";
import type { Dependencias } from "../../src/domain/odontograma/portas";
import { fileiras, ladoDaTela, quadranteDe } from "../../src/domain/odontograma/regras";
import {
  MENSAGEM_DENTE_INVALIDO,
  MENSAGEM_REGISTROS_CONFIRMADOS,
  type RegistroOdontograma,
} from "../../src/domain/odontograma/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const CONSULTA = "consulta-001";
const RESTAURACAO = "proc-restauracao";
const LIMPEZA = "proc-limpeza";
const AGORA = new Date("2026-10-27T15:00:00.000Z");
const DEPOIS = new Date("2026-10-27T16:30:00.000Z");
const MOTIVO = "Paciente remarcou";

class Memoria {
  registros = new Map<string, RegistroOdontograma>();
  auditoria: RegistroAuditoria[] = [];
  agendamentos = new Map<string, Agendamento>();
  pacientes = new Map<string, Paciente>();
  procedimentos = new Map<string, Procedimento>();
  baixas = 0;
  debitos = 0;
  proximoId = 0;

  deps(): Dependencias {
    return {
      registros: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.registros.values()].filter(
            (r) => r.clinicaId === clinicaId && r.pacienteId === pacienteId,
          ),
        listarPorAgendamento: async (clinicaId, agendamentoId) =>
          [...this.registros.values()].filter(
            (r) => r.clinicaId === clinicaId && r.agendamentoId === agendamentoId,
          ),
        buscarPorId: async (id) => this.registros.get(id) ?? null,
        salvar: async (registro) => {
          this.registros.set(registro.id, registro);
        },
      },
      auditoria: {
        registrar: async (registro) => {
          this.auditoria.push(registro);
        },
        listar: async (clinicaId) => this.auditoria.filter((r) => r.clinicaId === clinicaId),
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      procedimentos: { buscarPorId: async (id) => this.procedimentos.get(id) ?? null },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  depsAgenda(): DependenciasAgenda {
    const parcial = {
      avisos: { avisarRecepcionista: async () => {} },
      clinicas: {
        buscarPorId: async (id) => ({ id, nome: "Clínica", adminId: "ator-admin" }) as Clinica,
      },
      agendamentos: {
        listar: async () => [],
        listarEntre: async () => [],
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      reverterDoAgendamento: (clinicaId, agendamentoId, confirmou) =>
        reverterDoAgendamento(this.deps(), clinicaId, agendamentoId, confirmou),
    } satisfies Partial<DependenciasAgenda>;
    return parcial as unknown as DependenciasAgenda;
  }

  semearConsulta(): Agendamento {
    const agendamento = {
      id: CONSULTA,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      status: "iniciado",
      motivoCancelamento: null,
      canceladoPor: null,
      canceladoEm: null,
    } as Agendamento;
    this.agendamentos.set(agendamento.id, agendamento);
    return agendamento;
  }
}

function sessao(papel: Papel, ativo = true, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: { id: `ator-${papel}`, nome: "Ator", email: `${papel}@clinica.com`, papel, clinicaId, ativo },
  };
}

function entradaNoDente(dente: number) {
  return { pacienteId: PACIENTE_JOAO, dente, procedimentoId: RESTAURACAO, agendamentoId: CONSULTA };
}

describe("odontograma", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, {
      id: PACIENTE_JOAO,
      clinicaId: CLINICA_ID,
      nome: "João",
      canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
      cpf: null,
      endereco: null,
      dataNascimento: null,
      sexo: null,
      responsavel: null,
    });
    for (const [id, nome] of [[RESTAURACAO, "Restauração"], [LIMPEZA, "Limpeza"]]) {
      memoria.procedimentos.set(id, { id, clinicaId: CLINICA_ID, nome, tempoMedioMinutos: 30, valorMedio: 150 });
    }
    memoria.semearConsulta();
  });

  it("dado o dente 26 e Restauração, quando o dentista registra, então grava no quadrante superior_esquerdo, confirmado e de atendimento", async () => {
    const resultado = await registrarNoDente(memoria.deps(), sessao("dentista"), entradaNoDente(26), AGORA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toMatchObject({
      clinicaId: CLINICA_ID,
      dente: 26,
      quadrante: "superior_esquerdo",
      procedimentoId: RESTAURACAO,
      origem: "atendimento",
      agendamentoId: CONSULTA,
      status: "confirmado",
      registradoPor: "ator-dentista",
      registradoEm: AGORA.toISOString(),
    });
    expect(memoria.registros.get(resultado.valor.id)).toEqual(resultado.valor);
  });

  it("dado um registro no dente, quando salva, então não há baixa de estoque nem débito", async () => {
    const deps = memoria.deps();
    const extras = deps as unknown as Record<string, unknown>;
    expect(extras.estoque).toBeUndefined();
    expect(extras.debitos).toBeUndefined();

    await registrarNoDente(deps, sessao("admin"), entradaNoDente(26), AGORA);

    expect(memoria.baixas).toBe(0);
    expect(memoria.debitos).toBe(0);
  });

  it("dado o dente 11, quando registra pré-existente, então grava sem agendamento", async () => {
    const resultado = await registrarPreExistente(
      memoria.deps(),
      sessao("dentista"),
      { pacienteId: PACIENTE_JOAO, dente: 11, procedimentoId: RESTAURACAO },
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toMatchObject({
      quadrante: "superior_direito",
      origem: "pre_existente",
      agendamentoId: null,
      status: "confirmado",
    });
  });

  it("dado registros e um revertido no dente 26, quando vê o histórico, então volta do mais antigo ao mais novo com o revertido junto", async () => {
    const deps = memoria.deps();
    const ator = sessao("dentista");
    const primeiro = await registrarNoDente(deps, ator, entradaNoDente(26), AGORA);
    await registrarNoDente(deps, ator, entradaNoDente(11), AGORA);
    await registrarNoDente(deps, ator, entradaNoDente(26), DEPOIS);
    if (!primeiro.ok) throw new Error("semente");
    memoria.registros.set(primeiro.valor.id, { ...primeiro.valor, status: "revertido" });

    const resultado = await historicoDoDente(deps, sessao("recepcionista"), PACIENTE_JOAO, 26);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.map((r) => [r.dente, r.registradoEm, r.status])).toEqual([
      [26, AGORA.toISOString(), "revertido"],
      [26, DEPOIS.toISOString(), "confirmado"],
    ]);
    const todos = await listarOdontograma(deps, sessao("recepcionista"), PACIENTE_JOAO);
    expect(todos.ok && todos.valor).toHaveLength(3);
  });

  it("dado um registro, quando o admin edita o procedimento, então grava no mesmo id e audita com conteúdo anterior, autor e instante", async () => {
    const deps = memoria.deps();
    const criado = await registrarNoDente(deps, sessao("dentista"), entradaNoDente(26), AGORA);
    if (!criado.ok) throw new Error("semente");

    const resultado = await editarRegistro(
      deps,
      sessao("admin"),
      { registroId: criado.valor.id, procedimentoId: LIMPEZA },
      DEPOIS,
    );

    expect(resultado).toEqual({ ok: true, valor: { ...criado.valor, procedimentoId: LIMPEZA } });
    expect(memoria.registros.get(criado.valor.id)?.procedimentoId).toBe(LIMPEZA);
    expect(memoria.auditoria).toEqual([
      {
        id: expect.any(String),
        clinicaId: CLINICA_ID,
        entidade: "odontograma",
        entidadeId: criado.valor.id,
        usuarioId: "ator-admin",
        acao: "edicao",
        conteudoAnterior: JSON.stringify(criado.valor),
        registradoEm: DEPOIS.toISOString(),
      },
    ]);
  });

  describe("cancelar agendamento com registro confirmado", () => {
    async function semearRegistro() {
      const criado = await registrarNoDente(memoria.deps(), sessao("dentista"), entradaNoDente(26), AGORA);
      if (!criado.ok) throw new Error("semente");
      return criado.valor;
    }

    it("dado registro confirmado, quando cancela sem o flag, então o agendamento e o registro não mudam", async () => {
      const registro = await semearRegistro();
      const antes = memoria.agendamentos.get(CONSULTA);

      const resultado = await cancelarAgendamento(
        memoria.depsAgenda(), sessao("recepcionista"), CONSULTA, MOTIVO, AGORA, false,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_REGISTROS_CONFIRMADOS });
      expect(memoria.agendamentos.get(CONSULTA)).toEqual(antes);
      expect(memoria.registros.get(registro.id)?.status).toBe("confirmado");
    });

    it("dado registro confirmado, quando cancela com o flag, então o registro fica revertido no mesmo id e o agendamento cancelado", async () => {
      const registro = await semearRegistro();

      const resultado = await cancelarAgendamento(
        memoria.depsAgenda(), sessao("recepcionista"), CONSULTA, MOTIVO, AGORA, true,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.agendamentos.get(CONSULTA)?.status).toBe("cancelado");
      expect(memoria.registros.get(registro.id)).toEqual({ ...registro, status: "revertido" });
      expect(memoria.registros.size).toBe(1);
    });

    it("dado agendamento sem registro, quando cancela sem o flag, então cancela e não escreve registro", async () => {
      const resultado = await cancelarAgendamento(
        memoria.depsAgenda(), sessao("admin"), CONSULTA, MOTIVO, AGORA, false,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.registros.size).toBe(0);
    });
  });

  it("dado um recepcionista, quando tenta registrar, editar ou registrar pré-existente, então recebe Ação não permitida para seu papel", async () => {
    const deps = memoria.deps();
    const ator = sessao("recepcionista");

    const no = await registrarNoDente(deps, ator, entradaNoDente(26), AGORA);
    const pre = await registrarPreExistente(
      deps, ator, { pacienteId: PACIENTE_JOAO, dente: 11, procedimentoId: RESTAURACAO }, AGORA,
    );
    const edicao = await editarRegistro(deps, ator, { registroId: "x", procedimentoId: LIMPEZA }, AGORA);

    for (const r of [no, pre, edicao]) expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.registros.size).toBe(0);
  });

  it("dado o dente 19, quando registra, então devolve Dente inválido e não grava", async () => {
    const resultado = await registrarNoDente(memoria.deps(), sessao("dentista"), entradaNoDente(19), AGORA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
    expect(MENSAGEM_DENTE_INVALIDO).toBe("Dente inválido");
    expect(memoria.registros.size).toBe(0);
  });

  it("dado procedimento ou agendamento de outra clínica ou de outro paciente, quando registra, então bloqueia com a mensagem própria", async () => {
    memoria.procedimentos.set("proc-alheio", {
      id: "proc-alheio", clinicaId: OUTRA_CLINICA, nome: "X", tempoMedioMinutos: 10, valorMedio: 1,
    });
    memoria.agendamentos.set("ag-outro-paciente", {
      ...memoria.agendamentos.get(CONSULTA)!, id: "ag-outro-paciente", pacienteId: "paciente-maria",
    });
    const deps = memoria.deps();
    const ator = sessao("dentista");

    const proc = await registrarNoDente(deps, ator, { ...entradaNoDente(26), procedimentoId: "proc-alheio" }, AGORA);
    const ag = await registrarNoDente(deps, ator, { ...entradaNoDente(26), agendamentoId: "ag-outro-paciente" }, AGORA);

    expect(proc).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(ag).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    expect(memoria.registros.size).toBe(0);
  });

  it("dado um usuário de outra clínica ou inativo, quando vê o histórico, então não vê", async () => {
    const deps = memoria.deps();
    await registrarNoDente(deps, sessao("dentista"), entradaNoDente(26), AGORA);

    const outra = await historicoDoDente(deps, sessao("admin", true, OUTRA_CLINICA), PACIENTE_JOAO, 26);
    const inativo = await historicoDoDente(deps, sessao("admin", false), PACIENTE_JOAO, 26);

    expect(outra).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    expect(inativo).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado a visão do dentista, quando consulta o lado da tela e as fileiras, então o 11 fica à esquerda, o 21 à direita e a ordem é espelhada", () => {
    expect(ladoDaTela(11)).toBe("esquerda");
    expect(ladoDaTela(21)).toBe("direita");
    expect([41, 48].map(ladoDaTela)).toEqual(["esquerda", "esquerda"]);
    expect([31, 38].map(ladoDaTela)).toEqual(["direita", "direita"]);
    expect(ladoDaTela(19)).toBeNull();
    expect(quadranteDe(19)).toBeNull();
    expect(quadranteDe(49)).toBeNull();
    expect(quadranteDe(0)).toBeNull();
    expect(fileiras()).toEqual({
      superior: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
      inferior: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    });
  });

  it.todo("Feature 012: criar o registro ao concluir o item do plano");
  it.todo("Feature 015: imagem no dente");
  it.todo("Feature 016: prótese no dente 16");
});
