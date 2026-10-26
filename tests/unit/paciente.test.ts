import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA, type Clinica } from "../../src/domain/clinica/tipos";
import { cadastrarPaciente, editarPaciente, listarPacientes } from "../../src/domain/paciente/casos";
import type { Dependencias } from "../../src/domain/paciente/portas";
import { idadeEm, menorDeIdade, normalizarCanais } from "../../src/domain/paciente/regras";
import {
  MENSAGEM_CANAL_PREFERIDO,
  MENSAGEM_CPF_JA_CADASTRADO,
  MENSAGEM_NASCIMENTO_INVALIDO,
  MENSAGEM_NOME_OBRIGATORIO,
  MENSAGEM_PACIENTE_NAO_ENCONTRADO,
  MENSAGEM_RESPONSAVEL_CPF,
  MENSAGEM_RESPONSAVEL_NOME,
  MENSAGEM_SEM_CANAL,
  MENSAGEM_SEXO_INVALIDO,
  type EntradaPaciente,
  type Paciente,
} from "../../src/domain/paciente/tipos";

const HOJE = new Date("2026-10-25T12:00:00");
const CLINICA_ID = "clinica-001";

class Memoria {
  clinicas = new Map<string, Clinica>();
  pacientes = new Map<string, Paciente>();
  chamadasDeAgenda = 0;
  proximoId = 0;

  deps(): Dependencias {
    return {
      pacientes: {
        listar: async (clinicaId) =>
          [...this.pacientes.values()].filter((item) => item.clinicaId === clinicaId),
        buscarPorId: async (id) => this.pacientes.get(id) ?? null,
        buscarPorCpf: async (clinicaId, cpf) =>
          [...this.pacientes.values()].find(
            (item) => item.clinicaId === clinicaId && item.cpf === cpf,
          ) ?? null,
        salvar: async (paciente) => {
          this.pacientes.set(paciente.id, paciente);
        },
      },
      clinicas: { buscarPorId: async (id) => this.clinicas.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semear(parcial: Partial<Paciente> & Pick<Paciente, "id">): Paciente {
    const paciente: Paciente = {
      clinicaId: CLINICA_ID,
      nome: "João Pereira",
      canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
      cpf: null,
      endereco: null,
      dataNascimento: null,
      sexo: null,
      responsavel: null,
      ...parcial,
    };
    this.pacientes.set(paciente.id, paciente);
    return paciente;
  }
}

function sessao(papel: Papel, ativo = true): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId: CLINICA_ID,
      ativo,
    },
  };
}

const ENTRADA: EntradaPaciente = {
  nome: " Maria Oliveira ",
  canais: [
    { canal: "whatsapp", contato: "11 99999-1111", preferido: true },
    { canal: "email", contato: "maria@exemplo.com", preferido: false },
  ],
  cpf: " 123.456.789-09 ",
  endereco: "Rua das Flores, 100",
  dataNascimento: "1990-05-10",
  sexo: "feminino",
};

describe("cadastro de pacientes", () => {
  let memoria: Memoria;
  const recepcionista = sessao("recepcionista");

  beforeEach(() => {
    memoria = new Memoria();
    memoria.clinicas.set(CLINICA_ID, {
      id: CLINICA_ID,
      nome: "Clínica OdontoSmile",
      adminId: "ator-admin",
      diasAtendimento: ["segunda"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    });
  });

  it("dado um recepcionista, quando cadastra nome, WhatsApp preferido, e-mail, CPF, endereço, aniversário e sexo, então o paciente fica vinculado à clínica da sessão", async () => {
    const resultado = await cadastrarPaciente(memoria.deps(), recepcionista, ENTRADA, HOJE);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(memoria.pacientes.get(resultado.valor.id)).toEqual({
      id: resultado.valor.id,
      clinicaId: CLINICA_ID,
      nome: "Maria Oliveira",
      canais: [
        { canal: "whatsapp", contato: "11 99999-1111", preferido: true },
        { canal: "email", contato: "maria@exemplo.com", preferido: false },
      ],
      cpf: "123.456.789-09",
      endereco: "Rua das Flores, 100",
      dataNascimento: "1990-05-10",
      sexo: "feminino",
      responsavel: null,
    });
  });

  it("dado só nome e um canal, quando cadastra, então campos opcionais vazios viram null e o canal único fica preferido", async () => {
    const resultado = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      {
        nome: "Ana Lima",
        canais: [{ canal: "sms", contato: "11 97777-2222", preferido: false }],
        cpf: "  ",
        endereco: "",
        dataNascimento: "",
        sexo: "",
      },
      HOJE,
    );

    expect(resultado.ok && resultado.valor).toMatchObject({
      canais: [{ canal: "sms", contato: "11 97777-2222", preferido: true }],
      cpf: null,
      endereco: null,
      dataNascimento: null,
      sexo: null,
      responsavel: null,
    });
  });

  it("dado um cadastro sem canal ou com contato vazio, quando salva, então bloqueia com Informe ao menos um canal", async () => {
    const semCanal = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      { nome: "Ana Lima", canais: [] },
      HOJE,
    );
    const contatoVazio = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      { nome: "Ana Lima", canais: [{ canal: "email", contato: "  ", preferido: true }] },
      HOJE,
    );

    expect(semCanal).toEqual({ ok: false, mensagem: MENSAGEM_SEM_CANAL });
    expect(contatoVazio).toEqual({ ok: false, mensagem: MENSAGEM_SEM_CANAL });
    expect(memoria.pacientes.size).toBe(0);
  });

  it("dado vários canais sem exatamente um preferido, quando cadastra, então bloqueia", async () => {
    const nenhum = normalizarCanais([
      { canal: "sms", contato: "1", preferido: false },
      { canal: "email", contato: "a@b.com", preferido: false },
    ]);
    const dois = normalizarCanais([
      { canal: "sms", contato: "1", preferido: true },
      { canal: "email", contato: "a@b.com", preferido: true },
    ]);

    expect(nenhum).toEqual({ ok: false, mensagem: MENSAGEM_CANAL_PREFERIDO });
    expect(dois).toEqual({ ok: false, mensagem: MENSAGEM_CANAL_PREFERIDO });
  });

  it("dado um nome vazio, quando cadastra, então bloqueia", async () => {
    const resultado = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      { ...ENTRADA, nome: "   " },
      HOJE,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_NOME_OBRIGATORIO });
  });

  it("dado um sexo desconhecido ou uma data inválida ou futura, quando cadastra, então recebe a mensagem correspondente", async () => {
    const deps = memoria.deps();

    expect(await cadastrarPaciente(deps, recepcionista, { ...ENTRADA, sexo: "x" }, HOJE)).toEqual({
      ok: false,
      mensagem: MENSAGEM_SEXO_INVALIDO,
    });
    for (const data of ["2026-02-30", "10/05/1990", "2026-10-26"]) {
      expect(
        await cadastrarPaciente(deps, recepcionista, { ...ENTRADA, dataNascimento: data }, HOJE),
      ).toEqual({ ok: false, mensagem: MENSAGEM_NASCIMENTO_INVALIDO });
    }
    expect(memoria.pacientes.size).toBe(0);
  });

  it("dado o aniversário 1990-05-10, então idadeEm é 36 em 2026-10-25 e 35 em 2026-05-01", () => {
    expect(idadeEm("1990-05-10", new Date("2026-10-25T12:00:00"))).toBe(36);
    expect(idadeEm("1990-05-10", new Date("2026-05-01T12:00:00"))).toBe(35);
    expect(idadeEm("1990-05-10", new Date("2026-05-10T12:00:00"))).toBe(36);
  });

  it("dado a data de nascimento, então menorDeIdade é idade menor que 18 e sem data não há menoridade", () => {
    expect(menorDeIdade("2015-03-20", HOJE)).toBe(true);
    expect(menorDeIdade("2008-10-26", HOJE)).toBe(true);
    expect(menorDeIdade("2008-10-25", HOJE)).toBe(false);
    expect(menorDeIdade(null, HOJE)).toBe(false);
  });

  it("dado um CPF já cadastrado na clínica, quando cadastra, então bloqueia e devolve o paciente João Pereira", async () => {
    const joao = memoria.semear({ id: "p1", nome: "João Pereira", cpf: "123.456.789-09" });

    const resultado = await cadastrarPaciente(memoria.deps(), recepcionista, ENTRADA, HOJE);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CPF_JA_CADASTRADO, existente: joao });
    expect(memoria.pacientes.size).toBe(1);
  });

  it("dado o mesmo CPF em outra clínica, quando cadastra, então é aceito; e vários pacientes sem CPF são válidos", async () => {
    memoria.semear({ id: "alheio", clinicaId: "outra-clinica", cpf: "123.456.789-09" });
    const deps = memoria.deps();

    const comCpf = await cadastrarPaciente(deps, recepcionista, ENTRADA, HOJE);
    const semCpfA = await cadastrarPaciente(deps, recepcionista, { ...ENTRADA, cpf: "" }, HOJE);
    const semCpfB = await cadastrarPaciente(deps, recepcionista, { ...ENTRADA, cpf: null }, HOJE);

    expect(comCpf.ok && semCpfA.ok && semCpfB.ok).toBe(true);
    expect(memoria.pacientes.size).toBe(4);
  });

  it("dado nascimento 2015-03-20 em 2026-10-25, quando cadastra sem responsável, então bloqueia pedindo nome e depois CPF", async () => {
    const deps = memoria.deps();
    const menor = { ...ENTRADA, cpf: null, dataNascimento: "2015-03-20" };

    const semNada = await cadastrarPaciente(deps, recepcionista, menor, HOJE);
    const semCpf = await cadastrarPaciente(
      deps,
      recepcionista,
      { ...menor, responsavel: { nome: "Carla Oliveira", cpf: " " } },
      HOJE,
    );

    expect(semNada).toEqual({ ok: false, mensagem: MENSAGEM_RESPONSAVEL_NOME });
    expect(semCpf).toEqual({ ok: false, mensagem: MENSAGEM_RESPONSAVEL_CPF });
    expect(memoria.pacientes.size).toBe(0);
  });

  it("dado um menor com responsável de nome e CPF, quando cadastra, então grava o responsável e o telefone opcional vira null", async () => {
    const resultado = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      {
        ...ENTRADA,
        cpf: null,
        dataNascimento: "2015-03-20",
        responsavel: { nome: " Carla Oliveira ", cpf: " 987.654.321-00 ", telefone: "" },
      },
      HOJE,
    );

    expect(resultado.ok && resultado.valor.responsavel).toEqual({
      nome: "Carla Oliveira",
      cpf: "987.654.321-00",
      telefone: null,
    });
  });

  it("dado um responsável com o mesmo CPF de outro menor, quando cadastra o irmão, então é aceito porque o CPF do responsável não é único", async () => {
    const deps = memoria.deps();
    const irmao = {
      ...ENTRADA,
      cpf: null,
      dataNascimento: "2015-03-20",
      responsavel: { nome: "Carla Oliveira", cpf: "987.654.321-00" },
    };

    const primeiro = await cadastrarPaciente(deps, recepcionista, irmao, HOJE);
    const segundo = await cadastrarPaciente(deps, recepcionista, irmao, HOJE);

    expect(primeiro.ok && segundo.ok).toBe(true);
    expect(memoria.pacientes.size).toBe(2);
  });

  it("dado um paciente sem data de nascimento, quando cadastra, então não exige responsável", async () => {
    const resultado = await cadastrarPaciente(
      memoria.deps(),
      recepcionista,
      { ...ENTRADA, dataNascimento: null },
      HOJE,
    );

    expect(resultado.ok && resultado.valor.responsavel).toBeNull();
  });

  it("dado um dentista, quando altera o contato do canal, então o id permanece e nenhuma porta de agenda é chamada", async () => {
    memoria.semear({
      id: "p1",
      canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
    });

    const resultado = await editarPaciente(
      memoria.deps(),
      sessao("dentista"),
      "p1",
      {
        nome: "João Pereira",
        canais: [{ canal: "whatsapp", contato: "11 91111-2222", preferido: true }],
      },
      HOJE,
    );

    expect(resultado.ok && resultado.valor.id).toBe("p1");
    expect(memoria.pacientes.size).toBe(1);
    expect(memoria.pacientes.get("p1")?.canais).toEqual([
      { canal: "whatsapp", contato: "11 91111-2222", preferido: true },
    ]);
    expect(memoria.chamadasDeAgenda).toBe(0);
  });

  it("dado a edição que mantém o próprio CPF, então é aceita; com o CPF de outro paciente, bloqueia e devolve o existente", async () => {
    memoria.semear({ id: "p1", nome: "João Pereira", cpf: "111.111.111-11" });
    memoria.semear({ id: "p2", nome: "Maria Oliveira", cpf: "222.222.222-22" });
    const deps = memoria.deps();
    const base = { nome: "João Pereira", canais: ENTRADA.canais };

    const mesmo = await editarPaciente(deps, recepcionista, "p1", { ...base, cpf: "111.111.111-11" }, HOJE);
    const outro = await editarPaciente(deps, recepcionista, "p1", { ...base, cpf: "222.222.222-22" }, HOJE);

    expect(mesmo.ok).toBe(true);
    expect(outro).toEqual({
      ok: false,
      mensagem: MENSAGEM_CPF_JA_CADASTRADO,
      existente: memoria.pacientes.get("p2"),
    });
    expect(memoria.pacientes.get("p1")?.cpf).toBe("111.111.111-11");
  });

  it("dado um paciente de outra clínica, quando se tenta editar, então não é encontrado e nada muda", async () => {
    const alheio = memoria.semear({ id: "alheio", clinicaId: "outra-clinica" });

    const resultado = await editarPaciente(
      memoria.deps(),
      recepcionista,
      "alheio",
      { nome: "X", canais: ENTRADA.canais },
      HOJE,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO });
    expect(memoria.pacientes.get("alheio")).toEqual(alheio);
  });

  it("dado um paciente maior de idade editado para uma data de menor, quando salva sem responsável, então bloqueia", async () => {
    memoria.semear({ id: "p1" });

    const resultado = await editarPaciente(
      memoria.deps(),
      recepcionista,
      "p1",
      { nome: "João Pereira", canais: ENTRADA.canais, dataNascimento: "2015-03-20" },
      HOJE,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_RESPONSAVEL_NOME });
    expect(memoria.pacientes.get("p1")?.dataNascimento).toBeNull();
  });

  it.each(["dentista", "admin"] as const)(
    "dado um %s, quando cadastra um paciente, então é aceito e fica na clínica da sessão",
    async (papel) => {
      const resultado = await cadastrarPaciente(memoria.deps(), sessao(papel), ENTRADA, HOJE);

      expect(resultado.ok && resultado.valor.clinicaId).toBe(CLINICA_ID);
    },
  );

  it.each(["admin", "dentista", "recepcionista"] as const)(
    "dado um %s inativo, quando cadastra, edita ou lista, então recebe a mensagem de papel",
    async (papel) => {
      memoria.semear({ id: "p1" });
      const ator = sessao(papel, false);
      const deps = memoria.deps();

      const resultados = [
        await cadastrarPaciente(deps, ator, ENTRADA, HOJE),
        await editarPaciente(deps, ator, "p1", ENTRADA, HOJE),
        await listarPacientes(deps, ator),
      ];

      for (const resultado of resultados) {
        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      }
      expect(memoria.pacientes.size).toBe(1);
    },
  );

  it("dado uma sessão cuja clínica não existe, quando cadastra ou lista, então recebe Clínica não encontrada", async () => {
    memoria.clinicas.clear();
    const deps = memoria.deps();

    expect(await cadastrarPaciente(deps, recepcionista, ENTRADA, HOJE)).toEqual({
      ok: false,
      mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA,
    });
    expect(await listarPacientes(deps, recepcionista)).toEqual({
      ok: false,
      mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA,
    });
  });

  it("dado pacientes da clínica e de outra, quando lista, então devolve só os da clínica ordenados por nome", async () => {
    memoria.semear({ id: "p1", nome: "Zélia Prado" });
    memoria.semear({ id: "p2", nome: "Ana Lima" });
    memoria.semear({ id: "alheio", nome: "Bruno", clinicaId: "outra-clinica" });

    const lista = await listarPacientes(memoria.deps(), recepcionista);

    expect(lista.ok && lista.valor.map((item) => item.id)).toEqual(["p2", "p1"]);
  });

  it("dado um paciente cadastrado, então o objeto não tem usuário, senha nem idade", async () => {
    const resultado = await cadastrarPaciente(memoria.deps(), recepcionista, ENTRADA, HOJE);

    expect(resultado.ok && Object.keys(resultado.valor).sort()).toEqual([
      "canais",
      "clinicaId",
      "cpf",
      "dataNascimento",
      "endereco",
      "id",
      "nome",
      "responsavel",
      "sexo",
    ]);
  });

  it.todo("Feature 006: a tela de agendamento permite selecionar o paciente cadastrado na clínica");
  it.todo("Feature 010: a Visão Geral do prontuário mostra os dados do paciente cadastrado");
});
