import type { Dependencias } from "./portas";
import { destinatarios, urgenciaDe, visivel } from "./regras";
import type { Notificacao, PedidoPublicacao, TipoNotificacao } from "./tipos";

export async function publicar(deps: Dependencias, pedido: PedidoPublicacao): Promise<void> {
  const urgencia = urgenciaDe(pedido.tipo);
  for (const destinatarioId of new Set(pedido.destinatarioIds)) {
    const aberta = await deps.notificacoes.buscarAberta(
      destinatarioId,
      pedido.tipo,
      pedido.referenciaId,
    );
    if (aberta && !aberta.resolvida) continue;

    await deps.notificacoes.salvar({
      id: deps.ids.novo(),
      clinicaId: pedido.clinicaId,
      destinatarioId,
      tipo: pedido.tipo,
      urgencia,
      referenciaId: pedido.referenciaId,
      mensagem: pedido.mensagem,
      lida: false,
      resolvida: false,
      criadaEm: deps.agora(),
    });
  }
}

// Publica para os destinatários que a regra do tipo define para a clínica.
export async function publicarPorRegra(
  deps: Dependencias,
  entrada: {
    clinicaId: string;
    tipo: TipoNotificacao;
    referenciaId: string;
    mensagem: string;
    dentistaUsuarioId?: string;
  },
): Promise<void> {
  const usuarios = await deps.usuarios.listarAtivos(entrada.clinicaId);
  await publicar(deps, {
    clinicaId: entrada.clinicaId,
    tipo: entrada.tipo,
    referenciaId: entrada.referenciaId,
    mensagem: entrada.mensagem,
    destinatarioIds: destinatarios(usuarios, entrada.tipo, entrada.dentistaUsuarioId),
  });
}

export async function listarVisiveis(
  deps: Dependencias,
  clinicaId: string,
  destinatarioId: string,
): Promise<Notificacao[]> {
  const todas = await deps.notificacoes.listar(clinicaId, destinatarioId);
  return todas.filter(
    (item) =>
      item.clinicaId === clinicaId && item.destinatarioId === destinatarioId && visivel(item),
  );
}

// A porta `listar` exige a clínica; sem ela não há como localizar a notificação do destinatário.
export async function marcarLida(
  deps: Dependencias,
  destinatarioId: string,
  notificacaoId: string,
  clinicaId: string,
): Promise<void> {
  const proprias = await deps.notificacoes.listar(clinicaId, destinatarioId);
  const alvo = proprias.find(
    (item) =>
      item.id === notificacaoId &&
      item.destinatarioId === destinatarioId &&
      item.clinicaId === clinicaId,
  );
  if (!alvo) return;
  await deps.notificacoes.atualizar({ ...alvo, lida: true });
}

export async function resolver(
  deps: Dependencias,
  clinicaId: string,
  tipo: TipoNotificacao,
  referenciaId: string,
): Promise<void> {
  const usuarios = await deps.usuarios.listarAtivos(clinicaId);
  for (const usuario of usuarios) {
    const doUsuario = await deps.notificacoes.listar(clinicaId, usuario.id);
    for (const item of doUsuario) {
      const alvo =
        item.clinicaId === clinicaId &&
        item.tipo === tipo &&
        item.referenciaId === referenciaId &&
        !item.resolvida;
      if (alvo) await deps.notificacoes.atualizar({ ...item, resolvida: true });
    }
  }
}

export async function registrarFalhaEnvio(
  deps: Dependencias,
  clinicaId: string,
  referenciaId: string,
  mensagem: string,
): Promise<void> {
  await publicarPorRegra(deps, { clinicaId, tipo: "falha_envio_mensagem", referenciaId, mensagem });
}
