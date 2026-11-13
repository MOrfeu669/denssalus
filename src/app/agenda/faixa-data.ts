export const AMOSTRAS = 3;
export const LADO = 2;
export const CENTRO = LADO + 1;
export const JANELA = AMOSTRAS + LADO * 2;

const NOMES_MES = [
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

const NOMES_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function par(n: number) {
  return String(n).padStart(2, "0");
}

function partes(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return { ano, mes, dia };
}

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${par(mes)}-${par(dia)}`;
}

export function deslocarDia(data: string, dias: number) {
  const { ano, mes, dia } = partes(data);
  const alvo = new Date(ano, mes - 1, dia + dias);
  return iso(alvo.getFullYear(), alvo.getMonth() + 1, alvo.getDate());
}

export function hojeIso(agora = new Date()) {
  return iso(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
}

export function dataNoMes(data: string, meses: number) {
  const { ano, mes, dia } = partes(data);
  const primeiro = new Date(ano, mes - 1 + meses, 1);
  const ultimo = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
  return iso(primeiro.getFullYear(), primeiro.getMonth() + 1, Math.min(dia, ultimo));
}

export function faixa(centro: string, deslocar: (data: string, passos: number) => string, alcance = CENTRO) {
  return Array.from({ length: alcance * 2 + 1 }, (_, indice) => deslocar(centro, indice - alcance));
}

export function passosDoArraste(deslocamentoPx: number, passoPx: number) {
  if (passoPx <= 0) return 0;
  const passos = Math.round(-deslocamentoPx / passoPx);
  return passos === 0 ? 0 : passos;
}

export function distanciaVisual(indice: number, centro: number, deslocamentoPx: number, passoPx: number) {
  const shift = passoPx <= 0 ? 0 : deslocamentoPx / passoPx;
  return indice - centro + shift;
}

export function papelDaDistancia(distancia: number): "amostra" | "lado" | "fora" {
  const abs = Math.abs(distancia);
  if (abs <= (AMOSTRAS - 1) / 2) return "amostra";
  if (abs <= CENTRO) return "lado";
  return "fora";
}

export function rotuloDia(data: string) {
  const { ano, mes, dia } = partes(data);
  const semana = NOMES_SEMANA[new Date(ano, mes - 1, dia).getDay()];
  return { semana, numero: String(dia) };
}

export function nomeMes(data: string) {
  return NOMES_MES[partes(data).mes - 1];
}
