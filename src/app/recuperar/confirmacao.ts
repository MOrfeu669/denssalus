/** Confirmação vive só na tela: a action definirSenha lê apenas `senha`. */
export function confirmacaoConfere(senha: string, confirmacao: string): boolean {
  return senha === confirmacao;
}
