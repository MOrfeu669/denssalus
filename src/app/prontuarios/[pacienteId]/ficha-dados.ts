import type { StatusAgendamento } from "../../../domain/agendamento/tipos";
import type { Canal, Paciente, Sexo } from "../../../domain/paciente/tipos";
import { idadeEm } from "../../../domain/paciente/regras";

export type Face = "V" | "D" | "L" | "M" | "O";
export type MarcaFace = "carie" | "rest" | "plan";
export type TipoProcedimento = "carie" | "rest" | "canal" | "coroa" | "ausente";

export type Aparencia = {
  faces: Partial<Record<Face, MarcaFace>>;
  ausente: boolean;
  coroa: boolean;
  canal: boolean;
};

export type AlertaClinico = {
  tipo: "alergia" | "condicao";
  titulo: string;
  orientacao: string | null;
};

export type RegistroVisual = {
  dente: number;
  procedimentoNome: string;
  status: "confirmado" | "revertido";
  registradoEm: string;
};

export type ItemVisual = {
  procedimentoNome: string;
  dentes: number[];
  valor: number;
  status: "pendente" | "concluido";
  agendamentoId?: string | null;
};

const ORDEM_FACES: Face[] = ["O", "M", "D", "V", "L"];
const SEXO: Record<Sexo, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};
const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const ATIVOS = new Set<StatusAgendamento>(["agendado", "em_espera", "iniciado"]);

export function fileirasDeciduas(): { superior: number[]; inferior: number[] } {
  return {
    superior: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    inferior: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  };
}

export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function cpfMascarado(cpf: string | null): string | null {
  if (!cpf) return null;
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return `${primeira}${ultima}`.toLocaleUpperCase("pt-BR");
}

export function linhaMeta(paciente: Paciente, hoje: Date): string {
  const partes: string[] = [];
  if (paciente.dataNascimento) partes.push(`${idadeEm(paciente.dataNascimento, hoje)} anos`);
  if (paciente.sexo) partes.push(SEXO[paciente.sexo]);
  const cpf = cpfMascarado(paciente.cpf);
  partes.push(cpf ? `CPF ${cpf}` : "CPF não informado");
  return partes.join(" · ");
}

export function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function alertasDaAnamnese(conteudo: string | null | undefined): AlertaClinico[] {
  if (!conteudo) return [];
  const linhas = conteudo
    .split(/\r?\n/)
    .map((linha) => linha.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
  const alertas: AlertaClinico[] = [];
  for (let indice = 0; indice < linhas.length; indice += 1) {
    const linha = linhas[indice] ?? "";
    const inicio = /^(alergia|condicao)\b\s*[:\-–]?\s*(.*)$/i.exec(semAcento(linha));
    if (!inicio) continue;
    const tipo = inicio[1]?.toLowerCase() === "alergia" ? "alergia" : "condicao";
    const restoOriginal = linha.replace(/^(alergia|condi[cç][aã]o)\b\s*[:\-–]?\s*/i, "");
    const partido = partirOrientacao(restoOriginal);
    let orientacao = partido.orientacao;
    const seguinte = linhas[indice + 1];
    if (!orientacao && seguinte && !/^(alergia|condicao)\b/i.test(semAcento(seguinte))) {
      orientacao = seguinte;
      indice += 1;
    }
    const nucleo = partido.titulo || (tipo === "alergia" ? "não informada" : "não informada");
    const titulo = tipo === "alergia" && !/^alergia\b/i.test(nucleo) ? `Alergia: ${nucleo}` : nucleo;
    alertas.push({ tipo, titulo, orientacao });
  }
  return alertas;
}

function partirOrientacao(resto: string): { titulo: string; orientacao: string | null } {
  const corte = resto.split(/\s+[—–-]\s+/);
  const titulo = corte[0]?.trim() ?? "";
  if (corte.length < 2 || !corte[1]?.trim()) return { titulo, orientacao: null };
  return { titulo, orientacao: corte.slice(1).join(" — ").trim() };
}

export function tipoProcedimento(nome: string): TipoProcedimento | null {
  const texto = semAcento(nome).toLowerCase();
  if (/\b(ausente|extracao|exodontia)\b/.test(texto)) return "ausente";
  if (/\b(canal|endodont|pulpectomia)\b/.test(texto)) return "canal";
  if (/\bcoroa\b/.test(texto)) return "coroa";
  if (/\b(carie|cariosa)\b/.test(texto)) return "carie";
  if (/\b(restaur|resina|obturac)\b/.test(texto)) return "rest";
  return null;
}

export function facesDoNome(nome: string): Face[] {
  const texto = semAcento(nome);
  const letras = new Set<Face>();
  for (const grupo of texto.toUpperCase().matchAll(/\(([VDLOM]{1,5})\)/g)) {
    for (const letra of grupo[1] ?? "") letras.add(letra as Face);
  }
  const frase = texto.toUpperCase().match(/FACES?\s+([VDLOM](?:\s*(?:,|E)\s*[VDLOM])*)/);
  if (frase?.[1]) {
    for (const letra of frase[1].matchAll(/[VDLOM]/g)) letras.add(letra[0] as Face);
  }
  const baixo = texto.toLowerCase();
  if (/\boclusal\b/.test(baixo)) letras.add("O");
  if (/\bvestibular\b/.test(baixo)) letras.add("V");
  if (/\bmesial\b/.test(baixo)) letras.add("M");
  if (/\bdistal\b/.test(baixo)) letras.add("D");
  if (/\b(lingual|palatina|palatino)\b/.test(baixo)) letras.add("L");
  const achadas = ORDEM_FACES.filter((face) => letras.has(face));
  return achadas.length > 0 ? achadas : ["O"];
}

export function aparenciaDe(registros: RegistroVisual[], itens: ItemVisual[], dente: number): Aparencia {
  const confirmados = registros
    .filter((registro) => registro.dente === dente && registro.status === "confirmado")
    .sort((a, b) => a.registradoEm.localeCompare(b.registradoEm));
  const aparencia: Aparencia = { faces: {}, ausente: false, coroa: false, canal: false };
  for (const registro of confirmados) {
    const tipo = tipoProcedimento(registro.procedimentoNome);
    if (tipo === "ausente") {
      aparencia.ausente = true;
      aparencia.faces = {};
      aparencia.coroa = false;
      aparencia.canal = false;
      continue;
    }
    if (!tipo) continue;
    aparencia.ausente = false;
    if (tipo === "canal") aparencia.canal = true;
    if (tipo === "coroa") aparencia.coroa = true;
    if (tipo === "carie" || tipo === "rest") {
      for (const face of facesDoNome(registro.procedimentoNome)) aparencia.faces[face] = tipo;
    }
  }
  if (aparencia.ausente) return aparencia;
  for (const item of itens) {
    if (item.status !== "pendente" || !item.dentes.includes(dente)) continue;
    for (const face of facesDoNome(item.procedimentoNome)) {
      if (!aparencia.faces[face]) aparencia.faces[face] = "plan";
    }
  }
  return aparencia;
}

export function resumoDoDente(aparencia: Aparencia, protese: string | null): string {
  if (aparencia.ausente) return protese ? `Ausente · prótese: ${protese}` : "Ausente";
  const partes: string[] = [];
  const carie = facesMarcadas(aparencia, "carie");
  const rest = facesMarcadas(aparencia, "rest");
  const plano = facesMarcadas(aparencia, "plan");
  if (carie.length > 0) partes.push(`Cárie ${juntarFaces(carie)}`);
  if (rest.length > 0) partes.push(`Restauração ${juntarFaces(rest)}`);
  if (plano.length > 0) partes.push(`Planejado ${juntarFaces(plano)}`);
  if (aparencia.canal) partes.push("tratamento de canal");
  if (aparencia.coroa) partes.push("coroa");
  if (protese) partes.push(`prótese: ${protese}`);
  return partes.length > 0 ? partes.join(" · ") : "Nenhum registro confirmado neste dente.";
}

function facesMarcadas(aparencia: Aparencia, marca: MarcaFace): Face[] {
  return ORDEM_FACES.filter((face) => aparencia.faces[face] === marca);
}

function juntarFaces(faces: Face[]): string {
  if (faces.length === 1) return `na face ${faces[0]}`;
  const ultima = faces[faces.length - 1];
  return `nas faces ${faces.slice(0, -1).join(", ")} e ${ultima}`;
}

export function nomeDoDente(dente: number): string {
  const quadrante = Math.floor(dente / 10);
  const unidade = dente % 10;
  const deciduo = quadrante >= 5;
  const nomes = deciduo
    ? ["", "incisivo central", "incisivo lateral", "canino", "1º molar", "2º molar"]
    : ["", "incisivo central", "incisivo lateral", "canino", "1º pré-molar", "2º pré-molar", "1º molar", "2º molar", "3º molar"];
  const nome = nomes[unidade] ?? "dente";
  const arco = quadrante === 1 || quadrante === 2 || quadrante === 5 || quadrante === 6 ? "superior" : "inferior";
  const lado = quadrante === 1 || quadrante === 4 || quadrante === 5 || quadrante === 8 ? "direito" : "esquerdo";
  return `${nome} ${arco} ${lado}`;
}

export function denteMaisRecente(registros: { dente: number; status: string; registradoEm: string }[]): number | null {
  const confirmados = registros.filter((registro) => registro.status === "confirmado");
  const ultimo = [...confirmados].sort((a, b) => a.registradoEm.localeCompare(b.registradoEm)).at(-1);
  return ultimo?.dente ?? null;
}

type DebitoResumo = { valor: number; desconto: number; status: "em_aberto" | "quitado" };

export function liquidoDebito(debito: { valor: number; desconto: number }): number {
  return Math.max(0, debito.valor - debito.desconto);
}

export function saldoDevedor(debitos: DebitoResumo[]): number {
  return debitos
    .filter((debito) => debito.status === "em_aberto")
    .reduce((soma, debito) => soma + liquidoDebito(debito), 0);
}

export function resumoFinanceiro(
  debitos: DebitoResumo[],
  plano: { itens: { valor: number; status: string }[] } | null,
) {
  const pago = debitos
    .filter((debito) => debito.status === "quitado")
    .reduce((soma, debito) => soma + liquidoDebito(debito), 0);
  const emAberto = saldoDevedor(debitos);
  const totalPlano = plano ? plano.itens.reduce((soma, item) => soma + item.valor, 0) : null;
  const aFaturar = plano
    ? plano.itens.filter((item) => item.status === "pendente").reduce((soma, item) => soma + item.valor, 0)
    : null;
  const concluidos = plano ? plano.itens.filter((item) => item.status === "concluido").length : 0;
  const etapas = plano ? plano.itens.length : 0;
  const valorConcluido = plano
    ? plano.itens.filter((item) => item.status === "concluido").reduce((soma, item) => soma + item.valor, 0)
    : 0;
  return { pago, emAberto, totalPlano, aFaturar, concluidos, etapas, valorConcluido };
}

export function planoEmFoco<T extends { status: string; criadoEm: string }>(planos: T[]): T | null {
  const porData = (lista: T[]) => [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  return (
    porData(planos.filter((plano) => plano.status === "em_andamento"))[0] ??
    porData(planos.filter((plano) => plano.status === "proposto"))[0] ??
    porData(planos)[0] ??
    null
  );
}

export function indiceEtapaAtual(itens: ItemVisual[], agendamentoId: string | null): number {
  if (agendamentoId) {
    const ligado = itens.findIndex((item) => item.status === "pendente" && item.agendamentoId === agendamentoId);
    if (ligado >= 0) return ligado;
  }
  return itens.findIndex((item) => item.status === "pendente");
}

export function instanteDe(valor: string): number | null {
  const texto = valor.trim();
  const partes = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(texto);
  if (!partes) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(texto)) {
    const data = new Date(texto);
    return Number.isNaN(data.getTime()) ? null : data.getTime();
  }
  const data = new Date(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3]),
    Number(partes[4]),
    Number(partes[5]),
  );
  return data.getTime();
}

export function proximaConsulta<T extends { status: string; inicio: string }>(itens: T[], agora: Date): T | null {
  const marcados = itens
    .filter((item) => ATIVOS.has(item.status as StatusAgendamento))
    .map((item) => ({ item, quando: instanteDe(item.inicio) }))
    .filter((item): item is { item: T; quando: number } => item.quando !== null)
    .sort((a, b) => a.quando - b.quando);
  const futuro = marcados.find((item) => item.quando >= agora.getTime());
  if (futuro) return futuro.item;
  const emCurso = [...marcados]
    .reverse()
    .find((item) => item.item.status === "em_espera" || item.item.status === "iniciado");
  return emCurso?.item ?? null;
}

export function rotuloConsulta(inicio: string, fim: string): { semana: string; dia: string; horario: string } | null {
  const de = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(inicio);
  if (!de) return null;
  const ate = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(fim);
  const data = new Date(Number(de[1]), Number(de[2]) - 1, Number(de[3]));
  const horario = ate ? `${de[4]}:${de[5]} – ${ate[4]}:${ate[5]}` : `${de[4]}:${de[5]}`;
  return { semana: SEMANA[data.getDay()] ?? "", dia: String(Number(de[3])), horario };
}

export function hrefAgendar(pacienteId: string): string {
  return `/agenda?${new URLSearchParams({ paciente: pacienteId })}`;
}

export function textoDoLembrete(inicio: string, canal: Canal | null, agora: Date): string {
  if (!canal) return "Este paciente não tem canal preferido. O lembrete automático não sai.";
  const quando = instanteDe(inicio);
  if (quando === null || quando < agora.getTime()) {
    return "O horário já passou. A mensagem externa não sai para horário que já passou.";
  }
  const nome = canal === "whatsapp" ? "WhatsApp" : canal === "email" ? "E-mail" : "SMS";
  return `O lembrete de 24 h e o de 5 h saem sozinhos pelo ${nome}, se o horário ainda não passou. Não há envio manual.`;
}

export function canalPreferido(paciente: Paciente): Canal | null {
  return paciente.canais.find((canal) => canal.preferido)?.canal ?? paciente.canais[0]?.canal ?? null;
}

export function dataRegistro(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
