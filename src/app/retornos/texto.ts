export const TITULO = "Retornos";
export const SEM_SESSAO = "Nenhuma sessão aberta.";
export const VAZIO_RETORNOS = "Nenhum retorno pendente.";

export const TITULO_LISTA = "Retornos a reagendar";
export const NOTA_LISTA = "Cada item pede um agendamento novo para o paciente.";
export const ROTULO_REAGENDAR = "Agendar retorno";

export const TITULO_MARCAR = "Marcar retorno";
export const TEXTO_MARCAR = "O retorno se marca no agendamento concluído.";
export const ROTULO_IR_AGENDAMENTOS = "Ir para Agendamentos";

export const TITULO_PRAZO = "Prazo do aviso";
export const ROTULO_PRAZO = "Dias de antecedência";
export const ROTULO_SALVAR_PRAZO = "Salvar prazo";
export const PENDENTE_PRAZO = "Salvando…";

export const ROTULO_DATA_PREVISTA = "Data prevista";
export const ROTULO_MARCAR_RETORNO = "Marcar retorno";
export const PENDENTE_MARCAR = "Marcando…";

export function textoPrazo(dias: number): string {
  const unidade = dias === 1 ? "dia" : "dias";
  return `O aviso para reagendar aparece ${dias} ${unidade} antes da data prevista.`;
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})/;

// "2026-11-07" vira "07/11/2026". Texto fora do padrão passa como veio.
export function dataLegivel(iso: string): string {
  const achou = DATA_ISO.exec(iso);
  return achou ? `${achou[3]}/${achou[2]}/${achou[1]}` : iso;
}

export function textoPrevisto(dataPrevista: string): string {
  return `Retorno previsto para ${dataLegivel(dataPrevista)}`;
}

// Com id do paciente, o agendamento novo abre pré-preenchido; sem id, abre a tela sem query.
export function hrefReagendar(pacienteId?: string): string {
  return pacienteId ? `/agendamentos?paciente=${encodeURIComponent(pacienteId)}` : "/agendamentos";
}
