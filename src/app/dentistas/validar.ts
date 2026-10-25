import type { Resultado } from "../../domain/auth/tipos";

export type EdicaoValida = {
  nome: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string[];
};

export type CadastroDentistaValido = EdicaoValida & {
  email: string;
  senha: string;
};

// Texto separado por vírgula: sem vazio e sem repetição (ignora caixa).
export function lerEspecialidades(texto: string): string[] {
  const vistas = new Set<string>();
  const lista: string[] = [];
  for (const parte of texto.split(",")) {
    const item = parte.trim();
    const chave = item.toLowerCase();
    if (!item || vistas.has(chave)) continue;
    vistas.add(chave);
    lista.push(item);
  }
  return lista;
}

export function validarEdicao(entrada: {
  nome: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string;
}): Resultado<EdicaoValida> {
  const nome = entrada.nome.trim();
  const cro = entrada.cro.trim();
  const telefone = entrada.telefone.trim();
  const cpf = entrada.cpf.trim();
  if (!nome) return { ok: false, mensagem: "Informe o nome" };
  if (!cro) return { ok: false, mensagem: "Informe o CRO" };
  if (!telefone) return { ok: false, mensagem: "Informe o telefone" };
  if (!cpf) return { ok: false, mensagem: "Informe o CPF" };
  return {
    ok: true,
    valor: { nome, cro, telefone, cpf, especialidades: lerEspecialidades(entrada.especialidades) },
  };
}

export function validarCadastroDentista(entrada: {
  nome: string;
  email: string;
  senha: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string;
}): Resultado<CadastroDentistaValido> {
  const email = entrada.email.trim().toLowerCase();
  if (!entrada.nome.trim()) return { ok: false, mensagem: "Informe o nome" };
  if (!email.includes("@")) return { ok: false, mensagem: "Informe um e-mail válido" };
  if (entrada.senha.length < 6) {
    return { ok: false, mensagem: "A senha precisa ter pelo menos 6 caracteres" };
  }
  const edicao = validarEdicao(entrada);
  if (!edicao.ok) return edicao;
  return { ok: true, valor: { ...edicao.valor, email, senha: entrada.senha } };
}
