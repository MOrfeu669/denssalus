import { situacaoDe, type FatoLista } from "../../domain/paciente/lista";
import { menorDeIdade } from "../../domain/paciente/regras";
import type { LinhaVisivel } from "./tipos-lista";

function iniciaisDaLista(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte !== "" && parte !== "(menor)");
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0]!.slice(0, 2).toLocaleUpperCase("pt-BR");
  return `${partes[0]![0] ?? ""}${partes[1]![0] ?? ""}`.toLocaleUpperCase("pt-BR");
}

const FUSO = "America/Sao_Paulo";

export function mascararCpfLista(cpf: string | null): string {
  const digitos = (cpf ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return "—";
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}

function partes(iso: string, opcoes: Intl.DateTimeFormatOptions): Record<string, string> {
  const formatado = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes }).formatToParts(new Date(iso));
  return Object.fromEntries(formatado.map((parte) => [parte.type, parte.value]));
}

export function formatarDataLista(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  const mapa = partes(iso, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${mapa.day}/${mapa.month}/${mapa.year}`;
}

export function formatarProximaLista(iso: string): string {
  const mapa = partes(iso, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${mapa.day}/${mapa.month} · ${mapa.hour}:${mapa.minute}`;
}

export function apresentarLinha(fato: FatoLista, agora: Date): LinhaVisivel {
  const menor = menorDeIdade(fato.dataNascimento, agora);
  return {
    id: fato.id,
    nome: menor ? `${fato.nome} (menor)` : fato.nome,
    iniciais: iniciaisDaLista(fato.nome),
    complemento: menor && fato.responsavelNome ? `Resp.: ${fato.responsavelNome}` : (fato.email ?? "—"),
    cpf: mascararCpfLista(fato.cpf),
    telefone: fato.telefone ?? "—",
    ultimaVisita: formatarDataLista(fato.ultimaVisita),
    proximaConsulta: fato.proximaConsulta ? formatarProximaLista(fato.proximaConsulta) : null,
    situacao: situacaoDe(fato, agora),
  };
}
