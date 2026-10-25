import { beforeEach, describe, expect, it } from "vitest";
import type { NovoAcesso } from "../../src/domain/auth/portas";
import { MENSAGEM_PAPEL, type Papel, type Sessao, type Usuario } from "../../src/domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA, type Clinica } from "../../src/domain/clinica/tipos";
import {
  cadastrarDentista,
  editarDentista,
  listarDentistas,
  removerDentista,
} from "../../src/domain/dentista/casos";
import type { Dependencias } from "../../src/domain/dentista/portas";
import { bloqueiaDentistaInativo, listarDisponiveis } from "../../src/domain/dentista/regras";
import {
  MENSAGEM_DENTISTA_NAO_ENCONTRADO,
  MENSAGEM_EMAIL_JA_CADASTRADO,
  type AgendamentoDoDentista,
  type Dentista,
} from "../../src/domain/dentista/tipos";

const AGORA = new Date("2026-10-25T12:00:00");
const CLINICA_ID = "clinica-001";

type Registro = AgendamentoDoDentista & { status: string };

class Memoria {
  clinicas = new Map<string, Clinica>();
  dentistas = new Map<string, Dentista>();
  usuarios = new Map<string, Usuario>();
  agendamentos = new Map<string, Registro>();
  acessos = new Map<string, NovoAcesso>();
  revogados: string[] = [];
  falhaAoSalvarDentista = false;
  chamadasSalvarAlertas = 0;
  proximoId = 0;

  deps(): Dependencias {
    return {
      dentistas: {
        listar: async (clinicaId) =>
          [...this.dentistas.values()].filter((item) => item.clinicaId === clinicaId),
        buscarPorId: async (id) => this.dentistas.get(id) ?? null,
        salvar: async (dentista) => {
          if (this.falhaAoSalvarDentista) throw new Error("falha ao gravar");
          this.dentistas.set(dentista.id, dentista);
        },
      },
      agenda: {
        listarAgendadosFuturos: async (clinicaId, agora) =>
          [...this.agendamentos.values()]
            .filter(
              (item) =>
                item.clinicaId === clinicaId &&
                item.status === "agendado" &&
                new Date(item.inicio) > agora,
            )
            .map(({ status: _status, ...item }) => item),
        salvarAlertas: async (itens) => {
          this.chamadasSalvarAlertas += 1;
          for (const item of itens) {
            const atual = this.agendamentos.get(item.id);
            if (atual) this.agendamentos.set(item.id, { ...atual, ...item });
          }
        },
      },
      auth: {
        autenticar: async () => ({ ok: false }),
        criarAcesso: async (entrada) => {
          const id = `auth-${++this.proximoId}`;
          this.acessos.set(id, entrada);
          return { id };
        },
        revogarAcesso: async (userId) => {
          this.revogados.push(userId);
        },
        enviarRecuperacao: async () => {},
        usuarioAtual: async () => null,
        definirSenha: async () => {},
        encerrarSessao: async () => {},
      },
      usuarios: {
        buscarPorId: async (id) => this.usuarios.get(id) ?? null,
        buscarPorEmail: async (email) =>
          [...this.usuarios.values()].find((item) => item.email === email) ?? null,
        salvar: async (usuario) => {
          this.usuarios.set(usuario.id, usuario);
        },
        apagar: async (id) => {
          this.usuarios.delete(id);
        },
        listarDaClinica: async (clinicaId) =>
          [...this.usuarios.values()].filter((item) => item.clinicaId === clinicaId),
      },
      clinicas: {
        buscarPorAdmin: async (adminId) =>
          [...this.clinicas.values()].find((item) => item.adminId === adminId) ?? null,
      },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semearDentista(parcial: Partial<Dentista> & Pick<Dentista, "id">): Dentista {
    const dentista: Dentista = {
      usuarioId: `usuario-${parcial.id}`,
      clinicaId: CLINICA_ID,
      nome: "Dra. Marina Souza",
      cro: "CRO-SP 12345",
      telefone: "11 99999-0000",
      cpf: "123.456.789-09",
      especialidades: [],
      ativo: true,
      ...parcial,
    };
    this.dentistas.set(dentista.id, dentista);
    this.usuarios.set(dentista.usuarioId, {
      id: dentista.usuarioId,
      nome: dentista.nome,
      email: `${dentista.id}@clinica.com`,
      papel: "dentista",
      clinicaId: dentista.clinicaId,
      ativo: dentista.ativo,
    });
    return dentista;
  }

  agendar(parcial: Partial<Registro> & Pick<Registro, "id" | "dentistaId" | "inicio">): void {
    this.agendamentos.set(parcial.id, {
      clinicaId: CLINICA_ID,
      alertaDentista: false,
      status: "agendado",
      ...parcial,
    });
  }
}

function sessao(papel: Papel): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId: CLINICA_ID,
      ativo: true,
    },
  };
}

const ENTRADA = {
  nome: "Dra. Marina Souza",
  email: "Marina@Clinica.com ",
  senha: "segredo1",
  cro: "CRO-SP 12345",
  telefone: "11 99999-0000",
  cpf: "123.456.789-09",
  especialidades: [] as string[],
};

describe("cadastro de dentistas", () => {
  let memoria: Memoria;
  const admin = sessao("admin");

  beforeEach(() => {
    memoria = new Memoria();
    memoria.usuarios.set(admin.usuario.id, admin.usuario);
    memoria.clinicas.set(CLINICA_ID, {
      id: CLINICA_ID,
      nome: "Clínica OdontoSmile",
      adminId: admin.usuario.id,
      diasAtendimento: ["segunda"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    });
  });

  it("dado um admin, quando cadastra com nome, CRO, telefone e CPF, então cria o dentista na clínica e um usuário dentista com o e-mail informado", async () => {
    const resultado = await cadastrarDentista(memoria.deps(), admin, ENTRADA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(memoria.dentistas.get(resultado.valor.id)).toMatchObject({
      clinicaId: CLINICA_ID,
      nome: "Dra. Marina Souza",
      cro: "CRO-SP 12345",
      telefone: "11 99999-0000",
      cpf: "123.456.789-09",
      ativo: true,
    });
    const usuario = memoria.usuarios.get(resultado.valor.usuarioId);
    expect(usuario).toMatchObject({
      papel: "dentista",
      email: "marina@clinica.com",
      clinicaId: CLINICA_ID,
      ativo: true,
    });
    expect(memoria.acessos.get(resultado.valor.usuarioId)).toMatchObject({
      email: "marina@clinica.com",
      papel: "dentista",
      clinicaId: CLINICA_ID,
    });
  });

  it("dado 15 dentistas cadastrados, quando o admin cadastra o 16º, então é aceito sem teto de quantidade", async () => {
    for (let numero = 1; numero <= 15; numero += 1) memoria.semearDentista({ id: `d${numero}` });

    const resultado = await cadastrarDentista(memoria.deps(), admin, ENTRADA);

    expect(resultado.ok).toBe(true);
    expect(memoria.dentistas.size).toBe(16);
  });

  it("dado um e-mail já cadastrado, quando o admin cadastra, então recebe a mensagem e nada é criado", async () => {
    memoria.semearDentista({ id: "d1" });

    const resultado = await cadastrarDentista(memoria.deps(), admin, {
      ...ENTRADA,
      email: "d1@clinica.com",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_EMAIL_JA_CADASTRADO });
    expect(memoria.acessos.size).toBe(0);
    expect(memoria.dentistas.size).toBe(1);
  });

  it("dado um admin sem clínica, quando cadastra, então recebe Clínica não encontrada", async () => {
    memoria.clinicas.clear();

    const resultado = await cadastrarDentista(memoria.deps(), admin, ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA });
    expect(memoria.acessos.size).toBe(0);
  });

  it("dado uma falha ao gravar o dentista, quando cadastra, então revoga o acesso e apaga o usuário", async () => {
    memoria.falhaAoSalvarDentista = true;

    await expect(cadastrarDentista(memoria.deps(), admin, ENTRADA)).rejects.toThrow("falha ao gravar");

    expect(memoria.revogados).toEqual(["auth-1"]);
    expect(memoria.usuarios.has("auth-1")).toBe(false);
  });

  it("dado um dentista cadastrado, quando o admin edita o telefone, então grava o novo valor e não chama salvarAlertas", async () => {
    memoria.semearDentista({ id: "d1" });
    memoria.agendar({ id: "a1", dentistaId: "d1", inicio: "2026-10-26T10:00:00" });

    const resultado = await editarDentista(memoria.deps(), admin, "d1", {
      nome: "Dra. Marina Souza",
      cro: "CRO-SP 12345",
      telefone: "11 98888-1111",
      cpf: "123.456.789-09",
      especialidades: [],
    });

    expect(resultado.ok && resultado.valor.telefone).toBe("11 98888-1111");
    expect(memoria.dentistas.get("d1")?.telefone).toBe("11 98888-1111");
    expect(memoria.chamadasSalvarAlertas).toBe(0);
    expect(memoria.agendamentos.get("a1")?.alertaDentista).toBe(false);
  });

  it("dado um dentista, quando o admin muda o nome, então usuarios.nome acompanha e e-mail e papel não mudam", async () => {
    memoria.semearDentista({ id: "d1", usuarioId: "u1" });

    await editarDentista(memoria.deps(), admin, "d1", {
      nome: "Dra. Marina Lima",
      cro: "CRO-SP 12345",
      telefone: "11 99999-0000",
      cpf: "123.456.789-09",
      especialidades: [],
    });

    expect(memoria.usuarios.get("u1")).toMatchObject({
      nome: "Dra. Marina Lima",
      email: "d1@clinica.com",
      papel: "dentista",
    });
  });

  it("dado um dentista de outra clínica, quando o admin tenta editar ou remover, então não é encontrado", async () => {
    memoria.semearDentista({ id: "alheio", clinicaId: "outra-clinica" });
    const deps = memoria.deps();

    const edicao = await editarDentista(deps, admin, "alheio", {
      nome: "X",
      cro: "1",
      telefone: "1",
      cpf: "1",
      especialidades: [],
    });
    const remocao = await removerDentista(deps, admin, "alheio", AGORA);

    expect(edicao).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO });
    expect(remocao).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO });
    expect(memoria.dentistas.get("alheio")?.ativo).toBe(true);
  });

  it("dado a especialidade Endodontia, quando o admin cadastra, então fica no registro, o dentista segue disponível e o objeto não tem campo de procedimento", async () => {
    const resultado = await cadastrarDentista(memoria.deps(), admin, {
      ...ENTRADA,
      especialidades: ["Endodontia"],
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(memoria.dentistas.get(resultado.valor.id)?.especialidades).toEqual(["Endodontia"]);
    const lista = await listarDentistas(memoria.deps(), admin);
    expect(lista.ok && listarDisponiveis(lista.valor).map((item) => item.id)).toEqual([
      resultado.valor.id,
    ]);
    expect(Object.keys(resultado.valor).sort()).toEqual([
      "ativo",
      "clinicaId",
      "cpf",
      "cro",
      "especialidades",
      "id",
      "nome",
      "telefone",
      "usuarioId",
    ]);
    expect(Object.keys(resultado.valor).some((chave) => /procedimento/i.test(chave))).toBe(false);
  });

  it("dado um dentista com agendamentos futuros, quando o admin o remove, então só os agendados dele ganham alertaDentista, o status não muda, ativo fica falso e bloqueiaDentistaInativo recusa", async () => {
    memoria.semearDentista({ id: "d1", usuarioId: "u1" });
    memoria.semearDentista({ id: "d2" });
    memoria.agendar({ id: "a1", dentistaId: "d1", inicio: "2026-10-26T10:00:00" });
    memoria.agendar({ id: "a2", dentistaId: "d2", inicio: "2026-10-26T10:00:00" });
    memoria.agendar({ id: "a3", dentistaId: "d1", inicio: "2026-10-20T10:00:00" });
    memoria.agendar({ id: "a4", dentistaId: "d1", inicio: "2026-10-27T10:00:00", status: "cancelado" });

    const resultado = await removerDentista(memoria.deps(), admin, "d1", AGORA);

    expect(resultado.ok && resultado.valor.ativo).toBe(false);
    expect(memoria.dentistas.get("d1")?.ativo).toBe(false);
    expect(memoria.usuarios.get("u1")?.ativo).toBe(false);
    expect(memoria.revogados).toEqual(["u1"]);
    expect(memoria.agendamentos.get("a1")).toMatchObject({ alertaDentista: true, status: "agendado" });
    expect(memoria.agendamentos.get("a2")?.alertaDentista).toBe(false);
    expect(memoria.agendamentos.get("a3")?.alertaDentista).toBe(false);
    expect(memoria.agendamentos.get("a4")?.alertaDentista).toBe(false);
    if (!resultado.ok) return;
    expect(bloqueiaDentistaInativo(resultado.valor)).toBe(true);
    expect(bloqueiaDentistaInativo(memoria.dentistas.get("d2")!)).toBe(false);
  });

  it("dado um dentista removido, quando lista, então aparece com ativo falso mas fica fora de listarDisponiveis", async () => {
    memoria.semearDentista({ id: "d1" });
    memoria.semearDentista({ id: "d2" });
    await removerDentista(memoria.deps(), admin, "d1", AGORA);

    const lista = await listarDentistas(memoria.deps(), admin);

    expect(lista.ok && lista.valor.map((item) => [item.id, item.ativo])).toEqual([
      ["d1", false],
      ["d2", true],
    ]);
    expect(lista.ok && listarDisponiveis(lista.valor).map((item) => item.id)).toEqual(["d2"]);
  });

  it("dado um dentista de outra clínica, quando o admin lista, então ele não aparece", async () => {
    memoria.semearDentista({ id: "d1" });
    memoria.semearDentista({ id: "alheio", clinicaId: "outra-clinica" });

    const lista = await listarDentistas(memoria.deps(), admin);

    expect(lista.ok && lista.valor.map((item) => item.id)).toEqual(["d1"]);
  });

  it.each(["dentista", "recepcionista"] as const)(
    "dado um %s, quando tenta cadastrar, editar, remover ou listar dentistas, então recebe a mensagem de papel",
    async (papel) => {
      memoria.semearDentista({ id: "d1" });
      const ator = sessao(papel);
      const deps = memoria.deps();

      const resultados = [
        await cadastrarDentista(deps, ator, ENTRADA),
        await editarDentista(deps, ator, "d1", {
          nome: "X",
          cro: "1",
          telefone: "1",
          cpf: "1",
          especialidades: [],
        }),
        await removerDentista(deps, ator, "d1", AGORA),
        await listarDentistas(deps, ator),
      ];

      for (const resultado of resultados) {
        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      }
      expect(memoria.dentistas.size).toBe(1);
      expect(memoria.dentistas.get("d1")?.ativo).toBe(true);
      expect(memoria.acessos.size).toBe(0);
    },
  );

  it.todo("Feature 006: a tela de agendamento oferece só os dentistas ativos da clínica para escolha");
  it.todo("Feature 007: agendamento com alertaDentista aparece destacado na agenda (cor diferente ou sinal '!')");
});
