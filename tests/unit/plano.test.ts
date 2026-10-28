import { beforeEach, describe, expect, it } from "vitest";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  type Agendamento,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_DENTE_INVALIDO, type RegistroOdontograma } from "../../src/domain/odontograma/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import {
  adicionarItem,
  concluirItensDoAgendamento,
  criarPlano,
  editarItem,
  listarPlanos,
  marcarEmAndamento,
} from "../../src/domain/plano/casos";
import type { Dependencias } from "../../src/domain/plano/portas";
import {
  MENSAGEM_DENTE_OBRIGATORIO,
  MENSAGEM_ITEM_CONCLUIDO,
  MENSAGEM_PLANO_CONCLUIDO,
  MENSAGEM_VALOR,
  type ItemPlano,
  type PlanoTratamento,
} from "../../src/domain/plano/tipos";
import type { Procedimento } from "../../src/domain/procedimento/tipos";
import { salvarEvolucao } from "../../src/domain/prontuario/casos";
import type { Dependencias as DependenciasProntuario } from "../../src/domain/prontuario/portas";
import type { Evolucao, RegistroAuditoria } from "../../src/domain/prontuario/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const PACIENTE_MARIA = "paciente-maria";
const CONSULTA = "consulta-001";
const RESTAURACAO = "proc-restauracao";
const AGORA = new Date("2026-10-27T15:00:00.000Z");
const DEPOIS = new Date("2026-10-27T16:30:00.000Z");

class Memoria {
  planos = new Map<string, PlanoTratamento>();
  itens = new Map<string, ItemPlano>();
  registros = new Map<string, RegistroOdontograma>();
  auditoria: RegistroAuditoria[] = [];
  evolucoes = new Map<string, Evolucao>();
  agendamentos = new Map<string, Agendamento>();
  pacientes = new Map<string, Paciente>();
  procedimentos = new Map<string, Procedimento>();
  debitos: string[] = [];
  conclusoes = 0;
  proximoId = 0;

  deps(): Dependencias {
    return {
      planos: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.planos.values()].filter((p) => p.clinicaId === clinicaId && p.pacienteId === pacienteId),
        buscarPorId: async (id) => this.planos.get(id) ?? null,
        salvar: async (plano) => {
          this.planos.set(plano.id, plano);
        },
      },
      itens: {
        listarPorPlano: async (planoId) => [...this.itens.values()].filter((i) => i.planoId === planoId),
        listarPorAgendamento: async (clinicaId, agendamentoId) =>
          [...this.itens.values()].filter(
            (i) => i.agendamentoId === agendamentoId && this.planos.get(i.planoId)?.clinicaId === clinicaId,
          ),
        buscarPorId: async (id) => this.itens.get(id) ?? null,
        salvar: async (item) => {
          this.itens.set(item.id, item);
        },
      },
      registros: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.registros.values()].filter((r) => r.clinicaId === clinicaId && r.pacienteId === pacienteId),
        listarPorAgendamento: async (clinicaId, agendamentoId) =>
          [...this.registros.values()].filter((r) => r.clinicaId === clinicaId && r.agendamentoId === agendamentoId),
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

  depsProntuario(): DependenciasProntuario {
    return {
      anamneses: { buscar: async () => null, salvar: async () => {} },
      evolucoes: {
        buscar: async (id) => this.evolucoes.get(id) ?? null,
        listar: async (ids) => [...this.evolucoes.values()].filter((e) => ids.includes(e.agendamentoId)),
        salvar: async (evolucao) => {
          this.evolucoes.set(evolucao.agendamentoId, evolucao);
        },
      },
      auditoria: this.deps().auditoria,
      estoque: { baixar: async () => {} },
      concluirItensDoAgendamento: async (clinicaId, agendamentoId, ator, agora) => {
        this.conclusoes += 1;
        await concluirItensDoAgendamento(this.deps(), clinicaId, agendamentoId, ator, agora);
      },
      agendamentos: {
        listar: async (clinicaId) => [...this.agendamentos.values()].filter((a) => a.clinicaId === clinicaId),
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      pacientes: this.deps().pacientes,
      ids: this.deps().ids,
    };
  }

  semearConsulta(parcial: Partial<Agendamento> = {}): void {
    const id = parcial.id ?? CONSULTA;
    this.agendamentos.set(id, {
      id,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      status: "iniciado",
      concluidoEm: null,
      ...parcial,
    } as Agendamento);
  }
}

function sessao(papel: Papel, ativo = true, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: { id: `ator-${papel}`, nome: "Ator", email: `${papel}@clinica.com`, papel, clinicaId, ativo },
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

function entrada(parcial: Partial<{ dentes: number[]; valor: number; agendamentoId: string | null }> = {}) {
  return { procedimentoId: RESTAURACAO, dentes: [26], valor: 150, agendamentoId: null, ...parcial };
}

describe("plano de tratamento", () => {
  let memoria: Memoria;
  const dentista = sessao("dentista");

  async function novoPlano(): Promise<PlanoTratamento> {
    const plano = await criarPlano(memoria.deps(), dentista, PACIENTE_JOAO, AGORA);
    if (!plano.ok) throw new Error("semente");
    return plano.valor;
  }

  async function novoItem(planoId: string, parcial: Parameters<typeof entrada>[0] = {}): Promise<ItemPlano> {
    const item = await adicionarItem(memoria.deps(), dentista, { planoId, ...entrada(parcial) }, AGORA);
    if (!item.ok) throw new Error("semente");
    return item.valor;
  }

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, "João"));
    memoria.pacientes.set(PACIENTE_MARIA, paciente(PACIENTE_MARIA, "Maria"));
    memoria.procedimentos.set(RESTAURACAO, {
      id: RESTAURACAO,
      clinicaId: CLINICA_ID,
      nome: "Restauração",
      tempoMedioMinutos: 30,
      valorMedio: 150,
    });
    memoria.semearConsulta();
  });

  it("dado dois itens de Restauração, um no dente 26 a 150 e outro no 16 a 80, quando lista, então o valorTotal do plano é 230", async () => {
    const plano = await novoPlano();
    await novoItem(plano.id, { dentes: [26], valor: 150 });
    await novoItem(plano.id, { dentes: [16], valor: 80 });

    const resultado = await listarPlanos(memoria.deps(), sessao("recepcionista"), PACIENTE_JOAO);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toHaveLength(1);
    expect(resultado.valor[0]).toMatchObject({ id: plano.id, status: "proposto", valorTotal: 230 });
    expect(resultado.valor[0].itens).toHaveLength(2);
  });

  it("dado um item a 150, quando o dentista muda o valor para 180, então o item muda e o valorMedio do procedimento continua 150", async () => {
    const plano = await novoPlano();
    const item = await novoItem(plano.id, { valor: 150 });

    const resultado = await editarItem(memoria.deps(), dentista, { itemId: item.id, ...entrada({ valor: 180 }) });

    expect(resultado.ok && resultado.valor.valor).toBe(180);
    expect(memoria.itens.get(item.id)?.valor).toBe(180);
    expect(memoria.procedimentos.get(RESTAURACAO)?.valorMedio).toBe(150);
  });

  it.each([
    ["sem dente", { dentes: [] }, MENSAGEM_DENTE_OBRIGATORIO],
    ["com dente repetido", { dentes: [26, 26] }, MENSAGEM_DENTE_OBRIGATORIO],
    ["com o dente 19", { dentes: [19] }, MENSAGEM_DENTE_INVALIDO],
    ["com valor negativo", { valor: -1 }, MENSAGEM_VALOR],
    ["com valor NaN", { valor: Number.NaN }, MENSAGEM_VALOR],
    ["com valor infinito", { valor: Number.POSITIVE_INFINITY }, MENSAGEM_VALOR],
  ])("dado um plano, quando o dentista adiciona item %s, então bloqueia com a mensagem e nada grava", async (_nome, parcial, mensagem) => {
    const plano = await novoPlano();

    const resultado = await adicionarItem(memoria.deps(), dentista, { planoId: plano.id, ...entrada(parcial) }, AGORA);

    expect(resultado).toEqual({ ok: false, mensagem });
    expect(memoria.itens.size).toBe(0);
  });

  it("dado um item pendente, quando o dentista edita com dente inválido ou valor negativo, então bloqueia e o item não muda", async () => {
    const plano = await novoPlano();
    const item = await novoItem(plano.id);

    const dente = await editarItem(memoria.deps(), dentista, { itemId: item.id, ...entrada({ dentes: [19] }) });
    const valor = await editarItem(memoria.deps(), dentista, { itemId: item.id, ...entrada({ valor: -5 }) });

    expect(dente).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
    expect(valor).toEqual({ ok: false, mensagem: MENSAGEM_VALOR });
    expect(memoria.itens.get(item.id)).toEqual(item);
  });

  it("dado uma recepcionista, quando cria, adiciona, edita ou marca em andamento, então recebe bloqueio de papel e nada muda", async () => {
    const plano = await novoPlano();
    const item = await novoItem(plano.id);
    const ator = sessao("recepcionista");
    const deps = memoria.deps();

    const resultados = [
      await criarPlano(deps, ator, PACIENTE_JOAO, AGORA),
      await adicionarItem(deps, ator, { planoId: plano.id, ...entrada() }, AGORA),
      await editarItem(deps, ator, { itemId: item.id, ...entrada({ valor: 10 }) }),
      await marcarEmAndamento(deps, ator, plano.id),
    ];

    for (const resultado of resultados) expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.planos.size).toBe(1);
    expect(memoria.planos.get(plano.id)?.status).toBe("proposto");
    expect(memoria.itens.size).toBe(1);
    expect(memoria.itens.get(item.id)).toEqual(item);
  });

  it("dado o admin, quando cria o plano, então nasce proposto com autor e instante", async () => {
    const resultado = await criarPlano(memoria.deps(), sessao("admin"), PACIENTE_JOAO, AGORA);

    expect(resultado).toEqual({
      ok: true,
      valor: {
        id: "id-1",
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_JOAO,
        criadoPor: "ator-admin",
        status: "proposto",
        criadoEm: AGORA.toISOString(),
      },
    });
  });

  it("dado um usuário inativo, quando lista os planos, então recebe bloqueio de papel", async () => {
    const resultado = await listarPlanos(memoria.deps(), sessao("dentista", false), PACIENTE_JOAO);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado um item concluído, quando o dentista tenta mudar o valor, então devolve Item concluído não pode ser alterado e o valor permanece", async () => {
    const plano = await novoPlano();
    const concluido = await novoItem(plano.id, { valor: 150 });
    const pendente = await novoItem(plano.id, { dentes: [16], valor: 80 });
    memoria.itens.set(concluido.id, { ...concluido, status: "concluido", executadoPor: "ator-dentista", concluidoEm: AGORA.toISOString() });

    const bloqueado = await editarItem(memoria.deps(), dentista, { itemId: concluido.id, ...entrada({ valor: 200 }) });
    const igual = await editarItem(memoria.deps(), dentista, { itemId: concluido.id, ...entrada({ dentes: [26] }) });
    const livre = await editarItem(memoria.deps(), dentista, { itemId: pendente.id, ...entrada({ dentes: [16], valor: 95 }) });

    expect(bloqueado).toEqual({ ok: false, mensagem: MENSAGEM_ITEM_CONCLUIDO });
    expect(memoria.itens.get(concluido.id)?.valor).toBe(150);
    expect(igual.ok).toBe(true);
    expect(livre.ok && livre.valor.valor).toBe(95);
  });

  describe("conclusão pela evolução", () => {
    it("dado o último item pendente vinculado à consulta, quando a evolução é salva a primeira vez, então o item conclui e o plano fica concluido; a edição da evolução não conclui de novo", async () => {
      const plano = await novoPlano();
      const item = await novoItem(plano.id, { agendamentoId: CONSULTA });
      expect(memoria.planos.get(plano.id)?.status).toBe("proposto");

      await salvarEvolucao(memoria.depsProntuario(), dentista, CONSULTA, "Texto 1", AGORA);
      await salvarEvolucao(memoria.depsProntuario(), dentista, CONSULTA, "Texto 2", DEPOIS);

      expect(memoria.conclusoes).toBe(1);
      expect(memoria.itens.get(item.id)).toMatchObject({
        status: "concluido",
        executadoPor: "ator-dentista",
        concluidoEm: AGORA.toISOString(),
      });
      expect(memoria.planos.get(plano.id)?.status).toBe("concluido");
    });

    it("dado dois itens, quando a evolução conclui só o da consulta, então o plano continua proposto e só marcarEmAndamento o promove", async () => {
      const plano = await novoPlano();
      await novoItem(plano.id, { agendamentoId: CONSULTA });
      await novoItem(plano.id, { dentes: [16] });

      await salvarEvolucao(memoria.depsProntuario(), dentista, CONSULTA, "Texto", AGORA);
      expect(memoria.planos.get(plano.id)?.status).toBe("proposto");

      const andamento = await marcarEmAndamento(memoria.deps(), dentista, plano.id);
      const repetido = await marcarEmAndamento(memoria.deps(), dentista, plano.id);

      expect(andamento.ok && andamento.valor.status).toBe("em_andamento");
      expect(repetido.ok && repetido.valor.status).toBe("em_andamento");
    });

    it("dado um plano concluído, quando o dentista adiciona item, edita item ou marca em andamento, então recebe Plano concluído não pode ser alterado", async () => {
      const plano = await novoPlano();
      const item = await novoItem(plano.id, { agendamentoId: CONSULTA });
      await salvarEvolucao(memoria.depsProntuario(), dentista, CONSULTA, "Texto", AGORA);
      const deps = memoria.deps();

      const novo = await adicionarItem(deps, dentista, { planoId: plano.id, ...entrada() }, DEPOIS);
      const edicao = await editarItem(deps, dentista, { itemId: item.id, ...entrada({ valor: 1 }) });
      const volta = await marcarEmAndamento(deps, dentista, plano.id);

      for (const r of [novo, edicao, volta]) expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PLANO_CONCLUIDO });
      expect(memoria.itens.size).toBe(1);
      expect(memoria.planos.get(plano.id)?.status).toBe("concluido");
    });

    it("dado um item com os dentes 26 e 16, quando a evolução conclui, então grava dois registros confirmados de atendimento e não cria débito", async () => {
      const plano = await novoPlano();
      await novoItem(plano.id, { dentes: [26, 16], agendamentoId: CONSULTA });

      await salvarEvolucao(memoria.depsProntuario(), dentista, CONSULTA, "Texto", AGORA);

      const registros = [...memoria.registros.values()];
      expect(registros.map((r) => r.dente).sort()).toEqual([16, 26]);
      for (const registro of registros) {
        expect(registro).toMatchObject({
          status: "confirmado",
          origem: "atendimento",
          agendamentoId: CONSULTA,
          procedimentoId: RESTAURACAO,
        });
      }
      expect(memoria.debitos).toEqual([]);
    });

    it("dado uma consulta sem itens, quando conclui os itens, então devolve ok sem registro", async () => {
      const resultado = await concluirItensDoAgendamento(memoria.deps(), CLINICA_ID, CONSULTA, dentista, AGORA);

      expect(resultado).toEqual({ ok: true, valor: undefined });
      expect(memoria.registros.size).toBe(0);
    });
  });

  describe("outra clínica", () => {
    it("dado um usuário de outra clínica, quando lista, cria ou grava no plano, então recebe Paciente não encontrado e nada muda", async () => {
      const plano = await novoPlano();
      const item = await novoItem(plano.id);
      const fora = sessao("admin", true, OUTRA_CLINICA);
      const deps = memoria.deps();

      const resultados = [
        await listarPlanos(deps, fora, PACIENTE_JOAO),
        await criarPlano(deps, fora, PACIENTE_JOAO, AGORA),
        await adicionarItem(deps, fora, { planoId: plano.id, ...entrada() }, AGORA),
        await editarItem(deps, fora, { itemId: item.id, ...entrada({ valor: 1 }) }),
        await marcarEmAndamento(deps, fora, plano.id),
      ];

      for (const r of resultados) expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
      expect(memoria.planos.size).toBe(1);
      expect(memoria.planos.get(plano.id)?.status).toBe("proposto");
      expect(memoria.itens.get(item.id)).toEqual(item);
    });
  });

  describe("vínculo com agendamento", () => {
    it.each([
      ["de outro paciente", { pacienteId: PACIENTE_MARIA }],
      ["de outra clínica", { clinicaId: OUTRA_CLINICA }],
      ["concluido", { status: "concluido" as const }],
      ["cancelado", { status: "cancelado" as const }],
    ])("dado um agendamento %s, quando o dentista vincula ao item, então devolve Agendamento não encontrado", async (_nome, parcial) => {
      const plano = await novoPlano();
      memoria.semearConsulta({ id: "ag-alvo", ...parcial });

      const resultado = await adicionarItem(
        memoria.deps(),
        dentista,
        { planoId: plano.id, ...entrada({ agendamentoId: "ag-alvo" }) },
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
      expect(memoria.itens.size).toBe(0);
    });

    it.each(["agendado", "em_espera", "iniciado"] as const)(
      "dado um agendamento %s do mesmo paciente, quando o dentista vincula ao item, então aceita",
      async (status) => {
        const plano = await novoPlano();
        memoria.semearConsulta({ id: "ag-alvo", status });

        const resultado = await adicionarItem(
          memoria.deps(),
          dentista,
          { planoId: plano.id, ...entrada({ agendamentoId: "ag-alvo" }) },
          AGORA,
        );

        expect(resultado.ok && resultado.valor.agendamentoId).toBe("ag-alvo");
      },
    );

    it("dado um agendamento inexistente, quando o dentista vincula, então devolve Agendamento não encontrado", async () => {
      const plano = await novoPlano();

      const resultado = await adicionarItem(
        memoria.deps(),
        dentista,
        { planoId: plano.id, ...entrada({ agendamentoId: "nao-existe" }) },
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    });
  });

  it.todo("Feature 013: o débito nasce do item concluído");
  it.todo("Feature 019: itens concluídos alimentam o faturamento do dashboard");
});
