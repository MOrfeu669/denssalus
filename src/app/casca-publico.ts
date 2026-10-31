export function telaSemCasca(caminho: string): boolean {
  return caminho === "/login" || caminho.startsWith("/recuperar") || caminho.startsWith("/auth");
}
