import type { AuthGateway } from "../../domain/auth/portas";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";
import { createClient } from "./server";

export function criarGateway(): AuthGateway {
  return {
    async autenticar(email, senha) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error || !data.user) return { ok: false };
      return { ok: true, userId: data.user.id };
    },

    async criarAcesso(entrada) {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.createUser({
        email: entrada.email,
        password: entrada.senha,
        email_confirm: true,
        app_metadata: {
          papel: entrada.papel,
          clinica_id: entrada.clinicaId,
        },
      });
      if (error || !data.user) {
        throw new ErroAplicacao("Não foi possível criar o acesso", error);
      }
      return { id: data.user.id };
    },

    async revogarAcesso(userId) {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new ErroAplicacao("Não foi possível revogar o acesso", error);
    },

    async enviarRecuperacao(email, redirectTo) {
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw new ErroAplicacao("Não foi possível enviar a recuperação", error);
    },

    async usuarioAtual() {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return data.user.id;
    },

    async definirSenha(senha) {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw new ErroAplicacao("Não foi possível definir a senha", error);
    },

    async encerrarSessao() {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw new ErroAplicacao("Não foi possível encerrar a sessão", error);
    },
  };
}
