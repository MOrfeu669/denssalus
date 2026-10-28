import { beforeEach, describe, expect, it } from "vitest";
import type { Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL } from "../../src/domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../../src/domain/clinica/tipos";
import {
  baixarPorAtendimento,
  criarMaterial,
  historico,
  listarMateriais,
  listarMateriaisDaConsulta,
  reabastecer,
  vincularMaterial,
} from "../../src/domain/estoque/casos";
import {
  MENSAGEM_MATERIAL_JA_CADASTRADO,
  MENSAGEM_MATERIAL_NAO_ENCONTRADO,
  MENSAGEM_NOME,
  MENSAGEM_QUANTIDADE,
  MENSAGEM_QUANTIDADE_MINIMA,
  MENSAGEM_VALIDADE,
  type AjusteBaixa,
  type EntradaMaterial,
} from "../../src/domain/estoque/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../../src/domain/procedimento/tipos";
import { salvarEvolucao } from "../../src/domain/prontuario/casos";
import type { Dependencias as DependenciasProntuario } from "../../src/domain/prontuario/portas";
import type { Evolucao } from "../../src/domain/prontuario/tipos";
import { CLINICA_ID, HOJE, Memoria, OUTRA_CLINICA, sessao } from "./apoio-estoque";

const ENTRADA: EntradaMaterial = {
  nome: "Resina Composta",
  quantidade: 50,
  quantidadeMinima: 10,
  validade: "2027-01-01",
};
const SETEMBRO = new Date("2026-09-02T12:00:00.000Z");
const admin = sessao("admin");
const dentista = sessao("dentista");

describe("cadastro e reabastecimento de materiais", () => {
  let memoria: Memoria;
  beforeEach(() => {
    memoria = new Memoria();
  });

  it("dado um dentista, quando cadastra Resina Composta com 50, mínima 10 e validade 2027-01-01, então grava o material da clínica, o lote de 50 e a entrada com o usuário", async () => {
    const resultado = await criarMaterial(memoria.deps(), dentista, ENTRADA, HOJE);

    expect(resultado.ok && resultado.valor).toEqual({
      id: "id-1",
      clinicaId: CLINICA_ID,
      nome: "Resina Composta",
      quantidadeMinima: 10,
    });
    expect([...memoria.lotes.values()]).toEqual([
      { id: "id-2", materialId: "id-1", quantidade: 50, validade: "2027-01-01", criadoEm: HOJE.toISOString() },
    ]);
    expect(memoria.movimentacoes).toEqual([
      {
        id: "id-3",
        materialId: "id-1",
        loteId: "id-2",
        tipo: "entrada",
        quantidade: 50,
        usuarioId: "ator-dentista",
        agendamentoId: null,
        registradoEm: HOJE.toISOString(),
      },
    ]);
  });

  it("dado Resina Composta já cadastrada na clínica, quando cadastra o mesmo nome, então recebe Material já cadastrado e nada novo é gravado", async () => {
    memoria.material();

    const resultado = await criarMaterial(memoria.deps(), admin, ENTRADA, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_MATERIAL_JA_CADASTRADO });
    expect(memoria.materiais.size).toBe(1);
    expect(memoria.lotes.size).toBe(0);
  });

  it("dado o mesmo nome em outra clínica, quando cadastra, então aceita e a listagem não mostra o material da outra clínica", async () => {
    memoria.material({ id: "alheio", clinicaId: OUTRA_CLINICA });
    memoria.lote({ id: "l-alheio", materialId: "alheio" });

    const criado = await criarMaterial(memoria.deps(), admin, ENTRADA, HOJE);
    const lista = await listarMateriais(memoria.deps(), admin, HOJE);

    expect(criado.ok).toBe(true);
    expect(lista.ok && lista.valor.map((item) => item.clinicaId)).toEqual([CLINICA_ID]);
    expect(lista.ok && lista.valor.map((item) => item.quantidade)).toEqual([50]);
  });

  it.each([
    [{ nome: "   " }, MENSAGEM_NOME],
    [{ quantidade: 0 }, MENSAGEM_QUANTIDADE],
    [{ quantidade: 1.5 }, MENSAGEM_QUANTIDADE],
    [{ quantidadeMinima: -1 }, MENSAGEM_QUANTIDADE_MINIMA],
    [{ validade: "2027-02-30" }, MENSAGEM_VALIDADE],
    [{ validade: "01/01/2027" }, MENSAGEM_VALIDADE],
  ])("dado a entrada %j, quando cadastra, então bloqueia com a mensagem do campo", async (parcial, mensagem) => {
    const resultado = await criarMaterial(memoria.deps(), admin, { ...ENTRADA, ...parcial }, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem });
    expect(memoria.materiais.size).toBe(0);
  });

  it("dado material com lote restante 10 validade 2026-12-01 e aviso de mínimo, quando reabastece 40 validade 2027-06-01, então nasce o segundo lote, a quantidade válida fica 50 e o aviso continua", async () => {
    memoria.material({ quantidadeMinima: 10 });
    memoria.lote({ quantidade: 10, validade: "2026-12-01" });
    memoria.avisos.push({ id: "av-1", materialId: "m1", tipo: "estoque_minimo", texto: "Resina Composta: quantidade 10" });

    const resultado = await reabastecer(memoria.deps(), dentista, "m1", { quantidade: 40, validade: "2027-06-01" }, HOJE);
    const lista = await listarMateriais(memoria.deps(), dentista, HOJE);

    expect(resultado.ok && resultado.valor).toMatchObject({ materialId: "m1", quantidade: 40, validade: "2027-06-01" });
    expect(memoria.lotes.size).toBe(2);
    expect(lista.ok && lista.valor[0]?.quantidade).toBe(50);
    expect(memoria.movimentacoes.map((item) => [item.tipo, item.quantidade])).toEqual([["entrada", 40]]);
    expect(memoria.avisos.map((item) => item.id)).toEqual(["av-1"]);
  });

  it("dado material de outra clínica, quando reabastece, então recebe Material não encontrado", async () => {
    memoria.material({ clinicaId: OUTRA_CLINICA });

    const resultado = await reabastecer(memoria.deps(), admin, "m1", { quantidade: 5, validade: "2027-06-01" }, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_MATERIAL_NAO_ENCONTRADO });
    expect(memoria.lotes.size).toBe(0);
  });

  it("dado um vínculo existente, quando salva o mesmo par com outra quantidade, então atualiza a quantidade", async () => {
    memoria.material();
    memoria.procedimento("p1");
    memoria.vinculo("p1", 2);

    const resultado = await vincularMaterial(memoria.deps(), dentista, { procedimentoId: "p1", materialId: "m1", quantidade: 4 });

    expect(resultado.ok && resultado.valor.quantidade).toBe(4);
    expect([...memoria.vinculos.values()]).toEqual([{ procedimentoId: "p1", materialId: "m1", quantidade: 4 }]);
  });

  it("dado procedimento de outra clínica ou quantidade zero, quando vincula, então bloqueia", async () => {
    memoria.material();
    memoria.procedimento("alheio", OUTRA_CLINICA);
    const deps = memoria.deps();

    const alheio = await vincularMaterial(deps, admin, { procedimentoId: "alheio", materialId: "m1", quantidade: 1 });
    const zero = await vincularMaterial(deps, admin, { procedimentoId: "alheio", materialId: "m1", quantidade: 0 });

    expect(alheio).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(zero).toEqual({ ok: false, mensagem: MENSAGEM_QUANTIDADE });
    expect(memoria.vinculos.size).toBe(0);
  });

  it.each(["admin", "dentista", "recepcionista"] as const)("dado um %s, quando cadastra material, então cria", async (papel) => {
    const resultado = await criarMaterial(memoria.deps(), sessao(papel), ENTRADA, HOJE);

    expect(resultado.ok).toBe(true);
  });

  it("dado um usuário inativo, quando cadastra, então recebe a mensagem de papel", async () => {
    const resultado = await criarMaterial(memoria.deps(), sessao("admin", false), ENTRADA, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.materiais.size).toBe(0);
  });

  it("dado uma clínica inexistente, quando cadastra, então recebe Clínica não encontrada", async () => {
    memoria.clinicas.clear();

    const resultado = await criarMaterial(memoria.deps(), admin, ENTRADA, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA });
  });
});

describe("vencimento", () => {
  let memoria: Memoria;
  beforeEach(() => {
    memoria = new Memoria();
    memoria.material();
  });

  it("dado lote com validade 2026-09-01, quando hoje é 2026-09-02, então a quantidade válida é 0, grava vencimento sem usuário e sem agendamento e o lote permanece com 0", async () => {
    memoria.lote({ quantidade: 10, validade: "2026-09-01" });

    const lista = await listarMateriais(memoria.deps(), admin, SETEMBRO);

    expect(lista.ok && lista.valor[0]?.quantidade).toBe(0);
    expect(memoria.movimentacoes).toEqual([
      {
        id: "id-1",
        materialId: "m1",
        loteId: "l1",
        tipo: "vencimento",
        quantidade: 10,
        usuarioId: null,
        agendamentoId: null,
        registradoEm: SETEMBRO.toISOString(),
      },
    ]);
    expect(memoria.lotes.get("l1")?.quantidade).toBe(0);
  });

  it("dado lote com validade 2026-09-01, quando hoje é 2026-09-01, então o lote ainda vale", async () => {
    memoria.lote({ quantidade: 10, validade: "2026-09-01" });

    const lista = await listarMateriais(memoria.deps(), admin, new Date("2026-09-01T23:59:00.000Z"));

    expect(lista.ok && lista.valor[0]?.quantidade).toBe(10);
    expect(memoria.movimentacoes).toEqual([]);
  });

  it("dado lote já vencido e zerado, quando consulta o histórico duas vezes, então há um único vencimento", async () => {
    memoria.lote({ quantidade: 10, validade: "2026-09-01" });

    await historico(memoria.deps(), admin, "m1", SETEMBRO);
    const segunda = await historico(memoria.deps(), admin, "m1", SETEMBRO);

    expect(segunda.ok && segunda.valor.map((item) => item.tipo)).toEqual(["vencimento"]);
  });
});

describe("baixa na conclusão do atendimento", () => {
  let memoria: Memoria;
  const baixar = (ajustes: AjusteBaixa[] = []) =>
    baixarPorAtendimento(memoria.deps(), "a1", ajustes, "ator-dentista", HOJE);

  beforeEach(() => {
    memoria = new Memoria();
    memoria.material();
    memoria.procedimento("p1");
    memoria.agendamento({ procedimentoId: "p1" });
  });

  it("dado lotes de 10 (2026-12-01, criado antes) e 40 (2027-06-01), quando baixa 2, então sai só do primeiro", async () => {
    memoria.lote({ id: "l-cedo", quantidade: 10, validade: "2026-12-01" });
    memoria.lote({ id: "l-tarde", quantidade: 40, validade: "2027-06-01", criadoEm: "2026-01-02T00:00:00.000Z" });
    memoria.vinculo("p1", 2);

    await baixar();

    expect(memoria.lotes.get("l-cedo")?.quantidade).toBe(8);
    expect(memoria.lotes.get("l-tarde")?.quantidade).toBe(40);
  });

  it("dado dois lotes com a mesma validade, quando baixa 2, então consome o de criadoEm anterior", async () => {
    memoria.lote({ id: "l-novo", quantidade: 5, criadoEm: "2026-03-01T00:00:00.000Z" });
    memoria.lote({ id: "l-velho", quantidade: 5, criadoEm: "2026-02-01T00:00:00.000Z" });
    memoria.vinculo("p1", 2);

    await baixar();

    expect(memoria.lotes.get("l-velho")?.quantidade).toBe(3);
    expect(memoria.lotes.get("l-novo")?.quantidade).toBe(5);
  });

  it("dado vínculo de 2 e agendamento sem itens de plano, quando conclui, então 50 vira 48 e o log guarda o agendamento e a quantidade 2", async () => {
    memoria.lote();
    memoria.vinculo("p1", 2);

    await baixar();

    expect(memoria.quantidadeDosLotes()).toBe(48);
    expect(memoria.movimentacoes).toEqual([
      {
        id: "id-1",
        materialId: "m1",
        loteId: "l1",
        tipo: "baixa",
        quantidade: 2,
        usuarioId: "ator-dentista",
        agendamentoId: "a1",
        registradoEm: HOJE.toISOString(),
      },
    ]);
  });

  it("dado item de plano no agendamento, quando conclui, então a baixa usa o procedimento do item e não o avulso", async () => {
    memoria.lote();
    memoria.procedimento("p-item");
    memoria.vinculo("p1", 5);
    memoria.vinculo("p-item", 2);
    memoria.item("p-item");

    await baixar();

    expect(memoria.quantidadeDosLotes()).toBe(48);
  });

  it("dado agendamento inexistente ou sem procedimento, quando baixa, então resolve sem mexer no estoque", async () => {
    memoria.lote();
    memoria.agendamento({ id: "a2", procedimentoId: null });
    memoria.vinculo("p1", 2);

    await baixarPorAtendimento(memoria.deps(), "nao-existe", [], "ator-dentista", HOJE);
    await baixarPorAtendimento(memoria.deps(), "a2", [], "ator-dentista", HOJE);

    expect(memoria.quantidadeDosLotes()).toBe(50);
    expect(memoria.movimentacoes).toEqual([]);
  });

  it("dado 1 unidade válida e pedido de 2, quando baixa, então zera o lote sem lançar e avisa Resina Composta: faltou 1", async () => {
    memoria.lote({ quantidade: 1 });
    memoria.vinculo("p1", 2);

    await expect(baixar()).resolves.toBeUndefined();

    expect(memoria.lotes.get("l1")?.quantidade).toBe(0);
    expect(memoria.movimentacoes.map((item) => [item.tipo, item.quantidade])).toEqual([["baixa", 1]]);
    expect(memoria.avisos).toEqual([
      { id: "id-2", materialId: "m1", tipo: "estoque_insuficiente", texto: "Resina Composta: faltou 1" },
    ]);
  });

  it("dado vínculo de 2, quando o ajuste informa 3, então baixa 3 e o log guarda 3", async () => {
    memoria.lote();
    memoria.vinculo("p1", 2);

    await baixar([{ materialId: "m1", quantidade: 3 }]);

    expect(memoria.quantidadeDosLotes()).toBe(47);
    expect(memoria.movimentacoes.map((item) => item.quantidade)).toEqual([3]);
  });

  it("dado ajuste de material que não entra na conta, quando baixa, então o ajuste é ignorado", async () => {
    memoria.lote();
    memoria.material({ id: "m2", nome: "Anestésico" });
    memoria.lote({ id: "l2", materialId: "m2" });
    memoria.vinculo("p1", 2);

    await baixar([{ materialId: "m2", quantidade: 9 }]);

    expect(memoria.lotes.get("l2")?.quantidade).toBe(50);
    expect(memoria.lotes.get("l1")?.quantidade).toBe(48);
  });

  it("dado quantidade válida abaixo da mínima, quando baixa duas vezes, então grava um único aviso estoque_minimo com nome e quantidade", async () => {
    memoria.material({ quantidadeMinima: 10 });
    memoria.lote({ quantidade: 11 });
    memoria.vinculo("p1", 2);

    await baixar();
    await baixar();

    expect(memoria.avisos.map((item) => [item.tipo, item.texto])).toEqual([
      ["estoque_minimo", "Resina Composta: quantidade 9"],
    ]);
  });

  it("dado a consulta com procedimento vinculado, quando o dentista lista os materiais, então vê nome e quantidade padrão; outra clínica não encontra", async () => {
    memoria.lote();
    memoria.vinculo("p1", 2);
    memoria.clinicas.set(OUTRA_CLINICA, { ...memoria.clinicas.get(CLINICA_ID)!, id: OUTRA_CLINICA });

    const lista = await listarMateriaisDaConsulta(memoria.deps(), dentista, "a1", HOJE);
    const outra = await listarMateriaisDaConsulta(memoria.deps(), { usuario: { ...dentista.usuario, clinicaId: OUTRA_CLINICA } }, "a1", HOJE);

    expect(lista.ok && lista.valor).toEqual([{ materialId: "m1", nome: "Resina Composta", quantidade: 2 }]);
    expect(outra.ok).toBe(false);
  });

  it.todo("Feature 018: o sino mostra o alerta crítico de estoque mínimo e de estoque insuficiente");
  it.todo("Feature 019: o dashboard exibe em vermelho o alerta de estoque abaixo do mínimo");
});

describe("salvar evolução e baixa de estoque", () => {
  const AGORA = new Date("2026-10-28T15:00:00.000Z");

  function montar() {
    const memoria = new Memoria();
    const consulta: Agendamento = memoria.agendamento();
    const agendamentos = new Map([[consulta.id, consulta]]);
    const evolucoes = new Map<string, Evolucao>();
    const chamadas: unknown[][] = [];
    const deps: DependenciasProntuario = {
      anamneses: { buscar: async () => null, salvar: async () => {} },
      evolucoes: {
        buscar: async (id) => evolucoes.get(id) ?? null,
        listar: async () => [],
        salvar: async (evolucao) => {
          evolucoes.set(evolucao.agendamentoId, evolucao);
        },
      },
      auditoria: { registrar: async () => {}, listar: async () => [] },
      estoque: {
        baixar: async (...argumentos) => {
          chamadas.push(argumentos);
        },
      },
      concluirItensDoAgendamento: async () => {},
      gerarDebitosDoAtendimento: async () => {},
      agendamentos: {
        listar: async () => [...agendamentos.values()],
        buscarPorId: async (id) => agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      pacientes: { buscarPorId: async () => null },
      ids: { novo: () => "id-x" },
    };
    return { deps, chamadas };
  }

  it("dado uma consulta iniciada, quando salva a evolução com ajuste, então a porta baixar recebe agendamento, ajustes, usuário e data, e a segunda gravação não baixa de novo", async () => {
    const { deps, chamadas } = montar();
    const ajustes = [{ materialId: "m1", quantidade: 3 }];

    await salvarEvolucao(deps, dentista, "a1", "Restauração feita", AGORA, ajustes);
    await salvarEvolucao(deps, dentista, "a1", "Texto revisado", AGORA, ajustes);

    expect(chamadas).toEqual([["a1", ajustes, "ator-dentista", AGORA]]);
  });

  it("dado a chamada antiga sem ajustes, quando salva a evolução, então a porta recebe lista vazia", async () => {
    const { deps, chamadas } = montar();

    await salvarEvolucao(deps, dentista, "a1", "Restauração feita", AGORA);

    expect(chamadas).toEqual([["a1", [], "ator-dentista", AGORA]]);
  });
});
