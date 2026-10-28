import { describe, expect, it } from "vitest";
import type { Agendamento, BloqueioAgenda } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import type { Debito, Pagamento } from "../../src/domain/debito/tipos";
import type { Dentista } from "../../src/domain/dentista/tipos";
import type { Lote, Material } from "../../src/domain/estoque/tipos";
import type { ItemPlano } from "../../src/domain/plano/tipos";
import type { Procedimento } from "../../src/domain/procedimento/tipos";
import type { Protese } from "../../src/domain/protese/tipos";
import {
  definirCamposDoPapel,
  definirPreferencia,
  exportar,
  obterResumo,
} from "../../src/domain/dashboard/casos";
import type { Dependencias } from "../../src/domain/dashboard/portas";
import type { CampoDashboard, PedidoPeriodo } from "../../src/domain/dashboard/tipos";

const C1 = "clinica-001";
const C2 = "clinica-002";
const HOJE = new Date("2026-10-28T12:00:00.000Z");
const DIA: PedidoPeriodo = { tipo: "intervalo", inicio: "2026-10-28", fim: "2026-10-28" };

function clinica(id: string): Clinica {
  return {
    id,
    nome: `Clínica ${id}`,
    adminId: "x",
    diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
    horarioAbertura: "08:00",
    horarioFechamento: "18:00",
  };
}

function sessao(papel: Papel, clinicaId = C1, id = `u-${papel}`, ativo = true): Sessao {
  return { usuario: { id, nome: id, email: `${id}@x.com`, papel, clinicaId, ativo } };
}

function agendamento(p: Partial<Agendamento> & { id: string }): Agendamento {
  return {
    clinicaId: C1,
    pacienteId: "pac",
    dentistaId: "d1",
    cadeiraId: "cad",
    procedimentoId: null,
    inicio: "2026-10-28T10:00:00.000Z",
    fim: "2026-10-28T12:00:00.000Z",
    status: "concluido",
    iniciadoPor: null,
    emergencia: false,
    criadoPor: "u",
    alertaCadeira: false,
    alertaHorario: false,
    alertaDentista: false,
    motivoCancelamento: null,
    canceladoPor: null,
    canceladoEm: null,
    concluidoEm: "2026-10-28T12:00:00.000Z",
    ...p,
  };
}

function item(p: Partial<ItemPlano> & { id: string }): ItemPlano {
  return {
    planoId: "plano",
    procedimentoId: "proc-a",
    dentes: [11],
    valor: 250,
    agendamentoId: null,
    status: "concluido",
    executadoPor: "d1",
    concluidoEm: "2026-10-28T12:00:00.000Z",
    ...p,
  };
}

function protese(id: string, comissao: number | null, instaladaEm: string | null, clinicaId = C1): Protese {
  return {
    id,
    clinicaId,
    pacienteId: "pac",
    dentes: [11],
    tipo: "coroa",
    responsavelId: "d1",
    laboratorio: "Lab",
    procedimentoAvaliacaoId: null,
    procedimentoCirurgiaId: null,
    agendamentoInstalacaoId: null,
    etapa: instaladaEm ? "instalacao" : "pre_envio",
    status: "em_andamento",
    prazoRetorno: null,
    ajusteNecessario: null,
    valorComissao: comissao,
    alertaAtraso: false,
    historico: instaladaEm ? [{ etapa: "instalacao", usuarioId: "u", em: instaladaEm }] : [],
  };
}

class Memoria {
  clinicas = new Map<string, Clinica>([[C1, clinica(C1)], [C2, clinica(C2)]]);
  agendamentos: Agendamento[] = [];
  bloqueios: BloqueioAgenda[] = [];
  debitos: Debito[] = [];
  pagamentos: Pagamento[] = [];
  itens: ItemPlano[] = [];
  procedimentos: Procedimento[] = [];
  proteses: Protese[] = [];
  materiais: Material[] = [];
  lotes: Lote[] = [];
  dentistas: Dentista[] = [dentista("d1")];
  visibilidade = new Map<string, CampoDashboard[]>();
  preferencias = new Map<string, { widgetsOcultos: CampoDashboard[]; periodo: string }>();
  gravacoes = 0;

  deps(): Dependencias {
    return {
      agendamentos: { listar: async (c) => this.agendamentos.filter((x) => x.clinicaId === c) },
      bloqueios: { listar: async (c) => this.bloqueios.filter((x) => x.clinicaId === c) },
      debitos: { listar: async (c) => this.debitos.filter((x) => x.clinicaId === c) },
      pagamentos: {
        listarPorDebitos: async (ids) => this.pagamentos.filter((p) => ids.includes(p.debitoId)),
      },
      itens: { listarPorClinica: async () => this.itens },
      procedimentos: { listar: async (c) => this.procedimentos.filter((x) => x.clinicaId === c) },
      proteses: { listarPorClinica: async (c) => this.proteses.filter((x) => x.clinicaId === c) },
      materiais: { listar: async (c) => this.materiais.filter((x) => x.clinicaId === c) },
      lotes: { listarPorMaterial: async (m) => this.lotes.filter((l) => l.materialId === m) },
      dentistas: { listar: async (c) => this.dentistas.filter((x) => x.clinicaId === c) },
      clinicas: { buscarPorId: async (id) => this.clinicas.get(id) ?? null },
      visibilidade: {
        buscar: async (c, p) => this.visibilidade.get(`${c}:${p}`) ?? [],
        salvar: async (c, p, campos) => {
          this.gravacoes++;
          this.visibilidade.set(`${c}:${p}`, campos);
        },
      },
      preferencias: {
        buscar: async (u) => this.preferencias.get(u) ?? null,
        salvar: async (u, widgetsOcultos, periodo) => {
          this.gravacoes++;
          this.preferencias.set(u, { widgetsOcultos, periodo });
        },
      },
      ids: { novo: () => "id" },
    };
  }

  concluido(id: string, p: Partial<Agendamento> = {}, itens: Partial<ItemPlano>[] = []) {
    this.agendamentos.push(agendamento({ id, ...p }));
    itens.forEach((i, n) => this.itens.push(item({ id: `${id}-i${n}`, agendamentoId: id, ...i })));
  }

  debito(id: string, valor: number, desconto: number, pagoEm: string | null, clinicaId = C1) {
    this.debitos.push({
      id, clinicaId, pacienteId: "pac", origem: "item_plano", itemPlanoId: null,
      agendamentoId: "a", valor, desconto, descontoPor: null, status: pagoEm ? "quitado" : "em_aberto",
    });
    if (pagoEm) {
      this.pagamentos.push({ id: `pg-${id}`, debitoId: id, forma: "pix", data: pagoEm, registradoPor: "u" });
    }
  }
}

function dentista(id: string, ativo = true, clinicaId = C1): Dentista {
  return {
    id, usuarioId: `u-${id}`, clinicaId, nome: id, cro: "1", telefone: "1", cpf: "1",
    especialidades: [], ativo,
  };
}

async function ver(m: Memoria, pedido: PedidoPeriodo | null, ator = sessao("admin")) {
  const r = await obterResumo(m.deps(), ator, pedido, HOJE);
  if (!r.ok) throw new Error(r.mensagem);
  return r.valor;
}

const utf8 = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

describe("Dashboard — faturamento", () => {
  it("Dado item concluído (250) e avulso (valorMedio 100) no período, quando abre, então faturado 350 pela data de concluidoEm e item pendente não soma", async () => {
    const m = new Memoria();
    m.procedimentos.push({ id: "proc-b", clinicaId: C1, nome: "Limpeza", tempoMedioMinutos: 30, valorMedio: 100 });
    m.concluido("a1", {}, [{ valor: 250 }]);
    m.concluido("a2", { procedimentoId: "proc-b" });
    m.agendamentos.push(agendamento({ id: "a3", status: "iniciado", concluidoEm: null }));
    m.itens.push(item({ id: "pendente", agendamentoId: "a3", status: "pendente", valor: 999 }));
    // início em setembro, concluído em outubro: conta a data de concluidoEm
    m.concluido("a4", { inicio: "2026-09-30T10:00:00.000Z", fim: "2026-09-30T11:00:00.000Z", concluidoEm: "2026-09-30T11:00:00.000Z" }, [{ valor: 5000 }]);
    const { resumo } = await ver(m, DIA);
    expect(resumo.faturado).toBe(350);
  });

  it("Dado dois dentistas e dois procedimentos, quando abre, então separa o faturado por dentista e por procedimento", async () => {
    const m = new Memoria();
    m.dentistas.push(dentista("d2"));
    m.procedimentos.push({ id: "proc-b", clinicaId: C1, nome: "Limpeza", tempoMedioMinutos: 30, valorMedio: 100 });
    m.concluido("a1", { dentistaId: "d1" }, [{ valor: 250, procedimentoId: "proc-a", executadoPor: "outro" }]);
    m.concluido("a2", { dentistaId: "d2", procedimentoId: "proc-b" });
    m.concluido("a3", { dentistaId: "d2" }, [{ valor: 300, procedimentoId: "proc-a" }]);
    const { resumo } = await ver(m, DIA);
    expect(resumo.porDentista).toEqual([
      { dentistaId: "d1", valor: 250 },
      { dentistaId: "d2", valor: 400 },
    ]);
    expect(resumo.porProcedimento).toEqual([
      { procedimentoId: "proc-a", valor: 550 },
      { procedimentoId: "proc-b", valor: 100 },
    ]);
  });
});

describe("Dashboard — recebido e despesa", () => {
  it("Dado pagamento no período (200, desconto 50), quando abre, então recebido 150, faturado intacto, e fora do período/desconto total não somam", async () => {
    const m = new Memoria();
    m.concluido("a1", {}, [{ valor: 250 }]);
    m.debito("d-ok", 200, 50, "2026-10-28");
    m.debito("d-fora", 500, 0, "2026-10-20");
    m.debito("d-zero", 300, 300, "2026-10-28");
    m.debito("d-aberto", 80, 0, null);
    const { resumo } = await ver(m, DIA);
    expect(resumo.recebido).toBe(150);
    expect(resumo.faturado).toBe(250);
  });

  it("Dado comissão 800 com instalação no mês, quando abre, então despesaProtese 800 sem mexer em faturado/recebido; instalação fora fica de fora", async () => {
    const m = new Memoria();
    m.concluido("a1", {}, [{ valor: 250 }]);
    m.debito("d1", 100, 0, "2026-10-28");
    m.proteses.push(protese("p1", 800, "2026-10-15T10:00:00.000Z"));
    m.proteses.push(protese("p2", 300, "2026-09-15T10:00:00.000Z"));
    m.proteses.push(protese("p3", 400, null));
    m.proteses.push(protese("p4", null, "2026-10-15T10:00:00.000Z"));
    const { resumo } = await ver(m, { tipo: "mes" });
    expect(resumo.despesaProtese).toBe(800);
    expect(resumo.faturado).toBe(250);
    expect(resumo.recebido).toBe(100);
  });
});

describe("Dashboard — ocupação", () => {
  function dia() {
    const m = new Memoria();
    m.concluido("c1", { inicio: "2026-10-28T10:00:00.000Z", fim: "2026-10-28T12:00:00.000Z" });
    m.concluido("c2", { emergencia: true, inicio: "2026-10-28T14:00:00.000Z", fim: "2026-10-28T16:00:00.000Z" });
    m.agendamentos.push(
      agendamento({ id: "x", status: "cancelado", concluidoEm: null, inicio: "2026-10-28T16:00:00.000Z", fim: "2026-10-28T18:00:00.000Z" }),
    );
    return m;
  }

  it("Dado 2h comuns, 2h de emergência e 2h canceladas, capacidade 10, quando abre, então ocupacao 40", async () => {
    expect((await ver(dia(), DIA)).resumo.ocupacao).toBeCloseTo(40);
  });

  it("Dado bloqueio 08:00–10:00 no dia, quando abre, então a capacidade cai a 8 e ocupacao 50", async () => {
    const m = dia();
    m.bloqueios.push({ id: "b", clinicaId: C1, dentistaId: "d1", inicio: "2026-10-28T08:00:00.000Z", fim: "2026-10-28T10:00:00.000Z", motivo: null, criadoPor: "u" });
    m.bloqueios.push({ id: "b2", clinicaId: C1, dentistaId: "d1", inicio: "2026-10-28T06:00:00.000Z", fim: "2026-10-28T08:00:00.000Z", motivo: null, criadoPor: "u" });
    expect((await ver(m, DIA)).resumo.ocupacao).toBeCloseTo(50);
  });

  it("Dado nenhum dentista ativo, quando abre, então ocupacao 0", async () => {
    const m = dia();
    m.dentistas = [dentista("d1", false)];
    expect((await ver(m, DIA)).resumo.ocupacao).toBe(0);
  });
});

describe("Dashboard — período", () => {
  it("Dado fatos em 2026-10-01 e 2026-10-28, quando troca para últimos 7 dias, então faturado, recebido, despesa e ocupação mudam em relação ao mês", async () => {
    const m = new Memoria();
    m.concluido("a1", { inicio: "2026-10-01T10:00:00.000Z", fim: "2026-10-01T12:00:00.000Z", concluidoEm: "2026-10-01T12:00:00.000Z" }, [{ valor: 100 }]);
    m.concluido("a2", {}, [{ valor: 250 }]);
    m.debito("d1", 100, 0, "2026-10-01");
    m.debito("d2", 200, 50, "2026-10-28");
    m.proteses.push(protese("p1", 50, "2026-10-01T09:00:00.000Z"));
    m.proteses.push(protese("p2", 800, "2026-10-28T09:00:00.000Z"));
    const mes = (await ver(m, { tipo: "mes" })).resumo;
    const sete = (await ver(m, { tipo: "7dias" })).resumo;
    expect(sete.periodo).toEqual({ inicio: "2026-10-22", fim: "2026-10-28" });
    expect(mes.periodo).toEqual({ inicio: "2026-10-01", fim: "2026-10-31" });
    expect([mes.faturado, mes.recebido, mes.despesaProtese]).toEqual([350, 250, 850]);
    expect([sete.faturado, sete.recebido, sete.despesaProtese]).toEqual([250, 150, 800]);
    expect(mes.ocupacao).toBeCloseTo((4 / 220) * 100);
    expect(sete.ocupacao).toBeCloseTo((2 / 50) * 100);
  });

  it("Dado pedido nulo, quando há preferência salva, então usa o período salvo e devolve periodoSalvo; sem preferência cai em mes", async () => {
    const m = new Memoria();
    const sem = await ver(m, null);
    expect(sem.periodoSalvo).toBe("mes");
    expect(sem.resumo.periodo).toEqual({ inicio: "2026-10-01", fim: "2026-10-31" });
    m.preferencias.set("u-admin", { widgetsOcultos: [], periodo: "7dias" });
    const com = await ver(m, null);
    expect(com.periodoSalvo).toBe("7dias");
    expect(com.resumo.periodo.inicio).toBe("2026-10-22");
    m.preferencias.set("u-admin", { widgetsOcultos: [], periodo: "lixo" });
    expect((await ver(m, null)).periodoSalvo).toBe("mes");
  });

  it("Dado intervalo inválido, quando abre, então Informe o período", async () => {
    const m = new Memoria();
    for (const inicio of ["28/10/2026", "2026-10-29"]) {
      const r = await obterResumo(m.deps(), sessao("admin"), { tipo: "intervalo", inicio, fim: "2026-10-28" }, HOJE);
      expect(r).toEqual({ ok: false, mensagem: "Informe o período" });
    }
  });
});

describe("Dashboard — visibilidade", () => {
  it("Dado admin oculta faturamento da recepcionista, quando ela abre, então o número continua no resumo e ocultos contém faturamento", async () => {
    const m = new Memoria();
    m.concluido("a1", {}, [{ valor: 250 }]);
    const salvo = await definirCamposDoPapel(m.deps(), sessao("admin"), "recepcionista", ["faturamento"]);
    expect(salvo.ok).toBe(true);
    const visao = await ver(m, DIA, sessao("recepcionista"));
    expect(visao.resumo.faturado).toBe(250);
    expect(visao.ocultos).toEqual(["faturamento"]);
    expect((await ver(m, DIA, sessao("dentista"))).ocultos).toEqual([]);
  });

  it("Dado preferência de um usuário (ocultar ocupacao), quando outro abre, então não entra na visão dele; para quem tem os dois cortes eles se somam", async () => {
    const m = new Memoria();
    const rec1 = sessao("recepcionista", C1, "rec1");
    const rec2 = sessao("recepcionista", C1, "rec2");
    await definirCamposDoPapel(m.deps(), sessao("admin"), "recepcionista", ["faturamento"]);
    const pref = await definirPreferencia(m.deps(), rec1, { widgetsOcultos: ["ocupacao", "faturamento"], periodo: "7dias" });
    expect(pref.ok).toBe(true);
    expect((await ver(m, DIA, rec1)).ocultos).toEqual(["faturamento", "ocupacao"]);
    expect((await ver(m, DIA, rec2)).ocultos).toEqual(["faturamento"]);
    expect(m.preferencias.has("rec2")).toBe(false);
  });

  it("Dado entradas inválidas, quando define preferência ou campos, então Campo inválido / Informe o período e nada é gravado", async () => {
    const m = new Memoria();
    const rec = sessao("recepcionista");
    expect(await definirPreferencia(m.deps(), rec, { widgetsOcultos: ["x"], periodo: "mes" })).toEqual({ ok: false, mensagem: "Campo inválido" });
    expect(await definirPreferencia(m.deps(), rec, { widgetsOcultos: ["estoque", "estoque"], periodo: "mes" })).toEqual({ ok: false, mensagem: "Campo inválido" });
    expect(await definirPreferencia(m.deps(), rec, { widgetsOcultos: [], periodo: "ontem" })).toEqual({ ok: false, mensagem: "Informe o período" });
    expect(await definirCamposDoPapel(m.deps(), sessao("admin"), "dentista", ["nada"])).toEqual({ ok: false, mensagem: "Campo inválido" });
    expect(m.gravacoes).toBe(0);
    expect((await definirPreferencia(m.deps(), rec, { widgetsOcultos: [], periodo: "2026-10-01/2026-10-10" })).ok).toBe(true);
    expect(m.preferencias.get("u-recepcionista")).toEqual({ widgetsOcultos: [], periodo: "2026-10-01/2026-10-10" });
  });
});

describe("Dashboard — estoque", () => {
  it("Dado material abaixo do mínimo, lote vencido e quantidade igual ao mínimo, quando abre, então só o abaixo entra, sem contar o vencido", async () => {
    const m = new Memoria();
    m.materiais.push(
      { id: "m1", clinicaId: C1, nome: "Luvas", quantidadeMinima: 20 },
      { id: "m2", clinicaId: C1, nome: "Anestésico", quantidadeMinima: 10 },
      { id: "m3", clinicaId: C1, nome: "Algodão", quantidadeMinima: 10 },
    );
    m.lotes.push(
      { id: "l1", materialId: "m1", quantidade: 15, validade: "2027-01-01", criadoEm: "2026-01-01" },
      { id: "l2", materialId: "m1", quantidade: 50, validade: "2026-10-01", criadoEm: "2026-01-01" },
      { id: "l3", materialId: "m2", quantidade: 10, validade: "2027-01-01", criadoEm: "2026-01-01" },
      { id: "l4", materialId: "m3", quantidade: 40, validade: "2026-10-01", criadoEm: "2026-01-01" },
    );
    const { resumo } = await ver(m, DIA);
    expect(resumo.estoque).toEqual([
      { materialId: "m3", nome: "Algodão", quantidade: 0 },
      { materialId: "m1", nome: "Luvas", quantidade: 15 },
    ]);
    expect(m.lotes).toHaveLength(4);
  });
});

describe("Dashboard — papéis", () => {
  it("Dado admin, dentista e recepcionista, quando abrem, então todos leem; usuário inativo recebe MENSAGEM_PAPEL", async () => {
    const m = new Memoria();
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      expect((await obterResumo(m.deps(), sessao(papel), DIA, HOJE)).ok).toBe(true);
    }
    const inativo = await obterResumo(m.deps(), sessao("admin", C1, "i", false), DIA, HOJE);
    expect(inativo).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("Dado dentista ou recepcionista, quando tenta definirCamposDoPapel, então MENSAGEM_PAPEL e nada é gravado", async () => {
    const m = new Memoria();
    for (const papel of ["dentista", "recepcionista"] as const) {
      const r = await definirCamposDoPapel(m.deps(), sessao(papel), "recepcionista", ["faturamento"]);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    }
    expect(m.gravacoes).toBe(0);
  });
});

describe("Dashboard — outra clínica e exportação", () => {
  function comDados() {
    const m = new Memoria();
    m.concluido("a1", {}, [{ valor: 250 }]);
    m.debito("d1", 200, 0, "2026-10-28");
    m.proteses.push(protese("p1", 800, "2026-10-28T09:00:00.000Z"));
    m.materiais.push({ id: "m1", clinicaId: C1, nome: "Luvas", quantidadeMinima: 20 });
    m.lotes.push({ id: "l1", materialId: "m1", quantidade: 15, validade: "2027-01-01", criadoEm: "2026-01-01" });
    return m;
  }

  it("Dado dados da clínica 1, quando usuário da clínica 2 abre, então não vê faturamento, pagamento, despesa nem estoque", async () => {
    const m = comDados();
    const { resumo } = await ver(m, DIA, sessao("admin", C2, "outro-admin"));
    expect(resumo).toMatchObject({ faturado: 0, recebido: 0, despesaProtese: 0, ocupacao: 0, estoque: [], porDentista: [], porProcedimento: [] });
  });

  it("Dado faturamento oculto, quando exporta PDF e Excel, então ambos omitem o faturamento; PDF começa com %PDF e Excel tem Workbook", async () => {
    const m = comDados();
    await definirCamposDoPapel(m.deps(), sessao("admin"), "recepcionista", ["faturamento"]);
    const rec = sessao("recepcionista");
    const pdf = await exportar(m.deps(), rec, DIA, "pdf", HOJE);
    const xls = await exportar(m.deps(), rec, DIA, "excel", HOJE);
    if (!pdf.ok || !xls.ok) throw new Error("exportação falhou");
    expect(pdf.valor).toMatchObject({ nome: "dashboard.pdf", mediaType: "application/pdf" });
    expect(utf8(pdf.valor.bytes.slice(0, 4))).toBe("%PDF");
    expect(utf8(pdf.valor.bytes)).not.toContain("Total faturado");
    expect(utf8(pdf.valor.bytes)).toContain("Total recebido");
    expect(xls.valor).toMatchObject({ nome: "dashboard.xls", mediaType: "application/vnd.ms-excel" });
    const xml = new TextDecoder().decode(xls.valor.bytes);
    expect(xml).toContain("<Workbook");
    expect(xml).toContain("urn:schemas-microsoft-com:office:spreadsheet");
    expect(xml).not.toContain("Total faturado");
    expect(xml).toContain("Luvas — 15 unidades restantes");
    const completo = await exportar(m.deps(), sessao("admin"), DIA, "excel", HOJE);
    if (!completo.ok) throw new Error("exportação falhou");
    expect(new TextDecoder().decode(completo.valor.bytes)).toContain("Total faturado");
  });

  it("Dado papel sem acesso, quando exporta, então MENSAGEM_PAPEL", async () => {
    const m = comDados();
    const r = await exportar(m.deps(), sessao("admin", C1, "i", false), DIA, "pdf", HOJE);
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });
});
