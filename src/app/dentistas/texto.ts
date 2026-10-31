export const DENTISTAS_VAZIO = "Nenhum dentista cadastrado nesta clínica.";

export const DENTISTAS_NOTA =
  "O cadastro também cria o acesso de papel Dentista. Remover tira agendamentos novos com ele; os já marcados ficam.";

export const DENTISTAS_SEM_SESSAO = "Nenhuma sessão aberta.";

export function mensagemComDetalhe(mensagem: string, detalhe: string): string {
  return detalhe ? `${mensagem}: ${detalhe}` : mensagem;
}
