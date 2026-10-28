import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelarAgendamento,
  iniciarAtendimento,
  marcarChegada,
} from "../../src/domain/agendamento/casos";
import type { Dependencias as DependenciasAgenda } from "../../src/domain/agendamento/portas";
import type { Agendamento } from "../../src/domain/agendamento/tipos";
import { MENSAGEM_PAPEL, type Papel, type Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import {
  listarVisiveis,
  marcarLida,
  publicar,
  registrarFalhaEnvio,
  resolver,
} from "../../src/domain/notificacao/casos";
import type { UsuarioAtivo } from "../../src/domain/notificacao/portas";
import { destinatarios, urgenciaDe } from "../../src/domain/notificacao/regras";
import type { Notificacao } from "../../src/domain/notificacao/tipos";
import {
  reagendarPorNovoAgendamento,
  verificarRetornos,
} from "../../src/domain/retorno/casos";
import type { Dependencias as DependenciasRetorno } from "../../src/domain/retorno/portas";
import type { Retorno } from "../../src/domain/retorno/tipos";
import { NotificacoesMemoria } from "./apoio-notificacao";

const CLINICA_ID = "clinica-001";
const PACIENTE_JOAO = "paciente-joao";
const DENTISTA_CARLOS = "dentista-carlos";
const USUARIO_DENTISTA = "usuario-dentista-carlos";
const USUARIO_ADMIN = "usuario-admin";
const RECEPCAO_ANA = "usuario-recepcao-ana";
const RECEPCAO_BIA = "usuario-recepcao-bia";
const AGENDAMENTO = "ag-1";
const MOTIVO = "Paciente remarcou";
const AGORA = new Date("2026-10-15T12:00:00.000Z");

const ADMIN: UsuarioAtivo = { id: USUARIO_ADMIN, papel: "admin", ativo: true };
const DENTISTA: UsuarioAtivo = { id: USUARIO_DENTISTA, papel: "dentista", ativo: true };
const ANA: UsuarioAtivo = { id: RECEPCAO_ANA, papel: "recepcionista", ativo: true };
const BIA: UsuarioAtivo = { id: RECEPCAO_BIA, papel: "recepcionista", ativo: true };

class Cenario {
  notificacoes = new NotificacoesMemoria();
  agendamentos = new Map<string, Agendamento>();
  retornos = new Map<string, Retorno>();

  constructor() {
    this.notificacoes.usuarios = [ADMIN, DENTISTA, ANA, BIA];
  }

  agenda(): DependenciasAgenda {
    const parcial = {
      notificacoes: this.notificacoes.deps(),
      avisos: { avisarRecepcionista: async () => {} },
      retornos: { concluirPendentes: async () => {} },
      reverterDoAgendamento: async () => ({ ok: true, valor: undefined }),
      notificarAgendamentoCriado: async () => {},
      clinicas: {
        buscarPorId: async (id) =>
          ({ id, nome: "Clínica OdontoSmile", adminId: USUARIO_ADMIN }) as Clinica,
      },
      agendamentos: {
        listar: async () => [...this.agendamentos.values()],
        listarEntre: async () => [],
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      dentistas: {
        listar: async () => [],
        buscarPorId: async (id) =>
          id === DENTISTA_CARLOS
            ? {
                id,
                clinicaId: CLINICA_ID,
                usuarioId: USUARIO_DENTISTA,
                nome: "Dr. Carlos",
                cro: "CRO-SP 12345",
                telefone: "11 98888-0000",
                cpf: "123.456.789-09",
                especialidades: [],
                ativo: true,
              }
            : null,
      },
    } satisfies Partial<DependenciasAgenda>;
    return parcial as unknown as DependenciasAgenda;
  }

  retorno(): DependenciasRetorno {
    return {
      notificacoes: this.notificacoes.deps(),
      avisos: { avisarRecepcionista: async () => {} },
      ids: { novo: () => "id-retorno" },
      configuracoes: { buscar: async () => null, salvar: async () => {} },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      pacientes: {
        buscarPorId: async (id) => ({
          id,
          clinicaId: CLINICA_ID,
          nome: "João",
          canais: [{ canal: "whatsapp", contato: "11 98888-0000", preferido: true }],
          cpf: null,
          endereco: null,
          dataNascimento: null,
          sexo: null,
          responsavel: null,
        }),
      },
      retornos: {
        listar: async (clinicaId) =>
          [...this.retornos.values()].filter((item) => item.clinicaId === clinicaId),
        listarPorStatus: async (status) =>
          [...this.retornos.values()].filter((item) => item.status === status),
        buscarPorAgendamentoOrigem: async () => null,
        salvar: async (retorno) => {
          this.retornos.set(retorno.id, retorno);
        },
      },
    };
  }

  semearAgendamento(parcial: Partial<Agendamento> = {}): Agendamento {
    const agendamento: Agendamento = {
      id: AGENDAMENTO,
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      cadeiraId: "cadeira-1",
      procedimentoId: null,
      inicio: "2026-10-15T14:00",
      fim: "2026-10-15T14:30",
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

  semearRetorno(): Retorno {
    const retorno: Retorno = {
      id: "retorno-001",
      clinicaId: CLINICA_ID,
      pacienteId: PACIENTE_JOAO,
      dentistaId: DENTISTA_CARLOS,
      agendamentoOrigemId: "consulta-001",
      marcadoPor: USUARIO_DENTISTA,
      dataPrevista: "2026-12-01",
      status: "pendente",
    };
    this.retornos.set(retorno.id, retorno);
    return retorno;
  }
}

function sessao(papel: Papel, id = `ator-${papel}`, ativo = true): Sessao {
  return {
    usuario: { id, nome: "Ator", email: `${papel}@clinica.com`, papel, clinicaId: CLINICA_ID, ativo },
  };
}

function aberta(parcial: Partial<Notificacao>): Notificacao {
  return {
    id: "n-1",
    clinicaId: CLINICA_ID,
    destinatarioId: RECEPCAO_ANA,
    tipo: "cancelamento_comunicar",
    urgencia: "normal",
    referenciaId: AGENDAMENTO,
    mensagem: "Comunicar o paciente sobre o cancelamento",
    lida: false,
    resolvida: false,
    criadaEm: "2026-10-28T12:00:00.000Z",
    ...parcial,
  };
}

describe("paciente aguardando atendimento", () => {
  let cenario: Cenario;

  beforeEach(() => {
    cenario = new Cenario();
    cenario.semearAgendamento();
  });

  it("dado um agendamento agendado, quando a recepcionista marca a chegada, então o status fica em_espera e o dentista da consulta recebe Paciente aguardando atendimento", async () => {
    const resultado = await marcarChegada(cenario.agenda(), sessao("recepcionista"), AGENDAMENTO);

    expect(resultado.ok).toBe(true);
    expect(cenario.agendamentos.get(AGENDAMENTO)?.status).toBe("em_espera");
    expect(cenario.notificacoes.linhas).toEqual([
      expect.objectContaining({
        destinatarioId: USUARIO_DENTISTA,
        tipo: "paciente_aguardando",
        referenciaId: AGENDAMENTO,
        mensagem: "Paciente aguardando atendimento",
        urgencia: "normal",
        lida: false,
        resolvida: false,
      }),
    ]);
  });

  it("dado um agendamento agendado, quando o dentista inicia sem marcar chegada, então o status vira iniciado e não nasce paciente_aguardando", async () => {
    const resultado = await iniciarAtendimento(
      cenario.agenda(),
      sessao("dentista", USUARIO_DENTISTA),
      AGENDAMENTO,
    );

    expect(resultado.ok).toBe(true);
    expect(cenario.agendamentos.get(AGENDAMENTO)?.status).toBe("iniciado");
    expect(cenario.notificacoes.linhas).toEqual([]);
  });

  it("dado um agendamento em_espera, quando o dentista inicia, então continua aceitando e vira iniciado", async () => {
    await marcarChegada(cenario.agenda(), sessao("recepcionista"), AGENDAMENTO);

    const resultado = await iniciarAtendimento(
      cenario.agenda(),
      sessao("dentista", USUARIO_DENTISTA),
      AGENDAMENTO,
    );

    expect(resultado.ok).toBe(true);
    expect(cenario.agendamentos.get(AGENDAMENTO)?.status).toBe("iniciado");
  });

  it("dado um usuário inativo, quando marca a chegada, então recebe bloqueio de papel e nada muda", async () => {
    const resultado = await marcarChegada(
      cenario.agenda(),
      sessao("recepcionista", "ator-recepcionista", false),
      AGENDAMENTO,
    );

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
    expect(cenario.agendamentos.get(AGENDAMENTO)?.status).toBe("agendado");
    expect(cenario.notificacoes.linhas).toEqual([]);
  });

  it("dado um agendamento já em_espera, quando marca a chegada de novo, então devolve não encontrado e não duplica a notificação", async () => {
    await marcarChegada(cenario.agenda(), sessao("recepcionista"), AGENDAMENTO);

    const segunda = await marcarChegada(cenario.agenda(), sessao("recepcionista"), AGENDAMENTO);

    expect(segunda.ok).toBe(false);
    expect(cenario.notificacoes.linhas).toHaveLength(1);
  });

  it("dado um agendamento de outra clínica, quando marca a chegada, então devolve não encontrado e nada muda", async () => {
    cenario.semearAgendamento({ clinicaId: "clinica-002" });

    const resultado = await marcarChegada(cenario.agenda(), sessao("admin"), AGENDAMENTO);

    expect(resultado.ok).toBe(false);
    expect(cenario.agendamentos.get(AGENDAMENTO)?.status).toBe("agendado");
    expect(cenario.notificacoes.linhas).toEqual([]);
  });
});

describe("cancelamento a comunicar", () => {
  let cenario: Cenario;

  beforeEach(() => {
    cenario = new Cenario();
    cenario.semearAgendamento();
  });

  it("dado duas recepcionistas, quando cancela, então as duas recebem cancelamento_comunicar e o admin não", async () => {
    await cancelarAgendamento(cenario.agenda(), sessao("recepcionista"), AGENDAMENTO, MOTIVO, AGORA, false);

    const linhas = cenario.notificacoes.linhas;
    expect(linhas.map((item) => item.destinatarioId).sort()).toEqual([RECEPCAO_ANA, RECEPCAO_BIA]);
    expect(linhas.every((item) => item.tipo === "cancelamento_comunicar")).toBe(true);
    expect(linhas.every((item) => item.urgencia === "normal")).toBe(true);
    expect(linhas[0].mensagem).toBe("Comunicar o paciente sobre o cancelamento");
    expect(linhas[0].referenciaId).toBe(AGENDAMENTO);
    expect(cenario.notificacoes.doDestinatario(USUARIO_ADMIN)).toEqual([]);
  });

  it("dado nenhuma recepcionista, quando cancela, então o admin recebe", async () => {
    cenario.notificacoes.usuarios = [ADMIN, DENTISTA];

    await cancelarAgendamento(cenario.agenda(), sessao("admin"), AGENDAMENTO, MOTIVO, AGORA, false);

    expect(cenario.notificacoes.linhas.map((item) => item.destinatarioId)).toEqual([USUARIO_ADMIN]);
  });
});

describe("retorno a reagendar", () => {
  let cenario: Cenario;
  const hoje = new Date(2026, 10, 24);

  beforeEach(() => {
    cenario = new Cenario();
    cenario.semearRetorno();
  });

  it("dado um retorno no prazo, quando a verificação roda, então as recepcionistas recebem retorno_reagendar crítico com o texto do aviso", async () => {
    await verificarRetornos(cenario.retorno(), hoje);

    const linhas = cenario.notificacoes.linhas;
    expect(linhas.map((item) => item.destinatarioId).sort()).toEqual([RECEPCAO_ANA, RECEPCAO_BIA]);
    expect(linhas[0]).toMatchObject({
      tipo: "retorno_reagendar",
      urgencia: "critica",
      referenciaId: "retorno-001",
      mensagem: "Paciente João precisa ser reagendado",
    });
  });

  it("dado um retorno crítico, quando a recepcionista marca como lida, então continua visível e some só quando o retorno fica reagendado", async () => {
    const deps = cenario.retorno();
    await verificarRetornos(deps, hoje);
    await marcarLida(deps.notificacoes, RECEPCAO_ANA, "notificacao-1", CLINICA_ID);

    const depoisDeLida = await listarVisiveis(deps.notificacoes, CLINICA_ID, RECEPCAO_ANA);
    expect(depoisDeLida).toHaveLength(1);
    expect(depoisDeLida[0]).toMatchObject({ lida: true, resolvida: false });

    await reagendarPorNovoAgendamento(deps, CLINICA_ID, PACIENTE_JOAO);

    expect(cenario.retornos.get("retorno-001")?.status).toBe("reagendado");
    expect(await listarVisiveis(deps.notificacoes, CLINICA_ID, RECEPCAO_ANA)).toEqual([]);
    expect(await listarVisiveis(deps.notificacoes, CLINICA_ID, RECEPCAO_BIA)).toEqual([]);
    expect(cenario.notificacoes.linhas).toHaveLength(2);
    expect(cenario.notificacoes.linhas.every((item) => item.resolvida)).toBe(true);
  });
});

describe("caixa de notificações", () => {
  let cenario: Cenario;

  beforeEach(() => {
    cenario = new Cenario();
  });

  it("dado uma notificação normal, quando é marcada como lida, então sai da lista", async () => {
    const deps = cenario.notificacoes.deps();
    cenario.notificacoes.linhas = [aberta({ urgencia: "normal" })];

    await marcarLida(deps, RECEPCAO_ANA, "n-1", CLINICA_ID);

    expect(await listarVisiveis(deps, CLINICA_ID, RECEPCAO_ANA)).toEqual([]);
  });

  it("dado uma notificação crítica, quando é marcada como lida, então permanece na lista", async () => {
    const deps = cenario.notificacoes.deps();
    cenario.notificacoes.linhas = [aberta({ tipo: "estoque_abaixo_minimo", urgencia: "critica" })];

    await marcarLida(deps, RECEPCAO_ANA, "n-1", CLINICA_ID);

    const visiveis = await listarVisiveis(deps, CLINICA_ID, RECEPCAO_ANA);
    expect(visiveis).toHaveLength(1);
    expect(visiveis[0].lida).toBe(true);
  });

  it("dado a notificação de outro destinatário, quando marca como lida, então nada muda", async () => {
    const deps = cenario.notificacoes.deps();
    cenario.notificacoes.linhas = [aberta({})];

    await marcarLida(deps, RECEPCAO_BIA, "n-1", CLINICA_ID);

    expect(cenario.notificacoes.linhas[0].lida).toBe(false);
  });

  it("dado uma notificação de outra clínica, quando lista, então não aparece", async () => {
    const deps = cenario.notificacoes.deps();
    cenario.notificacoes.linhas = [aberta({ clinicaId: "clinica-002" })];

    expect(await listarVisiveis(deps, CLINICA_ID, RECEPCAO_ANA)).toEqual([]);
  });

  it("dado uma notificação aberta do mesmo destinatário, tipo e referência, quando publica de novo, então não duplica", async () => {
    const deps = cenario.notificacoes.deps();
    const pedido = {
      clinicaId: CLINICA_ID,
      tipo: "estoque_abaixo_minimo" as const,
      referenciaId: "material-1",
      mensagem: "Resina Composta abaixo do mínimo",
      destinatarioIds: [RECEPCAO_ANA],
    };

    await publicar(deps, pedido);
    await publicar(deps, pedido);

    expect(cenario.notificacoes.linhas).toHaveLength(1);
    expect(cenario.notificacoes.linhas[0]).toMatchObject({ urgencia: "critica", lida: false });
  });

  it("dado uma notificação resolvida, quando a situação volta e publica de novo, então nasce uma nova", async () => {
    const deps = cenario.notificacoes.deps();
    const pedido = {
      clinicaId: CLINICA_ID,
      tipo: "estoque_abaixo_minimo" as const,
      referenciaId: "material-1",
      mensagem: "Resina Composta abaixo do mínimo",
      destinatarioIds: [RECEPCAO_ANA],
    };

    await publicar(deps, pedido);
    await resolver(deps, CLINICA_ID, "estoque_abaixo_minimo", "material-1");
    await publicar(deps, pedido);

    expect(cenario.notificacoes.linhas).toHaveLength(2);
  });

  it("dado nenhum destinatário, quando publica, então não grava", async () => {
    await publicar(cenario.notificacoes.deps(), {
      clinicaId: CLINICA_ID,
      tipo: "paciente_aguardando",
      referenciaId: AGENDAMENTO,
      mensagem: "Paciente aguardando atendimento",
      destinatarioIds: [],
    });

    expect(cenario.notificacoes.linhas).toEqual([]);
  });

  it("dado uma falha definitiva de envio, quando registra, então as recepcionistas recebem falha_envio_mensagem crítica", async () => {
    await registrarFalhaEnvio(cenario.notificacoes.deps(), CLINICA_ID, "mensagem-1", "Falha ao enviar lembrete");

    expect(cenario.notificacoes.linhas.map((item) => item.destinatarioId).sort()).toEqual([
      RECEPCAO_ANA,
      RECEPCAO_BIA,
    ]);
    expect(cenario.notificacoes.linhas[0]).toMatchObject({
      tipo: "falha_envio_mensagem",
      urgencia: "critica",
    });
  });
});

describe("regras de notificação", () => {
  it("dado cada tipo, quando consulta a urgência, então só paciente_aguardando e cancelamento_comunicar são normais", () => {
    expect(urgenciaDe("paciente_aguardando")).toBe("normal");
    expect(urgenciaDe("cancelamento_comunicar")).toBe("normal");
    for (const tipo of [
      "retorno_reagendar",
      "estoque_abaixo_minimo",
      "estoque_baixa_insuficiente",
      "cadeira_indisponivel",
      "fora_de_horario",
      "dentista_removido",
      "falha_envio_mensagem",
      "atraso_protese",
    ] as const) {
      expect(urgenciaDe(tipo)).toBe("critica");
    }
  });

  it("dado uma recepcionista inativa, quando resolve o destino, então ela fica de fora e o admin só entra sem recepcionista ativa", () => {
    const inativa: UsuarioAtivo = { ...ANA, ativo: false };

    expect(destinatarios([ADMIN, inativa, BIA], "retorno_reagendar")).toEqual([RECEPCAO_BIA]);
    expect(destinatarios([ADMIN, inativa], "retorno_reagendar")).toEqual([USUARIO_ADMIN]);
  });

  it("dado um alerta operacional, quando resolve o destino, então vão todos os usuários ativos da clínica", () => {
    const inativo: UsuarioAtivo = { id: "usuario-x", papel: "dentista", ativo: false };

    expect(destinatarios([ADMIN, DENTISTA, ANA, inativo], "estoque_abaixo_minimo")).toEqual([
      USUARIO_ADMIN,
      USUARIO_DENTISTA,
      RECEPCAO_ANA,
    ]);
  });

  it("dado paciente_aguardando, quando resolve o destino, então vai só ao dentista informado ou a ninguém", () => {
    expect(destinatarios([ADMIN, DENTISTA, ANA], "paciente_aguardando", USUARIO_DENTISTA)).toEqual([
      USUARIO_DENTISTA,
    ]);
    expect(destinatarios([ADMIN, DENTISTA, ANA], "paciente_aguardando")).toEqual([]);
  });

  it.todo("Feature 019: widget do dashboard");
  it.todo("Feature 020: chamar registrarFalhaEnvio");
});
