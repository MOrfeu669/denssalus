import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_PAPEL, type Papel, type Sessao, type Usuario } from "../../src/domain/auth/tipos";
import {
  adicionarCadeira,
  configurarFuncionamento,
  criarClinica,
  desativarCadeira,
  obterClinica,
} from "../../src/domain/clinica/casos";
import type { Dependencias } from "../../src/domain/clinica/portas";
import { bloqueiaNovoAgendamento } from "../../src/domain/clinica/regras";
import {
  MENSAGEM_CADEIRA_NAO_ENCONTRADA,
  MENSAGEM_JA_TEM_CLINICA,
  type AgendamentoFuturo,
  type Cadeira,
  type Clinica,
  type Dia,
} from "../../src/domain/clinica/tipos";

const SEGUNDA_A_SABADO: Dia[] = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const AGORA = new Date("2026-10-25T12:00:00");

type Registro = AgendamentoFuturo & { status: string };

class Memoria {
  clinicas = new Map<string, Clinica>();
  cadeiras = new Map<string, Cadeira>();
  usuarios = new Map<string, Usuario>();
  agendamentos = new Map<string, Registro>();
  falhaNaCadeira: number | null = null;
  gravacoesDeCadeira = 0;
  proximoId = 0;

  deps(): Dependencias {
    return {
      clinicas: {
        buscarPorAdmin: async (adminId) =>
          [...this.clinicas.values()].find((item) => item.adminId === adminId) ?? null,
        salvar: async (clinica) => {
          this.clinicas.set(clinica.id, clinica);
        },
        remover: async (id) => {
          this.clinicas.delete(id);
        },
      },
      cadeiras: {
        listar: async (clinicaId) =>
          [...this.cadeiras.values()].filter((item) => item.clinicaId === clinicaId),
        salvar: async (cadeira) => {
          this.gravacoesDeCadeira += 1;
          if (this.falhaNaCadeira === this.gravacoesDeCadeira) throw new Error("falha ao gravar");
          this.cadeiras.set(cadeira.id, cadeira);
        },
        removerDaClinica: async (clinicaId) => {
          for (const [id, cadeira] of this.cadeiras) {
            if (cadeira.clinicaId === clinicaId) this.cadeiras.delete(id);
          }
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
          for (const item of itens) {
            const atual = this.agendamentos.get(item.id);
            if (atual) this.agendamentos.set(item.id, { ...atual, ...item });
          }
        },
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
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  agendar(parcial: Partial<Registro> & Pick<Registro, "id" | "inicio" | "fim">): void {
    this.agendamentos.set(parcial.id, {
      clinicaId: "id-1",
      cadeiraId: "id-3",
      alertaCadeira: false,
      alertaHorario: false,
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
      clinicaId: "clinica-001",
      ativo: true,
    },
  };
}

describe("criar e configurar clínica", () => {
  let memoria: Memoria;
  const admin = sessao("admin");

  beforeEach(() => {
    memoria = new Memoria();
    memoria.usuarios.set(admin.usuario.id, admin.usuario);
  });

  async function criarComTresCadeiras() {
    const resultado = await criarClinica(memoria.deps(), admin, {
      nome: "Clínica OdontoSmile",
      diasAtendimento: SEGUNDA_A_SABADO,
      cadeiras: 3,
    });
    if (!resultado.ok) throw new Error(resultado.mensagem);
    return resultado.valor;
  }

  it("dado um admin sem clínica, quando cria sem alterar o horário sugerido, então grava 08:00-18:00", async () => {
    const resultado = await criarClinica(memoria.deps(), admin, {
      nome: "Clínica OdontoSmile",
      diasAtendimento: ["segunda", "terca"],
      cadeiras: 1,
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.clinica.horarioAbertura).toBe("08:00");
    expect(resultado.valor.clinica.horarioFechamento).toBe("18:00");
    expect(resultado.valor.clinica.adminId).toBe(admin.usuario.id);
    expect(memoria.usuarios.get(admin.usuario.id)?.clinicaId).toBe(resultado.valor.clinica.id);
  });

  it("dado um admin criando a clínica, quando seleciona segunda a sábado com 08:00-18:00, então salva esse horário único para os dias", async () => {
    const { clinica } = await criarComTresCadeiras();

    const salva = memoria.clinicas.get(clinica.id);
    expect(salva?.diasAtendimento).toEqual(SEGUNDA_A_SABADO);
    expect(salva?.horarioAbertura).toBe("08:00");
    expect(salva?.horarioFechamento).toBe("18:00");
  });

  it("dado um admin criando a clínica, quando informa 3 cadeiras, então cria Cadeira 1 a Cadeira 3 sem restrição de procedimento", async () => {
    const { clinica, cadeiras } = await criarComTresCadeiras();

    expect(cadeiras.map((item) => item.identificacao)).toEqual(["Cadeira 1", "Cadeira 2", "Cadeira 3"]);
    for (const cadeira of cadeiras) {
      expect(cadeira.clinicaId).toBe(clinica.id);
      expect(cadeira.ativa).toBe(true);
      expect(Object.keys(cadeira).sort()).toEqual(["ativa", "clinicaId", "id", "identificacao"]);
    }
  });

  it("dado uma clínica com 3 cadeiras, quando o admin adiciona uma nova, então ficam 4 ativas", async () => {
    const { clinica } = await criarComTresCadeiras();

    const nova = await adicionarCadeira(memoria.deps(), admin);

    expect(nova.ok).toBe(true);
    if (!nova.ok) return;
    expect(nova.valor.identificacao).toBe("Cadeira 4");
    const detalhe = await obterClinica(memoria.deps(), admin);
    expect(detalhe.ok && detalhe.valor?.clinica.id).toBe(clinica.id);
    expect(detalhe.ok && detalhe.valor?.cadeiras.filter((item) => item.ativa)).toHaveLength(4);
  });

  it("dado uma admin que já tem clínica, quando cria outra, então o segundo cadastro falha", async () => {
    await criarComTresCadeiras();

    const segunda = await criarClinica(memoria.deps(), admin, {
      nome: "Outra clínica",
      diasAtendimento: ["segunda"],
      cadeiras: 1,
    });

    expect(segunda).toEqual({ ok: false, mensagem: MENSAGEM_JA_TEM_CLINICA });
    expect(memoria.clinicas.size).toBe(1);
  });

  it("dado uma falha ao gravar a segunda cadeira, quando cria a clínica, então remove cadeiras e clínica já gravadas", async () => {
    memoria.falhaNaCadeira = 2;

    await expect(
      criarClinica(memoria.deps(), admin, {
        nome: "Clínica OdontoSmile",
        diasAtendimento: ["segunda"],
        cadeiras: 3,
      }),
    ).rejects.toThrow("falha ao gravar");

    expect(memoria.clinicas.size).toBe(0);
    expect(memoria.cadeiras.size).toBe(0);
    expect(memoria.usuarios.get(admin.usuario.id)?.clinicaId).toBe("clinica-001");
  });

  it.each(["dentista", "recepcionista"] as const)(
    "dado um %s, quando tenta configurar a clínica, então recebe a mensagem de papel",
    async (papel) => {
      const ator = sessao(papel);
      const deps = memoria.deps();

      const resultados = [
        await criarClinica(deps, ator, { nome: "X", diasAtendimento: ["segunda"], cadeiras: 1 }),
        await obterClinica(deps, ator),
        await configurarFuncionamento(
          deps,
          ator,
          { diasAtendimento: ["segunda"], horarioAbertura: "08:00", horarioFechamento: "18:00" },
          AGORA,
        ),
        await adicionarCadeira(deps, ator),
        await desativarCadeira(deps, ator, "id-3", AGORA),
      ];

      for (const resultado of resultados) {
        expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      }
      expect(memoria.clinicas.size).toBe(0);
    },
  );

  it("dado a Cadeira 2 com agendamentos futuros, quando o admin a desativa, então só os agendados dela ganham alertaCadeira e o status não muda", async () => {
    const { cadeiras } = await criarComTresCadeiras();
    const [, cadeira2, cadeira3] = cadeiras;
    memoria.agendar({ id: "a1", cadeiraId: cadeira2.id, inicio: "2026-10-26T10:00:00", fim: "2026-10-26T10:30:00" });
    memoria.agendar({ id: "a2", cadeiraId: cadeira3.id, inicio: "2026-10-26T10:00:00", fim: "2026-10-26T10:30:00" });
    memoria.agendar({ id: "a3", cadeiraId: cadeira2.id, inicio: "2026-10-20T10:00:00", fim: "2026-10-20T10:30:00" });
    memoria.agendar({
      id: "a4",
      cadeiraId: cadeira2.id,
      inicio: "2026-10-27T10:00:00",
      fim: "2026-10-27T10:30:00",
      status: "cancelado",
    });

    const resultado = await desativarCadeira(memoria.deps(), admin, cadeira2.id, AGORA);

    expect(resultado.ok && resultado.valor.ativa).toBe(false);
    expect(memoria.cadeiras.get(cadeira2.id)?.ativa).toBe(false);
    expect(memoria.agendamentos.get("a1")).toMatchObject({ alertaCadeira: true, status: "agendado" });
    expect(memoria.agendamentos.get("a2")?.alertaCadeira).toBe(false);
    expect(memoria.agendamentos.get("a3")?.alertaCadeira).toBe(false);
    expect(memoria.agendamentos.get("a4")?.alertaCadeira).toBe(false);
  });

  it("dado uma cadeira desativada, quando um novo agendamento a escolhe, então bloqueiaNovoAgendamento recusa", async () => {
    const { clinica, cadeiras } = await criarComTresCadeiras();
    const horario = ["2026-10-26T10:00:00", "2026-10-26T10:30:00"] as const;

    expect(bloqueiaNovoAgendamento(clinica, cadeiras[1], ...horario)).toBe(false);

    const inativa = await desativarCadeira(memoria.deps(), admin, cadeiras[1].id, AGORA);
    if (!inativa.ok) throw new Error(inativa.mensagem);

    expect(bloqueiaNovoAgendamento(clinica, inativa.valor, ...horario)).toBe(true);
  });

  it("dado uma cadeira de outra clínica, quando o admin tenta desativá-la, então a cadeira não é encontrada", async () => {
    await criarComTresCadeiras();
    memoria.cadeiras.set("alheia", {
      id: "alheia",
      clinicaId: "outra-clinica",
      identificacao: "Cadeira 1",
      ativa: true,
    });

    const resultado = await desativarCadeira(memoria.deps(), admin, "alheia", AGORA);

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CADEIRA_NAO_ENCONTRADA });
    expect(memoria.cadeiras.get("alheia")?.ativa).toBe(true);
  });

  it("dado um agendamento às 17:30, quando o fechamento vai para 17:00, então ganha alertaHorario sem ser cancelado, e voltar o horário limpa o alerta", async () => {
    const { clinica } = await criarComTresCadeiras();
    memoria.agendar({ id: "tarde", inicio: "2026-10-26T17:30:00", fim: "2026-10-26T18:00:00" });
    memoria.agendar({ id: "manha", inicio: "2026-10-26T09:00:00", fim: "2026-10-26T09:30:00" });

    const restrito = await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: SEGUNDA_A_SABADO, horarioAbertura: "08:00", horarioFechamento: "17:00" },
      AGORA,
    );

    expect(restrito.ok).toBe(true);
    expect(memoria.clinicas.get(clinica.id)?.horarioFechamento).toBe("17:00");
    expect(memoria.agendamentos.get("tarde")).toMatchObject({ alertaHorario: true, status: "agendado" });
    expect(memoria.agendamentos.get("manha")?.alertaHorario).toBe(false);

    await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: SEGUNDA_A_SABADO, horarioAbertura: "08:00", horarioFechamento: "18:00" },
      AGORA,
    );

    expect(memoria.agendamentos.get("tarde")).toMatchObject({ alertaHorario: false, status: "agendado" });
  });

  it("dado um agendamento num domingo, quando o admin tira o domingo dos dias de atendimento, então ganha alertaHorario", async () => {
    await criarComTresCadeiras();
    memoria.agendar({ id: "domingo", inicio: "2026-11-01T10:00:00", fim: "2026-11-01T10:30:00" });

    await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: ["segunda", "domingo"], horarioAbertura: "08:00", horarioFechamento: "18:00" },
      AGORA,
    );
    expect(memoria.agendamentos.get("domingo")?.alertaHorario).toBe(false);

    await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: SEGUNDA_A_SABADO, horarioAbertura: "08:00", horarioFechamento: "18:00" },
      AGORA,
    );
    expect(memoria.agendamentos.get("domingo")?.alertaHorario).toBe(true);
  });

  it("dado cadeira desativada e horário fora, quando o horário volta ao normal, então alertaCadeira permanece e só alertaHorario limpa", async () => {
    const { cadeiras } = await criarComTresCadeiras();
    memoria.agendar({
      id: "duplo",
      cadeiraId: cadeiras[1].id,
      inicio: "2026-10-26T17:30:00",
      fim: "2026-10-26T18:00:00",
    });
    await desativarCadeira(memoria.deps(), admin, cadeiras[1].id, AGORA);
    await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: SEGUNDA_A_SABADO, horarioAbertura: "08:00", horarioFechamento: "17:00" },
      AGORA,
    );
    expect(memoria.agendamentos.get("duplo")).toMatchObject({ alertaCadeira: true, alertaHorario: true });

    await configurarFuncionamento(
      memoria.deps(),
      admin,
      { diasAtendimento: SEGUNDA_A_SABADO, horarioAbertura: "08:00", horarioFechamento: "18:00" },
      AGORA,
    );

    expect(memoria.agendamentos.get("duplo")).toMatchObject({ alertaCadeira: true, alertaHorario: false });
  });

  it("dado um horário de funcionamento, quando o intervalo sai do expediente ou cai em dia sem atendimento, então bloqueiaNovoAgendamento recusa", async () => {
    const { clinica, cadeiras } = await criarComTresCadeiras();
    const bloqueia = (inicio: string, fim: string) =>
      bloqueiaNovoAgendamento(clinica, cadeiras[0], inicio, fim);

    expect(bloqueia("2026-10-26T08:00:00", "2026-10-26T08:30:00")).toBe(false);
    expect(bloqueia("2026-10-26T17:30:00", "2026-10-26T18:00:00")).toBe(false);
    expect(bloqueia("2026-10-26T07:30:00", "2026-10-26T08:30:00")).toBe(true);
    expect(bloqueia("2026-10-26T17:30:00", "2026-10-26T18:30:00")).toBe(true);
    expect(bloqueia("2026-10-26T18:00:00", "2026-10-26T18:30:00")).toBe(true);
    expect(bloqueia("2026-11-01T10:00:00", "2026-11-01T10:30:00")).toBe(true);
  });

  it.todo("Feature 007: agendamento com alerta aparece destacado na agenda (cor diferente ou sinal '!')");
});
