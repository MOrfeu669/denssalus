import type { Paciente } from "./tipos";

export type AlvoBusca = {
  id: string;
  clinicaId: string;
  nome: string;
  cpf: string | null;
  telefones: string[];
};

const MINIMO_LETRAS = 2;
const MINIMO_DIGITOS = 3;

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** CPF com ou sem máscara vira só dígitos. Não valida o dígito verificador. */
export function normalizarCpf(valor: string): string {
  return somenteDigitos(valor);
}

/** Telefone com ou sem máscara, com ou sem DDI 55. */
export function normalizarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor);
  if (digitos.startsWith("55") && digitos.length > 11) return digitos.slice(2);
  return digitos;
}

/** Mostra o começo e o fim. O miolo não volta para a lista. */
export function mascararCpf(cpf: string | null): string | null {
  const digitos = normalizarCpf(cpf ?? "");
  if (digitos.length !== 11) return null;
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9)}`;
}

export function telefonesDoPaciente(paciente: Pick<Paciente, "canais" | "responsavel">): string[] {
  const telefones = paciente.canais
    .filter((canal) => canal.canal === "sms" || canal.canal === "whatsapp")
    .map((canal) => canal.contato);
  if (paciente.responsavel?.telefone) telefones.push(paciente.responsavel.telefone);
  return telefones;
}

function dobrar(valor: string): string {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

function combina(alvo: AlvoBusca, termo: string): boolean {
  const digitosCpf = normalizarCpf(termo);
  const digitosTelefone = normalizarTelefone(termo);
  const nome = dobrar(alvo.nome);
  const consultaNome = dobrar(termo)
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (consultaNome.replace(/[^a-z]/g, "").length >= MINIMO_LETRAS && nome.includes(consultaNome)) {
    return true;
  }
  if (digitosCpf.length >= MINIMO_DIGITOS) {
    const cpf = normalizarCpf(alvo.cpf ?? "");
    if (cpf.includes(digitosCpf)) return true;
  }
  if (digitosTelefone.length >= MINIMO_DIGITOS) {
    return alvo.telefones.some((telefone) => {
      const normal = normalizarTelefone(telefone);
      const termoNoTelefone = normal.includes(digitosTelefone);
      const telefoneNoTermo = normal.length >= MINIMO_DIGITOS && digitosTelefone.includes(normal);
      return termoNoTelefone || telefoneNoTermo;
    });
  }
  return false;
}

/** Descarta outra clínica antes de comparar nome, CPF ou telefone. */
export function filtrarPacientes(alvos: AlvoBusca[], clinicaId: string, termo: string): AlvoBusca[] {
  const consulta = termo.trim();
  if (consulta === "") return [];
  return alvos.filter((alvo) => alvo.clinicaId === clinicaId && combina(alvo, consulta));
}
