import { beforeEach, describe, expect, it } from "vitest";
import { permite } from "../../src/domain/auth/permissao";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import {
  criarModelo,
  garantirModelosPadrao,
  gerarDocumento,
  importarModelo,
  listarDocumentos,
  listarModelos,
  obterDocumento,
} from "../../src/domain/documento/casos";
import type { Dependencias } from "../../src/domain/documento/portas";
import { assinaturaDe, pdfDe, preencher } from "../../src/domain/documento/regras";
import {
  MENSAGEM_DOCUMENTO_NAO_ENCONTRADO,
  MENSAGEM_MODELO_NAO_ENCONTRADO,
  type DocumentoGerado,
  type ModeloDocumento,
} from "../../src/domain/documento/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import type { RegistroAuditoria } from "../../src/domain/prontuario/tipos";

const CLINICA = "clinica-001";
const OUTRA = "clinica-002";
const AGORA = new Date("2026-10-28T10:00:00.000Z");
const DEPOIS = new Date("2026-10-28T11:00:00.000Z");

function sessao(id: string, papel: Papel, clinicaId = CLINICA): Sessao {
  return { usuario: { id, nome: id, email: `${id}@x.com`, papel, clinicaId, ativo: true } };
}

const CARLOS = sessao("u-carlos", "dentista");
const ANA = sessao("u-ana", "dentista");
const ADMIN = sessao("u-admin", "admin");
const RECEP = sessao("u-recep", "recepcionista");

class Memoria {
  modelos = new Map<string, ModeloDocumento>();
  documentos = new Map<string, DocumentoGerado>();
  importacoes: { modeloId: string; usuarioId: string }[] = [];
  auditoria: RegistroAuditoria[] = [];
  salvosDocumento = 0;
  proximoId = 0;
  pacientes = new Map<string, Paciente>([
    ["p-joao", paciente("p-joao", CLINICA, "João", "123.456.789-00", "1990-05-01")],
    ["p-sem-dados", paciente("p-sem-dados", CLINICA, "Maria", null, null)],
    ["p-outra", paciente("p-outra", OUTRA, "Estranho", null, null)],
  ]);

  constructor() {
    this.modelos.set("m-outra", {
      id: "m-outra",
      clinicaId: OUTRA,
      criadoPor: "u-x",
      compartilhado: true,
      nome: "Alheio",
      tipo: "personalizado",
      conteudo: "{{paciente.nome}}",
    });
  }

  deps(): Dependencias {
    return {
      modelos: {
        listar: async (clinicaId) => [...this.modelos.values()].filter((m) => m.clinicaId === clinicaId),
        buscarPorId: async (id) => this.modelos.get(id) ?? null,
        salvar: async (m) => {
          this.modelos.set(m.id, m);
        },
      },
      documentos: {
        listarPorPaciente: async (clinicaId, pacienteId) =>
          [...this.documentos.values()].filter(
            (d) => d.clinicaId === clinicaId && d.pacienteId === pacienteId,
          ),
        buscarPorId: async (id) => this.documentos.get(id) ?? null,
        salvar: async (d) => {
          this.salvosDocumento += 1;
          this.documentos.set(d.id, d);
        },
      },
      importacoes: {
        registrar: async (modeloId, usuarioId) => {
          this.importacoes.push({ modeloId, usuarioId });
        },
        listarPorUsuario: async (usuarioId) =>
          this.importacoes.filter((i) => i.usuarioId === usuarioId).map((i) => i.modeloId),
      },
      pacientes: { buscarPorId: async (id) => this.pacientes.get(id) ?? null },
      dentistas: {
        listar: async (clinicaId) =>
          [dentista("d-carlos", CARLOS.usuario.id, "Carlos", "CRO-1"), dentista("d-ana", ANA.usuario.id, "Ana", "CRO-2")].filter(
            (d) => d.clinicaId === clinicaId,
          ),
      },
      auditoria: {
        registrar: async (r) => {
          this.auditoria.push(r);
        },
        listar: async () => this.auditoria,
      },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }
}

function paciente(
  id: string,
  clinicaId: string,
  nome: string,
  cpf: string | null,
  dataNascimento: string | null,
): Paciente {
  return {
    id,
    clinicaId,
    nome,
    canais: [{ canal: "email", contato: "a@b.com", preferido: true }],
    cpf,
    endereco: null,
    dataNascimento,
    sexo: null,
    responsavel: null,
  };
}

function dentista(id: string, usuarioId: string, nome: string, cro: string) {
  return {
    id,
    usuarioId,
    clinicaId: CLINICA,
    nome,
    cro,
    telefone: "11999990000",
    cpf: "000.000.000-00",
    especialidades: [],
    ativo: true,
  };
}

async function modeloPadrao(mem: Memoria, nome: string): Promise<ModeloDocumento> {
  const r = await garantirModelosPadrao(mem.deps(), CARLOS);
  if (!r.ok) throw new Error(r.mensagem);
  return r.valor.find((m) => m.nome === nome) as ModeloDocumento;
}

describe("regras puras de documento", () => {
  it("dado um template com as seis variáveis, quando preenche, então troca todas e nulo vira vazio", () => {
    const texto = preencher(
      "{{paciente.nome}}|{{paciente.cpf}}|{{paciente.dataNascimento}}|{{dentista.nome}}|{{dentista.cro}}|{{data}}",
      {
        paciente: { nome: "João", cpf: null, dataNascimento: "1990-05-01" },
        dentista: { nome: "Carlos", cro: "CRO-1" },
        data: "hoje",
      },
    );
    expect(texto).toBe("João||1990-05-01|Carlos|CRO-1|hoje");
  });

  it("dado um texto com parênteses, barra e símbolo fora do Latin-1, quando monta o PDF, então escapa e troca por ?", () => {
    const bytes = pdfDe("a (b) \\ € ção\nsegunda");
    const texto = String.fromCharCode(...bytes);
    expect(texto.startsWith("%PDF-1.4")).toBe(true);
    expect(texto).toContain("(a \\(b\\) \\\\ ? ção) Tj");
    expect(texto).toContain("(segunda) Tj");
    expect(texto.trimEnd().endsWith("%%EOF")).toBe(true);
    const inicio = Number(/startxref\n(\d+)/.exec(texto)?.[1]);
    expect(texto.slice(inicio, inicio + 4)).toBe("xref");
  });

  it("dado usuário, instante e conteúdo, quando assina, então devolve usuario:instante:conteudo", () => {
    expect(assinaturaDe("u1", "2026-01-01T00:00:00.000Z", "texto")).toBe(
      "u1:2026-01-01T00:00:00.000Z:texto",
    );
  });
});

describe("permissão de documento", () => {
  it("dado cada papel, quando consulta documento:gerar, então só o dentista pode", () => {
    expect(permite("dentista", "documento:gerar")).toBe(true);
    expect(permite("admin", "documento:gerar")).toBe(false);
    expect(permite("recepcionista", "documento:gerar")).toBe(false);
  });

  it("dado cada papel, quando consulta documento:modelar, então dentista e admin podem", () => {
    expect(permite("dentista", "documento:modelar")).toBe(true);
    expect(permite("admin", "documento:modelar")).toBe(true);
    expect(permite("recepcionista", "documento:modelar")).toBe(false);
  });
});

describe("Feature 014 — documentos", () => {
  let mem: Memoria;
  beforeEach(() => {
    mem = new Memoria();
  });

  it("dado uma clínica sem modelos, quando garante os padrão duas vezes, então cria só os três e não duplica", async () => {
    await garantirModelosPadrao(mem.deps(), RECEP);
    const r = await garantirModelosPadrao(mem.deps(), CARLOS);
    const nomes = [...mem.modelos.values()].filter((m) => m.clinicaId === CLINICA).map((m) => m.nome);
    expect(nomes.sort()).toEqual(["Atestado", "Receituário", "Termo de Consentimento"]);
    expect(r.ok && r.valor).toHaveLength(3);
  });

  it("dado o Atestado, quando o dentista gera para João, então o texto traz o nome, assina, audita e gera PDF", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const r = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
    if (!r.ok) throw new Error(r.mensagem);
    const doc = r.valor;
    expect(doc.conteudoFinal).toContain("João");
    expect(doc.conteudoFinal).toContain("Carlos");
    expect(doc.assinatura).toBe(`${CARLOS.usuario.id}:${AGORA.toISOString()}:${doc.conteudoFinal}`);
    expect(doc.geradoPor).toBe(CARLOS.usuario.id);
    expect(doc.anteriorId).toBeNull();
    expect(doc.pdf).toBeInstanceOf(Uint8Array);
    expect(doc.pdf.length).toBeGreaterThan(0);
    const [registro] = mem.auditoria;
    expect(registro).toMatchObject({
      entidade: "documento",
      acao: "criacao",
      entidadeId: doc.id,
      usuarioId: CARLOS.usuario.id,
      clinicaId: CLINICA,
      conteudoAnterior: null,
    });
  });

  it("dado paciente sem CPF e nascimento, quando gera, então os campos nulos viram vazio", async () => {
    const m = await criarModelo(mem.deps(), CARLOS, {
      nome: "Ficha",
      conteudo: "[{{paciente.cpf}}][{{paciente.dataNascimento}}]",
      compartilhado: false,
    });
    if (!m.ok) throw new Error(m.mensagem);
    const r = await gerarDocumento(mem.deps(), CARLOS, { modeloId: m.valor.id, pacienteId: "p-sem-dados" }, AGORA);
    expect(r.ok && r.valor.conteudoFinal).toBe("[][]");
  });

  it("dado recepcionista ou admin, quando gera, então recebe a mensagem de papel e nada é salvo", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    for (const ator of [RECEP, ADMIN]) {
      const r = await gerarDocumento(mem.deps(), ator, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    }
    expect(mem.salvosDocumento).toBe(0);
    expect(mem.auditoria).toHaveLength(0);
  });

  it("dado um dentista, quando cria modelo personalizado, então o autor é ele e a recepcionista é barrada", async () => {
    const r = await criarModelo(mem.deps(), CARLOS, {
      nome: "Meu atestado",
      conteudo: "{{paciente.nome}} {{dentista.nome}} {{dentista.cro}} {{data}}",
      compartilhado: true,
    });
    expect(r.ok && r.valor).toMatchObject({ tipo: "personalizado", criadoPor: CARLOS.usuario.id, clinicaId: CLINICA });
    const negada = await criarModelo(mem.deps(), RECEP, { nome: "x", conteudo: "y", compartilhado: false });
    expect(negada).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado modelo compartilhado, quando outro dentista importa e gera, então a assinatura e geradoPor são dele", async () => {
    const m = await criarModelo(mem.deps(), CARLOS, {
      nome: "Compartilhado",
      conteudo: "Atesto {{paciente.nome}} por {{dentista.nome}}",
      compartilhado: true,
    });
    if (!m.ok) throw new Error(m.mensagem);
    const antes = await gerarDocumento(mem.deps(), ANA, { modeloId: m.valor.id, pacienteId: "p-joao" }, AGORA);
    expect(antes).toEqual({ ok: false, mensagem: MENSAGEM_MODELO_NAO_ENCONTRADO });

    expect((await importarModelo(mem.deps(), ANA, m.valor.id)).ok).toBe(true);
    const r = await gerarDocumento(mem.deps(), ANA, { modeloId: m.valor.id, pacienteId: "p-joao" }, AGORA);
    if (!r.ok) throw new Error(r.mensagem);
    expect(r.valor.geradoPor).toBe(ANA.usuario.id);
    expect(r.valor.conteudoFinal).toBe("Atesto João por Ana");
    expect(r.valor.assinatura).toBe(`${ANA.usuario.id}:${AGORA.toISOString()}:${r.valor.conteudoFinal}`);
  });

  it("dado modelo não compartilhado, quando outro dentista importa, então recebe Modelo não encontrado e nada é registrado", async () => {
    const m = await criarModelo(mem.deps(), CARLOS, { nome: "Privado", conteudo: "x", compartilhado: false });
    if (!m.ok) throw new Error(m.mensagem);
    const r = await importarModelo(mem.deps(), ANA, m.valor.id);
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_MODELO_NAO_ENCONTRADO });
    expect(mem.importacoes).toHaveLength(0);
    const propria = await importarModelo(mem.deps(), CARLOS, m.valor.id);
    expect(propria.ok).toBe(false);
  });

  it("dado um documento gerado, quando o dentista corrige, então cria outro com anteriorId e o original permanece", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const primeiro = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
    if (!primeiro.ok) throw new Error(primeiro.mensagem);
    const original = { ...primeiro.valor };

    const correcao = await gerarDocumento(
      mem.deps(),
      CARLOS,
      { modeloId: atestado.id, pacienteId: "p-joao", anteriorId: original.id },
      DEPOIS,
    );
    if (!correcao.ok) throw new Error(correcao.mensagem);
    expect(correcao.valor.id).not.toBe(original.id);
    expect(correcao.valor.anteriorId).toBe(original.id);

    const lista = await listarDocumentos(mem.deps(), RECEP, "p-joao");
    expect(lista.ok && lista.valor.map((d) => d.id).sort()).toEqual([original.id, correcao.valor.id].sort());
    const guardado = mem.documentos.get(original.id) as DocumentoGerado;
    expect(guardado.conteudoFinal).toBe(original.conteudoFinal);
    expect(guardado.assinatura).toBe(original.assinatura);
    expect(guardado.pdf).toEqual(original.pdf);
    expect(mem.auditoria[1].conteudoAnterior).toBe(original.conteudoFinal);
    expect(mem.auditoria[1].entidadeId).toBe(correcao.valor.id);
  });

  it("dado anteriorId inexistente ou de outro paciente, quando corrige, então Documento não encontrado e não salva", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const base = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
    if (!base.ok) throw new Error(base.mensagem);
    mem.pacientes.set("p-outro", paciente("p-outro", CLINICA, "Outro", null, null));
    const salvos = mem.salvosDocumento;
    for (const anteriorId of ["inexistente", base.valor.id]) {
      const pacienteId = anteriorId === "inexistente" ? "p-joao" : "p-outro";
      const r = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId, anteriorId }, DEPOIS);
      expect(r).toEqual({ ok: false, mensagem: MENSAGEM_DOCUMENTO_NAO_ENCONTRADO });
    }
    expect(mem.salvosDocumento).toBe(salvos);
  });

  it("dado paciente ou modelo de outra clínica, quando gera, então recebe a mensagem de não encontrado", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const pac = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId: "p-outra" }, AGORA);
    expect(pac).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    const mod = await gerarDocumento(mem.deps(), CARLOS, { modeloId: "m-outra", pacienteId: "p-joao" }, AGORA);
    expect(mod).toEqual({ ok: false, mensagem: MENSAGEM_MODELO_NAO_ENCONTRADO });
    expect(mem.salvosDocumento).toBe(0);
  });

  it("dado usuário sem dentista na clínica, quando gera, então não salva", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const sem = sessao("u-sem-cadastro", "dentista");
    const r = await gerarDocumento(mem.deps(), sem, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
    expect(r).toEqual({ ok: false, mensagem: "Dentista não encontrado" });
    expect(mem.salvosDocumento).toBe(0);
  });

  it("dado documento e modelos, quando outra clínica consulta, então não vê paciente nem documento e o modelo privado não aparece", async () => {
    const atestado = await modeloPadrao(mem, "Atestado");
    const doc = await gerarDocumento(mem.deps(), CARLOS, { modeloId: atestado.id, pacienteId: "p-joao" }, AGORA);
    if (!doc.ok) throw new Error(doc.mensagem);
    const fora = sessao("u-fora", "recepcionista", OUTRA);
    expect(await obterDocumento(mem.deps(), fora, doc.valor.id)).toEqual({
      ok: false,
      mensagem: MENSAGEM_DOCUMENTO_NAO_ENCONTRADO,
    });
    expect(await listarDocumentos(mem.deps(), fora, "p-joao")).toEqual({
      ok: false,
      mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO,
    });
    expect((await obterDocumento(mem.deps(), ADMIN, doc.valor.id)).ok).toBe(true);

    await criarModelo(mem.deps(), CARLOS, { nome: "Privado", conteudo: "x", compartilhado: false });
    const vistoPorAna = await listarModelos(mem.deps(), ANA);
    expect(vistoPorAna.ok && vistoPorAna.valor.modelos.map((m) => m.nome)).not.toContain("Privado");
  });

  it.todo("PENDENTE: o Admin pode gerar e assinar documento?");
  it.todo("PENDENTE: provedor de assinatura (hoje a assinatura é só texto composto)");
  it.todo("PENDENTE: storage externo do PDF (hoje o PDF fica no banco como bytea)");
});
