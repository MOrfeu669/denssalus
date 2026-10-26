import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA, type Clinica } from "../../src/domain/clinica/tipos";
import {
  criarProcedimento,
  editarProcedimento,
  excluirProcedimento,
  listarProcedimentos,
} from "../../src/domain/procedimento/casos";
import type { Dependencias } from "../../src/domain/procedimento/portas";
import {
  MENSAGEM_NOME,
  MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO,
  MENSAGEM_TEMPO,
  MENSAGEM_VALOR,
  type EntradaProcedimento,
  type Procedimento,
} from "../../src/domain/procedimento/tipos";

const CLINICA_ID = "clinica-001";

class Memoria {
  clinicas = new Map<string, Clinica>();
  procedimentos = new Map<string, Procedimento>();
  proximoId = 0;

  deps(): Dependencias {
    return {
      procedimentos: {
        listar: async (clinicaId) =>
          [...this.procedimentos.values()].filter((item) => item.clinicaId === clinicaId),
        buscarPorId: async (id) => this.procedimentos.get(id) ?? null,
        salvar: async (procedimento) => {
          this.procedimentos.set(procedimento.id, procedimento);
        },
        remover: async (id) => {
          this.procedimentos.delete(id);
        },
      },
      clinicas: { buscarPorId: async (id) => this.clinicas.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semear(parcial: Partial<Procedimento> & Pick<Procedimento, "id">): Procedimento {
    const procedimento: Procedimento = {
      clinicaId: CLINICA_ID,
      nome: "Limpeza",
      tempoMedioMinutos: 30,
      valorMedio: 100,
      ...parcial,
    };
    this.procedimentos.set(procedimento.id, procedimento);
    return procedimento;
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

const ENTRADA: EntradaProcedimento = {
  nome: "Restauração",
  tempoMedioMinutos: 40,
  valorMedio: 150,
};

describe("cadastro de procedimentos", () => {
  let memoria: Memoria;
  const admin = sessao("admin");
  const dentista = sessao("dentista");
  const recepcionista = sessao("recepcionista");

  beforeEach(() => {
    memoria = new Memoria();
    memoria.clinicas.set(CLINICA_ID, {
      id: CLINICA_ID,
      nome: "Clínica OdontoSmile",
      adminId: "ator-admin",
      diasAtendimento: ["segunda"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    });
  });

  it("dado um admin, quando cria Avaliação/Consulta sem material, então o objeto salvo não tem chave de material, categoria nem especialidade", async () => {
    const resultado = await criarProcedimento(memoria.deps(), admin, {
      nome: "Avaliação/Consulta",
      tempoMedioMinutos: 30,
      valorMedio: 0,
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const salvo = memoria.procedimentos.get(resultado.valor.id);
    expect(salvo).toBeDefined();
    if (!salvo) return;
    expect(Object.keys(salvo).sort()).toEqual([
      "clinicaId",
      "id",
      "nome",
      "tempoMedioMinutos",
      "valorMedio",
    ]);
    expect("materiais" in salvo).toBe(false);
    expect("categoria" in salvo).toBe(false);
    expect("especialidade" in salvo).toBe(false);
    expect(salvo.valorMedio).toBe(0);
  });

  it("dado um dentista, quando cria Restauração com 40 minutos e valor 150, então o salvo tem esses campos e a clínica da sessão", async () => {
    const resultado = await criarProcedimento(memoria.deps(), dentista, ENTRADA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(memoria.procedimentos.get(resultado.valor.id)).toEqual({
      id: "id-1",
      clinicaId: CLINICA_ID,
      nome: "Restauração",
      tempoMedioMinutos: 40,
      valorMedio: 150,
    });
  });

  it("dado um dentista, quando edita o tempo de um procedimento, então o id e a clínica permanecem", async () => {
    memoria.semear({ id: "p1", nome: "Restauração", tempoMedioMinutos: 40, valorMedio: 150 });

    const resultado = await editarProcedimento(memoria.deps(), dentista, "p1", {
      ...ENTRADA,
      tempoMedioMinutos: 60,
    });

    expect(resultado.ok && resultado.valor.id).toBe("p1");
    expect(memoria.procedimentos.size).toBe(1);
    expect(memoria.procedimentos.get("p1")).toEqual({
      id: "p1",
      clinicaId: CLINICA_ID,
      nome: "Restauração",
      tempoMedioMinutos: 60,
      valorMedio: 150,
    });
  });

  it("dado um dentista, quando tenta excluir, então recebe a mensagem de papel e o procedimento continua na lista; o admin exclui e ele sai", async () => {
    memoria.semear({ id: "p1" });
    const deps = memoria.deps();

    const negado = await excluirProcedimento(deps, dentista, "p1");

    expect(negado).toEqual({ ok: false, mensagem: "Ação não permitida para seu papel" });
    expect(negado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    const antes = await listarProcedimentos(deps, admin);
    expect(antes.ok && antes.valor.map((item) => item.id)).toEqual(["p1"]);

    const excluido = await excluirProcedimento(deps, admin, "p1");

    expect(excluido).toEqual({ ok: true, valor: undefined });
    const depois = await listarProcedimentos(deps, admin);
    expect(depois.ok && depois.valor).toEqual([]);
    expect(memoria.procedimentos.has("p1")).toBe(false);
  });

  it("dado um recepcionista, quando cria ou edita, então recebe a mensagem de papel e nada muda", async () => {
    const original = memoria.semear({ id: "p1" });
    const deps = memoria.deps();

    const criou = await criarProcedimento(deps, recepcionista, ENTRADA);
    const editou = await editarProcedimento(deps, recepcionista, "p1", ENTRADA);

    expect(criou).toEqual({ ok: false, mensagem: "Ação não permitida para seu papel" });
    expect(editou).toEqual({ ok: false, mensagem: "Ação não permitida para seu papel" });
    expect(memoria.procedimentos.size).toBe(1);
    expect(memoria.procedimentos.get("p1")).toEqual(original);
  });

  it("dado um admin inativo, quando cria, então recebe a mensagem de papel", async () => {
    const resultado = await criarProcedimento(memoria.deps(), sessao("admin", false), ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: "Ação não permitida para seu papel" });
    expect(memoria.procedimentos.size).toBe(0);
  });

  it("dado um admin, quando cria ou edita, então passa pela mesma regra do dentista", async () => {
    memoria.semear({ id: "p1" });
    const deps = memoria.deps();

    const criou = await criarProcedimento(deps, admin, ENTRADA);
    const editou = await editarProcedimento(deps, admin, "p1", ENTRADA);

    expect(criou.ok && editou.ok).toBe(true);
  });

  it("dado procedimentos da clínica e de outra, quando lista, então devolve só os da clínica ordenados por nome", async () => {
    memoria.semear({ id: "p1", nome: "Restauração" });
    memoria.semear({ id: "p2", nome: "Avaliação" });
    memoria.semear({ id: "alheio", nome: "Alheio", clinicaId: "outra-clinica" });

    const lista = await listarProcedimentos(memoria.deps(), dentista);

    expect(lista.ok && lista.valor.map((item) => item.id)).toEqual(["p2", "p1"]);
  });

  it("dado um procedimento de outra clínica, quando se tenta editar ou excluir, então não é encontrado e nada muda", async () => {
    const alheio = memoria.semear({ id: "alheio", clinicaId: "outra-clinica" });
    const deps = memoria.deps();

    const editou = await editarProcedimento(deps, admin, "alheio", ENTRADA);
    const excluiu = await excluirProcedimento(deps, admin, "alheio");
    const inexistente = await excluirProcedimento(deps, admin, "nao-existe");

    expect(editou).toEqual({ ok: false, mensagem: "Procedimento não encontrado" });
    expect(excluiu).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(inexistente).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(memoria.procedimentos.get("alheio")).toEqual(alheio);
  });

  it("dado um nome em branco, quando cria ou edita, então bloqueia com Informe o nome", async () => {
    memoria.semear({ id: "p1" });
    const deps = memoria.deps();

    const criou = await criarProcedimento(deps, dentista, { ...ENTRADA, nome: "   " });
    const editou = await editarProcedimento(deps, dentista, "p1", { ...ENTRADA, nome: "" });

    expect(criou).toEqual({ ok: false, mensagem: MENSAGEM_NOME });
    expect(editou).toEqual({ ok: false, mensagem: "Informe o nome" });
    expect(memoria.procedimentos.size).toBe(1);
  });

  it("dado um nome com espaços nas pontas, quando cria, então grava o nome sem eles", async () => {
    const resultado = await criarProcedimento(memoria.deps(), dentista, {
      ...ENTRADA,
      nome: "  Limpeza  ",
    });

    expect(resultado.ok && resultado.valor.nome).toBe("Limpeza");
  });

  it.each([0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "dado o tempo médio %s, quando cria, então bloqueia com Informe o tempo médio",
    async (tempo) => {
      const resultado = await criarProcedimento(memoria.deps(), dentista, {
        ...ENTRADA,
        tempoMedioMinutos: tempo,
      });

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_TEMPO });
      expect(memoria.procedimentos.size).toBe(0);
    },
  );

  it.each([-1, 10.123, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "dado o valor médio %s, quando cria, então bloqueia com Informe o valor médio",
    async (valor) => {
      const resultado = await criarProcedimento(memoria.deps(), dentista, {
        ...ENTRADA,
        valorMedio: valor,
      });

      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_VALOR });
      expect(memoria.procedimentos.size).toBe(0);
    },
  );

  it.each([0, 150, 150.5, 19.99])(
    "dado o valor médio %s, quando cria, então aceita e guarda o número como está",
    async (valor) => {
      const resultado = await criarProcedimento(memoria.deps(), dentista, {
        ...ENTRADA,
        valorMedio: valor,
      });

      expect(resultado.ok && resultado.valor.valorMedio).toBe(valor);
    },
  );

  it("dado uma edição com tempo inválido, quando salva, então bloqueia e o procedimento não muda", async () => {
    const original = memoria.semear({ id: "p1" });

    const resultado = await editarProcedimento(memoria.deps(), dentista, "p1", {
      ...ENTRADA,
      tempoMedioMinutos: 0,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_TEMPO });
    expect(memoria.procedimentos.get("p1")).toEqual(original);
  });

  it("dado uma sessão cuja clínica não existe, quando cria, edita, exclui ou lista, então recebe Clínica não encontrada", async () => {
    memoria.semear({ id: "p1" });
    memoria.clinicas.clear();
    const deps = memoria.deps();
    const esperado = { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

    expect(MENSAGEM_CLINICA_NAO_ENCONTRADA).toBe("Clínica não encontrada");
    expect(await criarProcedimento(deps, admin, ENTRADA)).toEqual(esperado);
    expect(await editarProcedimento(deps, admin, "p1", ENTRADA)).toEqual(esperado);
    expect(await excluirProcedimento(deps, admin, "p1")).toEqual(esperado);
    expect(await listarProcedimentos(deps, admin)).toEqual(esperado);
    expect(memoria.procedimentos.size).toBe(1);
  });

  it.todo("Feature 017: dado um material do estoque, quando cria um procedimento com material, então o vínculo é salvo");
  it.todo("Feature 017: dado um procedimento existente, quando edita incluindo material, então o vínculo é atualizado");
  it.todo("Feature 006: dado um procedimento escolhido no agendamento, então a duração é pré-preenchida com o tempo médio");
  it.todo("Feature 006: dado um procedimento excluído, então o histórico de agendamentos permanece consistente");
});
