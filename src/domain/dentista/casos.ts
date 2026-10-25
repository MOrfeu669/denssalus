import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dependencias } from "./portas";
import {
  MENSAGEM_DENTISTA_NAO_ENCONTRADO,
  MENSAGEM_EMAIL_JA_CADASTRADO,
  type Dentista,
  type EntradaCadastrarDentista,
  type EntradaEditarDentista,
} from "./tipos";

type Falha = { ok: false; mensagem: string };

async function clinicaDoAdmin(
  deps: Dependencias,
  ator: Sessao,
): Promise<{ ok: true; clinicaId: string } | Falha> {
  const permitido = autorizarAcao(ator, "dentista:cadastrar");
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinicaId: clinica.id };
}

async function dentistaDaClinica(
  deps: Dependencias,
  clinicaId: string,
  dentistaId: string,
): Promise<Dentista | null> {
  const dentista = await deps.dentistas.buscarPorId(dentistaId);
  return dentista && dentista.clinicaId === clinicaId ? dentista : null;
}

export async function cadastrarDentista(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaCadastrarDentista,
): Promise<Resultado<Dentista>> {
  const contexto = await clinicaDoAdmin(deps, ator);
  if (!contexto.ok) return contexto;

  const email = entrada.email.trim().toLowerCase();
  const existente = await deps.usuarios.buscarPorEmail(email);
  if (existente) return { ok: false, mensagem: MENSAGEM_EMAIL_JA_CADASTRADO };

  const nome = entrada.nome.trim();
  const { id: usuarioId } = await deps.auth.criarAcesso({
    email,
    senha: entrada.senha,
    nome,
    papel: "dentista",
    clinicaId: contexto.clinicaId,
  });
  const dentista: Dentista = {
    id: deps.ids.novo(),
    usuarioId,
    clinicaId: contexto.clinicaId,
    nome,
    cro: entrada.cro.trim(),
    telefone: entrada.telefone.trim(),
    cpf: entrada.cpf.trim(),
    especialidades: entrada.especialidades,
    ativo: true,
  };
  const usuario = {
    id: usuarioId,
    nome,
    email,
    papel: "dentista" as const,
    clinicaId: contexto.clinicaId,
    ativo: true,
  };
  try {
    await deps.usuarios.salvar(usuario);
  } catch (erro) {
    await deps.auth.revogarAcesso(usuarioId);
    throw erro;
  }
  try {
    await deps.dentistas.salvar(dentista);
  } catch (erro) {
    await deps.auth.revogarAcesso(usuarioId);
    await deps.usuarios.apagar(usuarioId);
    throw erro;
  }
  return { ok: true, valor: dentista };
}

export async function editarDentista(
  deps: Dependencias,
  ator: Sessao,
  dentistaId: string,
  entrada: EntradaEditarDentista,
): Promise<Resultado<Dentista>> {
  const contexto = await clinicaDoAdmin(deps, ator);
  if (!contexto.ok) return contexto;

  const atual = await dentistaDaClinica(deps, contexto.clinicaId, dentistaId);
  if (!atual) return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };

  const editado: Dentista = {
    ...atual,
    nome: entrada.nome.trim(),
    cro: entrada.cro.trim(),
    telefone: entrada.telefone.trim(),
    cpf: entrada.cpf.trim(),
    especialidades: entrada.especialidades,
  };
  await deps.dentistas.salvar(editado);

  if (editado.nome !== atual.nome) {
    const usuario = await deps.usuarios.buscarPorId(atual.usuarioId);
    if (usuario) await deps.usuarios.salvar({ ...usuario, nome: editado.nome });
  }
  return { ok: true, valor: editado };
}

export async function removerDentista(
  deps: Dependencias,
  ator: Sessao,
  dentistaId: string,
  agora: Date,
): Promise<Resultado<Dentista>> {
  const contexto = await clinicaDoAdmin(deps, ator);
  if (!contexto.ok) return contexto;

  const atual = await dentistaDaClinica(deps, contexto.clinicaId, dentistaId);
  if (!atual) return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };

  const inativo: Dentista = { ...atual, ativo: false };
  await deps.dentistas.salvar(inativo);

  const usuario = await deps.usuarios.buscarPorId(atual.usuarioId);
  if (usuario) await deps.usuarios.salvar({ ...usuario, ativo: false });
  await deps.auth.revogarAcesso(atual.usuarioId);

  const futuros = await deps.agenda.listarAgendadosFuturos(contexto.clinicaId, agora);
  const alterados = futuros
    .filter((item) => item.dentistaId === atual.id && !item.alertaDentista)
    .map((item) => ({ ...item, alertaDentista: true }));
  if (alterados.length > 0) await deps.agenda.salvarAlertas(alterados);

  return { ok: true, valor: inativo };
}

export async function listarDentistas(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Dentista[]>> {
  const contexto = await clinicaDoAdmin(deps, ator);
  if (!contexto.ok) return contexto;

  const lista = await deps.dentistas.listar(contexto.clinicaId);
  return { ok: true, valor: lista };
}
