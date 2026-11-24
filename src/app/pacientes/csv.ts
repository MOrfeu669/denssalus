import { ROTULO_SITUACAO } from "./texto";
import type { LinhaVisivel } from "./tipos-lista";

const COLUNAS = ["Paciente", "Contato", "CPF", "Telefone", "Última visita", "Próxima consulta", "Situação"];

function celula(valor: string): string {
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  if (/[";\n\r]/.test(seguro)) return `"${seguro.replaceAll('"', '""')}"`;
  return seguro;
}

export function textoCsv(linhas: LinhaVisivel[]): string {
  const corpo = linhas.map((linha) =>
    [
      linha.nome,
      linha.complemento,
      linha.cpf,
      linha.telefone,
      linha.ultimaVisita,
      linha.proximaConsulta ?? "Sem agendamento",
      ROTULO_SITUACAO[linha.situacao],
    ]
      .map(celula)
      .join(";"),
  );
  const linhasTexto = corpo.length === 0 ? "" : `${corpo.join("\n")}\n`;
  return `\uFEFF${COLUNAS.join(";")}\n${linhasTexto}`;
}
