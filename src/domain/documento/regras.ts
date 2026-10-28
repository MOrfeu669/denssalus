import type { DadosDocumento } from "./tipos";

const VARIAVEIS =
  "Paciente: {{paciente.nome}} (CPF {{paciente.cpf}}, nascimento {{paciente.dataNascimento}})\n" +
  "Dentista: {{dentista.nome}} (CRO {{dentista.cro}})\n" +
  "Data: {{data}}";

export const MODELOS_PADRAO: ReadonlyArray<{ nome: string; conteudo: string }> = [
  { nome: "Receituário", conteudo: `RECEITUÁRIO\n${VARIAVEIS}\nPrescrição:` },
  {
    nome: "Atestado",
    conteudo: `ATESTADO\nAtesto que {{paciente.nome}} esteve em atendimento odontológico.\n${VARIAVEIS}`,
  },
  {
    nome: "Termo de Consentimento",
    conteudo: `TERMO DE CONSENTIMENTO\n{{paciente.nome}} autoriza o tratamento proposto.\n${VARIAVEIS}`,
  },
];

export function preencher(template: string, dados: DadosDocumento): string {
  const valores: Record<string, string> = {
    "{{paciente.nome}}": dados.paciente.nome ?? "",
    "{{paciente.cpf}}": dados.paciente.cpf ?? "",
    "{{paciente.dataNascimento}}": dados.paciente.dataNascimento ?? "",
    "{{dentista.nome}}": dados.dentista.nome ?? "",
    "{{dentista.cro}}": dados.dentista.cro ?? "",
    "{{data}}": dados.data ?? "",
  };
  return template.replace(
    /\{\{(?:paciente\.nome|paciente\.cpf|paciente\.dataNascimento|dentista\.nome|dentista\.cro|data)\}\}/g,
    (chave) => valores[chave],
  );
}

export function assinaturaDe(usuarioId: string, instante: string, conteudo: string): string {
  return `${usuarioId}:${instante}:${conteudo}`;
}

const LINHAS_POR_PAGINA = 50;

function linhaPdf(linha: string): string {
  let saida = "";
  for (const caractere of linha) {
    const codigo = caractere.codePointAt(0) as number;
    if (codigo > 255) saida += "?";
    else if (codigo < 32) saida += " ";
    else if (caractere === "\\" || caractere === "(" || caractere === ")") saida += `\\${caractere}`;
    else saida += caractere;
  }
  return saida;
}

export function pdfDe(texto: string): Uint8Array {
  const linhas = texto.split(/\r\n|\r|\n/).map(linhaPdf);
  const paginas: string[][] = [];
  for (let i = 0; i < linhas.length; i += LINHAS_POR_PAGINA) {
    paginas.push(linhas.slice(i, i + LINHAS_POR_PAGINA));
  }
  if (paginas.length === 0) paginas.push([""]);

  // Objetos: 1 catálogo, 2 páginas, 3 fonte, depois (página, conteúdo) por página.
  const objetos: string[] = [];
  const filhos = paginas.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  objetos.push("<< /Type /Catalog /Pages 2 0 R >>");
  objetos.push(`<< /Type /Pages /Kids [${filhos}] /Count ${paginas.length} >>`);
  objetos.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  paginas.forEach((pagina, i) => {
    const corpo =
      "BT /F1 12 Tf 14 TL 50 800 Td\n" + pagina.map((l) => `(${l}) Tj T*`).join("\n") + "\nET";
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    objetos.push(`<< /Length ${corpo.length} >>\nstream\n${corpo}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const posicoes: number[] = [];
  objetos.forEach((objeto, i) => {
    posicoes.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const posicao of posicoes) pdf += `${String(posicao).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}
