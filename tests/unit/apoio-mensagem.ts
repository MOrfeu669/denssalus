import type { Dependencias as DependenciasAgenda } from "../../src/domain/agendamento/portas";
import type { Agendamento, EntradaAgendamento } from "../../src/domain/agendamento/tipos";
import type { Papel, Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import type { Dependencias, PedidoEnvio } from "../../src/domain/mensagem/portas";
import type { MensagemExterna, ModeloMensagem } from "../../src/domain/mensagem/tipos";
import type { CanalComunicacao, Paciente } from "../../src/domain/paciente/tipos";
import { NotificacoesMemoria } from "./apoio-notificacao";

export const CLINICA = "clinica-001";
export const OUTRA = "clinica-002";
export const PACIENTE = "paciente-joao";
const INICIO = "2026-10-15T14:00";
const FIM = "2026-10-15T14:30";
export const CRIACAO = new Date(2026, 9, 14, 10, 0);
export const MENOS_24H = new Date(2026, 9, 14, 14, 0);
export const MENOS_5H = new Date(2026, 9, 15, 9, 0);
export const DUAS_HORAS = new Date(2026, 9, 14, 12, 0);
export const TEXTO_CONFIRMACAO = "Você foi agendado para uma consulta dia 15/10 às 14:00";

export const WHATSAPP: CanalComunicacao = {
  canal: "whatsapp",
  contato: "11 98888-0000",
  preferido: true,
};
export const SMS: CanalComunicacao = { canal: "sms", contato: "11 97777-0001", preferido: false };
export const SMS_PREF: CanalComunicacao = { canal: "sms", contato: "11 97777-0001", preferido: true };
export const EMAIL: CanalComunicacao = {
  canal: "email",
  contato: "joao.souza@exemplo.com",
  preferido: false,
};

export const ENTRADA: EntradaAgendamento = {
  pacienteId: PACIENTE,
  dentistaId: "dentista-1",
  cadeiraId: "cadeira-1",
  procedimentoId: null,
  inicio: INICIO,
  fim: FIM,
};

export class Memoria {
  mensagens: MensagemExterna[] = [];
  modelos: ModeloMensagem[] = [];
  pacientes = new Map<string, Paciente>();
  agendamentos = new Map<string, Agendamento>();
  pedidos: PedidoEnvio[] = [];
  respostas: Array<"ok" | "falha" | "erro"> = [];
  notificacoes = new NotificacoesMemoria();
  proximo = 0;
  falhaPaciente = false;

  deps(): Dependencias {
    return {
      mensagens: {
        listarDaClinica: async (clinicaId) =>
          this.mensagens.filter((item) => item.clinicaId === clinicaId),
        salvar: async (mensagem) => {
          const indice = this.mensagens.findIndex((item) => item.id === mensagem.id);
          if (indice >= 0) this.mensagens[indice] = mensagem;
          else this.mensagens.push(mensagem);
        },
      },
      modelos: {
        listar: async (clinicaId) => this.modelos.filter((item) => item.clinicaId === clinicaId),
        salvar: async (modelo) => {
          const indice = this.modelos.findIndex(
            (item) => item.clinicaId === modelo.clinicaId && item.tipo === modelo.tipo,
          );
          if (indice >= 0) this.modelos[indice] = modelo;
          else this.modelos.push(modelo);
        },
      },
      pacientes: {
        buscarPorId: async (id) => {
          if (this.falhaPaciente) throw new Error("banco indisponível");
          return this.pacientes.get(id) ?? null;
        },
      },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      notificacoes: this.notificacoes.deps(),
      enviador: {
        enviar: async (pedido) => {
          this.pedidos.push(pedido);
          const resposta = this.respostas.shift() ?? "ok";
          if (resposta === "erro") throw new Error("falha de envio");
          return resposta === "falha" ? { ok: false } : { ok: true };
        },
      },
      ids: { novo: () => `msg-${++this.proximo}` },
    };
  }

  depsAgenda(
    notificar: DependenciasAgenda["notificarAgendamentoCriado"] = async () => {},
  ): DependenciasAgenda {
    const clinica: Clinica = {
      id: CLINICA,
      nome: "Clínica OdontoSmile",
      adminId: "ator-admin",
      diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    };
    return {
      avisos: { avisarRecepcionista: async () => {} },
      notificacoes: this.notificacoes.deps(),
      retornos: { concluirPendentes: async () => {} },
      reverterDoAgendamento: async () => ({ ok: true, valor: undefined }),
      notificarAgendamentoCriado: notificar,
      agendamentos: {
        listar: async (clinicaId) =>
          [...this.agendamentos.values()].filter((item) => item.clinicaId === clinicaId),
        listarEntre: async () => [],
        buscarPorId: async (id) => this.agendamentos.get(id) ?? null,
        salvar: async (agendamento) => {
          this.agendamentos.set(agendamento.id, agendamento);
          return null;
        },
      },
      bloqueios: { listar: async () => [], listarEntre: async () => [], salvar: async () => {} },
      clinicas: { buscarPorId: async (id) => (id === CLINICA ? clinica : null) },
      cadeiras: {
        listar: async (clinicaId) => [
          { id: "cadeira-1", clinicaId, identificacao: "Cadeira 1", ativa: true },
        ],
      },
      dentistas: {
        listar: async () => [],
        buscarPorId: async (id) =>
          id === "dentista-1"
            ? {
                id,
                clinicaId: CLINICA,
                usuarioId: "ator-dentista",
                nome: "Dr. Carlos",
                cro: "CRO-SP 12345",
                telefone: "11 98888-0000",
                cpf: "123.456.789-09",
                especialidades: [],
                ativo: true,
              }
            : null,
      },
      pacientes: {
        listar: async () => [...this.pacientes.values()],
        buscarPorId: async (id) => this.pacientes.get(id) ?? null,
      },
      procedimentos: { listar: async () => [], buscarPorId: async () => null },
      ids: { novo: () => `ag-novo-${++this.proximo}` },
    };
  }
}

export function sessao(papel: Papel, ativo = true, clinicaId = CLINICA): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId,
      ativo,
    },
  };
}

export function consulta(parcial: Partial<Agendamento> = {}): Agendamento {
  return {
    id: "ag-1",
    clinicaId: CLINICA,
    pacienteId: PACIENTE,
    dentistaId: "dentista-1",
    cadeiraId: "cadeira-1",
    procedimentoId: null,
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
}

export function paciente(canais: CanalComunicacao[], clinicaId = CLINICA): Paciente {
  return {
    id: PACIENTE,
    clinicaId,
    nome: "João Souza",
    canais,
    cpf: null,
    endereco: null,
    dataNascimento: null,
    sexo: null,
    responsavel: null,
  };
}

export function pendente(parcial: Partial<MensagemExterna> = {}): MensagemExterna {
  return {
    id: "msg-1",
    clinicaId: CLINICA,
    pacienteId: PACIENTE,
    agendamentoId: "ag-1",
    tipo: "lembrete_24h",
    canal: "whatsapp",
    contato: "11 98888-0000",
    texto: "Você tem uma consulta marcada",
    status: "pendente",
    tentativas: 0,
    programadoPara: MENOS_24H.toISOString(),
    enviadoEm: null,
    ...parcial,
  };
}

export function preparar(
  memoria: Memoria,
  canais: CanalComunicacao[],
  parcial: Partial<Agendamento> = {},
) {
  const agendamento = consulta(parcial);
  memoria.pacientes.set(PACIENTE, paciente(canais, agendamento.clinicaId));
  memoria.agendamentos.set(agendamento.id, agendamento);
  return agendamento;
}
