import { beforeEach, describe, expect, it } from "vitest";
import {
  criarAgendamento,
  criarBloqueio,
  iniciarAtendimento,
  listarAgendamentos,
  listarOpcoesAgendamento,
  registrarEmergencia,
} from "../../src/domain/agendamento/casos";
import type { Dependencias } from "../../src/domain/agendamento/portas";
import { notificacoesVazias } from "./apoio-notificacao";
import { intervalosSobrepoem, ocupaAgenda, sugerirFim } from "../../src/domain/agendamento/regras";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  MENSAGEM_CADEIRA_INDISPONIVEL,
  MENSAGEM_CADEIRA_OCUPADA,
  MENSAGEM_DENTISTA_INDISPONIVEL,
  MENSAGEM_DENTISTA_OCUPADO,
  MENSAGEM_DIA_SEM_ATENDIMENTO,
  MENSAGEM_FORA_DO_HORARIO,
  MENSAGEM_HORARIO_INVALIDO,
  MENSAGEM_PACIENTE_OCUPADO,
  type Agendamento,
  type BloqueioAgenda,
  type ConflitoAgenda,
  type EntradaAgendamento,
} from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import {
  MENSAGEM_CADEIRA_NAO_ENCONTRADA,
  MENSAGEM_CLINICA_NAO_ENCONTRADA,
  type Cadeira,
  type Clinica,
} from "../../src/domain/clinica/tipos";
import { MENSAGEM_DENTISTA_NAO_ENCONTRADO, type Dentista } from "../../src/domain/dentista/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../../src/domain/paciente/tipos";
import {
  MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO,
  type Procedimento,
} from "../../src/domain/procedimento/tipos";

const CLINICA_ID = "clinica-001";
const OUTRA_CLINICA = "clinica-002";
const PACIENTE_JOAO = "paciente-joao";
const PACIENTE_MARIA = "paciente-maria";
const DENTISTA_CARLOS = "dentista-carlos";
const DENTISTA_ANA = "dentista-ana";
const USUARIO_CARLOS = "ator-dentista";
const USUARIO_ANA = "ator-ana";
const CADEIRA_1 = "cadeira-1";
const CADEIRA_2 = "cadeira-2";
const CADEIRA_3 = "cadeira-3";
const PROCEDIMENTO_ID = "procedimento-limpeza";
const INICIO = "2026-10-15T14:00";
const FIM = "2026-10-15T14:30";

const ENTRADA: EntradaAgendamento = {
  pacienteId: PACIENTE_JOAO,
  dentistaId: DENTISTA_CARLOS,
  cadeiraId: CADEIRA_1,
  procedimentoId: PROCEDIMENTO_ID,
  inicio: INICIO,
  fim: FIM,
};

class Memoria {
  clinicas = new Map<string, Clinica>();
  pacientes = new Map<string, Paciente>();
  dentistas = new Map<string, Dentista>();
  cadeiras = new Map<string, Cadeira>();
  procedimentos = new Map<string, Procedimento>();
  agendamentos = new Map<string, Agendamento>();
  bloqueios = new Map<string, BloqueioAgenda>();
  proximoId = 0;

  deps(): Dependencias {
    return {
      avisos: { avisarRecepcionista: async () => {} },
      notificacoes: notificacoesVazias(),
      retornos: { concluirPendentes: async () => {} },
      reverterDoAgendamento: async () => ({ ok: true, valor: undefined }),
      agendamentos: {
        listar: async (clinicaId) => this.daClinica(this.agendamentos, clinicaId),
        listarEntre: async (clinicaId, inicio, fim) =>
          this.daClinica(this.agendamentos, clinicaId).filter(
            (item) => item.inicio < fim && item.fim > inicio,
          ),
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          if (ocupaAgenda(agendamento)) {
            const conflito = this.conflito(agendamento);
            if (conflito) return conflito;
          }
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      bloqueios: {
        listar: async (clinicaId) => this.daClinica(this.bloqueios, clinicaId),
        listarEntre: async (clinicaId, inicio, fim) =>
          this.daClinica(this.bloqueios, clinicaId).filter(
            (item) => item.inicio < fim && item.fim > inicio,
          ),
        salvar: async (bloqueio) => {
          this.bloqueios.set(bloqueio.id, bloqueio);
        },
      },
      clinicas: { buscarPorId: async (id) => this.clinicas.get(id) ?? null },
      cadeiras: { listar: async (clinicaId) => this.daClinica(this.cadeiras, clinicaId) },
      dentistas: {
        listar: async (clinicaId) => this.daClinica(this.dentistas, clinicaId),
        buscarPorId: async (id) => this.dentistas.get(id) ?? null,
      },
      pacientes: {
        listar: async (clinicaId) => this.daClinica(this.pacientes, clinicaId),
        buscarPorId: async (id) => this.pacientes.get(id) ?? null,
      },
      procedimentos: {
        listar: async (clinicaId) => this.daClinica(this.procedimentos, clinicaId),
        buscarPorId: async (id) => this.procedimentos.get(id) ?? null,
      },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  semearAgendamento(parcial: Partial<Agendamento> & Pick<Agendamento, "id">): Agendamento {
    const agendamento: Agendamento = {
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: CADEIRA_1,
      procedimentoId: PROCEDIMENTO_ID,
      inicio: INICIO,
      fim: FIM,
      status: "agendado",
      iniciadoPor: null,
      emergencia: false,
      criadoPor: "ator-admin",
      alertaCadeira: false,
      alertaHorario: false,
      alertaDentista: false,
      motivoCancelamento: null,
      canceladoPor: null,
      canceladoEm: null,
      concluidoEm: null,
      ...parcial,
    };
    this.agendamentos.set(agendamento.id, agendamento);
    return agendamento;
  }

  semearBloqueio(parcial: Partial<BloqueioAgenda> & Pick<BloqueioAgenda, "id">): BloqueioAgenda {
    const bloqueio: BloqueioAgenda = {
      clinicaId: CLINICA_ID,
      dentistaId: DENTISTA_CARLOS,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: null,
      criadoPor: USUARIO_CARLOS,
      ...parcial,
    };
    this.bloqueios.set(bloqueio.id, bloqueio);
    return bloqueio;
  }

  private daClinica<T extends { clinicaId: string }>(mapa: Map<string, T>, clinicaId: string): T[] {
    return [...mapa.values()].filter((item) => item.clinicaId === clinicaId);
  }

  private conflito(agendamento: Agendamento): ConflitoAgenda | null {
    const outros = [...this.agendamentos.values()].filter(
      (item) =>
        item.id !== agendamento.id &&
        item.clinicaId === agendamento.clinicaId &&
        ocupaAgenda(item) &&
        intervalosSobrepoem(item, agendamento),
    );
    if (outros.some((item) => item.cadeiraId === agendamento.cadeiraId)) return "cadeira";
    if (outros.some((item) => item.dentistaId === agendamento.dentistaId)) return "dentista";
    if (outros.some((item) => item.pacienteId === agendamento.pacienteId)) return "paciente";
    return null;
  }
}

function sessao(papel: Papel, ativo = true, id = `ator-${papel}`): Sessao {
  return {
    usuario: {
      id,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId: CLINICA_ID,
      ativo,
    },
  };
}

function paciente(parcial: Partial<Paciente> & Pick<Paciente, "id" | "nome">): Paciente {
  return {
    clinicaId: CLINICA_ID,
    canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
    ...parcial,
  };
}

function dentista(
  parcial: Partial<Dentista> & Pick<Dentista, "id" | "nome" | "usuarioId">,
): Dentista {
  return {
    clinicaId: CLINICA_ID,
    cro: "CRO-SP 12345",
    telefone: "11 98888-0000",
    cpf: "123.456.789-09",
    especialidades: [],
    ativo: true,
    ...parcial,
  };
}

describe("criar agendamento", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.clinicas.set(CLINICA_ID, {
      id: CLINICA_ID,
      nome: "Clínica OdontoSmile",
      adminId: "ator-admin",
      diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    });
    memoria.pacientes.set(PACIENTE_JOAO, paciente({ id: PACIENTE_JOAO, nome: "João" }));
    memoria.pacientes.set(PACIENTE_MARIA, paciente({ id: PACIENTE_MARIA, nome: "Maria" }));
    memoria.dentistas.set(
      DENTISTA_CARLOS,
      dentista({ id: DENTISTA_CARLOS, nome: "Dr. Carlos", usuarioId: USUARIO_CARLOS }),
    );
    memoria.dentistas.set(
      DENTISTA_ANA,
      dentista({ id: DENTISTA_ANA, nome: "Dra. Ana", usuarioId: USUARIO_ANA }),
    );
    memoria.cadeiras.set(CADEIRA_1, {
      id: CADEIRA_1,
      clinicaId: CLINICA_ID,
      identificacao: "Cadeira 1",
      ativa: true,
    });
    memoria.cadeiras.set(CADEIRA_2, {
      id: CADEIRA_2,
      clinicaId: CLINICA_ID,
      identificacao: "Cadeira 2",
      ativa: false,
    });
    memoria.cadeiras.set(CADEIRA_3, {
      id: CADEIRA_3,
      clinicaId: CLINICA_ID,
      identificacao: "Cadeira 3",
      ativa: true,
    });
    memoria.procedimentos.set(PROCEDIMENTO_ID, {
      id: PROCEDIMENTO_ID,
      clinicaId: CLINICA_ID,
      nome: "Limpeza",
      tempoMedioMinutos: 30,
      valorMedio: 150,
    });
  });

  it.each(["admin", "dentista", "recepcionista"] as const)(
    "dado um %s, quando cria o agendamento, então nasce agendado com id, criadoPor e emergencia false",
    async (papel) => {
      const ator = sessao(papel);
      const resultado = await criarAgendamento(memoria.deps(), ator, ENTRADA);

      expect(resultado.ok).toBe(true);
      if (!resultado.ok) return;
      expect(resultado.valor.id.length).toBeGreaterThan(0);
      expect(resultado.valor).toMatchObject({
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_JOAO,
        dentistaId: DENTISTA_CARLOS,
        cadeiraId: CADEIRA_1,
        procedimentoId: PROCEDIMENTO_ID,
        inicio: INICIO,
        fim: FIM,
        status: "agendado",
        iniciadoPor: null,
        emergencia: false,
        criadoPor: ator.usuario.id,
        alertaCadeira: false,
        alertaHorario: false,
        alertaDentista: false,
      });
      expect(memoria.agendamentos.get(resultado.valor.id)).toEqual(resultado.valor);
    },
  );

  it("dado 14:00–14:30 na cadeira, quando agenda 14:30–15:00 na mesma cadeira, então os dois gravam", async () => {
    expect(
      intervalosSobrepoem(
        { inicio: INICIO, fim: FIM },
        { inicio: "2026-10-15T14:30", fim: "2026-10-15T15:00" },
      ),
    ).toBe(false);
    const deps = memoria.deps();

    const primeiro = await criarAgendamento(deps, sessao("admin"), ENTRADA);
    const segundo = await criarAgendamento(deps, sessao("recepcionista"), {
      ...ENTRADA,
      inicio: "2026-10-15T14:30",
      fim: "2026-10-15T15:00",
    });

    expect(primeiro.ok && segundo.ok).toBe(true);
    expect(memoria.agendamentos.size).toBe(2);
  });

  it("dado a cadeira ocupada em 2026-10-15 14:00 por outro dentista, quando agenda na mesma cadeira e horário, então a cadeira fica indisponível nesse horário", async () => {
    memoria.semearAgendamento({
      id: "ocupado",
      pacienteId: PACIENTE_MARIA,
      dentistaId: DENTISTA_ANA,
    });

    const resultado = await criarAgendamento(memoria.deps(), sessao("recepcionista"), ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CADEIRA_OCUPADA });
    expect(memoria.agendamentos.size).toBe(1);
  });

  it("dado agendamento em espera ou iniciado na cadeira, quando cria no mesmo horário, então a cadeira fica indisponível nesse horário", async () => {
    const deps = memoria.deps();
    for (const status of ["em_espera", "iniciado"] as const) {
      memoria.agendamentos.clear();
      memoria.semearAgendamento({
        id: "ocupado",
        status,
        pacienteId: PACIENTE_MARIA,
        dentistaId: DENTISTA_ANA,
      });
      expect(await criarAgendamento(deps, sessao("admin"), ENTRADA)).toEqual({
        ok: false,
        mensagem: MENSAGEM_CADEIRA_OCUPADA,
      });
    }
  });

  it("dado cancelado, concluído ou emergência na cadeira, quando cria no mesmo horário, então grava", async () => {
    const deps = memoria.deps();
    for (const parcial of [
      { status: "cancelado" as const },
      { status: "concluido" as const },
      { emergencia: true },
    ]) {
      memoria.agendamentos.clear();
      memoria.semearAgendamento({ id: "livre", ...parcial });
      expect((await criarAgendamento(deps, sessao("admin"), ENTRADA)).ok).toBe(true);
    }
  });

  it("dado o dentista com bloqueio pontual das 14:00 às 15:00, quando agenda nesse intervalo, então o dentista fica indisponível nesse horário", async () => {
    memoria.semearBloqueio({ id: "bloqueio-1" });

    const resultado = await criarAgendamento(memoria.deps(), sessao("admin"), ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_OCUPADO });
    expect(memoria.agendamentos.size).toBe(0);
  });

  it("dado o dentista com outro agendamento ativo no intervalo, quando cria em outra cadeira, então o dentista fica indisponível nesse horário", async () => {
    memoria.semearAgendamento({
      id: "consulta",
      pacienteId: PACIENTE_MARIA,
      cadeiraId: CADEIRA_3,
    });

    const resultado = await criarAgendamento(memoria.deps(), sessao("recepcionista"), ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_OCUPADO });
  });

  it("dado o paciente já agendado em 2026-10-15 14:00, quando agenda o mesmo paciente com outro dentista, então ele já possui agendamento nesse horário", async () => {
    memoria.semearAgendamento({ id: "do-joao", dentistaId: DENTISTA_CARLOS, cadeiraId: CADEIRA_1 });

    const resultado = await criarAgendamento(memoria.deps(), sessao("admin"), {
      ...ENTRADA,
      dentistaId: DENTISTA_ANA,
      cadeiraId: CADEIRA_3,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PACIENTE_OCUPADO });
    expect(memoria.agendamentos.size).toBe(1);
  });

  it("dado a clínica de segunda a sexta, quando agenda no domingo 2026-10-18, então a clínica não atende nesse dia", async () => {
    const resultado = await criarAgendamento(memoria.deps(), sessao("recepcionista"), {
      ...ENTRADA,
      inicio: "2026-10-18T14:00",
      fim: "2026-10-18T14:30",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DIA_SEM_ATENDIMENTO });
  });

  it("dado a clínica em funcionamento até 18:00, quando agenda às 19:00, então fica fora do horário de funcionamento", async () => {
    const resultado = await criarAgendamento(memoria.deps(), sessao("admin"), {
      ...ENTRADA,
      inicio: "2026-10-15T19:00",
      fim: "2026-10-15T19:30",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_FORA_DO_HORARIO });
  });

  it("dado o expediente 08:00–18:00, quando o intervalo começa na abertura ou termina no fechamento, então grava", async () => {
    const deps = memoria.deps();

    const abertura = await criarAgendamento(deps, sessao("admin"), {
      ...ENTRADA,
      inicio: "2026-10-15T08:00",
      fim: "2026-10-15T08:30",
    });
    const fechamento = await criarAgendamento(deps, sessao("admin"), {
      ...ENTRADA,
      pacienteId: PACIENTE_MARIA,
      inicio: "2026-10-15T17:30",
      fim: "2026-10-15T18:00",
    });

    expect(abertura.ok && fechamento.ok).toBe(true);
  });

  it("dado um intervalo que atravessa a meia-noite, quando cria, então fica fora do horário de funcionamento", async () => {
    const resultado = await criarAgendamento(memoria.deps(), sessao("admin"), {
      ...ENTRADA,
      inicio: "2026-10-15T17:00",
      fim: "2026-10-16T09:00",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_FORA_DO_HORARIO });
  });

  it("dado a cadeira desativada, quando cria o agendamento, então a cadeira fica indisponível", async () => {
    const resultado = await criarAgendamento(memoria.deps(), sessao("recepcionista"), {
      ...ENTRADA,
      cadeiraId: CADEIRA_2,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CADEIRA_INDISPONIVEL });
    expect(memoria.agendamentos.size).toBe(0);
  });

  it("dado o dentista inativo, quando cria o agendamento, então o dentista fica indisponível", async () => {
    memoria.dentistas.get(DENTISTA_CARLOS)!.ativo = false;

    const resultado = await criarAgendamento(memoria.deps(), sessao("admin"), ENTRADA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_INDISPONIVEL });
    expect(memoria.agendamentos.size).toBe(0);
  });

  it("dado a limpeza com tempo médio de 30 minutos, quando a duração informada é 45, então grava o intervalo e o tempo médio permanece 30", async () => {
    const procedimento = memoria.procedimentos.get(PROCEDIMENTO_ID);

    const resultado = await criarAgendamento(memoria.deps(), sessao("dentista"), {
      ...ENTRADA,
      fim: "2026-10-15T14:45",
    });

    expect(resultado.ok && resultado.valor).toMatchObject({
      inicio: INICIO,
      fim: "2026-10-15T14:45",
      procedimentoId: PROCEDIMENTO_ID,
    });
    expect(procedimento?.tempoMedioMinutos).toBe(30);
    expect(memoria.procedimentos.get(PROCEDIMENTO_ID)).toBe(procedimento);
  });

  it("dado paciente, dentista e cadeira livres, quando cria sem procedimento, então grava com procedimentoId null", async () => {
    const resultado = await criarAgendamento(memoria.deps(), sessao("recepcionista"), {
      ...ENTRADA,
      procedimentoId: null,
    });

    expect(resultado.ok && resultado.valor.procedimentoId).toBeNull();
    expect(resultado.ok && resultado.valor.status).toBe("agendado");
    expect(memoria.agendamentos.size).toBe(1);
  });

  it("dado a cadeira livre em 2026-10-15 14:00, quando dois usuários criam ao mesmo tempo nesse horário, então só uma gravação fica e a outra recebe cadeira indisponível nesse horário", async () => {
    const deps = memoria.deps();
    const [primeira, segunda] = await Promise.all([
      criarAgendamento(deps, sessao("admin"), ENTRADA),
      criarAgendamento(deps, sessao("recepcionista"), {
        ...ENTRADA,
        pacienteId: PACIENTE_MARIA,
        dentistaId: DENTISTA_ANA,
      }),
    ]);

    const resultados = [primeira, segunda];
    expect(resultados.filter((item) => item.ok)).toHaveLength(1);
    expect(resultados.filter((item) => !item.ok)).toEqual([
      { ok: false, mensagem: MENSAGEM_CADEIRA_OCUPADA },
    ]);
    expect(memoria.agendamentos.size).toBe(1);
  });

  it("dado horário inválido ou entidades de outra clínica, quando cria, então a primeira falha segue horário, paciente, dentista, cadeira e procedimento", async () => {
    memoria.pacientes.set(
      "alheio-p",
      paciente({ id: "alheio-p", nome: "Alheio", clinicaId: OUTRA_CLINICA }),
    );
    memoria.dentistas.set(
      "alheio-d",
      dentista({
        id: "alheio-d",
        nome: "Alheio",
        usuarioId: "ator-alheio",
        clinicaId: OUTRA_CLINICA,
      }),
    );
    memoria.cadeiras.set("alheio-c", {
      id: "alheio-c",
      clinicaId: OUTRA_CLINICA,
      identificacao: "Alheia",
      ativa: true,
    });
    memoria.procedimentos.set("alheio-pr", {
      id: "alheio-pr",
      clinicaId: OUTRA_CLINICA,
      nome: "Canal",
      tempoMedioMinutos: 20,
      valorMedio: 80,
    });
    const deps = memoria.deps();
    const ator = sessao("recepcionista");
    const base = {
      pacienteId: "alheio-p",
      dentistaId: "alheio-d",
      cadeiraId: "alheio-c",
      procedimentoId: "alheio-pr",
      inicio: INICIO,
      fim: INICIO,
    };

    expect(await criarAgendamento(deps, ator, { ...base, inicio: "", fim: "" })).toEqual({
      ok: false,
      mensagem: MENSAGEM_HORARIO_INVALIDO,
    });
    expect(await criarAgendamento(deps, ator, base)).toEqual({
      ok: false,
      mensagem: MENSAGEM_HORARIO_INVALIDO,
    });
    expect(await criarAgendamento(deps, ator, { ...base, fim: FIM })).toEqual({
      ok: false,
      mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO,
    });
    expect(
      await criarAgendamento(deps, ator, { ...ENTRADA, dentistaId: "alheio-d", cadeiraId: "alheio-c", procedimentoId: "alheio-pr" }),
    ).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO });
    expect(
      await criarAgendamento(deps, ator, { ...ENTRADA, cadeiraId: "alheio-c", procedimentoId: "alheio-pr" }),
    ).toEqual({ ok: false, mensagem: MENSAGEM_CADEIRA_NAO_ENCONTRADA });
    expect(await criarAgendamento(deps, ator, { ...ENTRADA, procedimentoId: "alheio-pr" })).toEqual({
      ok: false,
      mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO,
    });
    expect(memoria.agendamentos.size).toBe(0);
    expect(memoria.procedimentos.get("alheio-pr")?.tempoMedioMinutos).toBe(20);
  });

  it("dado um domingo com a cadeira já ocupada, quando se registra a emergência nesse horário, então grava com emergencia true e status agendado", async () => {
    memoria.semearAgendamento({
      id: "domingo",
      inicio: "2026-10-18T14:00",
      fim: "2026-10-18T14:30",
    });
    const entrada: EntradaAgendamento = {
      ...ENTRADA,
      inicio: "2026-10-18T14:00",
      fim: "2026-10-18T14:30",
    };
    const deps = memoria.deps();
    const ator = sessao("recepcionista");

    expect(await criarAgendamento(deps, ator, entrada)).toEqual({
      ok: false,
      mensagem: MENSAGEM_DIA_SEM_ATENDIMENTO,
    });
    const resultado = await registrarEmergencia(deps, ator, entrada);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor).toMatchObject({
      emergencia: true,
      status: "agendado",
      criadoPor: ator.usuario.id,
      iniciadoPor: null,
      inicio: "2026-10-18T14:00",
      fim: "2026-10-18T14:30",
    });
    expect(memoria.agendamentos.get(resultado.valor.id)?.emergencia).toBe(true);
  });

  it("dado um agendamento agendado, quando a recepcionista inicia, então recebe a mensagem de papel", async () => {
    const agendamento = memoria.semearAgendamento({ id: "a1" });

    const resultado = await iniciarAtendimento(memoria.deps(), sessao("recepcionista"), "a1");

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.agendamentos.get("a1")).toEqual(agendamento);
  });

  it("dado o agendamento do Dr. Carlos, quando outro dentista inicia, então recebe a mensagem de papel", async () => {
    memoria.semearAgendamento({ id: "a1" });

    const resultado = await iniciarAtendimento(
      memoria.deps(),
      sessao("dentista", true, USUARIO_ANA),
      "a1",
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.agendamentos.get("a1")?.status).toBe("agendado");
    expect(memoria.agendamentos.get("a1")?.iniciadoPor).toBeNull();
  });

  it("dado um agendamento agendado, quando o dentista responsável inicia, então fica iniciado e iniciadoPor é ele", async () => {
    memoria.semearAgendamento({ id: "a1" });
    const ator = sessao("dentista");

    const resultado = await iniciarAtendimento(memoria.deps(), ator, "a1");

    expect(resultado.ok && resultado.valor.status).toBe("iniciado");
    expect(resultado.ok && resultado.valor.iniciadoPor).toBe(USUARIO_CARLOS);
    expect(memoria.agendamentos.get("a1")?.iniciadoPor).toBe(ator.usuario.id);
  });

  it("dado um agendamento em espera, quando o admin inicia, então fica iniciado e iniciadoPor é o admin", async () => {
    memoria.semearAgendamento({ id: "a1", status: "em_espera" });
    const ator = sessao("admin");

    const resultado = await iniciarAtendimento(memoria.deps(), ator, "a1");

    expect(resultado.ok && resultado.valor).toMatchObject({
      status: "iniciado",
      iniciadoPor: ator.usuario.id,
    });
  });

  it("dado agendamento inexistente, de outra clínica ou fora de agendado e em espera, quando inicia, então não é encontrado", async () => {
    memoria.semearAgendamento({ id: "alheio", clinicaId: OUTRA_CLINICA });
    memoria.semearAgendamento({ id: "feito", status: "concluido" });
    memoria.semearAgendamento({ id: "cancelado", status: "cancelado" });
    memoria.semearAgendamento({ id: "ja", status: "iniciado" });
    const deps = memoria.deps();
    const ator = sessao("admin");

    for (const id of ["nao-existe", "alheio", "feito", "cancelado", "ja"]) {
      expect(await iniciarAtendimento(deps, ator, id)).toEqual({
        ok: false,
        mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
      });
    }
    expect(memoria.agendamentos.get("feito")?.status).toBe("concluido");
  });

  it("dado um usuário inativo, quando inicia, então recebe a mensagem de papel", async () => {
    memoria.semearAgendamento({ id: "a1" });

    const resultado = await iniciarAtendimento(memoria.deps(), sessao("dentista", false), "a1");

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.agendamentos.get("a1")?.status).toBe("agendado");
  });

  it("dado outro dentista da clínica, quando o dentista bloqueia a agenda dele, então recebe a mensagem de papel", async () => {
    const resultado = await criarBloqueio(memoria.deps(), sessao("dentista"), {
      dentistaId: DENTISTA_ANA,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: "Congresso",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.bloqueios.size).toBe(0);
  });

  it("dado a própria agenda, quando o dentista bloqueia, então grava o bloqueio pontual", async () => {
    const resultado = await criarBloqueio(memoria.deps(), sessao("dentista"), {
      dentistaId: DENTISTA_CARLOS,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: "Congresso",
    });

    expect(resultado.ok && resultado.valor).toMatchObject({
      clinicaId: CLINICA_ID,
      dentistaId: DENTISTA_CARLOS,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: "Congresso",
      criadoPor: USUARIO_CARLOS,
    });
    expect(resultado.ok && Object.keys(resultado.valor).sort()).toEqual([
      "clinicaId",
      "criadoPor",
      "dentistaId",
      "fim",
      "id",
      "inicio",
      "motivo",
    ]);
  });

  it("dado um dentista da clínica, quando o admin bloqueia com motivo nulo, então grava o bloqueio", async () => {
    const resultado = await criarBloqueio(memoria.deps(), sessao("admin"), {
      dentistaId: DENTISTA_ANA,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: null,
    });

    expect(resultado.ok && resultado.valor).toMatchObject({
      dentistaId: DENTISTA_ANA,
      motivo: null,
      criadoPor: "ator-admin",
    });
    expect(memoria.bloqueios.size).toBe(1);
  });

  it("dado a recepcionista, quando bloqueia a agenda, então recebe a mensagem de papel", async () => {
    const resultado = await criarBloqueio(memoria.deps(), sessao("recepcionista"), {
      dentistaId: DENTISTA_CARLOS,
      inicio: INICIO,
      fim: "2026-10-15T15:00",
      motivo: null,
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(memoria.bloqueios.size).toBe(0);
  });

  it("dado dentista de outra clínica ou fim igual ao início, quando o admin bloqueia, então recebe a mensagem correspondente", async () => {
    memoria.dentistas.set(
      "alheio-d",
      dentista({
        id: "alheio-d",
        nome: "Alheio",
        usuarioId: "ator-alheio",
        clinicaId: OUTRA_CLINICA,
      }),
    );
    const deps = memoria.deps();
    const admin = sessao("admin");

    expect(
      await criarBloqueio(deps, admin, {
        dentistaId: "alheio-d",
        inicio: INICIO,
        fim: "2026-10-15T15:00",
        motivo: null,
      }),
    ).toEqual({ ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO });
    expect(
      await criarBloqueio(deps, admin, {
        dentistaId: DENTISTA_CARLOS,
        inicio: INICIO,
        fim: INICIO,
        motivo: null,
      }),
    ).toEqual({ ok: false, mensagem: MENSAGEM_HORARIO_INVALIDO });
    expect(memoria.bloqueios.size).toBe(0);
  });

  it("dado agendamentos da clínica e de outra, quando lista, então o de outra clínica não entra", async () => {
    memoria.semearAgendamento({ id: "da-casa" });
    memoria.semearAgendamento({ id: "alheio", clinicaId: OUTRA_CLINICA });

    const lista = await listarAgendamentos(memoria.deps(), sessao("recepcionista"));

    expect(lista.ok && lista.valor.map((item) => item.id)).toEqual(["da-casa"]);
  });

  it("dado um usuário inativo ou uma clínica inexistente, quando cria ou lista, então recebe a mensagem correspondente", async () => {
    const deps = memoria.deps();

    expect(await criarAgendamento(deps, sessao("admin", false), ENTRADA)).toEqual({
      ok: false,
      mensagem: MENSAGEM_PAPEL,
    });
    expect(await listarAgendamentos(deps, sessao("dentista", false))).toEqual({
      ok: false,
      mensagem: MENSAGEM_PAPEL,
    });

    memoria.clinicas.clear();
    expect(await criarAgendamento(deps, sessao("recepcionista"), ENTRADA)).toEqual({
      ok: false,
      mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA,
    });
    expect(await listarAgendamentos(deps, sessao("recepcionista"))).toEqual({
      ok: false,
      mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA,
    });
  });

  it("dado pacientes, dentistas, cadeiras e procedimentos da clínica, quando lista as opções, então devolve os da clínica ordenados em pt-BR, inclusive inativos", async () => {
    memoria.pacientes.get(PACIENTE_JOAO)!.nome = "ana";
    memoria.pacientes.get(PACIENTE_MARIA)!.nome = "Bruno";
    memoria.pacientes.set(
      "alheio-p",
      paciente({ id: "alheio-p", nome: "Zélia", clinicaId: OUTRA_CLINICA }),
    );
    memoria.dentistas.get(DENTISTA_CARLOS)!.nome = "Zélia";
    memoria.dentistas.get(DENTISTA_CARLOS)!.ativo = false;
    memoria.dentistas.get(DENTISTA_ANA)!.nome = "ana";
    memoria.cadeiras.get(CADEIRA_1)!.identificacao = "Beta";
    memoria.cadeiras.get(CADEIRA_3)!.identificacao = "alfa";
    memoria.procedimentos.set("proc-beta", {
      id: "proc-beta",
      clinicaId: CLINICA_ID,
      nome: "beta",
      tempoMedioMinutos: 20,
      valorMedio: 80,
    });
    memoria.procedimentos.set("proc-gamma", {
      id: "proc-gamma",
      clinicaId: CLINICA_ID,
      nome: "Gamma",
      tempoMedioMinutos: 40,
      valorMedio: 200,
    });

    const opcoes = await listarOpcoesAgendamento(memoria.deps(), sessao("recepcionista"));

    expect(opcoes.ok).toBe(true);
    if (!opcoes.ok) return;
    expect(opcoes.valor.pacientes.map((item) => item.nome)).toEqual(["ana", "Bruno"]);
    expect(opcoes.valor.dentistas).toEqual([
      { id: DENTISTA_ANA, nome: "ana", usuarioId: USUARIO_ANA },
      { id: DENTISTA_CARLOS, nome: "Zélia", usuarioId: USUARIO_CARLOS },
    ]);
    expect(opcoes.valor.cadeiras.map((item) => item.identificacao)).toEqual([
      "alfa",
      "Beta",
      "Cadeira 2",
    ]);
    expect(opcoes.valor.procedimentos.map((item) => item.nome)).toEqual(["beta", "Gamma", "Limpeza"]);
    expect(opcoes.valor.procedimentos.find((item) => item.id === PROCEDIMENTO_ID)?.tempoMedioMinutos).toBe(
      30,
    );
  });

  it("dado 2026-10-15T14:00 e 30 minutos, quando sugere o fim, então devolve 2026-10-15T14:30 no fuso do processo", () => {
    expect(sugerirFim("2026-10-15T14:00", 30)).toBe("2026-10-15T14:30");
    expect(sugerirFim("2026-10-15T23:40", 30)).toBe("2026-10-16T00:10");
  });

  it.todo("Feature 010: concluir o agendamento ao salvar a evolução");
  it.todo("Feature 012: vincular itens de plano de tratamento ao agendamento");
  it.todo(
    "Cenário 13: bloqueio recorrente impede o horário da ocorrência — PENDENTE o formato da recorrência",
  );
  it.todo("Feature 007: grade de dia e de semana da agenda");
  it.todo("PENDENTE: quem pode registrar um atendimento de emergência retroativo");
});
