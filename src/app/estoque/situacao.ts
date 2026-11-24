export type SituacaoEstoque = "critico" | "baixo" | "normal";

const DIA_MS = 86_400_000;

export function situacaoQuantidade(quantidade: number, minimo: number): SituacaoEstoque {
  if (minimo > 0 && quantidade < minimo) return quantidade * 3 <= minimo ? "critico" : "baixo";
  return "normal";
}

export function somarDias(data: string, dias: number): string {
  return new Date(Date.parse(`${data}T00:00:00.000Z`) + dias * DIA_MS).toISOString().slice(0, 10);
}

export function venceDentro(validade: string | null, hoje: string, dias: number): boolean {
  if (!validade) return false;
  return validade >= hoje && validade <= somarDias(hoje, dias);
}

export function tomValidade(
  validade: string | null,
  hoje: string,
): "perigo" | "aviso" | "normal" | "ausente" {
  if (!validade) return "ausente";
  if (validade <= somarDias(hoje, 30)) return "perigo";
  if (validade <= somarDias(hoje, 60)) return "aviso";
  return "normal";
}

export function mesAno(validade: string | null): string {
  if (!validade) return "—";
  const [ano, mes] = validade.split("-");
  if (!ano || !mes) return validade;
  return `${mes}/${ano}`;
}

export function nivelBarra(quantidade: number, minimo: number): { preenchido: number; marca: number | null } {
  if (minimo <= 0) return { preenchido: quantidade > 0 ? 1 : 0, marca: null };
  return { preenchido: Math.min(quantidade / (minimo * 2), 1), marca: 0.5 };
}

export function consumoSemanal(
  movimentos: { tipo: string; quantidade: number; registradoEm: string }[],
): number | null {
  const baixas = movimentos.filter((item) => item.tipo === "baixa" && Number.isFinite(Date.parse(item.registradoEm)));
  if (baixas.length < 2) return null;
  const datas = baixas.map((item) => Date.parse(item.registradoEm)).sort((a, b) => a - b);
  const span = datas[datas.length - 1]! - datas[0]!;
  const semana = 7 * DIA_MS;
  if (span < semana) return null;
  const total = baixas.reduce((soma, item) => soma + item.quantidade, 0);
  return total / (span / semana);
}

export function quandoCurto(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
  return `${dia} ${hora}`;
}
