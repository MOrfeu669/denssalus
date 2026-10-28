import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO, type Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { confirmarImagem, excluirImagem, listarImagens, prepararUpload, restaurarImagem } from "../../src/domain/imagem/casos";
import type { Dependencias } from "../../src/domain/imagem/portas";
import {
  MENSAGEM_CAMINHO_INVALIDO,
  MENSAGEM_DESCRICAO,
  MENSAGEM_IMAGEM_NAO_ENCONTRADA,
  MENSAGEM_TAMANHO,
  MENSAGEM_TIPO_CASO,
  TETO_BYTES,
  type ImagemProntuario,
} from "../../src/domain/imagem/tipos";
import { MENSAGEM_DENTE_INVALIDO } from "../../src/domain/odontograma/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const PACIENTE_EXTERNO = "paciente-externo";
const CONSULTA = "consulta-001";
const AGORA = new Date("2026-01-15T00:00:00.000Z");

class Memoria {
  imagens = new Map<string, ImagemProntuario>();
  removidos: string[] = [];
  pacientes = new Map<string, Paciente>();
  agendamentos = new Map<string, Agendamento>();
  proximoId = 0;

  deps(): Dependencias {
    return {
      imagens: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.imagens.values()].filter((i) => i.clinicaId === clinicaId && i.pacienteId === pacienteId),
        buscarPorId: async (id) => this.imagens.get(id) ?? null,
        salvar: async (imagem) => {
          this.imagens.set(imagem.id, imagem);
        },
        apagar: async (id) => {
          this.imagens.delete(id);
        },
      },
      arquivos: {
        remover: async (caminho) => {
          this.removidos.push(caminho);
        },
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      ids: { novo: () => `img-${++this.proximoId}` },
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

function sessao(papel: Papel, ativo = true, clinicaId = CLINICA_ID): Sessao {
  return {
    usuario: { id: `ator-${papel}`, nome: "Ator", email: `${papel}@clinica.com`, papel, clinicaId, ativo },
  };
}

function entrada(id: string, extra: Partial<Parameters<typeof confirmarImagem>[2]> = {}) {
  return {
    id,
    pacienteId: PACIENTE_JOAO,
    agendamentoId: CONSULTA as string | null,
    dente: 26 as number | null,
    tipoCaso: "Raio X periapical",
    descricao: "Avaliação pré-restauração",
    caminho: `${CLINICA_ID}/${PACIENTE_JOAO}/${id}`,
    tamanhoBytes: 1024,
    ...extra,
  };
}

describe("imagem", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.pacientes.set(PACIENTE_JOAO, paciente(PACIENTE_JOAO, CLINICA_ID));
    memoria.pacientes.set(PACIENTE_EXTERNO, paciente(PACIENTE_EXTERNO, OUTRA_CLINICA));
    memoria.agendamentos.set(CONSULTA, {
      id: CONSULTA,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
    } as Agendamento);
  });

  async function semear(id: string, extra: Partial<Parameters<typeof confirmarImagem>[2]> = {}, quando = AGORA) {
    const resultado = await confirmarImagem(memoria.deps(), sessao("dentista"), entrada(id, extra), quando);
    if (!resultado.ok) throw new Error("semente");
    return resultado.valor;
  }

  it("dado o dente 26 e a consulta atual, quando o dentista confirma o raio X, então a imagem entra no prontuário", async () => {
    const deps = memoria.deps();
    const preparo = await prepararUpload(deps, sessao("dentista"), PACIENTE_JOAO);
    expect(preparo).toEqual({
      ok: true,
      valor: { id: "img-1", caminho: `${CLINICA_ID}/${PACIENTE_JOAO}/img-1` },
    });
    expect(memoria.imagens.size).toBe(0);
    if (!preparo.ok) return;

    const resultado = await confirmarImagem(
      deps,
      sessao("dentista"),
      entrada(preparo.valor.id, { caminho: preparo.valor.caminho }),
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toEqual({
      id: "img-1",
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      agendamentoId: CONSULTA,
      dente: 26,
      tipoCaso: "Raio X periapical",
      descricao: "Avaliação pré-restauração",
      caminho: `${CLINICA_ID}/${PACIENTE_JOAO}/img-1`,
      tamanhoBytes: 1024,
      adicionadoPor: "ator-dentista",
      adicionadoEm: AGORA.toISOString(),
      excluidoEm: null,
      remocaoDefinitivaEm: null,
    });
    const lista = await listarImagens(deps, sessao("dentista"), PACIENTE_JOAO, AGORA);
    expect(lista.ok && lista.valor.ativas.map((i) => i.id)).toEqual(["img-1"]);
  });

  it("dado uma recepcionista, quando tenta anexar ou excluir, então recebe Ação não permitida para seu papel", async () => {
    const imagem = await semear("img-a");
    const deps = memoria.deps();
    const ator = sessao("recepcionista");

    const preparo = await prepararUpload(deps, ator, PACIENTE_JOAO);
    const confirmar = await confirmarImagem(deps, ator, entrada("img-b"), AGORA);
    const exclusao = await excluirImagem(deps, ator, imagem.id, AGORA);

    for (const r of [preparo, confirmar, exclusao]) expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect([...memoria.imagens.keys()]).toEqual(["img-a"]);
    expect(memoria.imagens.get("img-a")?.excluidoEm).toBeNull();
  });

  it("dado um admin, quando anexa a imagem, então grava com sucesso", async () => {
    const resultado = await confirmarImagem(memoria.deps(), sessao("admin"), entrada("img-a"), AGORA);

    expect(resultado.ok && resultado.valor.adicionadoPor).toBe("ator-admin");
    expect(memoria.imagens.has("img-a")).toBe(true);
  });

  it("dado uma recepcionista, quando lista as imagens, então vê a galeria", async () => {
    await semear("img-a");

    const lista = await listarImagens(memoria.deps(), sessao("recepcionista"), PACIENTE_JOAO, AGORA);

    expect(lista.ok && lista.valor.ativas.map((i) => i.id)).toEqual(["img-a"]);
  });

  it("dado quatro imagens em datas diferentes, quando abre a galeria, então voltam da mais antiga para a mais nova com tipo de caso e dente", async () => {
    await semear("img-3", { dente: 16, tipoCaso: "Panorâmica" }, new Date("2026-01-03T10:00:00.000Z"));
    await semear("img-1", { dente: 11, tipoCaso: "Periapical" }, new Date("2026-01-01T10:00:00.000Z"));
    await semear("img-4", { dente: null, tipoCaso: "Interproximal" }, new Date("2026-01-04T10:00:00.000Z"));
    await semear("img-2", { dente: 26, tipoCaso: "Bite-wing" }, new Date("2026-01-02T10:00:00.000Z"));

    const lista = await listarImagens(memoria.deps(), sessao("dentista"), PACIENTE_JOAO, AGORA);

    expect(lista.ok).toBe(true);
    if (!lista.ok) return;
    expect(lista.valor.ativas.map((i) => [i.id, i.tipoCaso, i.dente])).toEqual([
      ["img-1", "Periapical", 11],
      ["img-2", "Bite-wing", 26],
      ["img-3", "Panorâmica", 16],
      ["img-4", "Interproximal", null],
    ]);
    expect(lista.valor.pendentes).toEqual([]);
  });

  it("dado um arquivo de 20 MB + 1 byte, quando o dentista confirma, então devolve o teto e não grava linha", async () => {
    const resultado = await confirmarImagem(
      memoria.deps(),
      sessao("dentista"),
      entrada("img-grande", { tamanhoBytes: TETO_BYTES + 1 }),
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_TAMANHO });
    expect(MENSAGEM_TAMANHO).toBe("O arquivo passa de 20 MB");
    expect(memoria.imagens.has("img-grande")).toBe(false);
    expect(memoria.imagens.size).toBe(0);
  });

  it("dado um arquivo de exatamente 20 MB, quando o dentista confirma, então grava", async () => {
    const resultado = await confirmarImagem(
      memoria.deps(),
      sessao("dentista"),
      entrada("img-limite", { tamanhoBytes: TETO_BYTES }),
      AGORA,
    );

    expect(resultado.ok).toBe(true);
    expect(memoria.imagens.has("img-limite")).toBe(true);
  });

  it("dado uma imagem excluída em 2026-01-15, quando o prazo corre, então restaura antes de 2026-04-15 e expurga em 2026-04-15", async () => {
    const imagem = await semear("img-a");
    const deps = memoria.deps();
    const dentista = sessao("dentista");

    const excluida = await excluirImagem(deps, dentista, imagem.id, AGORA);

    expect(excluida.ok).toBe(true);
    if (!excluida.ok) return;
    expect(excluida.valor.excluidoEm).toBe("2026-01-15T00:00:00.000Z");
    expect(excluida.valor.remocaoDefinitivaEm).toBe("2026-04-15T00:00:00.000Z");
    const pendente = await listarImagens(deps, dentista, PACIENTE_JOAO, AGORA);
    expect(pendente.ok && pendente.valor.ativas).toEqual([]);
    expect(pendente.ok && pendente.valor.pendentes.map((i) => i.id)).toEqual(["img-a"]);

    const restaurada = await restaurarImagem(deps, dentista, imagem.id, new Date("2026-04-14T23:59:59.000Z"));
    expect(restaurada.ok).toBe(true);
    const galeria = await listarImagens(deps, dentista, PACIENTE_JOAO, new Date("2026-04-14T23:59:59.000Z"));
    expect(galeria.ok && galeria.valor.ativas).toEqual([
      { ...imagem, excluidoEm: null, remocaoDefinitivaEm: null },
    ]);

    await excluirImagem(deps, dentista, imagem.id, AGORA);
    const expurgo = await listarImagens(deps, dentista, PACIENTE_JOAO, new Date("2026-04-15T00:00:00.000Z"));
    expect(expurgo).toEqual({ ok: true, valor: { ativas: [], pendentes: [] } });
    expect(memoria.removidos).toEqual([imagem.caminho]);
    expect(memoria.imagens.has("img-a")).toBe(false);
  });

  it("dado uma imagem já expurgada, quando tenta restaurar, então não volta", async () => {
    const imagem = await semear("img-a");
    const deps = memoria.deps();
    await excluirImagem(deps, sessao("dentista"), imagem.id, AGORA);

    const noPrazoFinal = await restaurarImagem(deps, sessao("dentista"), imagem.id, new Date("2026-04-15T00:00:00.000Z"));
    await listarImagens(deps, sessao("dentista"), PACIENTE_JOAO, new Date("2026-04-15T00:00:00.000Z"));
    const semLinha = await restaurarImagem(deps, sessao("dentista"), imagem.id, new Date("2026-04-14T00:00:00.000Z"));

    expect(noPrazoFinal).toEqual({ ok: false, mensagem: MENSAGEM_IMAGEM_NAO_ENCONTRADA });
    expect(semLinha).toEqual({ ok: false, mensagem: MENSAGEM_IMAGEM_NAO_ENCONTRADA });
  });

  it("dado um paciente de outra clínica, quando o dentista confirma, então não grava, e a listagem não devolve imagem dessa clínica", async () => {
    const deps = memoria.deps();
    const dentista = sessao("dentista");
    memoria.imagens.set("img-alheia", {
      ...(await semear("img-base")),
      id: "img-alheia",
      clinicaId: OUTRA_CLINICA,
      pacienteId: PACIENTE_EXTERNO,
    });

    const preparo = await prepararUpload(deps, dentista, PACIENTE_EXTERNO);
    const confirmar = await confirmarImagem(
      deps,
      dentista,
      entrada("img-x", { pacienteId: PACIENTE_EXTERNO, agendamentoId: null, caminho: `${CLINICA_ID}/${PACIENTE_EXTERNO}/img-x` }),
      AGORA,
    );
    const lista = await listarImagens(deps, dentista, PACIENTE_EXTERNO, AGORA);
    const doutraClinica = await listarImagens(deps, sessao("admin", true, OUTRA_CLINICA), PACIENTE_JOAO, AGORA);
    const exclusao = await excluirImagem(deps, dentista, "img-alheia", AGORA);

    const naoAchou = { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
    expect(preparo).toEqual(naoAchou);
    expect(confirmar).toEqual(naoAchou);
    expect(lista).toEqual(naoAchou);
    expect(doutraClinica).toEqual(naoAchou);
    expect(exclusao).toEqual({ ok: false, mensagem: MENSAGEM_IMAGEM_NAO_ENCONTRADA });
    expect(memoria.imagens.has("img-x")).toBe(false);
    expect(memoria.imagens.get("img-alheia")?.excluidoEm).toBeNull();
  });

  it("dado dente 19, tipo vazio, descrição vazia ou caminho divergente, quando confirma, então devolve a mensagem própria e não grava", async () => {
    const deps = memoria.deps();
    const dentista = sessao("dentista");

    const dente = await confirmarImagem(deps, dentista, entrada("a", { dente: 19 }), AGORA);
    const tipo = await confirmarImagem(deps, dentista, entrada("b", { tipoCaso: "   " }), AGORA);
    const descricao = await confirmarImagem(deps, dentista, entrada("c", { descricao: "" }), AGORA);
    const caminho = await confirmarImagem(deps, dentista, entrada("d", { caminho: "outro/caminho" }), AGORA);

    expect(dente).toEqual({ ok: false, mensagem: MENSAGEM_DENTE_INVALIDO });
    expect(tipo).toEqual({ ok: false, mensagem: MENSAGEM_TIPO_CASO });
    expect(descricao).toEqual({ ok: false, mensagem: MENSAGEM_DESCRICAO });
    expect(caminho).toEqual({ ok: false, mensagem: MENSAGEM_CAMINHO_INVALIDO });
    expect(memoria.imagens.size).toBe(0);
  });

  it("dado um agendamento de outro paciente, quando confirma, então devolve Agendamento não encontrado e não grava", async () => {
    memoria.agendamentos.set("ag-outro", {
      id: "ag-outro",
      clinicaId: CLINICA_ID,
      pacienteId: "paciente-maria",
    } as Agendamento);

    const resultado = await confirmarImagem(
      memoria.deps(),
      sessao("dentista"),
      entrada("img-a", { agendamentoId: "ag-outro" }),
      AGORA,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO });
    expect(memoria.imagens.size).toBe(0);
  });

  it("dado textos com espaços, quando confirma, então grava o tipo de caso e a descrição já aparados", async () => {
    const resultado = await confirmarImagem(
      memoria.deps(),
      sessao("dentista"),
      entrada("img-a", { tipoCaso: "  Periapical ", descricao: " Controle  ", agendamentoId: null, dente: null }),
      AGORA,
    );

    expect(resultado.ok && [resultado.valor.tipoCaso, resultado.valor.descricao]).toEqual(["Periapical", "Controle"]);
  });
});
