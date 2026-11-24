export const CHIPS_LISTA = [
  "todos",
  "em_tratamento",
  "com_debito",
  "retorno_pendente",
  "aniversariantes",
] as const;

export type ChipLista = (typeof CHIPS_LISTA)[number];

export const SITUACOES_LISTA = [
  "em_tratamento",
  "debito_em_aberto",
  "retorno_pendente",
  "alta",
  "inativo",
] as const;

export type SituacaoLista = (typeof SITUACOES_LISTA)[number];

export const POR_PAGINA = [10, 25, 50] as const;
export const POR_PAGINA_PADRAO = 10;
export const MESES_PARA_INATIVO = 12;
const FUSO_CLINICA = "America/Sao_Paulo";
const MINIMO_DIGITOS = 3;

export type FatoLista = {
  clinicaId: string;
  id: string;
  nome: string;
  cpf: string | null;
  dataNascimento: string | null;
  telefone: string | null;
  email: string | null;
  responsavelNome: string | null;
  emTratamento: boolean;
  comDebito: boolean;
  retornoPendente: boolean;
  ultimaVisita: string | null;
  proximaConsulta: string | null;
};

export type PedidoLista = {
  clinicaId: string;
  termo: string;
  chip: ChipLista;
  pagina: number;
  porPagina: number;
  agora: Date;
};

export type ContagensLista = Record<ChipLista, number>;

export type RecorteLista = {
  fatos: FatoLista[];
  totalFiltrado: number;
  totalClinica: number;
  pagina: number;
  porPagina: number;
  contagens: ContagensLista;
};

export function normalizarBusca(valor: string): string {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
}

function aniversariante(nascimento: string | null, agora: Date): boolean {
  if (!nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return false;
  const mes = new Intl.DateTimeFormat("en-US", { timeZone: FUSO_CLINICA, month: "2-digit" }).format(agora);
  return Number(nascimento.slice(5, 7)) === Number(mes);
}

function casaTermo(fato: FatoLista, termo: string): boolean {
  const consulta = termo.trim();
  if (consulta === "") return true;
  const pedido = normalizarBusca(consulta);
  if (pedido !== "" && normalizarBusca(fato.nome).includes(pedido)) return true;
  const digitos = consulta.replace(/\D/g, "");
  if (digitos.length < MINIMO_DIGITOS) return false;
  const cpf = (fato.cpf ?? "").replace(/\D/g, "");
  if (cpf.includes(digitos)) return true;
  return (fato.telefone ?? "").replace(/\D/g, "").includes(digitos);
}

function aceitaChip(fato: FatoLista, chip: ChipLista, agora: Date): boolean {
  if (chip === "todos") return true;
  if (chip === "em_tratamento") return fato.emTratamento;
  if (chip === "com_debito") return fato.comDebito;
  if (chip === "retorno_pendente") return fato.retornoPendente;
  return aniversariante(fato.dataNascimento, agora);
}

function visitaRecente(iso: string | null, agora: Date): boolean {
  if (!iso) return false;
  const visita = new Date(iso).getTime();
  if (Number.isNaN(visita)) return false;
  const limite = new Date(agora.getTime());
  limite.setMonth(limite.getMonth() - MESES_PARA_INATIVO);
  return visita >= limite.getTime();
}

export function situacaoDe(fato: FatoLista, agora: Date): SituacaoLista {
  if (fato.comDebito) return "debito_em_aberto";
  const proxima = fato.proximaConsulta ? new Date(fato.proximaConsulta).getTime() : Number.NaN;
  const temProxima = !Number.isNaN(proxima) && proxima > agora.getTime();
  if (fato.retornoPendente && !temProxima) return "retorno_pendente";
  if (fato.emTratamento) return "em_tratamento";
  if (visitaRecente(fato.ultimaVisita, agora)) return "alta";
  return "inativo";
}

function porPaginaDe(valor: number): number {
  return (POR_PAGINA as readonly number[]).includes(valor) ? valor : POR_PAGINA_PADRAO;
}

function ordenar(fatos: FatoLista[]): FatoLista[] {
  return [...fatos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.id.localeCompare(b.id));
}

export function filtrarLista(fatos: FatoLista[], pedido: PedidoLista): Omit<RecorteLista, "pagina" | "porPagina"> {
  const daClinica = fatos.filter((fato) => fato.clinicaId === pedido.clinicaId);
  const peloTexto = daClinica.filter((fato) => casaTermo(fato, pedido.termo));
  const contagens: ContagensLista = {
    todos: peloTexto.length,
    em_tratamento: peloTexto.filter((fato) => fato.emTratamento).length,
    com_debito: peloTexto.filter((fato) => fato.comDebito).length,
    retorno_pendente: peloTexto.filter((fato) => fato.retornoPendente).length,
    aniversariantes: peloTexto.filter((fato) => aniversariante(fato.dataNascimento, pedido.agora)).length,
  };
  const filtrados = ordenar(peloTexto.filter((fato) => aceitaChip(fato, pedido.chip, pedido.agora)));
  return {
    fatos: filtrados,
    totalFiltrado: filtrados.length,
    totalClinica: daClinica.length,
    contagens,
  };
}

export function recortarLista(fatos: FatoLista[], pedido: PedidoLista): RecorteLista {
  const filtrado = filtrarLista(fatos, pedido);
  const porPagina = porPaginaDe(pedido.porPagina);
  const paginas = Math.max(1, Math.ceil(filtrado.totalFiltrado / porPagina));
  const pagina = Math.min(Math.max(1, Math.floor(pedido.pagina) || 1), paginas);
  const inicio = (pagina - 1) * porPagina;
  return {
    ...filtrado,
    fatos: filtrado.fatos.slice(inicio, inicio + porPagina),
    pagina,
    porPagina,
  };
}

/** Seleção vazia exporta o filtro. Id de outra clínica ou fora do filtro fica de fora. */
export function fatosParaExportar(fatos: FatoLista[], pedido: PedidoLista, ids: string[]): FatoLista[] {
  const filtrados = filtrarLista(fatos, pedido).fatos;
  if (ids.length === 0) return filtrados;
  const escolhidos = new Set(ids);
  return filtrados.filter((fato) => escolhidos.has(fato.id));
}
