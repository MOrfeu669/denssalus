import type { Agendamento } from "../agendamento/tipos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { registrarFalhaEnvio } from "../notificacao/casos";
import type { Dependencias } from "./portas";
import { TEXTOS_PADRAO, aplicarVariaveis, inicioJaPassou, instanteDoLembrete } from "./regras";
import {
  MENSAGEM_CONTEUDO_VAZIO,
  MENSAGEM_FALHA_ENVIO,
  TIPOS_MENSAGEM,
  type MensagemExterna,
  type ModeloMensagem,
  type TipoMensagem,
} from "./tipos";

export async function notificarAgendamentoCriado(
  deps: Dependencias,
  agendamento: Agendamento,
  agora: Date,
): Promise<void> {
  try {
    await programar(deps, agendamento, agora);
  } catch {
    return;
  }
}

export async function enviarPendentes(
  deps: Dependencias,
  clinicaId: string,
  agora: Date,
): Promise<void> {
  const limite = agora.toISOString();
  const pendentes = (await deps.mensagens.listarDaClinica(clinicaId)).filter(
    (mensagem) =>
      mensagem.clinicaId === clinicaId &&
      mensagem.status === "pendente" &&
      mensagem.programadoPara <= limite,
  );
  for (const mensagem of pendentes) {
    if (!(await agendadoNaClinica(deps, clinicaId, mensagem.agendamentoId))) continue;
    const enviou = await disparar(deps, mensagem);
    if (enviou) {
      await deps.mensagens.salvar({ ...mensagem, status: "enviado", enviadoEm: limite });
      continue;
    }
    await deps.mensagens.salvar({ ...mensagem, status: "falhou" });
  }
}

export async function reenviarFalhas(
  deps: Dependencias,
  clinicaId: string,
  agora: Date,
): Promise<void> {
  const falhas = (await deps.mensagens.listarDaClinica(clinicaId)).filter(
    (mensagem) =>
      mensagem.clinicaId === clinicaId && mensagem.status === "falhou" && mensagem.tentativas < 2,
  );
  for (const mensagem of falhas) {
    if (!(await agendadoNaClinica(deps, clinicaId, mensagem.agendamentoId))) continue;
    const enviou = await disparar(deps, mensagem);
    if (enviou) {
      await deps.mensagens.salvar({
        ...mensagem,
        status: "enviado",
        enviadoEm: agora.toISOString(),
      });
      continue;
    }
    const tentativas = mensagem.tentativas + 1;
    await deps.mensagens.salvar({ ...mensagem, status: "falhou", tentativas });
    if (tentativas === 2) {
      await registrarFalhaEnvio(deps.notificacoes, clinicaId, mensagem.id, MENSAGEM_FALHA_ENVIO);
    }
  }
}

export async function listarModelos(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<ModeloMensagem[]>> {
  if (!adminAtivo(ator)) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const clinicaId = ator.usuario.clinicaId;
  const salvos = (await deps.modelos.listar(clinicaId)).filter(
    (modelo) => modelo.clinicaId === clinicaId,
  );
  const valor = TIPOS_MENSAGEM.map((tipo) => {
    const salvo = salvos.find((modelo) => modelo.tipo === tipo);
    return {
      clinicaId,
      tipo,
      conteudo: salvo?.conteudo ?? TEXTOS_PADRAO[tipo],
    };
  });
  return { ok: true, valor };
}

export async function salvarModelo(
  deps: Dependencias,
  ator: Sessao,
  entrada: { tipo: TipoMensagem; conteudo: string },
): Promise<Resultado<ModeloMensagem>> {
  if (!adminAtivo(ator)) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const conteudo = entrada.conteudo.trim();
  if (conteudo === "") return { ok: false, mensagem: MENSAGEM_CONTEUDO_VAZIO };
  const modelo: ModeloMensagem = { clinicaId: ator.usuario.clinicaId, tipo: entrada.tipo, conteudo };
  await deps.modelos.salvar(modelo);
  return { ok: true, valor: modelo };
}

function adminAtivo(ator: Sessao): boolean {
  return ator.usuario.ativo && ator.usuario.papel === "admin";
}

async function programar(
  deps: Dependencias,
  agendamento: Agendamento,
  agora: Date,
): Promise<void> {
  if (inicioJaPassou(agendamento.inicio, agora)) return;

  const paciente = await deps.pacientes.buscarPorId(agendamento.pacienteId);
  if (!paciente || paciente.clinicaId !== agendamento.clinicaId) return;
  const preferido = paciente.canais.find((canal) => canal.preferido);
  if (!preferido) return;

  const modelos = await deps.modelos.listar(agendamento.clinicaId);
  const conteudoDe = (tipo: TipoMensagem): string => {
    const salvo = modelos.find(
      (modelo) => modelo.clinicaId === agendamento.clinicaId && modelo.tipo === tipo,
    );
    return salvo?.conteudo ?? TEXTOS_PADRAO[tipo];
  };
  const gravar = async (tipo: TipoMensagem, quando: Date): Promise<void> => {
    const mensagem: MensagemExterna = {
      id: deps.ids.novo(),
      clinicaId: agendamento.clinicaId,
      pacienteId: agendamento.pacienteId,
      agendamentoId: agendamento.id,
      tipo,
      canal: preferido.canal,
      contato: preferido.contato,
      texto: aplicarVariaveis(conteudoDe(tipo), paciente.nome, agendamento.inicio),
      status: "pendente",
      tentativas: 0,
      programadoPara: quando.toISOString(),
      enviadoEm: null,
    };
    await deps.mensagens.salvar(mensagem);
  };

  await gravar("confirmacao_agendamento", agora);
  const em24 = instanteDoLembrete(agendamento.inicio, 24);
  if (em24 && em24.getTime() >= agora.getTime()) await gravar("lembrete_24h", em24);
  const em5 = instanteDoLembrete(agendamento.inicio, 5);
  if (em5 && em5.getTime() >= agora.getTime()) await gravar("lembrete_5h", em5);
}

async function agendadoNaClinica(
  deps: Dependencias,
  clinicaId: string,
  agendamentoId: string,
): Promise<boolean> {
  const agendamento = await deps.agendamentos.buscarPorId(agendamentoId);
  return agendamento?.clinicaId === clinicaId && agendamento.status === "agendado";
}

async function disparar(deps: Dependencias, mensagem: MensagemExterna): Promise<boolean> {
  try {
    const resposta = await deps.enviador.enviar({
      canal: mensagem.canal,
      contato: mensagem.contato,
      texto: mensagem.texto,
    });
    return resposta.ok === true;
  } catch {
    return false;
  }
}
