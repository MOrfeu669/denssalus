export function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function data(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : valor;
}

export function textoMeta(meta: number | null): string {
  if (meta == null) return "Dias úteis do período";
  return `Dias úteis do período · meta diária ${moeda(meta)}`;
}

export function subtituloDashboard(inicio: string, agora: Date): string {
  const mes = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${inicio}T12:00:00.000Z`));
  const titulo = mes.charAt(0).toUpperCase() + mes.slice(1);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(agora);
  return `${titulo} · atualizado hoje às ${hora}`;
}

export function percentual(valor: number): string {
  const texto = Math.abs(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return `${valor >= 0 ? "+" : "−"}${texto}%`;
}

export function pontos(valor: number): string {
  const texto = Math.abs(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  return `${valor >= 0 ? "+" : "−"}${texto} p.p.`;
}

export function rotuloDia(dataIso: string): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dataIso}T12:00:00.000Z`));
  return texto.replace(".", "");
}

export function tetoDe(maximo: number): number {
  if (!(maximo > 0)) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const n = maximo / potencia;
  const passo = [1, 2, 4, 5, 6, 8, 10].find((item) => item >= n - 1e-9) ?? 10;
  return passo * potencia;
}

export function rotuloEixo(valor: number): string {
  if (valor === 0) return "R$ 0";
  if (valor >= 1000 && valor % 1000 === 0) return `R$ ${valor / 1000}k`;
  return moeda(valor);
}
