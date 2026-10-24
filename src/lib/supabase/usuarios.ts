import type { Usuarios } from "../../domain/auth/portas";
import type { Papel, Usuario } from "../../domain/auth/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Linha = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  clinica_id: string;
  ativo: boolean;
};

function paraUsuario(linha: Linha): Usuario {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    papel: linha.papel,
    clinicaId: linha.clinica_id,
    ativo: linha.ativo,
  };
}

function paraLinha(usuario: Usuario): Linha {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    clinica_id: usuario.clinicaId,
    ativo: usuario.ativo,
  };
}

export function criarUsuarios(): Usuarios {
  const admin = createAdminClient();

  return {
    async buscarPorId(id) {
      const { data, error } = await admin.from("usuarios").select("*").eq("id", id).maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o usuário", error);
      return data ? paraUsuario(data as Linha) : null;
    },

    async buscarPorEmail(email) {
      const { data, error } = await admin
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o usuário", error);
      return data ? paraUsuario(data as Linha) : null;
    },

    async salvar(usuario) {
      const { error } = await admin.from("usuarios").upsert(paraLinha(usuario));
      if (error) throw new ErroAplicacao("Não foi possível salvar o usuário", error);
    },

    async listarDaClinica(clinicaId) {
      const { data, error } = await admin
        .from("usuarios")
        .select("*")
        .eq("clinica_id", clinicaId)
        .order("nome");
      if (error) throw new ErroAplicacao("Não foi possível listar os usuários", error);
      return (data as Linha[]).map(paraUsuario);
    },
  };
}
