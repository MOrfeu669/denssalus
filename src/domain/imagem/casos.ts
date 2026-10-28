import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import type { Dependencias } from "./portas";
import { caminhoEsperado, emOrdemCronologica, prazoDeRemocao, validarEntrada } from "./regras";
import {
  MENSAGEM_IMAGEM_NAO_ENCONTRADA,
  type EntradaImagem,
  type ImagemProntuario,
  type PreparoUpload,
} from "./tipos";

const naoEncontrada = { ok: false, mensagem: MENSAGEM_IMAGEM_NAO_ENCONTRADA } as const;

async function pacienteDaClinica(deps: Dependencias, ator: Sessao, pacienteId: string) {
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  return paciente && paciente.clinicaId === ator.usuario.clinicaId ? paciente : null;
}

async function imagemDaClinica(deps: Dependencias, ator: Sessao, imagemId: string) {
  const imagem = await deps.imagens.buscarPorId(imagemId);
  return imagem && imagem.clinicaId === ator.usuario.clinicaId ? imagem : null;
}

export async function prepararUpload(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<PreparoUpload>> {
  const permitido = autorizarAcao(ator, "imagem:anexar");
  if (!permitido.ok) return permitido;
  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const id = deps.ids.novo();
  return { ok: true, valor: { id, caminho: caminhoEsperado(ator.usuario.clinicaId, paciente.id, id) } };
}

export async function confirmarImagem(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaImagem,
  agora: Date,
): Promise<Resultado<ImagemProntuario>> {
  const permitido = autorizarAcao(ator, "imagem:anexar");
  if (!permitido.ok) return permitido;
  const clinicaId = ator.usuario.clinicaId;

  const paciente = await pacienteDaClinica(deps, ator, entrada.pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const invalida = validarEntrada(entrada, clinicaId);
  if (invalida) return { ok: false, mensagem: invalida.mensagem };

  if (entrada.agendamentoId !== null) {
    const agendamento = await deps.agendamentos.buscarPorId(entrada.agendamentoId);
    if (!agendamento || agendamento.clinicaId !== clinicaId || agendamento.pacienteId !== paciente.id) {
      return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
    }
  }

  const imagem: ImagemProntuario = {
    id: entrada.id,
    clinicaId,
    pacienteId: paciente.id,
    agendamentoId: entrada.agendamentoId,
    dente: entrada.dente,
    tipoCaso: entrada.tipoCaso.trim(),
    descricao: entrada.descricao.trim(),
    caminho: entrada.caminho,
    tamanhoBytes: entrada.tamanhoBytes,
    adicionadoPor: ator.usuario.id,
    adicionadoEm: agora.toISOString(),
    excluidoEm: null,
    remocaoDefinitivaEm: null,
  };
  await deps.imagens.salvar(imagem);
  return { ok: true, valor: imagem };
}

// Não há cron: a listagem expurga o que já passou do prazo de segurança.
export async function listarImagens(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  agora: Date,
): Promise<Resultado<{ ativas: ImagemProntuario[]; pendentes: ImagemProntuario[] }>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const clinicaId = ator.usuario.clinicaId;
  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const instante = agora.toISOString();
  const doPaciente = (await deps.imagens.listarPorPaciente(clinicaId, pacienteId)).filter(
    (i) => i.clinicaId === clinicaId && i.pacienteId === pacienteId,
  );
  const vencida = (i: ImagemProntuario) =>
    i.excluidoEm !== null && i.remocaoDefinitivaEm !== null && i.remocaoDefinitivaEm <= instante;

  for (const imagem of doPaciente.filter(vencida)) {
    await deps.arquivos.remover(imagem.caminho);
    await deps.imagens.apagar(imagem.id);
  }

  const vivas = doPaciente.filter((i) => !vencida(i));
  return {
    ok: true,
    valor: {
      ativas: emOrdemCronologica(vivas.filter((i) => i.excluidoEm === null)),
      pendentes: emOrdemCronologica(vivas.filter((i) => i.excluidoEm !== null)),
    },
  };
}

export async function excluirImagem(
  deps: Dependencias,
  ator: Sessao,
  imagemId: string,
  agora: Date,
): Promise<Resultado<ImagemProntuario>> {
  const permitido = autorizarAcao(ator, "imagem:anexar");
  if (!permitido.ok) return permitido;
  const imagem = await imagemDaClinica(deps, ator, imagemId);
  if (!imagem) return naoEncontrada;
  // Já pendente: mantém o prazo original.
  if (imagem.excluidoEm !== null) return { ok: true, valor: imagem };

  const excluida: ImagemProntuario = {
    ...imagem,
    excluidoEm: agora.toISOString(),
    remocaoDefinitivaEm: prazoDeRemocao(agora),
  };
  await deps.imagens.salvar(excluida);
  return { ok: true, valor: excluida };
}

export async function restaurarImagem(
  deps: Dependencias,
  ator: Sessao,
  imagemId: string,
  agora: Date,
): Promise<Resultado<ImagemProntuario>> {
  const permitido = autorizarAcao(ator, "imagem:anexar");
  if (!permitido.ok) return permitido;
  const imagem = await imagemDaClinica(deps, ator, imagemId);
  if (!imagem) return naoEncontrada;
  if (imagem.excluidoEm === null) return { ok: true, valor: imagem };
  if (imagem.remocaoDefinitivaEm === null || agora.toISOString() >= imagem.remocaoDefinitivaEm) {
    return naoEncontrada;
  }

  const restaurada: ImagemProntuario = { ...imagem, excluidoEm: null, remocaoDefinitivaEm: null };
  await deps.imagens.salvar(restaurada);
  return { ok: true, valor: restaurada };
}
