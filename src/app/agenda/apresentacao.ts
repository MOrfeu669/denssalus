import type { StatusAgendamento } from "../../domain/agendamento/tipos";
import type { VisaoGrade } from "./posicao";

export const PX_HORA: Record<VisaoGrade, number> = { dia: 64, semana: 60 };

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const SIGLAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const TITULOS = new Set(["dr", "dra"]);

export const LETRAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export const AVATARES = [
  { fundo: "#E9E3FF", tinta: "#5B21B6" },
  { fundo: "#DBEAFE", tinta: "#1E40AF" },
  { fundo: "#DCFCE7", tinta: "#166534" },
];

export const CORES_DENTISTA = [
  { fill: "#F3EEFF", stripe: "#7C3AED", texto: "#4C1D95" },
  { fill: "#EFF6FF", stripe: "#2563EB", texto: "#1E3A8A" },
  { fill: "#F0FDF4", stripe: "#16A34A", texto: "#14532D" },
];

export const ALMOCO = { inicio: 12 * 60, fim: 13 * 60 };

export type ColunaDia = {
  id: string;
  nome: string;
  subtitulo: string;
  cadeiraId: string;
};

type DataLida = { ano: number; mes: number; dia: number; date: Date };

function par(n: number) {
  return String(n).padStart(2, "0");
}

function lerData(valor: string): DataLida | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!partes) return null;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const date = new Date(ano, mes - 1, dia);
  if (date.getFullYear() !== ano || date.getMonth() !== mes - 1 || date.getDate() !== dia) return null;
  return { ano, mes, dia, date };
}

function capital(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function pixelsPorMinuto(visao: VisaoGrade) {
  return PX_HORA[visao] / 60;
}

export function minutosRelogio(hhmm: string): number | null {
  const partes = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!partes) return null;
  const hora = Number(partes[1]);
  const minuto = Number(partes[2]);
  if (hora > 23 || minuto > 59) return null;
  return hora * 60 + minuto;
}

export function almocoVisivel(abertura: string, fechamento: string) {
  const abre = minutosRelogio(abertura);
  const fecha = minutosRelogio(fechamento);
  if (abre === null || fecha === null) return false;
  return abre <= ALMOCO.inicio && fecha >= ALMOCO.fim;
}

export function minutosEntre(inicio: string, fim: string) {
  const hi = Number(inicio.slice(11, 13));
  const mi = Number(inicio.slice(14, 16));
  const hf = Number(fim.slice(11, 13));
  const mf = Number(fim.slice(14, 16));
  if ([hi, mi, hf, mf].some((n) => Number.isNaN(n))) return 0;
  const a = hi * 60 + mi;
  if (inicio.slice(0, 10) !== fim.slice(0, 10)) return Math.max(0, 24 * 60 - a);
  return Math.max(0, hf * 60 + mf - a);
}

export function percentualOcupacao(entrada: {
  minutosOcupados: number;
  dentistas: number;
  abertura: string;
  fechamento: string;
  dias: number;
}): number | null {
  const abre = minutosRelogio(entrada.abertura);
  const fecha = minutosRelogio(entrada.fechamento);
  if (abre === null || fecha === null || fecha <= abre) return null;
  const capacidade = entrada.dentistas * (fecha - abre) * entrada.dias;
  if (capacidade <= 0) return null;
  return Math.round((entrada.minutosOcupados / capacidade) * 100);
}

export function semanaIso(data: string): number | null {
  const lida = lerData(data);
  if (!lida) return null;
  const alvo = new Date(Date.UTC(lida.ano, lida.mes - 1, lida.dia));
  const dia = alvo.getUTCDay() || 7;
  alvo.setUTCDate(alvo.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(alvo.getUTCFullYear(), 0, 1));
  return Math.ceil(((alvo.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
}

export function rotuloContagem(valor: number, um: string, varios: string) {
  return `${valor} ${valor === 1 ? um : varios}`;
}

export function resumoDia(consultas: number, espera: number) {
  return `${rotuloContagem(consultas, "consulta hoje", "consultas hoje")} · ${rotuloContagem(espera, "paciente na sala de espera", "pacientes na sala de espera")}`;
}

export function resumoSemana(semana: number, consultas: number, ocupacao: number | null) {
  const base = `Semana ${semana} · ${rotuloContagem(consultas, "consulta", "consultas")}`;
  return ocupacao === null ? base : `${base} · ocupação ${ocupacao}%`;
}

export function rotuloDiaLongo(data: string) {
  const lida = lerData(data);
  if (!lida) return data;
  return `${capital(SEMANA[lida.date.getDay()])}, ${lida.dia} de ${MESES[lida.mes - 1]}`;
}

export function rotuloIntervalo(inicio: string, fim: string) {
  const a = lerData(inicio);
  const b = lerData(fim);
  if (!a || !b) return `${inicio} – ${fim}`;
  if (a.ano === b.ano && a.mes === b.mes) {
    return `${a.dia} – ${b.dia} de ${MESES[a.mes - 1]} de ${a.ano}`;
  }
  if (a.ano === b.ano) {
    return `${a.dia} de ${MESES[a.mes - 1]} – ${b.dia} de ${MESES[b.mes - 1]} de ${a.ano}`;
  }
  return `${a.dia} de ${MESES[a.mes - 1]} de ${a.ano} – ${b.dia} de ${MESES[b.mes - 1]} de ${b.ano}`;
}

export function rotuloColunaSemana(data: string) {
  const lida = lerData(data);
  if (!lida) return { sigla: data, numero: 0 };
  return { sigla: SIGLAS[lida.date.getDay()], numero: lida.dia };
}

export function nomeMesAno(ano: number, mes: number) {
  const nome = MESES[mes - 1] ?? "";
  return `${capital(nome)} ${ano}`;
}

export function deslocarMes(ano: number, mes: number, delta: number) {
  const data = new Date(ano, mes - 1 + delta, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() + 1 };
}

export function diasDoMes(ano: number, mes: number) {
  const total = new Date(ano, mes, 0).getDate();
  return Array.from({ length: total }, (_, indice) => {
    const dia = indice + 1;
    const data = new Date(ano, mes - 1, dia);
    return {
      dia,
      iso: `${ano}-${par(mes)}-${par(dia)}`,
      domingo: data.getDay() === 0,
    };
  });
}

export function iniciais(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => !TITULOS.has(parte.toLowerCase().replace(/\./g, "")));
  if (partes.length === 0) return "?";
  const ultima = partes[partes.length - 1] ?? "";
  const letras = partes.length === 1 ? partes[0].slice(0, 2) : `${partes[0][0]}${ultima[0] ?? ""}`;
  return letras.toLocaleUpperCase("pt-BR");
}

export function trilhosNaColuna(itens: { id: string; inicio: number; fim: number }[]) {
  const ordenados = [...itens].sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);
  const ocupacao: number[] = [];
  const faixa = new Map<string, number>();
  for (const item of ordenados) {
    let indice = ocupacao.findIndex((fim) => fim <= item.inicio);
    if (indice < 0) {
      indice = ocupacao.length;
      ocupacao.push(item.fim);
    } else {
      ocupacao[indice] = item.fim;
    }
    faixa.set(item.id, indice);
  }
  return { faixa, total: Math.max(ocupacao.length, 1) };
}

export function contarDia(itens: { status: StatusAgendamento }[]) {
  return {
    consultas: itens.filter((item) => item.status !== "cancelado").length,
    espera: itens.filter((item) => item.status === "em_espera").length,
  };
}

function cadeirasDoDentista(
  dentistaId: string,
  agendamentos: { dentistaId: string; cadeiraId: string }[],
  nomes: Record<string, string>,
) {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const item of agendamentos) {
    if (item.dentistaId !== dentistaId || vistos.has(item.cadeiraId)) continue;
    vistos.add(item.cadeiraId);
    saida.push(nomes[item.cadeiraId] ?? item.cadeiraId);
  }
  return saida;
}

function cadeiraUnica(
  dentistaId: string,
  agendamentos: { dentistaId: string; cadeiraId: string }[],
) {
  const ids = new Set(
    agendamentos.filter((item) => item.dentistaId === dentistaId).map((item) => item.cadeiraId),
  );
  if (ids.size !== 1) return null;
  return [...ids][0] ?? null;
}

export function colunasDoDia(entrada: {
  dentistaId: string | null;
  dentistas: { id: string; nome: string }[];
  presentes: { dentistaId: string }[];
  agendamentos: { dentistaId: string; cadeiraId: string }[];
  nomesDentistas: Record<string, string>;
  nomesCadeiras: Record<string, string>;
  cadeiraId: string | null;
  nomeCadeiraFiltrada: string | null;
}): ColunaDia[] {
  const base = entrada.dentistaId
    ? entrada.dentistas.filter((item) => item.id === entrada.dentistaId)
    : entrada.dentistas;
  const ids = new Set(base.map((item) => item.id));
  const extras: { id: string; nome: string }[] = [];
  for (const item of entrada.presentes) {
    if (ids.has(item.dentistaId)) continue;
    if (entrada.dentistaId && item.dentistaId !== entrada.dentistaId) continue;
    ids.add(item.dentistaId);
    extras.push({
      id: item.dentistaId,
      nome: entrada.nomesDentistas[item.dentistaId] ?? item.dentistaId,
    });
  }
  return [...base, ...extras].map((dentista) => {
    const cadeiras = cadeirasDoDentista(dentista.id, entrada.agendamentos, entrada.nomesCadeiras);
    return {
      id: dentista.id,
      nome: dentista.nome,
      subtitulo: cadeiras.length > 0 ? cadeiras.join(" · ") : (entrada.nomeCadeiraFiltrada ?? ""),
      cadeiraId: cadeiraUnica(dentista.id, entrada.agendamentos) ?? entrada.cadeiraId ?? "",
    };
  });
}
