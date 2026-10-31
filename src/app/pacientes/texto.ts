import type { Canal, Sexo } from "../../domain/paciente/tipos";

export const ROTULO_CANAL: Record<Canal, string> = {
  sms: "SMS",
  email: "E-mail",
  whatsapp: "WhatsApp",
};

export const ROTULO_SEXO: Record<Sexo, string> = {
  masculino: "masculino",
  feminino: "feminino",
  outro: "outro",
};

export const TEXTO_VAZIO = "Nenhum paciente cadastrado nesta clínica.";

export function textoIdade(idade: number): string {
  return idade === 1 ? "1 ano" : `${idade} anos`;
}

// A mensagem vem da action. O detalhe (nome do paciente com o mesmo CPF, ou nome do salvo) segue depois.
export function textoAviso(mensagem: string, detalhe: string): string {
  return detalhe ? `${mensagem}: ${detalhe}` : mensagem;
}
