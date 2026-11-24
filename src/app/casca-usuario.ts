function ehTitulo(parte: string): boolean {
  const limpo = parte.toLocaleLowerCase("pt-BR").replace(/\./g, "");
  return limpo === "dr" || limpo === "dra" || limpo === "doutor" || limpo === "doutora";
}

export function iniciaisDoNome(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte !== "" && !ehTitulo(parte));
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return `${partes[0]![0] ?? ""}${partes[partes.length - 1]![0] ?? ""}`.toUpperCase();
}
