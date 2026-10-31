export const CLINICA_SEM_CLINICA =
  "Esta conta ainda não tem clínica. Crie a clínica para configurar horário e cadeiras.";

export const CLINICA_SUGESTAO_HORARIO = "Sugestão: 08:00–18:00";

export const CLINICA_CADEIRAS_VAZIO = "Nenhuma cadeira cadastrada nesta clínica.";

export const CLINICA_SEM_SESSAO = "Nenhuma sessão aberta.";

export function mensagemComDetalhe(mensagem: string, detalhe: string): string {
  return detalhe ? `${mensagem}: ${detalhe}` : mensagem;
}
