import type { Resultado } from "../../domain/auth/tipos";
import type { Dia } from "../../domain/clinica/tipos";

export const DIAS: { valor: Dia; rotulo: string }[] = [
  { valor: "segunda", rotulo: "Segunda" },
  { valor: "terca", rotulo: "Terça" },
  { valor: "quarta", rotulo: "Quarta" },
  { valor: "quinta", rotulo: "Quinta" },
  { valor: "sexta", rotulo: "Sexta" },
  { valor: "sabado", rotulo: "Sábado" },
  { valor: "domingo", rotulo: "Domingo" },
];

export type FuncionamentoValido = {
  diasAtendimento: Dia[];
  horarioAbertura: string;
  horarioFechamento: string;
};

export type CriacaoValida = FuncionamentoValido & {
  nome: string;
  cadeiras: number;
};

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validarFuncionamento(entrada: {
  dias: string[];
  abertura: string;
  fechamento: string;
}): Resultado<FuncionamentoValido> {
  // Ordem canônica da semana, sem repetição, só valores conhecidos.
  const diasAtendimento = DIAS.map((dia) => dia.valor).filter((valor) =>
    entrada.dias.includes(valor),
  );
  if (diasAtendimento.length === 0) return { ok: false, mensagem: "Informe ao menos um dia" };

  const horarioAbertura = entrada.abertura.trim();
  const horarioFechamento = entrada.fechamento.trim();
  if (!HORARIO.test(horarioAbertura) || !HORARIO.test(horarioFechamento)) {
    return { ok: false, mensagem: "Informe um horário válido" };
  }
  if (horarioAbertura >= horarioFechamento) {
    return { ok: false, mensagem: "A abertura precisa ser antes do fechamento" };
  }
  return { ok: true, valor: { diasAtendimento, horarioAbertura, horarioFechamento } };
}

export function validarCriacao(entrada: {
  nome: string;
  dias: string[];
  abertura: string;
  fechamento: string;
  cadeiras: string;
}): Resultado<CriacaoValida> {
  const nome = entrada.nome.trim();
  if (!nome) return { ok: false, mensagem: "Informe o nome" };

  const funcionamento = validarFuncionamento(entrada);
  if (!funcionamento.ok) return funcionamento;

  const texto = entrada.cadeiras.trim();
  const cadeiras = /^\d+$/.test(texto) ? Number(texto) : 0;
  if (!Number.isSafeInteger(cadeiras) || cadeiras < 1) {
    return { ok: false, mensagem: "Informe ao menos uma cadeira" };
  }
  return { ok: true, valor: { nome, cadeiras, ...funcionamento.valor } };
}
