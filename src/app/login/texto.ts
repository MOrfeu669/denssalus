import type { Papel } from "../../domain/auth/tipos";

const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Admin",
  dentista: "Dentista",
  recepcionista: "Recepcionista",
};

export const DETALHE_CREDENCIAIS =
  "E-mail ou senha incorretos. Confira os dados e tente novamente.";

export function detalheSessaoAberta(nome: string, papel: Papel): string {
  return `Você entrou como ${nome} (${ROTULO_PAPEL[papel]}). Continue para o Início.`;
}
