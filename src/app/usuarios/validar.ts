import { MENSAGEM_PAPEL, type Resultado } from "../../domain/auth/tipos";

export type CadastroValido = {
  nome: string;
  email: string;
  senha: string;
  papel: "dentista" | "recepcionista";
};

export function validarCadastro(entrada: {
  nome: string;
  email: string;
  senha: string;
  papel: string;
}): Resultado<CadastroValido> {
  const nome = entrada.nome.trim();
  const email = entrada.email.trim().toLowerCase();
  if (!nome) return { ok: false, mensagem: "Informe o nome" };
  if (!email.includes("@")) return { ok: false, mensagem: "Informe um e-mail válido" };
  if (entrada.senha.length < 6) {
    return { ok: false, mensagem: "A senha precisa ter pelo menos 6 caracteres" };
  }
  if (entrada.papel !== "dentista" && entrada.papel !== "recepcionista") {
    return { ok: false, mensagem: MENSAGEM_PAPEL };
  }
  return { ok: true, valor: { nome, email, senha: entrada.senha, papel: entrada.papel } };
}
