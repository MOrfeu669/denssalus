import { beforeEach, describe, expect, it } from "vitest";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  type Agendamento,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import {
  abrirProntuario,
  listarAuditoria,
  salvarAnamnese,
  salvarEvolucao,
} from "../../src/domain/prontuario/casos";
import type { Dependencias } from "../../src/domain/prontuario/portas";
import {
  MENSAGEM_EVOLUCAO_NAO_INICIADA,
  MENSAGEM_EVOLUCAO_VAZIA,
  type Anamnese,
  type Evolucao,
  type RegistroAuditoria,
} from "../../src/domain/prontuario/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const PACIENTE_MARIA = "paciente-maria";
const CONSULTA = "consulta-001";
const AGORA = new Date("2026-10-27T15:00:00.000Z");
const DEPOIS = new Date("2026-10-27T16:30:00.000Z");

class Memoria {
  anamneses = new Map<string, Anamnese>();
  evolucoes = new Map<string, Evolucao>();
  auditoria: RegistroAuditoria[] = [];
  agendamentos = new Map<string, Agendamento>();
  pacientes = new Map<string, Paciente>();
  baixas: string[] = [];
  estoqueFalha = false;
  proximoId = 0;

  deps(): Dependencias {
    return {
      anamneses: {
        buscar: async (pacienteId) => this.anamneses.get(pacienteId) ?? null,
        salvar: async (anamnese) => {
          this.anamneses.set(anamnese.pacienteId, anamnese);
        },
      },
      evolucoes: {
        buscar: async (id) => this.evolucoes.get(id) ?? null,
        listar: async (ids) => [...this.evolucoes.values()].filter((e) => ids.includes(e.agendamentoId)),
        salvar: async (evolucao) => {
          this.evolucoes.set(evolucao.agendamentoId, evolucao);
        },
      },
      auditoria: {
        registrar: async (registro) => {
          this.auditoria.push(registro);
        },
        listar: async (clinicaId) => this.auditoria.filter((r) => r.clinicaId === clinicaId),
      },
      estoque: {
        baixar: async (agendamentoId) => {
          if (this.estoqueFalha) throw new Error("estoque indisponível");
          this.baixas.push(agendamentoId);
        },
      },
      concluirItensDoAgendamento: async () => {},
      agendamentos: {
        listar: async (clinicaId) =>
          [...this.agendamentos.values()].filter((a) => a.clinicaId === clinicaId),
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semearConsulta(parcial: Partial<Agendamento> = {}): Agendamento {
    const agendamento: Agendamento = {
      id: CONSULTA,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
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

describe("prontuário básico", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, "João"));
    memoria.pacientes.set(PACIENTE_MARIA, paciente(PACIENTE_MARIA, "Maria"));
  });

  describe("anamnese", () => {
    it("dado um paciente, quando o dentista salva a anamnese, então grava com autor e instante e audita a criação", async () => {
      const resultado = await salvarAnamnese(
        memoria.deps(),
        sessao("dentista"),
        PACIENTE_JOAO,
        "  Alergia a penicilina  ",
        AGORA,
      );

      expect(resultado).toEqual({
        ok: true,
        valor: {
          pacienteId: PACIENTE_JOAO,
          conteudo: "Alergia a penicilina",
          preenchidoPor: "ator-dentista",
          atualizadoEm: AGORA.toISOString(),
        },
      });
      expect(memoria.anamneses.get(PACIENTE_JOAO)).toEqual(resultado.ok && resultado.valor);
      expect(memoria.auditoria).toEqual([
        {
          id: "id-1",
          clinicaId: CLINICA_ID,
          entidade: "anamnese",
          entidadeId: PACIENTE_JOAO,
          usuarioId: "ator-dentista",
          acao: "criacao",
          conteudoAnterior: null,
          registradoEm: AGORA.toISOString(),
        },
      ]);
    });

    it("dado uma recepcionista, quando salva a anamnese, então recebe bloqueio de papel e nada grava", async () => {
      const resultado = await salvarAnamnese(
        memoria.deps(),
        sessao("recepcionista"),
        PACIENTE_JOAO,
        "Texto",
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.anamneses.size).toBe(0);
      expect(memoria.auditoria).toEqual([]);
    });

    it("dado o admin, quando salva a anamnese, então grava pela hierarquia", async () => {
      const resultado = await salvarAnamnese(
        memoria.deps(),
        sessao("admin"),
        PACIENTE_JOAO,
        "Hipertensão",
        AGORA,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.anamneses.get(PACIENTE_JOAO)?.preenchidoPor).toBe("ator-admin");
    });

    it("dado um paciente de outra clínica, quando o dentista salva a anamnese, então devolve Paciente não encontrado", async () => {
      memoria.pacientes.set("paciente-fora", paciente("paciente-fora", "Fora", OUTRA_CLINICA));

      const resultado = await salvarAnamnese(
        memoria.deps(),
        sessao("dentista"),
        "paciente-fora",
        "Texto",
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
      expect(memoria.anamneses.size).toBe(0);
    });

    it("dado uma anamnese vazia, quando o dentista salva, então grava o texto vazio", async () => {
      const resultado = await salvarAnamnese(
        memoria.deps(),
        sessao("dentista"),
        PACIENTE_JOAO,
        "   ",
        AGORA,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.anamneses.get(PACIENTE_JOAO)?.conteudo).toBe("");
    });

    it("dado uma anamnese já salva, quando o admin grava de novo, então a auditoria guarda o texto anterior com autor e instante e o prontuário mostra o novo", async () => {
      await salvarAnamnese(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, "Versão 1", AGORA);

      await salvarAnamnese(memoria.deps(), sessao("admin"), PACIENTE_JOAO, "Versão 2", DEPOIS);

      expect(memoria.auditoria).toHaveLength(2);
      expect(memoria.auditoria[1]).toMatchObject({
        entidade: "anamnese",
        entidadeId: PACIENTE_JOAO,
        acao: "edicao",
        conteudoAnterior: "Versão 1",
        usuarioId: "ator-admin",
        registradoEm: DEPOIS.toISOString(),
      });
      const aberto = await abrirProntuario(memoria.deps(), sessao("recepcionista"), PACIENTE_JOAO);
      expect(aberto.ok && aberto.valor.anamnese?.conteudo).toBe("Versão 2");
      expect(memoria.anamneses.size).toBe(1);
    });
  });

  describe("histórico", () => {
    it("dado três consultas concluídas e uma cancelada, quando a recepcionista abre o prontuário, então vê as quatro com a data de início", async () => {
      memoria.semearConsulta({ id: "c-3", status: "concluido", inicio: "2026-10-03T09:00" });
      memoria.semearConsulta({ id: "c-1", status: "concluido", inicio: "2026-10-01T09:00" });
      memoria.semearConsulta({ id: "c-4", status: "cancelado", inicio: "2026-10-04T09:00" });
      memoria.semearConsulta({ id: "c-2", status: "concluido", inicio: "2026-10-02T09:00" });
      memoria.semearConsulta({ id: "c-maria", pacienteId: PACIENTE_MARIA });
      memoria.semearConsulta({ id: "c-fora", clinicaId: OUTRA_CLINICA });

      const resultado = await abrirProntuario(
        memoria.deps(),
        sessao("recepcionista"),
        PACIENTE_JOAO,
      );

      expect(resultado.ok).toBe(true);
      if (!resultado.ok) return;
      expect(resultado.valor.paciente.id).toBe(PACIENTE_JOAO);
      expect(resultado.valor.historico.map((h) => [h.id, h.status, h.inicio])).toEqual([
        ["c-1", "concluido", "2026-10-01T09:00"],
        ["c-2", "concluido", "2026-10-02T09:00"],
        ["c-3", "concluido", "2026-10-03T09:00"],
        ["c-4", "cancelado", "2026-10-04T09:00"],
      ]);
    });

    it("dado um paciente de outra clínica, quando o usuário abre o prontuário, então recebe Paciente não encontrado sem dado", async () => {
      memoria.pacientes.set("paciente-fora", paciente("paciente-fora", "Fora", OUTRA_CLINICA));

      const resultado = await abrirProntuario(memoria.deps(), sessao("admin"), "paciente-fora");

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    });

    it("dado um paciente inexistente, quando abre o prontuário, então recebe Paciente não encontrado", async () => {
      const resultado = await abrirProntuario(memoria.deps(), sessao("dentista"), "nao-existe");
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    });

    it("dado um usuário inativo, quando abre o prontuário, então recebe bloqueio de papel", async () => {
      const resultado = await abrirProntuario(
        memoria.deps(),
        sessao("dentista", false),
        PACIENTE_JOAO,
      );
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    });
  });

  describe("evolução", () => {
    it("dado uma consulta iniciada, quando o dentista salva a evolução, então grava, conclui com concluidoEm, audita a criação e baixa o estoque", async () => {
      memoria.semearConsulta();

      const resultado = await salvarEvolucao(
        memoria.deps(),
        sessao("dentista"),
        CONSULTA,
        "  Sensibilidade após o procedimento  ",
        AGORA,
      );

      expect(resultado).toEqual({
        ok: true,
        valor: {
          agendamentoId: CONSULTA,
          texto: "Sensibilidade após o procedimento",
          registradoPor: "ator-dentista",
          registradoEm: AGORA.toISOString(),
        },
      });
      expect(memoria.evolucoes.get(CONSULTA)?.texto).toBe("Sensibilidade após o procedimento");
      expect(memoria.agendamentos.get(CONSULTA)).toMatchObject({
        status: "concluido",
        concluidoEm: AGORA.toISOString(),
      });
      expect(memoria.auditoria).toEqual([
        {
          id: "id-1",
          clinicaId: CLINICA_ID,
          entidade: "evolucao",
          entidadeId: CONSULTA,
          usuarioId: "ator-dentista",
          acao: "criacao",
          conteudoAnterior: null,
          registradoEm: AGORA.toISOString(),
        },
      ]);
      expect(memoria.baixas).toEqual([CONSULTA]);
    });

    it.each(["", "   "])(
      "dado uma consulta iniciada, quando o texto é %j, então devolve Informe a evolução e nada muda",
      async (texto) => {
        memoria.semearConsulta();

        const resultado = await salvarEvolucao(
          memoria.deps(),
          sessao("dentista"),
          CONSULTA,
          texto,
          AGORA,
        );

        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_EVOLUCAO_VAZIA });
        expect(memoria.agendamentos.get(CONSULTA)?.status).toBe("iniciado");
        expect(memoria.agendamentos.get(CONSULTA)?.concluidoEm).toBeNull();
        expect(memoria.evolucoes.size).toBe(0);
        expect(memoria.auditoria).toEqual([]);
        expect(memoria.baixas).toEqual([]);
      },
    );

    it.each(["agendado", "em_espera", "cancelado", "concluido"] as const)(
      "dado uma consulta %s sem evolução, quando o dentista salva, então devolve que só conclui atendimento iniciado e não grava",
      async (status) => {
        memoria.semearConsulta({ status });

        const resultado = await salvarEvolucao(
          memoria.deps(),
          sessao("dentista"),
          CONSULTA,
          "Texto",
          AGORA,
        );

        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_EVOLUCAO_NAO_INICIADA });
        expect(memoria.agendamentos.get(CONSULTA)?.status).toBe(status);
        expect(memoria.evolucoes.size).toBe(0);
        expect(memoria.auditoria).toEqual([]);
        expect(memoria.baixas).toEqual([]);
      },
    );

    it("dado uma recepcionista, quando salva a evolução, então recebe bloqueio de papel e o status continua", async () => {
      memoria.semearConsulta();

      const resultado = await salvarEvolucao(
        memoria.deps(),
        sessao("recepcionista"),
        CONSULTA,
        "Texto",
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.agendamentos.get(CONSULTA)?.status).toBe("iniciado");
    });

    it("dado uma consulta de outra clínica, quando o dentista salva a evolução, então devolve Agendamento não encontrado", async () => {
      memoria.semearConsulta({ clinicaId: OUTRA_CLINICA });

      const resultado = await salvarEvolucao(
        memoria.deps(),
        sessao("dentista"),
        CONSULTA,
        "Texto",
        AGORA,
      );

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
      expect(memoria.evolucoes.size).toBe(0);
    });

    it("dado uma evolução salva, quando o admin edita o texto, então mantém concluido e concluidoEm, audita a edição com o texto anterior e não baixa de novo", async () => {
      memoria.semearConsulta();
      await salvarEvolucao(memoria.deps(), sessao("dentista"), CONSULTA, "Texto 1", AGORA);

      const resultado = await salvarEvolucao(
        memoria.deps(),
        sessao("admin"),
        CONSULTA,
        "Texto 2",
        DEPOIS,
      );

      expect(resultado).toEqual({
        ok: true,
        valor: {
          agendamentoId: CONSULTA,
          texto: "Texto 2",
          registradoPor: "ator-admin",
          registradoEm: DEPOIS.toISOString(),
        },
      });
      expect(memoria.agendamentos.get(CONSULTA)).toMatchObject({
        status: "concluido",
        concluidoEm: AGORA.toISOString(),
      });
      expect(memoria.auditoria).toHaveLength(2);
      expect(memoria.auditoria[1]).toMatchObject({
        entidade: "evolucao",
        entidadeId: CONSULTA,
        acao: "edicao",
        conteudoAnterior: "Texto 1",
        usuarioId: "ator-admin",
        registradoEm: DEPOIS.toISOString(),
      });
      expect(memoria.baixas).toEqual([CONSULTA]);
    });

    it("dado que a porta de estoque lança, quando o dentista salva a evolução, então a evolução e o status concluido permanecem e devolve ok", async () => {
      memoria.semearConsulta();
      memoria.estoqueFalha = true;

      const resultado = await salvarEvolucao(
        memoria.deps(),
        sessao("dentista"),
        CONSULTA,
        "Texto",
        AGORA,
      );

      expect(resultado.ok).toBe(true);
      expect(memoria.evolucoes.get(CONSULTA)?.texto).toBe("Texto");
      expect(memoria.agendamentos.get(CONSULTA)?.status).toBe("concluido");
    });

    it("dado evoluções salvas, quando abre o prontuário, então devolve as evoluções do histórico do paciente", async () => {
      memoria.semearConsulta();
      await salvarEvolucao(memoria.deps(), sessao("dentista"), CONSULTA, "Texto", AGORA);

      const resultado = await abrirProntuario(memoria.deps(), sessao("dentista"), PACIENTE_JOAO);

      expect(resultado.ok && resultado.valor.evolucoes.map((e) => e.texto)).toEqual(["Texto"]);
    });
  });

  describe("auditoria", () => {
    async function prepararTrilha() {
      memoria.semearConsulta();
      memoria.semearConsulta({ id: "c-maria", pacienteId: PACIENTE_MARIA });
      await salvarAnamnese(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, "A1", AGORA);
      await salvarAnamnese(memoria.deps(), sessao("dentista"), PACIENTE_MARIA, "M1", AGORA);
      await salvarEvolucao(memoria.deps(), sessao("dentista"), CONSULTA, "E1", AGORA);
      await salvarEvolucao(memoria.deps(), sessao("dentista"), "c-maria", "M-E1", AGORA);
    }

    it("dado um dentista, quando lista a auditoria, então recebe bloqueio de papel", async () => {
      await prepararTrilha();

      const resultado = await listarAuditoria(memoria.deps(), sessao("dentista"), PACIENTE_JOAO);

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    });

    it("dado o admin, quando lista a auditoria do paciente, então vê só anamnese e evolução desse paciente", async () => {
      await prepararTrilha();

      const resultado = await listarAuditoria(memoria.deps(), sessao("admin"), PACIENTE_JOAO);

      expect(resultado.ok).toBe(true);
      if (!resultado.ok) return;
      expect(resultado.valor.map((r) => [r.entidade, r.entidadeId])).toEqual([
        ["anamnese", PACIENTE_JOAO],
        ["evolucao", CONSULTA],
      ]);
    });

    it("dado um paciente de outra clínica, quando o admin lista a auditoria, então recebe Paciente não encontrado", async () => {
      memoria.pacientes.set("paciente-fora", paciente("paciente-fora", "Fora", OUTRA_CLINICA));

      const resultado = await listarAuditoria(memoria.deps(), sessao("admin"), "paciente-fora");

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    });
  });

  it.todo("Feature 012: concluir itens do plano de tratamento ao salvar a evolução");
  it.todo("Feature 017: baixa real de estoque quando falta material");
  it.todo("Feature 011: auditar alteração do odontograma");
  it.todo("Feature 014: auditar documento");
});
