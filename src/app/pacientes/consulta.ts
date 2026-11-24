import { CHIPS_LISTA, POR_PAGINA, POR_PAGINA_PADRAO, type ChipLista } from "../../domain/paciente/lista";

export const DEBOUNCE_FILTRO_MS = 300;
const LIMITE_TERMO = 80;

export type ConsultaLista = {
  termo: string;
  chip: ChipLista;
  pagina: number;
  porPagina: number;
};

export function lerConsulta(params: {
  q?: string;
  chip?: string;
  pagina?: string;
  linhas?: string;
}): ConsultaLista {
  const chip = (CHIPS_LISTA as readonly string[]).includes(params.chip ?? "")
    ? (params.chip as ChipLista)
    : "todos";
  const paginaBruta = Number(params.pagina);
  const linhasBruta = Number(params.linhas);
  return {
    termo: (params.q ?? "").trim().slice(0, LIMITE_TERMO),
    chip,
    pagina: Number.isFinite(paginaBruta) && paginaBruta >= 1 ? Math.floor(paginaBruta) : 1,
    porPagina: (POR_PAGINA as readonly number[]).includes(linhasBruta) ? linhasBruta : POR_PAGINA_PADRAO,
  };
}

export function hrefDaLista(atual: ConsultaLista, mudanca: Partial<ConsultaLista> = {}): string {
  const termoMudou = mudanca.termo !== undefined && mudanca.termo.trim() !== atual.termo;
  const chipMudou = mudanca.chip !== undefined && mudanca.chip !== atual.chip;
  const linhasMudou = mudanca.porPagina !== undefined && mudanca.porPagina !== atual.porPagina;
  const proxima: ConsultaLista = {
    termo: (mudanca.termo ?? atual.termo).trim().slice(0, LIMITE_TERMO),
    chip: mudanca.chip ?? atual.chip,
    porPagina: mudanca.porPagina ?? atual.porPagina,
    pagina: mudanca.pagina ?? (termoMudou || chipMudou || linhasMudou ? 1 : atual.pagina),
  };
  const params = new URLSearchParams();
  if (proxima.termo !== "") params.set("q", proxima.termo);
  if (proxima.chip !== "todos") params.set("chip", proxima.chip);
  if (proxima.pagina > 1) params.set("pagina", String(proxima.pagina));
  if (proxima.porPagina !== POR_PAGINA_PADRAO) params.set("linhas", String(proxima.porPagina));
  const texto = params.toString();
  return texto === "" ? "/pacientes" : `/pacientes?${texto}`;
}

export function paginasDaLista(atual: number, total: number, porPagina: number): (number | "…")[] {
  const ultima = Math.max(1, Math.ceil(total / Math.max(porPagina, 1)));
  if (ultima <= 7) return Array.from({ length: ultima }, (_, indice) => indice + 1);
  const marcas = new Set<number>([1, ultima]);
  if (atual <= 3) {
    marcas.add(2);
    marcas.add(3);
  } else if (atual >= ultima - 2) {
    marcas.add(ultima - 2);
    marcas.add(ultima - 1);
  } else {
    marcas.add(atual - 1);
    marcas.add(atual);
    marcas.add(atual + 1);
  }
  const ordenados = [...marcas].filter((numero) => numero >= 1 && numero <= ultima).sort((a, b) => a - b);
  const saida: (number | "…")[] = [];
  for (const numero of ordenados) {
    const anterior = saida.at(-1);
    if (typeof anterior === "number" && numero - anterior > 1) saida.push("…");
    saida.push(numero);
  }
  return saida;
}
