import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { MENSAGEM_DENTISTA_NAO_ENCONTRADO } from "../dentista/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import type { Dependencias } from "./portas";
import { MODELOS_PADRAO, assinaturaDe, pdfDe, preencher } from "./regras";
import {
  MENSAGEM_DOCUMENTO_NAO_ENCONTRADO,
  MENSAGEM_MODELO_NAO_ENCONTRADO,
  type DocumentoGerado,
  type ModeloDocumento,
} from "./tipos";

type Entrada = { modeloId: string; pacienteId: string; anteriorId?: string | null };

const negado = { ok: false, mensagem: MENSAGEM_PAPEL } as const;

function ehDentistaAtivo(ator: Sessao): boolean {
  return ator.usuario.ativo && ator.usuario.papel === "dentista";
}

export async function garantirModelosPadrao(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<ModeloDocumento[]>> {
  if (!ator.usuario.ativo) return negado;
  const clinicaId = ator.usuario.clinicaId;
  const existentes = (await deps.modelos.listar(clinicaId)).filter((m) => m.clinicaId === clinicaId);
  const todos = [...existentes];

  for (const padrao of MODELOS_PADRAO) {
    if (existentes.some((m) => m.tipo === "padrao" && m.nome === padrao.nome)) continue;
    const modelo: ModeloDocumento = {
      id: deps.ids.novo(),
      clinicaId,
      criadoPor: null,
      compartilhado: false,
      nome: padrao.nome,
      tipo: "padrao",
      conteudo: padrao.conteudo,
    };
    await deps.modelos.salvar(modelo);
    todos.push(modelo);
  }
  return { ok: true, valor: todos };
}

export async function criarModelo(
  deps: Dependencias,
  ator: Sessao,
  entrada: { nome: string; conteudo: string; compartilhado: boolean },
): Promise<Resultado<ModeloDocumento>> {
  const permitido = autorizarAcao(ator, "documento:modelar");
  if (!permitido.ok) return permitido;

  const modelo: ModeloDocumento = {
    id: deps.ids.novo(),
    clinicaId: ator.usuario.clinicaId,
    criadoPor: ator.usuario.id,
    compartilhado: entrada.compartilhado,
    nome: entrada.nome,
    tipo: "personalizado",
    conteudo: entrada.conteudo,
  };
  await deps.modelos.salvar(modelo);
  return { ok: true, valor: modelo };
}

export async function importarModelo(
  deps: Dependencias,
  ator: Sessao,
  modeloId: string,
): Promise<Resultado<ModeloDocumento>> {
  if (!ehDentistaAtivo(ator)) return negado;

  const modelo = await deps.modelos.buscarPorId(modeloId);
  const importavel =
    modelo &&
    modelo.clinicaId === ator.usuario.clinicaId &&
    modelo.tipo === "personalizado" &&
    modelo.compartilhado &&
    modelo.criadoPor !== ator.usuario.id;
  if (!importavel) return { ok: false, mensagem: MENSAGEM_MODELO_NAO_ENCONTRADO };

  await deps.importacoes.registrar(modelo.id, ator.usuario.id);
  return { ok: true, valor: modelo };
}

async function modeloUsavel(
  deps: Dependencias,
  ator: Sessao,
  modeloId: string,
): Promise<ModeloDocumento | null> {
  const modelo = await deps.modelos.buscarPorId(modeloId);
  if (!modelo || modelo.clinicaId !== ator.usuario.clinicaId) return null;
  if (modelo.tipo === "padrao" || modelo.criadoPor === ator.usuario.id) return modelo;
  const importados = await deps.importacoes.listarPorUsuario(ator.usuario.id);
  return importados.includes(modelo.id) ? modelo : null;
}

export async function gerarDocumento(
  deps: Dependencias,
  ator: Sessao,
  entrada: Entrada,
  agora: Date,
): Promise<Resultado<DocumentoGerado>> {
  if (!ehDentistaAtivo(ator)) return negado;
  const clinicaId = ator.usuario.clinicaId;

  const paciente = await deps.pacientes.buscarPorId(entrada.pacienteId);
  if (!paciente || paciente.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  const modelo = await modeloUsavel(deps, ator, entrada.modeloId);
  if (!modelo) return { ok: false, mensagem: MENSAGEM_MODELO_NAO_ENCONTRADO };

  const dentistas = await deps.dentistas.listar(clinicaId);
  const dentista = dentistas.find((d) => d.usuarioId === ator.usuario.id && d.clinicaId === clinicaId);
  if (!dentista) return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };

  let anterior: DocumentoGerado | null = null;
  if (entrada.anteriorId) {
    anterior = await deps.documentos.buscarPorId(entrada.anteriorId);
    if (!anterior || anterior.clinicaId !== clinicaId || anterior.pacienteId !== paciente.id) {
      return { ok: false, mensagem: MENSAGEM_DOCUMENTO_NAO_ENCONTRADO };
    }
  }

  const instante = agora.toISOString();
  const conteudoFinal = preencher(modelo.conteudo, {
    paciente: { nome: paciente.nome, cpf: paciente.cpf, dataNascimento: paciente.dataNascimento },
    dentista: { nome: dentista.nome, cro: dentista.cro },
    data: instante,
  });
  const documento: DocumentoGerado = {
    id: deps.ids.novo(),
    clinicaId,
    modeloId: modelo.id,
    pacienteId: paciente.id,
    anteriorId: anterior?.id ?? null,
    conteudoFinal,
    pdf: pdfDe(conteudoFinal),
    assinatura: assinaturaDe(ator.usuario.id, instante, conteudoFinal),
    geradoPor: ator.usuario.id,
    geradoEm: instante,
  };
  await deps.documentos.salvar(documento);
  await deps.auditoria.registrar({
    id: deps.ids.novo(),
    clinicaId,
    entidade: "documento",
    entidadeId: documento.id,
    usuarioId: ator.usuario.id,
    acao: "criacao",
    conteudoAnterior: anterior?.conteudoFinal ?? null,
    registradoEm: instante,
  });
  return { ok: true, valor: documento };
}

export async function listarDocumentos(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<DocumentoGerado[]>> {
  if (!ator.usuario.ativo) return negado;
  const clinicaId = ator.usuario.clinicaId;
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  if (!paciente || paciente.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  const documentos = await deps.documentos.listarPorPaciente(clinicaId, pacienteId);
  return {
    ok: true,
    valor: documentos.filter((d) => d.clinicaId === clinicaId && d.pacienteId === pacienteId),
  };
}

export async function listarModelos(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<{ modelos: ModeloDocumento[]; importados: string[] }>> {
  const garantia = await garantirModelosPadrao(deps, ator);
  if (!garantia.ok) return garantia;
  const importados = await deps.importacoes.listarPorUsuario(ator.usuario.id);
  // Modelo personalizado não compartilhado fica visível só para o autor.
  const modelos = garantia.valor.filter(
    (m) => m.tipo === "padrao" || m.compartilhado || m.criadoPor === ator.usuario.id,
  );
  return { ok: true, valor: { modelos, importados } };
}

export async function obterDocumento(
  deps: Dependencias,
  ator: Sessao,
  documentoId: string,
): Promise<Resultado<DocumentoGerado>> {
  if (!ator.usuario.ativo) return negado;
  const documento = await deps.documentos.buscarPorId(documentoId);
  if (!documento || documento.clinicaId !== ator.usuario.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_DOCUMENTO_NAO_ENCONTRADO };
  }
  return { ok: true, valor: documento };
}
