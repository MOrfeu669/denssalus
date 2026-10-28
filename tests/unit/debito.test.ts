import { beforeEach, describe, expect, it } from "vitest";
import type { Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import {
  aplicarDesconto,
  gerarDebitosDoAtendimento,
  listarDebitos,
  quitarDebito,
} from "../../src/domain/debito/casos";
import type { Dependencias } from "../../src/domain/debito/portas";
import {
  MENSAGEM_DATA,
  MENSAGEM_DEBITO_NAO_ENCONTRADO,
  MENSAGEM_DESCONTO,
  MENSAGEM_FORMA,
  MENSAGEM_JA_QUITADO,
  type Debito,
  type Pagamento,
} from "../../src/domain/debito/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import type { ItemPlano } from "../../src/domain/plano/tipos";
import type { Procedimento } from "../../src/domain/procedimento/tipos";
import { salvarEvolucao } from "../../src/domain/prontuario/casos";
import type { Dependencias as DependenciasProntuario } from "../../src/domain/prontuario/portas";
import type { Evolucao } from "../../src/domain/prontuario/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE = "paciente-joao";
const CONSULTA = "consulta-001";
const AGORA = new Date("2026-10-27T15:00:00.000Z");
const DEPOIS = new Date("2026-10-27T16:30:00.000Z");

class Memoria {
  debitos = new Map<string, Debito>();
  pagamentos: Pagamento[] = [];
  salvosPagamento = 0;
  itens: ItemPlano[] = [];
  agendamentos = new Map<string, Agendamento>();
  procedimentos = new Map<string, Procedimento>();
  pacientes = new Map<string, Paciente>();
  evolucoes = new Map<string, Evolucao>();
  proximoId = 0;

  deps(): Dependencias {
    return {
      debitos: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.debitos.values()].filter(
            (d) => d.clinicaId === clinicaId && d.pacienteId === pacienteId,
          ),
        listarPorAgendamento: async (clinicaId, agendamentoId) =>
          [...this.debitos.values()].filter(
            (d) => d.clinicaId === clinicaId && d.agendamentoId === agendamentoId,
          ),
        buscarPorId: async (id) => this.debitos.get(id) ?? null,
        salvar: async (debito) => {
          this.debitos.set(debito.id, debito);
        },
      },
      pagamentos: {
        listarPorDebitos: async (ids) => this.pagamentos.filter((p) => ids.includes(p.debitoId)),
        salvar: async (pagamento) => {
          this.salvosPagamento += 1;
          this.pagamentos.push(pagamento);
        },
      },
      itens: {
        listarPorAgendamento: async (_clinicaId, agendamentoId) =>
          this.itens.filter((i) => i.agendamentoId === agendamentoId),
      },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      procedimentos: { buscarPorId: async (id) => this.procedimentos.get(id) ?? null },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  depsProntuario(ator: Papel = "dentista"): DependenciasProntuario {
    return {
      anamneses: { buscar: async () => null, salvar: async () => {} },
      evolucoes: {
        buscar: async (id) => this.evolucoes.get(id) ?? null,
        listar: async () => [],
        salvar: async (evolucao) => {
          this.evolucoes.set(evolucao.agendamentoId, evolucao);
        },
      },
      auditoria: { registrar: async () => {}, listar: async () => [] },
      estoque: { baixar: async () => {} },
      concluirItensDoAgendamento: async () => {},
      gerarDebitosDoAtendimento: async (_clinicaId, agendamentoId, sessaoAtor) => {
        await gerarDebitosDoAtendimento(this.deps(), sessaoAtor, agendamentoId);
      },
      agendamentos: {
        listar: async () => [...this.agendamentos.values()],
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      ids: { novo: () => `aud-${ator}-${++this.proximoId}` },
    };
  }

  semearConsulta(parcial: Partial<Agendamento> = {}): Agendamento {
    const agendamento: Agendamento = {
      id: CONSULTA,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE,
      dentistaId: "dentista-carlos",
      cadeiraId: "cadeira-1",
      procedimentoId: null,
      inicio: "2026-10-27T14:00",
      fim: "2026-10-27T14:30",
      status: "iniciado",
      iniciadoPor: "ator-dentista",
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

  semearItem(id: string, valor: number, agendamentoId: string | null = CONSULTA): ItemPlano {
    const item: ItemPlano = {
      id,
      planoId: "plano-1",
      procedimentoId: "proc-1",
      dentes: [11],
      valor,
      agendamentoId,
      status: "concluido",
      executadoPor: "ator-dentista",
      concluidoEm: AGORA.toISOString(),
    };
    this.itens.push(item);
    return item;
  }

  semearProcedimento(valorMedio: number): void {
    this.procedimentos.set("proc-1", {
      id: "proc-1",
      clinicaId: CLINICA_ID,
      nome: "Limpeza",
      tempoMedioMinutos: 30,
      valorMedio,
    });
  }

  semearDebito(parcial: Partial<Debito> = {}): Debito {
    const debito: Debito = {
      id: "debito-1",
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE,
      origem: "item_plano",
      itemPlanoId: "item-1",
      agendamentoId: CONSULTA,
      valor: 150,
      desconto: 0,
      descontoPor: null,
      status: "em_aberto",
      ...parcial,
    };
    this.debitos.set(debito.id, debito);
    return debito;
  }
}

function sessao(papel: Papel, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId,
      ativo: true,
    },
  };
}

function paciente(id: string, clinicaId = CLINICA_ID): Paciente {
  return {
    id,
    clinicaId,
    nome: "João",
    canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
  };
}

describe("débitos", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE, paciente(PACIENTE));
  });

  describe("geração", () => {
    it("dado um item de 150 no atendimento, quando a evolução é salva, então nasce um débito em aberto de 150 do item e a segunda gravação não gera outro", async () => {
      memoria.semearConsulta();
      memoria.semearItem("item-1", 150);

      const primeira = await salvarEvolucao(memoria.depsProntuario(), sessao("dentista"), CONSULTA, "Texto 1", AGORA);
      await salvarEvolucao(memoria.depsProntuario(), sessao("admin"), CONSULTA, "Texto 2", DEPOIS);

      expect(primeira.ok).toBe(true);
      const debitos = [...memoria.debitos.values()];
      expect(debitos).toHaveLength(1);
      expect(debitos[0]).toMatchObject({
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE,
        origem: "item_plano",
        itemPlanoId: "item-1",
        agendamentoId: CONSULTA,
        valor: 150,
        desconto: 0,
        descontoPor: null,
        status: "em_aberto",
      });
    });

    it("dado um item do plano, quando a geração roda duas vezes, então não cria segundo débito para o mesmo item", async () => {
      memoria.semearConsulta();
      memoria.semearItem("item-1", 150);

      await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);
      const segunda = await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);

      expect(segunda).toEqual({ ok: true, valor: [] });
      expect(memoria.debitos.size).toBe(1);
    });

    it("dado um agendamento com procedimento avulso e sem item, quando gera, então nasce um débito avulso no valor médio, uma só vez", async () => {
      memoria.semearConsulta({ procedimentoId: "proc-1" });
      memoria.semearProcedimento(200);

      await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);
      await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);

      const debitos = [...memoria.debitos.values()];
      expect(debitos).toHaveLength(1);
      expect(debitos[0]).toMatchObject({
        origem: "procedimento_avulso",
        itemPlanoId: null,
        valor: 200,
        status: "em_aberto",
      });
    });

    it("dado um agendamento com procedimento e com item do plano, quando gera, então só o item gera débito", async () => {
      memoria.semearConsulta({ procedimentoId: "proc-1" });
      memoria.semearProcedimento(200);
      memoria.semearItem("item-1", 150);

      await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);

      expect([...memoria.debitos.values()].map((d) => [d.origem, d.valor])).toEqual([["item_plano", 150]]);
    });

    it("dado um agendamento sem item e sem procedimento, quando gera, então devolve lista vazia", async () => {
      memoria.semearConsulta();

      const resultado = await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);

      expect(resultado).toEqual({ ok: true, valor: [] });
      expect(memoria.debitos.size).toBe(0);
    });
  });

  describe("quitação", () => {
    it("dado um débito em aberto, quando o admin quita com pix e data, então o registro guarda forma, data e quem quitou e o débito fica quitado", async () => {
      memoria.semearDebito();

      const resultado = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", {
        forma: "pix",
        data: "2026-10-20",
      });

      expect(resultado.ok).toBe(true);
      expect(memoria.debitos.get("debito-1")?.status).toBe("quitado");
      expect(memoria.pagamentos).toEqual([
        {
          id: "id-1",
          debitoId: "debito-1",
          forma: "pix",
          data: "2026-10-20",
          registradoPor: "ator-admin",
        },
      ]);
    });

    it.each(["dentista", "recepcionista"] as const)(
      "dado um débito em aberto, quando %s tenta quitar, então recebe bloqueio de papel e a lista continua visível",
      async (papel) => {
        memoria.semearDebito();

        const resultado = await quitarDebito(memoria.deps(), sessao(papel), "debito-1", {
          forma: "pix",
          data: "2026-10-20",
        });
        const lista = await listarDebitos(memoria.deps(), sessao(papel), PACIENTE);

        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
        expect(memoria.debitos.get("debito-1")?.status).toBe("em_aberto");
        expect(lista.ok && lista.valor.map((d) => [d.id, d.status, d.pagamento])).toEqual([
          ["debito-1", "em_aberto", null],
        ]);
      },
    );

    it("dado um débito quitado com pagamento, quando a recepcionista lista, então vê o débito com o pagamento", async () => {
      memoria.semearDebito();
      await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", { forma: "dinheiro", data: "2026-10-21" });

      const lista = await listarDebitos(memoria.deps(), sessao("recepcionista"), PACIENTE);

      expect(lista.ok && lista.valor[0]?.pagamento?.forma).toBe("dinheiro");
    });

    it("dado uma forma vazia ou fora da lista, quando o admin quita, então devolve Informe a forma de pagamento", async () => {
      memoria.semearDebito();

      const vazia = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", { forma: "", data: "2026-10-20" });
      const fora = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", { forma: "ouro", data: "2026-10-20" });

      expect(vazia).toEqual({ ok: false, mensagem: MENSAGEM_FORMA });
      expect(fora).toEqual({ ok: false, mensagem: MENSAGEM_FORMA });
      expect(memoria.pagamentos).toEqual([]);
    });

    it.each(["", "20/10/2026", "2026-1-5"])(
      "dado a data %j, quando o admin quita, então devolve Informe a data",
      async (data) => {
        memoria.semearDebito();

        const resultado = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", { forma: "pix", data });

        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DATA });
        expect(memoria.debitos.get("debito-1")?.status).toBe("em_aberto");
      },
    );

    it("dado um débito já quitado, quando o admin quita de novo, então devolve Débito já quitado e não duplica o pagamento", async () => {
      memoria.semearDebito({ status: "quitado" });

      const resultado = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", {
        forma: "pix",
        data: "2026-10-20",
      });

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_JA_QUITADO });
      expect(memoria.pagamentos).toEqual([]);
    });
  });

  describe("desconto", () => {
    it("dado um débito de 150, quando o dentista desconta 30 e o admin quita, então guarda desconto e autor, e o pagamento não tem valor", async () => {
      memoria.semearDebito();

      const desconto = await aplicarDesconto(memoria.deps(), sessao("dentista"), "debito-1", 30);
      const quitacao = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", {
        forma: "cartao_credito",
        data: "2026-10-22",
      });

      expect(desconto.ok && desconto.valor.status).toBe("em_aberto");
      expect(quitacao.ok).toBe(true);
      expect(memoria.debitos.get("debito-1")).toMatchObject({
        valor: 150,
        desconto: 30,
        descontoPor: "ator-dentista",
        status: "quitado",
      });
      expect(Object.keys(memoria.pagamentos[0] ?? {}).sort()).toEqual(
        ["data", "debitoId", "forma", "id", "registradoPor"],
      );
    });

    it("dado um débito de 150, quando o desconto é maior que o valor, negativo ou NaN, então bloqueia com Desconto maior que o valor", async () => {
      memoria.semearDebito();

      for (const valor of [150.01, -1, Number.NaN]) {
        const resultado = await aplicarDesconto(memoria.deps(), sessao("admin"), "debito-1", valor);
        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DESCONTO });
      }
      expect(memoria.debitos.get("debito-1")).toMatchObject({ desconto: 0, descontoPor: null });
    });

    it("dado um débito de 150, quando o desconto é igual ao valor, então quita sem linha de pagamento", async () => {
      memoria.semearDebito();

      const resultado = await aplicarDesconto(memoria.deps(), sessao("dentista"), "debito-1", 150);

      expect(resultado.ok && resultado.valor.status).toBe("quitado");
      expect(memoria.debitos.get("debito-1")?.descontoPor).toBe("ator-dentista");
      expect(memoria.salvosPagamento).toBe(0);
      const lista = await listarDebitos(memoria.deps(), sessao("dentista"), PACIENTE);
      expect(lista.ok && lista.valor[0]?.pagamento).toBeNull();
    });

    it("dado um débito em aberto, quando a recepcionista desconta, então recebe bloqueio de papel", async () => {
      memoria.semearDebito();

      const resultado = await aplicarDesconto(memoria.deps(), sessao("recepcionista"), "debito-1", 10);

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.debitos.get("debito-1")?.desconto).toBe(0);
    });

    it("dado um débito quitado, quando o dentista desconta, então devolve Débito já quitado", async () => {
      memoria.semearDebito({ status: "quitado" });

      const resultado = await aplicarDesconto(memoria.deps(), sessao("dentista"), "debito-1", 10);

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_JA_QUITADO });
    });
  });

  describe("outra clínica", () => {
    it("dado um débito de outra clínica, quando o admin quita ou o dentista desconta, então recebe Débito não encontrado", async () => {
      memoria.semearDebito({ clinicaId: OUTRA_CLINICA });

      const quitar = await quitarDebito(memoria.deps(), sessao("admin"), "debito-1", { forma: "pix", data: "2026-10-20" });
      const descontar = await aplicarDesconto(memoria.deps(), sessao("dentista"), "debito-1", 10);
      const ausente = await quitarDebito(memoria.deps(), sessao("admin"), "nao-existe", { forma: "pix", data: "2026-10-20" });

      expect(quitar).toEqual({ ok: false, mensagem: MENSAGEM_DEBITO_NAO_ENCONTRADO });
      expect(descontar).toEqual({ ok: false, mensagem: MENSAGEM_DEBITO_NAO_ENCONTRADO });
      expect(ausente).toEqual({ ok: false, mensagem: MENSAGEM_DEBITO_NAO_ENCONTRADO });
      expect(memoria.debitos.get("debito-1")?.status).toBe("em_aberto");
    });

    it("dado um paciente de outra clínica, quando a recepcionista lista, então recebe Paciente não encontrado", async () => {
      memoria.pacientes.set("paciente-fora", paciente("paciente-fora", OUTRA_CLINICA));
      memoria.semearDebito({ clinicaId: OUTRA_CLINICA, pacienteId: "paciente-fora" });

      const resultado = await listarDebitos(memoria.deps(), sessao("recepcionista"), "paciente-fora");

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    });

    it("dado um agendamento de outra clínica, quando gera débito, então não cria nada", async () => {
      memoria.semearConsulta({ clinicaId: OUTRA_CLINICA });
      memoria.semearItem("item-1", 150);

      const resultado = await gerarDebitosDoAtendimento(memoria.deps(), sessao("dentista"), CONSULTA);

      expect(resultado.ok).toBe(false);
      expect(memoria.debitos.size).toBe(0);
    });
  });

  it.todo("Feature 019: dashboard exibe faturado (competência) e recebido (caixa)");
  it.todo("Feature 018: alerta de débito em atraso");
});
