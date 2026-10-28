const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

export function dataIso(hoje: Date): string {
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

export function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return dataIso(new Date(ano, mes - 1, dia + dias));
}

function dataReal(iso: string): boolean {
  if (!FORMATO_DATA.test(iso)) return false;
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

export function dataFutura(dataPrevista: string, hoje: Date): boolean {
  return dataReal(dataPrevista) && dataPrevista > dataIso(hoje);
}

export function dentroDoPrazo(dataPrevista: string, diasAntecedencia: number, hoje: Date): boolean {
  return dataIso(hoje) >= somarDias(dataPrevista, -diasAntecedencia);
}
