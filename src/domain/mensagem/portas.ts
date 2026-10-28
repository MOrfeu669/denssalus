import type { Agendamentos } from "../agendamento/portas";
import type { Dependencias as DependenciasNotificacao } from "../notificacao/portas";
import type { Pacientes } from "../paciente/portas";
import type { CanalMensagem, MensagemExterna, ModeloMensagem } from "./tipos";

export type PedidoEnvio = {
  canal: CanalMensagem;
  contato: string;
  texto: string;
};

export type Enviador = {
  enviar(pedido: PedidoEnvio): Promise<{ ok: true } | { ok: false }>;
};

export type Mensagens = {
  listarDaClinica(clinicaId: string): Promise<MensagemExterna[]>;
  salvar(mensagem: MensagemExterna): Promise<void>;
};

export type ModelosMensagem = {
  listar(clinicaId: string): Promise<ModeloMensagem[]>;
  salvar(modelo: ModeloMensagem): Promise<void>;
};

export type Dependencias = {
  mensagens: Mensagens;
  modelos: ModelosMensagem;
  pacientes: Pick<Pacientes, "buscarPorId">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  notificacoes: DependenciasNotificacao;
  enviador: Enviador;
  ids: { novo(): string };
};
