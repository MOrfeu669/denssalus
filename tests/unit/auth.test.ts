import { beforeEach, describe, expect, it } from "vitest";
import {
  autorizarAcao,
  autorizarLeituraDaClinica,
  cadastrarUsuario,
  definirNovaSenha,
  login,
  removerUsuario,
  solicitarRecuperacao,
} from "../../src/domain/auth/casos";
import type { Dependencias } from "../../src/domain/auth/portas";
import {
  MENSAGEM_CREDENCIAIS,
  MENSAGEM_PAPEL,
  type Papel,
  type Sessao,
  type Usuario,
} from "../../src/domain/auth/tipos";

const CLINICA_A = "clinica-001";
const CLINICA_B = "clinica-002";

class Memoria {
  usuarios = new Map<string, Usuario>();
  senhas = new Map<string, string>();
  sessaoId: string | null = null;
  recuperacoes: { email: string; redirectTo: string }[] = [];
  revogados: string[] = [];
  prontuarios = [{ id: "prontuario-ana", clinicaId: CLINICA_A }];

  auth = {
    autenticar: async (email: string, senha: string) => {
      const usuario = [...this.usuarios.values()].find((item) => item.email === email);
      if (!usuario || this.senhas.get(usuario.id) !== senha) return { ok: false as const };
      this.sessaoId = usuario.id;
      return { ok: true as const, userId: usuario.id };
    },
    criarAcesso: async (entrada: { email: string; senha: string }) => {
      const id = `user-${this.usuarios.size + 1}`;
      this.senhas.set(id, entrada.senha);
      return { id };
    },
    revogarAcesso: async (userId: string) => {
      this.revogados.push(userId);
      this.senhas.delete(userId);
      if (this.sessaoId === userId) this.sessaoId = null;
    },
    enviarRecuperacao: async (email: string, redirectTo: string) => {
      this.recuperacoes.push({ email, redirectTo });
    },
    usuarioAtual: async () => this.sessaoId,
    definirSenha: async (senha: string) => {
      if (!this.sessaoId) throw new Error("sem sessão");
      this.senhas.set(this.sessaoId, senha);
    },
    encerrarSessao: async () => {
      this.sessaoId = null;
    },
  };

  repositorio = {
    buscarPorId: async (id: string) => this.usuarios.get(id) ?? null,
    buscarPorEmail: async (email: string) =>
      [...this.usuarios.values()].find((item) => item.email === email) ?? null,
    salvar: async (usuario: Usuario) => {
      this.usuarios.set(usuario.id, usuario);
    },
    listarDaClinica: async (clinicaId: string) =>
      [...this.usuarios.values()].filter((item) => item.clinicaId === clinicaId),
  };

  deps(): Dependencias {
    return { auth: this.auth, usuarios: this.repositorio };
  }
}

function usuario(parcial: Partial<Usuario> & Pick<Usuario, "id" | "papel">): Usuario {
  return {
    nome: parcial.nome ?? "Ana",
    email: parcial.email ?? "dra.ana@clinica.com",
    clinicaId: parcial.clinicaId ?? CLINICA_A,
    ativo: parcial.ativo ?? true,
    id: parcial.id,
    papel: parcial.papel,
  };
}

function sessao(papel: Papel, clinicaId = CLINICA_A): Sessao {
  return { usuario: usuario({ id: `ator-${papel}`, papel, clinicaId, email: `${papel}@clinica.com` }) };
}

describe("autenticação e papéis", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.usuarios.set(
      "ana",
      usuario({ id: "ana", papel: "dentista", email: "dra.ana@clinica.com", nome: "Ana" }),
    );
    memoria.senhas.set("ana", "senha-valida");
  });

  it("dado um dentista cadastrado, quando entra com a senha válida, então a sessão traz o papel e a clínica", async () => {
    const resultado = await login(memoria.deps(), "dra.ana@clinica.com", "senha-valida");

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.usuario.papel).toBe("dentista");
    expect(resultado.valor.usuario.clinicaId).toBe(CLINICA_A);
  });

  it("dado um dentista cadastrado, quando a senha está incorreta, então a sessão não abre", async () => {
    const resultado = await login(memoria.deps(), "dra.ana@clinica.com", "errada");

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CREDENCIAIS });
    expect(memoria.sessaoId).toBeNull();
  });

  it("dado um admin autenticado, quando cadastra uma recepcionista, então ela entra na clínica dele", async () => {
    const admin = sessao("admin");
    memoria.usuarios.set(admin.usuario.id, admin.usuario);

    const criado = await cadastrarUsuario(memoria.deps(), admin, {
      nome: "Lia",
      email: "lia@clinica.com",
      senha: "senha-lia",
      papel: "recepcionista",
    });

    expect(criado.ok).toBe(true);
    if (!criado.ok) return;
    expect(criado.valor.papel).toBe("recepcionista");
    expect(criado.valor.clinicaId).toBe(CLINICA_A);

    const entrada = await login(memoria.deps(), "lia@clinica.com", "senha-lia");
    expect(entrada.ok).toBe(true);
  });

  it("dado uma recepcionista, quando tenta a ação odontograma:preencher, então o papel bloqueia", () => {
    const resultado = autorizarAcao(sessao("recepcionista"), "odontograma:preencher");

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });

  it("dado um admin, quando executa a ação odontograma:preencher, então a hierarquia permite", () => {
    const resultado = autorizarAcao(sessao("admin"), "odontograma:preencher");

    expect(resultado.ok).toBe(true);
  });

  it("dado um dentista da clínica A, quando lê dado da clínica B, então o acesso é bloqueado", () => {
    const resultado = autorizarLeituraDaClinica(sessao("dentista", CLINICA_A), CLINICA_B);

    expect(resultado.ok).toBe(false);
  });

  it("dado um usuário que esqueceu a senha, quando pede recuperação e define outra, então entra com a nova senha", async () => {
    memoria.sessaoId = "ana";
    const pedido = await solicitarRecuperacao(
      memoria.deps(),
      "dra.ana@clinica.com",
      "http://localhost:3000/auth/callback?next=/recuperar/nova-senha",
    );
    expect(pedido.ok).toBe(true);
    expect(memoria.recuperacoes).toEqual([
      {
        email: "dra.ana@clinica.com",
        redirectTo: "http://localhost:3000/auth/callback?next=/recuperar/nova-senha",
      },
    ]);

    const nova = await definirNovaSenha(memoria.deps(), "senha-nova");
    expect(nova.ok).toBe(true);
    memoria.sessaoId = null;

    const entrada = await login(memoria.deps(), "dra.ana@clinica.com", "senha-nova");
    expect(entrada.ok).toBe(true);
  });

  it("dado um dentista com prontuário na clínica, quando o admin remove o acesso, então só o vínculo muda", async () => {
    const admin = sessao("admin");
    memoria.usuarios.set(admin.usuario.id, admin.usuario);
    const antes = memoria.prontuarios.map((item) => ({ ...item }));

    const resultado = await removerUsuario(memoria.deps(), admin, "ana");

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.ativo).toBe(false);
    expect(memoria.usuarios.get("ana")?.ativo).toBe(false);
    expect(memoria.revogados).toEqual(["ana"]);
    expect(memoria.prontuarios).toEqual(antes);

    const entrada = await login(memoria.deps(), "dra.ana@clinica.com", "senha-valida");
    expect(entrada).toEqual({ ok: false, mensagem: MENSAGEM_CREDENCIAIS });
  });
});
