import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import type { Dependencias } from "./portas";
import { HORARIO_PADRAO, foraDoHorario, nomeCadeira, normalizarDias } from "./regras";
import {
  MENSAGEM_CADEIRA_NAO_ENCONTRADA,
  MENSAGEM_CLINICA_NAO_ENCONTRADA,
  MENSAGEM_JA_TEM_CLINICA,
  type Cadeira,
  type Clinica,
  type DetalheClinica,
  type EntradaCriarClinica,
  type Funcionamento,
} from "./tipos";

export async function criarClinica(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaCriarClinica,
): Promise<Resultado<DetalheClinica>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  const existente = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (existente) return { ok: false, mensagem: MENSAGEM_JA_TEM_CLINICA };

  const clinica: Clinica = {
    id: deps.ids.novo(),
    nome: entrada.nome.trim(),
    adminId: ator.usuario.id,
    diasAtendimento: normalizarDias(entrada.diasAtendimento),
    horarioAbertura: entrada.horarioAbertura ?? HORARIO_PADRAO.abertura,
    horarioFechamento: entrada.horarioFechamento ?? HORARIO_PADRAO.fechamento,
  };
  const cadeiras: Cadeira[] = Array.from({ length: entrada.cadeiras }, (_, indice) => ({
    id: deps.ids.novo(),
    clinicaId: clinica.id,
    identificacao: nomeCadeira(indice + 1),
    ativa: true,
  }));

  try {
    await deps.clinicas.salvar(clinica);
    for (const cadeira of cadeiras) await deps.cadeiras.salvar(cadeira);
    await deps.usuarios.salvar({ ...ator.usuario, clinicaId: clinica.id });
  } catch (erro) {
    await deps.cadeiras.removerDaClinica(clinica.id);
    await deps.clinicas.remover(clinica.id);
    throw erro;
  }
  return { ok: true, valor: { clinica, cadeiras } };
}

export async function obterClinica(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<DetalheClinica | null>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (!clinica) return { ok: true, valor: null };
  const cadeiras = await deps.cadeiras.listar(clinica.id);
  return { ok: true, valor: { clinica, cadeiras } };
}

export async function configurarFuncionamento(
  deps: Dependencias,
  ator: Sessao,
  entrada: Funcionamento,
  agora: Date,
): Promise<Resultado<Clinica>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  const atual = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (!atual) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

  const clinica: Clinica = {
    ...atual,
    diasAtendimento: normalizarDias(entrada.diasAtendimento),
    horarioAbertura: entrada.horarioAbertura,
    horarioFechamento: entrada.horarioFechamento,
  };
  await deps.clinicas.salvar(clinica);

  const futuros = await deps.agenda.listarAgendadosFuturos(clinica.id, agora);
  const alterados = futuros
    .map((item) => ({ ...item, alertaHorario: foraDoHorario(clinica, item.inicio, item.fim) }))
    .filter((item, indice) => item.alertaHorario !== futuros[indice].alertaHorario);
  if (alterados.length > 0) await deps.agenda.salvarAlertas(alterados);

  return { ok: true, valor: clinica };
}

export async function adicionarCadeira(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Cadeira>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

  const existentes = await deps.cadeiras.listar(clinica.id);
  const cadeira: Cadeira = {
    id: deps.ids.novo(),
    clinicaId: clinica.id,
    identificacao: nomeCadeira(existentes.length + 1),
    ativa: true,
  };
  await deps.cadeiras.salvar(cadeira);
  return { ok: true, valor: cadeira };
}

async function cadeiraDoAdmin(
  deps: Dependencias,
  ator: Sessao,
  cadeiraId: string,
): Promise<Resultado<{ clinica: Clinica; cadeira: Cadeira }>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorAdmin(ator.usuario.id);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

  const cadeiras = await deps.cadeiras.listar(clinica.id);
  const cadeira = cadeiras.find((item) => item.id === cadeiraId);
  if (!cadeira) return { ok: false, mensagem: MENSAGEM_CADEIRA_NAO_ENCONTRADA };
  return { ok: true, valor: { clinica, cadeira } };
}

async function marcarAlertaDaCadeira(
  deps: Dependencias,
  clinicaId: string,
  cadeiraId: string,
  agora: Date,
  alerta: boolean,
) {
  const futuros = await deps.agenda.listarAgendadosFuturos(clinicaId, agora);
  const alterados = futuros
    .filter((item) => item.cadeiraId === cadeiraId && item.alertaCadeira !== alerta)
    .map((item) => ({ ...item, alertaCadeira: alerta }));
  if (alterados.length > 0) await deps.agenda.salvarAlertas(alterados);
}

export async function desativarCadeira(
  deps: Dependencias,
  ator: Sessao,
  cadeiraId: string,
  agora: Date,
): Promise<Resultado<Cadeira>> {
  const achado = await cadeiraDoAdmin(deps, ator, cadeiraId);
  if (!achado.ok) return achado;

  const inativa: Cadeira = { ...achado.valor.cadeira, ativa: false };
  await deps.cadeiras.salvar(inativa);
  await marcarAlertaDaCadeira(deps, achado.valor.clinica.id, inativa.id, agora, true);
  return { ok: true, valor: inativa };
}

export async function reativarCadeira(
  deps: Dependencias,
  ator: Sessao,
  cadeiraId: string,
  agora: Date,
): Promise<Resultado<Cadeira>> {
  const achado = await cadeiraDoAdmin(deps, ator, cadeiraId);
  if (!achado.ok) return achado;

  const ativa: Cadeira = { ...achado.valor.cadeira, ativa: true };
  await deps.cadeiras.salvar(ativa);
  await marcarAlertaDaCadeira(deps, achado.valor.clinica.id, ativa.id, agora, false);
  return { ok: true, valor: ativa };
}
