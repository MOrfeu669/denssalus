import type { ChipLista, SituacaoLista } from "../../domain/paciente/lista";
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
export const TEXTO_FILTRO_VAZIO = "Nenhum paciente com esse filtro.";
export const TEXTO_EXPORTAR_VAZIO = "Nenhum paciente para exportar";
export const TEXTO_IMPORTACAO =
  "A importação da planilha ainda não está definida: falta o formato do arquivo e o que fazer quando o CPF já existe na clínica. Nada foi importado.";
export const TEXTO_MENSAGEM_LOTE =
  "O envio de mensagem em lote depende do canal externo da clínica. Nenhuma mensagem foi enviada.";
export const TEXTO_AGENDAR_UM = "O agendamento é de um paciente por vez.";

export const ROTULO_CHIP: Record<ChipLista, string> = {
  todos: "Todos",
  em_tratamento: "Em tratamento",
  com_debito: "Com débito",
  retorno_pendente: "Retorno pendente",
  aniversariantes: "Aniversariantes",
};

export const ROTULO_SITUACAO: Record<SituacaoLista, string> = {
  em_tratamento: "Em tratamento",
  debito_em_aberto: "Débito em aberto",
  retorno_pendente: "Retorno pendente",
  alta: "Alta",
  inativo: "Inativo",
};

export function textoResumo(total: number): string {
  if (total === 1) return "1 paciente cadastrado";
  return `${new Intl.NumberFormat("pt-BR").format(total)} pacientes cadastrados`;
}

export function textoFaixa(pagina: number, porPagina: number, total: number): string {
  if (total === 0) return "Mostrando 0 de 0 pacientes";
  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);
  const n = new Intl.NumberFormat("pt-BR").format(total);
  return `Mostrando ${inicio}–${fim} de ${n} pacientes`;
}

export function textoSelecao(total: number): string {
  if (total === 1) return "1 paciente selecionado";
  return `${new Intl.NumberFormat("pt-BR").format(total)} pacientes selecionados`;
}

export function textoContagem(total: number): string {
  return new Intl.NumberFormat("pt-BR").format(total);
}

export function textoIdade(idade: number): string {
  return idade === 1 ? "1 ano" : `${idade} anos`;
}

// A mensagem vem da action. O detalhe (nome do paciente com o mesmo CPF, ou nome do salvo) segue depois.
export function textoAviso(mensagem: string, detalhe: string): string {
  return detalhe ? `${mensagem}: ${detalhe}` : mensagem;
}
