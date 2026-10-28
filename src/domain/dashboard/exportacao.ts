import { pdfDe } from "../documento/regras";
import type { ArquivoDashboard, CampoDashboard, VisaoDashboard } from "./tipos";

type Linha = { rotulo: string; valor?: number; unidade?: "moeda" | "percentual" };

export function textoEstoque(nome: string, quantidade: number): string {
  return `${nome} — ${quantidade} unidades restantes`;
}

function linhasVisiveis({ resumo, ocultos }: VisaoDashboard): Linha[] {
  const visivel = (campo: CampoDashboard) => !ocultos.includes(campo);
  const linhas: Linha[] = [{ rotulo: `Período: ${resumo.periodo.inicio} a ${resumo.periodo.fim}` }];
  if (visivel("faturamento")) {
    linhas.push({ rotulo: "Total faturado", valor: resumo.faturado, unidade: "moeda" });
  }
  if (visivel("detalhe")) {
    linhas.push({ rotulo: "Por dentista" });
    for (const d of resumo.porDentista) {
      linhas.push({ rotulo: `Dentista ${d.dentistaId}`, valor: d.valor, unidade: "moeda" });
    }
    linhas.push({ rotulo: "Por procedimento" });
    for (const p of resumo.porProcedimento) {
      linhas.push({ rotulo: `Procedimento ${p.procedimentoId}`, valor: p.valor, unidade: "moeda" });
    }
  }
  if (visivel("recebido")) {
    linhas.push({ rotulo: "Total recebido", valor: resumo.recebido, unidade: "moeda" });
  }
  if (visivel("despesa")) {
    linhas.push({ rotulo: "Despesa de prótese", valor: resumo.despesaProtese, unidade: "moeda" });
  }
  if (visivel("ocupacao")) {
    linhas.push({ rotulo: "Ocupação da agenda", valor: resumo.ocupacao, unidade: "percentual" });
  }
  if (visivel("estoque")) {
    linhas.push({ rotulo: "Estoque abaixo do mínimo" });
    for (const m of resumo.estoque) linhas.push({ rotulo: textoEstoque(m.nome, m.quantidade) });
  }
  return linhas;
}

function textoDaLinha(linha: Linha): string {
  if (linha.valor === undefined) return linha.rotulo;
  if (linha.unidade === "moeda") return `${linha.rotulo}: R$ ${linha.valor.toFixed(2)}`;
  if (linha.unidade === "percentual") return `${linha.rotulo}: ${linha.valor.toFixed(1)}%`;
  return `${linha.rotulo}: ${linha.valor}`;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function celula(tipo: "String" | "Number", conteudo: string): string {
  return `<Cell><Data ss:Type="${tipo}">${escapar(conteudo)}</Data></Cell>`;
}

function planilhaDe(linhas: Linha[]): string {
  const rows = linhas.map((l) => {
    const rotulo = celula("String", l.rotulo);
    const valor = l.valor === undefined ? "" : celula("Number", String(l.valor));
    return `<Row>${rotulo}${valor}</Row>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    `<Worksheet ss:Name="Dashboard"><Table>${rows.join("")}</Table></Worksheet></Workbook>`
  );
}

export function gerarArquivo(visao: VisaoDashboard, formato: "pdf" | "excel"): ArquivoDashboard {
  const linhas = linhasVisiveis(visao);
  if (formato === "pdf") {
    const bytes = pdfDe(linhas.map(textoDaLinha).join("\n"));
    return { nome: "dashboard.pdf", bytes, mediaType: "application/pdf" };
  }
  const bytes = new TextEncoder().encode(planilhaDe(linhas));
  return { nome: "dashboard.xls", bytes, mediaType: "application/vnd.ms-excel" };
}
