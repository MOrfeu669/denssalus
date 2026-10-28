import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO, type Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_DENTISTA_NAO_ENCONTRADO, type Dentista } from "../../src/domain/dentista/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO, type Procedimento } from "../../src/domain/procedimento/tipos";
import {
  conferirRetorno,
  configurarAtraso,
  descontinuarProtese,
  instalarProtese,
  listarPorDente,
  listarProteses,
  listarResponsaveis,
  obterLimiteAtraso,
  registrarEnvio,
  registrarPedido,
} from "../../src/domain/protese/casos";
import type { Dependencias } from "../../src/domain/protese/portas";
import {
  LIMITE_ATRASO_PADRAO,
  MENSAGEM_AJUSTE,
  MENSAGEM_ANDAMENTO,
  MENSAGEM_COMISSAO,
  MENSAGEM_CONFERENCIA,
  MENSAGEM_DENTE,
  MENSAGEM_DENTE_INVALIDO,
  MENSAGEM_INSTALACAO,
  MENSAGEM_LABORATORIO,
  MENSAGEM_LIMITE,
  MENSAGEM_PRAZO,
  MENSAGEM_PROTESE_NAO_ENCONTRADA,
  MENSAGEM_SAIDA,
  MENSAGEM_TIPO,
  type AvisoProtese,
  type ConfigAtrasoProtese,
  type EntradaPedidoProtese,
  type Protese,
} from "../../src/domain/protese/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const PACIENTE_EXTERNO = "paciente-externo";
const DENTISTA_ANA = "dentista-ana";
const AGORA = new Date("2026-10-20T12:00:00.000Z");

class Memoria {
  proteses = new Map<string, Protese>();
  configs = new Map<string, ConfigAtrasoProtese>();
  avisos = new Map<string, AvisoProtese>();
  pacientes = new Map<string, Paciente>();
  dentistas = new Map<string, Dentista>();
  procedimentos = new Map<string, Procedimento>();
  agendamentos = new Map<string, Agendamento>();
  proximoId = 0;

  deps(): Dependencias {
    return {
      proteses: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.proteses.values()].filter((p) => p.clinicaId === clinicaId && p.pacienteId === pacienteId),
        buscarPorId: async (id) => this.proteses.get(id) ?? null,
        salvar: async (protese) => {
          this.proteses.set(protese.id, protese);
        },
      },
      configuracoes: {
        buscar: async (clinicaId) => this.configs.get(clinicaId) ?? null,
        salvar: async (config) => {
          this.configs.set(config.clinicaId, config);
        },
      },
      avisos: {
        buscarPorProtese: async (proteseId) =>
          [...this.avisos.values()].find((a) => a.proteseId === proteseId) ?? null,
        salvar: async (aviso) => {
          this.avisos.set(aviso.id, aviso);
        },
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      dentistas: {
        buscarPorId: async (id) => this.dentistas.get(id) ?? null,
        listar: async (clinicaId) => [...this.dentistas.values()].filter((d) => d.clinicaId === clinicaId),
      },
      procedimentos: { buscarPorId: async (id) => this.procedimentos.get(id) ?? null },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }
}

function paciente(id: string, clinicaId: string): Paciente {
  return {
    id,
    clinicaId,
    nome: "Paciente",
    canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
  };
}

function dentista(id: string, clinicaId: string, ativo = true): Dentista {
  return {
    id,
    usuarioId: `usuario-${id}`,
    clinicaId,
    nome: `Dra. ${id}`,
    cro: "CRO-SP 0000",
    telefone: "11 90000-0000",
    cpf: "000.000.000-00",
    especialidades: [],
    ativo,
  };
}

function sessao(papel: Papel, ativo = true, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: { id: `ator-${papel}`, nome: "Ator", email: `${papel}@clinica.com`, papel, clinicaId, ativo },
  };
}

function pedido(extra: Partial<EntradaPedidoProtese> = {}): EntradaPedidoProtese {
  return {
    pacienteId: PACIENTE_JOAO,
    dentes: [14, 15, 16],
    tipo: "Coroa",
    responsavelId: DENTISTA_ANA,
    laboratorio: "Lab Sorriso",
    ...extra,
  };
}

describe("protese", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, CLINICA_ID));
    memoria.pacientes.set(PACIENTE_EXTERNO, paciente(PACIENTE_EXTERNO, OUTRA_CLINICA));
    memoria.dentistas.set(DENTISTA_ANA, dentista(DENTISTA_ANA, CLINICA_ID));
  });

  async function semear(extra: Partial<EntradaPedidoProtese> = {}) {
    const r = await registrarPedido(memoria.deps(), sessao("dentista"), pedido(extra), AGORA);
    if (!r.ok) throw new Error("semente");
    return r.valor;
  }

  async function semearEnviada(prazoRetorno = "2026-11-01") {
    const base = await semear();
    const r = await registrarEnvio(
      memoria.deps(),
      sessao("recepcionista"),
      { proteseId: base.id, prazoRetorno },
      AGORA,
    );
    if (!r.ok) throw new Error("semente");
    return r.valor;
  }

  async function semearConferida(ajusteNecessario: string | null = null) {
    const enviada = await semearEnviada();
    const r = await conferirRetorno(
      memoria.deps(),
      sessao("dentista"),
      { proteseId: enviada.id, ajusteNecessario },
      AGORA,
    );
    if (!r.ok) throw new Error("semente");
    return r.valor;
  }

  it("dado os dentes 14, 15 e 16, quando o dentista registra a coroa, então nasce em pré-envio e em andamento com a primeira passagem", async () => {
    const r = await registrarPedido(memoria.deps(), sessao("dentista"), pedido(), AGORA);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor).toEqual({
      id: "id-1",
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentes: [14, 15, 16],
      tipo: "Coroa",
      responsavelId: DENTISTA_ANA,
      laboratorio: "Lab Sorriso",
      procedimentoAvaliacaoId: null,
      procedimentoCirurgiaId: null,
      agendamentoInstalacaoId: null,
      etapa: "pre_envio",
      status: "em_andamento",
      prazoRetorno: null,
      ajusteNecessario: null,
      valorComissao: null,
      alertaAtraso: false,
      historico: [{ etapa: "pre_envio", usuarioId: "ator-dentista", em: AGORA.toISOString() }],
    });
    expect(memoria.proteses.get("id-1")).toEqual(r.valor);
  });

  it("dado dentes repetidos, quando registra o pedido, então grava sem repetir na ordem informada", async () => {
    const r = await registrarPedido(memoria.deps(), sessao("dentista"), pedido({ dentes: [16, 14, 16, 15, 14] }), AGORA);

    expect(r.ok && r.valor.dentes).toEqual([16, 14, 15]);
  });

  it("dado ids de procedimento vazios, quando registra, então viram nulo; ids da clínica são aceitos e de fora são recusados", async () => {
    memoria.procedimentos.set("proc-1", { id: "proc-1", clinicaId: CLINICA_ID } as Procedimento);
    memoria.procedimentos.set("proc-x", { id: "proc-x", clinicaId: OUTRA_CLINICA } as Procedimento);
    const deps = memoria.deps();
    const dentistaAtor = sessao("dentista");

    const vazios = await registrarPedido(
      deps,
      dentistaAtor,
      pedido({ procedimentoAvaliacaoId: "", procedimentoCirurgiaId: null }),
      AGORA,
    );
    const validos = await registrarPedido(
      deps,
      dentistaAtor,
      pedido({ procedimentoAvaliacaoId: "proc-1", procedimentoCirurgiaId: "proc-1" }),
      AGORA,
    );
    const alheio = await registrarPedido(deps, dentistaAtor, pedido({ procedimentoCirurgiaId: "proc-x" }), AGORA);
    const ausente = await registrarPedido(deps, dentistaAtor, pedido({ procedimentoAvaliacaoId: "nada" }), AGORA);

    expect(vazios.ok && [vazios.valor.procedimentoAvaliacaoId, vazios.valor.procedimentoCirurgiaId]).toEqual([null, null]);
    expect(validos.ok && [validos.valor.procedimentoAvaliacaoId, validos.valor.procedimentoCirurgiaId]).toEqual([
      "proc-1",
      "proc-1",
    ]);
    expect(alheio).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(ausente).toEqual({ ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO });
    expect(memoria.proteses.size).toBe(2);
  });

  it("dado um pedido sem dente, dente 99, sem tipo ou sem laboratório, quando registra, então devolve a mensagem própria e não grava", async () => {
    const deps = memoria.deps();
    const ator = sessao("dentista");

    const semDente = await registrarPedido(deps, ator, pedido({ dentes: [] }), AGORA);
    const invalido = await registrarPedido(deps, ator, pedido({ dentes: [14, 99] }), AGORA);
    const nan = await registrarPedido(deps, ator, pedido({ dentes: [Number.NaN] }), AGORA);
    const semTipo = await registrarPedido(deps, ator, pedido({ tipo: "   " }), AGORA);
    const semLab = await registrarPedido(deps, ator, pedido({ laboratorio: "" }), AGORA);

    expect(semDente).toEqual({ ok: false, mensagem: MENSAGEM_DENTE });
    expect(invalido).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
    expect(nan).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
    expect(semTipo).toEqual({ ok: false, mensagem: MENSAGEM_TIPO });
    expect(semLab).toEqual({ ok: false, mensagem: MENSAGEM_LABORATORIO });
    expect(memoria.proteses.size).toBe(0);
  });

  it("dado responsável inativo, de outra clínica ou inexistente, quando registra, então devolve Dentista não encontrado", async () => {
    memoria.dentistas.set("inativo", dentista("inativo", CLINICA_ID, false));
    memoria.dentistas.set("externo", dentista("externo", OUTRA_CLINICA));
    const deps = memoria.deps();

    for (const responsavelId of ["inativo", "externo", "fantasma"]) {
      const r = await registrarPedido(deps, sessao("dentista"), pedido({ responsavelId }), AGORA);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO });
    }
    expect(memoria.proteses.size).toBe(0);
  });

  it("dado admin, dentista e recepcionista ativos, quando registram, então todos conseguem; papel inativo recebe Ação não permitida", async () => {
    const deps = memoria.deps();

    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const r = await registrarPedido(deps, sessao(papel), pedido(), AGORA);
      expect(r.ok && r.valor.historico[0].usuarioId).toBe(`ator-${papel}`);
    }
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const r = await registrarPedido(deps, sessao(papel, false), pedido(), AGORA);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    }
    expect(memoria.proteses.size).toBe(3);
  });

  it("dado o pedido em pré-envio, quando a recepcionista registra a saída com retorno 2026-11-01, então vai ao acompanhamento e conserva o histórico", async () => {
    const base = await semear();
    const quando = new Date("2026-10-21T09:00:00.000Z");

    const r = await registrarEnvio(
      memoria.deps(),
      sessao("recepcionista"),
      { proteseId: base.id, prazoRetorno: "2026-11-01" },
      quando,
    );

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.etapa).toBe("envio_acompanhamento");
    expect(r.valor.prazoRetorno).toBe("2026-11-01");
    expect(r.valor.historico).toEqual([
      { etapa: "pre_envio", usuarioId: "ator-dentista", em: AGORA.toISOString() },
      { etapa: "envio_acompanhamento", usuarioId: "ator-recepcionista", em: quando.toISOString() },
    ]);
  });

  it("dado prazo inválido, quando registra a saída, então devolve Informe o prazo e não muda a etapa", async () => {
    const base = await semear();

    for (const prazoRetorno of ["", "01/11/2026", "2026-02-30", "2026-13-01"]) {
      const r = await registrarEnvio(memoria.deps(), sessao("recepcionista"), { proteseId: base.id, prazoRetorno }, AGORA);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PRAZO });
    }
    expect(memoria.proteses.get(base.id)?.etapa).toBe("pre_envio");
  });

  it("dado prazo com horário, quando registra a saída, então grava só a data de 10 caracteres", async () => {
    const base = await semear();

    const r = await registrarEnvio(
      memoria.deps(),
      sessao("dentista"),
      { proteseId: base.id, prazoRetorno: "2026-11-01T15:30:00.000Z" },
      AGORA,
    );

    expect(r.ok && r.valor.prazoRetorno).toBe("2026-11-01");
  });

  it("dado etapas fora de ordem, quando tenta saída, conferência ou instalação, então devolve a mensagem da etapa", async () => {
    const deps = memoria.deps();
    const ator = sessao("dentista");
    const emPreEnvio = await semear();
    const enviada = await semearEnviada();

    const conferirCedo = await conferirRetorno(deps, ator, { proteseId: emPreEnvio.id }, AGORA);
    const instalarCedo = await instalarProtese(deps, ator, { proteseId: enviada.id, valorComissao: 10 }, AGORA);
    const enviarDeNovo = await registrarEnvio(deps, ator, { proteseId: enviada.id, prazoRetorno: "2026-11-02" }, AGORA);

    expect(conferirCedo).toEqual({ ok: false, mensagem: MENSAGEM_CONFERENCIA });
    expect(instalarCedo).toEqual({ ok: false, mensagem: MENSAGEM_INSTALACAO });
    expect(enviarDeNovo).toEqual({ ok: false, mensagem: MENSAGEM_SAIDA });
    expect(memoria.proteses.get(enviada.id)?.prazoRetorno).toBe("2026-11-01");
  });

  it("dado conferência com ajuste, quando tenta instalar, então devolve A prótese ainda precisa de ajuste e nada muda", async () => {
    const conferida = await semearConferida("  Ajustar oclusão  ");

    const r = await instalarProtese(memoria.deps(), sessao("dentista"), { proteseId: conferida.id, valorComissao: 150 }, AGORA);

    expect(conferida.ajusteNecessario).toBe("Ajustar oclusão");
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_AJUSTE });
    expect(memoria.proteses.get(conferida.id)).toEqual(conferida);
  });

  it("dado conferência sem ajuste, quando instala com comissão 150, então grava a comissão e conclui na instalação", async () => {
    memoria.agendamentos.set("ag-1", { id: "ag-1", clinicaId: CLINICA_ID, pacienteId: PACIENTE_JOAO } as Agendamento);
    const conferida = await semearConferida("   ");
    const quando = new Date("2026-10-25T10:00:00.000Z");

    const r = await instalarProtese(
      memoria.deps(),
      sessao("dentista"),
      { proteseId: conferida.id, valorComissao: 150, agendamentoInstalacaoId: "ag-1" },
      quando,
    );

    expect(conferida.ajusteNecessario).toBeNull();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.etapa).toBe("instalacao");
    expect(r.valor.status).toBe("concluida");
    expect(r.valor.valorComissao).toBe(150);
    expect(r.valor.agendamentoInstalacaoId).toBe("ag-1");
    expect(r.valor.historico.map((p) => p.etapa)).toEqual([
      "pre_envio",
      "envio_acompanhamento",
      "recebimento_conferencia",
      "instalacao",
    ]);
    expect(r.valor.historico[3].em).toBe(quando.toISOString());
  });

  it("dado comissão negativa, ausente ou infinita, quando instala, então devolve Informe a comissão; zero é aceito", async () => {
    const conferida = await semearConferida();
    const deps = memoria.deps();
    const ator = sessao("dentista");

    for (const valorComissao of [-1, Number.NaN, Number.POSITIVE_INFINITY, undefined as unknown as number]) {
      const r = await instalarProtese(deps, ator, { proteseId: conferida.id, valorComissao }, AGORA);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_COMISSAO });
    }
    expect(memoria.proteses.get(conferida.id)?.status).toBe("em_andamento");

    const zero = await instalarProtese(deps, ator, { proteseId: conferida.id, valorComissao: 0 }, AGORA);
    expect(zero.ok && zero.valor.valorComissao).toBe(0);
    expect(zero.ok && zero.valor.status).toBe("concluida");
  });

  it("dado agendamento de outro paciente ou de outra clínica, quando instala, então devolve Agendamento não encontrado", async () => {
    memoria.agendamentos.set("ag-outro", { id: "ag-outro", clinicaId: CLINICA_ID, pacienteId: "maria" } as Agendamento);
    memoria.agendamentos.set("ag-fora", { id: "ag-fora", clinicaId: OUTRA_CLINICA, pacienteId: PACIENTE_JOAO } as Agendamento);
    const conferida = await semearConferida();

    for (const agendamentoInstalacaoId of ["ag-outro", "ag-fora", "ag-nada"]) {
      const r = await instalarProtese(
        memoria.deps(),
        sessao("dentista"),
        { proteseId: conferida.id, valorComissao: 10, agendamentoInstalacaoId },
        AGORA,
      );
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    }
    expect(memoria.proteses.get(conferida.id)?.status).toBe("em_andamento");
  });

  it("dado o pedido no envio, quando descontinua, então o status vira descontinuada, a etapa fica e as passagens anteriores permanecem", async () => {
    const enviada = await semearEnviada();

    const r = await descontinuarProtese(memoria.deps(), sessao("recepcionista"), enviada.id, AGORA);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.status).toBe("descontinuada");
    expect(r.valor.etapa).toBe("envio_acompanhamento");
    expect(r.valor.historico).toEqual(enviada.historico);
  });

  it("dado pedido já descontinuado ou concluído, quando age sobre ele, então devolve O pedido não está em andamento", async () => {
    const enviada = await semearEnviada();
    const deps = memoria.deps();
    const ator = sessao("dentista");
    await descontinuarProtese(deps, ator, enviada.id, AGORA);

    const descontinuarDeNovo = await descontinuarProtese(deps, ator, enviada.id, AGORA);
    const conferir = await conferirRetorno(deps, ator, { proteseId: enviada.id }, AGORA);

    expect(descontinuarDeNovo).toEqual({ ok: false, mensagem: MENSAGEM_ANDAMENTO });
    expect(conferir).toEqual({ ok: false, mensagem: MENSAGEM_ANDAMENTO });
    expect(memoria.proteses.get(enviada.id)?.etapa).toBe("envio_acompanhamento");
  });

  it("dado limite 15 e prazo 2026-11-01, quando lista em 2026-11-16, então nasce o aviso e o alerta liga; a segunda listagem não cria outro", async () => {
    const enviada = await semearEnviada("2026-11-01");
    const deps = memoria.deps();
    const dia16 = new Date("2026-11-16T12:00:00.000Z");

    const primeira = await listarProteses(deps, sessao("recepcionista"), PACIENTE_JOAO, dia16);
    const segunda = await listarProteses(deps, sessao("recepcionista"), PACIENTE_JOAO, new Date("2026-11-17T12:00:00.000Z"));

    expect(primeira.ok && primeira.valor.map((p) => p.alertaAtraso)).toEqual([true]);
    expect(segunda.ok && segunda.valor.map((p) => p.alertaAtraso)).toEqual([true]);
    expect(memoria.proteses.get(enviada.id)?.alertaAtraso).toBe(true);
    expect([...memoria.avisos.values()]).toEqual([
      {
        id: "id-2",
        clinicaId: CLINICA_ID,
        proteseId: enviada.id,
        tipo: "atraso_protese",
        criadoEm: dia16.toISOString(),
      },
    ]);
  });

  it("dado limite 15 e prazo 2026-11-01, quando lista em 2026-11-15, então ainda não atrasa", async () => {
    const enviada = await semearEnviada("2026-11-01");

    const r = await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-11-15T23:59:59.000Z"));

    expect(r.ok && r.valor[0].alertaAtraso).toBe(false);
    expect(memoria.proteses.get(enviada.id)?.alertaAtraso).toBe(false);
    expect(memoria.avisos.size).toBe(0);
  });

  it("dado limite configurado em 20, quando lista em 2026-11-16, então não atrasa e atrasa em 2026-11-21", async () => {
    await semearEnviada("2026-11-01");
    await configurarAtraso(memoria.deps(), sessao("admin"), 20);

    const cedo = await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-11-16T12:00:00.000Z"));
    const tarde = await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-11-21T00:00:00.000Z"));

    expect(cedo.ok && cedo.valor[0].alertaAtraso).toBe(false);
    expect(tarde.ok && tarde.valor[0].alertaAtraso).toBe(true);
    expect(memoria.avisos.size).toBe(1);
  });

  it("dado peça já conferida, quando lista em 2026-11-16, então não gera aviso nem liga o alerta", async () => {
    const conferida = await semearConferida();

    const r = await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-11-16T12:00:00.000Z"));

    expect(r.ok && r.valor.map((p) => [p.id, p.alertaAtraso])).toEqual([[conferida.id, false]]);
    expect(memoria.avisos.size).toBe(0);
  });

  it("dado peça descontinuada no envio, quando lista depois do prazo, então não gera aviso", async () => {
    const enviada = await semearEnviada("2026-11-01");
    await descontinuarProtese(memoria.deps(), sessao("dentista"), enviada.id, AGORA);

    const r = await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-12-31T12:00:00.000Z"));

    expect(r.ok && r.valor[0].alertaAtraso).toBe(false);
    expect(memoria.avisos.size).toBe(0);
  });

  it("dado alerta já nascido, quando confere o retorno, então o alerta é mantido", async () => {
    const enviada = await semearEnviada("2026-11-01");
    await listarProteses(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, new Date("2026-11-16T12:00:00.000Z"));

    const r = await conferirRetorno(memoria.deps(), sessao("dentista"), { proteseId: enviada.id }, AGORA);

    expect(r.ok && r.valor.alertaAtraso).toBe(true);
    expect(r.ok && r.valor.etapa).toBe("recebimento_conferencia");
  });

  it("dado próteses em dentes diferentes, quando lista por dente, então devolve só as que incluem o dente; dente inválido é recusado", async () => {
    const coroa = await semear();
    await semear({ dentes: [26], tipo: "Faceta" });
    const deps = memoria.deps();

    const no15 = await listarPorDente(deps, sessao("dentista"), PACIENTE_JOAO, 15, AGORA);
    const no26 = await listarPorDente(deps, sessao("dentista"), PACIENTE_JOAO, 26, AGORA);
    const no38 = await listarPorDente(deps, sessao("dentista"), PACIENTE_JOAO, 38, AGORA);
    const invalido = await listarPorDente(deps, sessao("dentista"), PACIENTE_JOAO, 99, AGORA);

    expect(no15.ok && no15.valor.map((p) => p.id)).toEqual([coroa.id]);
    expect(no26.ok && no26.valor.map((p) => p.tipo)).toEqual(["Faceta"]);
    expect(no38).toEqual({ ok: true, valor: [] });
    expect(invalido).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
  });

  it("dado a listagem por dente após o limite, quando consulta o dente da peça atrasada, então também liga o alerta e cria um só aviso", async () => {
    await semearEnviada("2026-11-01");
    const deps = memoria.deps();
    const dia = new Date("2026-11-16T12:00:00.000Z");

    const r = await listarPorDente(deps, sessao("dentista"), PACIENTE_JOAO, 14, dia);
    await listarProteses(deps, sessao("dentista"), PACIENTE_JOAO, dia);

    expect(r.ok && r.valor[0].alertaAtraso).toBe(true);
    expect(memoria.avisos.size).toBe(1);
  });

  it("dado só o admin, quando configura o limite, então 15 e 30 passam; 14, 31 e fração devolvem Informe o limite", async () => {
    const deps = memoria.deps();

    for (const dias of [15, 30]) {
      const r = await configurarAtraso(deps, sessao("admin"), dias);
      expect(r).toEqual({ ok: true, valor: { clinicaId: CLINICA_ID, diasLimiteAtraso: dias } });
    }
    for (const dias of [14, 31, 20.5, Number.NaN]) {
      expect(await configurarAtraso(deps, sessao("admin"), dias)).toEqual({ ok: false, mensagem: MENSAGEM_LIMITE });
    }
    for (const papel of ["dentista", "recepcionista"] as const) {
      expect(await configurarAtraso(deps, sessao(papel), 20)).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    }
    expect(memoria.configs.get(CLINICA_ID)?.diasLimiteAtraso).toBe(30);
  });

  it("dado clínica sem configuração, quando consulta o limite, então devolve 15; configurado, devolve o valor", async () => {
    const deps = memoria.deps();

    expect(await obterLimiteAtraso(deps, sessao("recepcionista"))).toEqual({ ok: true, valor: LIMITE_ATRASO_PADRAO });
    await configurarAtraso(deps, sessao("admin"), 25);
    expect(await obterLimiteAtraso(deps, sessao("recepcionista"))).toEqual({ ok: true, valor: 25 });
    expect(await obterLimiteAtraso(deps, sessao("dentista", false))).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado dentistas ativos, inativos e de outra clínica, quando lista os responsáveis, então vêm só os ativos da clínica", async () => {
    memoria.dentistas.set("inativo", dentista("inativo", CLINICA_ID, false));
    memoria.dentistas.set("externo", dentista("externo", OUTRA_CLINICA));

    const r = await listarResponsaveis(memoria.deps(), sessao("recepcionista"));

    expect(r).toEqual({ ok: true, valor: [{ id: DENTISTA_ANA, nome: `Dra. ${DENTISTA_ANA}` }] });
  });

  it("dado paciente ou prótese de outra clínica, quando o usuário age, então não vê nem altera", async () => {
    const base = await semear();
    const deps = memoria.deps();
    const externo = sessao("admin", true, OUTRA_CLINICA);
    memoria.proteses.set("alheia", { ...base, id: "alheia", clinicaId: OUTRA_CLINICA, pacienteId: PACIENTE_EXTERNO });

    const registrar = await registrarPedido(deps, sessao("dentista"), pedido({ pacienteId: PACIENTE_EXTERNO }), AGORA);
    const listar = await listarProteses(deps, sessao("dentista"), PACIENTE_EXTERNO, AGORA);
    const porDente = await listarPorDente(deps, sessao("dentista"), PACIENTE_EXTERNO, 14, AGORA);
    const doutraClinica = await listarProteses(deps, externo, PACIENTE_JOAO, AGORA);
    const enviar = await registrarEnvio(deps, sessao("dentista"), { proteseId: "alheia", prazoRetorno: "2026-11-01" }, AGORA);
    const descontinuar = await descontinuarProtese(deps, sessao("dentista"), "alheia", AGORA);
    const fantasma = await conferirRetorno(deps, sessao("dentista"), { proteseId: "nada" }, AGORA);

    const semPaciente = { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
    expect(registrar).toEqual(semPaciente);
    expect(listar).toEqual(semPaciente);
    expect(porDente).toEqual(semPaciente);
    expect(doutraClinica).toEqual(semPaciente);
    for (const r of [enviar, descontinuar, fantasma]) {
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PROTESE_NAO_ENCONTRADA });
    }
    expect(memoria.proteses.get("alheia")?.status).toBe("em_andamento");
  });

  it("dado papel inativo, quando usa qualquer fluxo de prótese, então recebe Ação não permitida para seu papel", async () => {
    const base = await semear();
    const deps = memoria.deps();
    const inativo = sessao("admin", false);

    const resultados = [
      await registrarEnvio(deps, inativo, { proteseId: base.id, prazoRetorno: "2026-11-01" }, AGORA),
      await conferirRetorno(deps, inativo, { proteseId: base.id }, AGORA),
      await instalarProtese(deps, inativo, { proteseId: base.id, valorComissao: 1 }, AGORA),
      await descontinuarProtese(deps, inativo, base.id, AGORA),
      await listarProteses(deps, inativo, PACIENTE_JOAO, AGORA),
      await listarPorDente(deps, inativo, PACIENTE_JOAO, 14, AGORA),
      await listarResponsaveis(deps, inativo),
      await configurarAtraso(deps, inativo, 20),
    ];

    for (const r of resultados) expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.proteses.get(base.id)).toEqual(base);
  });

  it.todo("Feature 018: a caixa de notificações substitui avisos_protese");
  it.todo("Feature 019: a comissão entra como despesa, fora do faturado e do recebido");
  it.todo("versão futura: cadastro de laboratórios parceiros");
});
