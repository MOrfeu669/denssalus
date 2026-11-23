import { PAPEIS, type Papel, type Usuario } from "../../domain/auth/tipos";

export const PAPEIS_FILTRO = PAPEIS;

export function filtrarUsuarios(
  usuarios: readonly Usuario[],
  busca: string,
  papeisAtivos: readonly Papel[],
): Usuario[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const papeis = new Set(papeisAtivos.length > 0 ? papeisAtivos : PAPEIS);

  return usuarios.filter((usuario) => {
    if (!papeis.has(usuario.papel)) return false;
    if (!termo) return true;
    return (
      usuario.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
      usuario.email.toLocaleLowerCase("pt-BR").includes(termo)
    );
  });
}
