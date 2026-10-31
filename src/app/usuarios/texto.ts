export const USUARIOS_VAZIO = "Nenhum usuário cadastrado nesta clínica.";

export const USUARIOS_NOTA_REMOCAO = "Remover o acesso não apaga agendamento nem prontuário.";

export const USUARIOS_SEM_SESSAO = "Nenhuma sessão aberta.";

export function mensagemComDetalhe(mensagem: string, detalhe: string): string {
  return detalhe ? `${mensagem}: ${detalhe}` : mensagem;
}
