import type { Dependencias } from "../../domain/mensagem/portas";
import type {
  MensagemExterna,
  ModeloMensagem,
  StatusEnvio,
  TipoMensagem,
} from "../../domain/mensagem/tipos";
import { createAdminClient } from "../supabase/admin";
import { ErroAplicacao } from "../supabase/erro";

type LinhaMensagem = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  agendamento_id: string;
  tipo: string;
  canal: string;
  contato: string;
  texto: string;
  status: string;
  tentativas: number;
  programado_para: string;
  enviado_em: string | null;
};

type LinhaModelo = {
  clinica_id: string;
  tipo: string;
  conteudo: string;
};

function paraMensagem(linha: LinhaMensagem): MensagemExterna {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    agendamentoId: linha.agendamento_id,
    tipo: linha.tipo as TipoMensagem,
    canal: linha.canal as MensagemExterna["canal"],
    contato: linha.contato,
    texto: linha.texto,
    status: linha.status as StatusEnvio,
    tentativas: linha.tentativas,
    programadoPara: new Date(linha.programado_para).toISOString(),
    enviadoEm: linha.enviado_em === null ? null : new Date(linha.enviado_em).toISOString(),
  };
}

function paraLinhaMensagem(mensagem: MensagemExterna): LinhaMensagem {
  return {
    id: mensagem.id,
    clinica_id: mensagem.clinicaId,
    paciente_id: mensagem.pacienteId,
    agendamento_id: mensagem.agendamentoId,
    tipo: mensagem.tipo,
    canal: mensagem.canal,
    contato: mensagem.contato,
    texto: mensagem.texto,
    status: mensagem.status,
    tentativas: mensagem.tentativas,
    programado_para: mensagem.programadoPara,
    enviado_em: mensagem.enviadoEm,
  };
}

function paraModelo(linha: LinhaModelo): ModeloMensagem {
  return {
    clinicaId: linha.clinica_id,
    tipo: linha.tipo as TipoMensagem,
    conteudo: linha.conteudo,
  };
}

function paraLinhaModelo(modelo: ModeloMensagem): LinhaModelo {
  return {
    clinica_id: modelo.clinicaId,
    tipo: modelo.tipo,
    conteudo: modelo.conteudo,
  };
}

export function criarMensagens(): Dependencias["mensagens"] {
  const admin = createAdminClient();

  return {
    async listarDaClinica(clinicaId) {
      const { data, error } = await admin
        .from("mensagens_externas")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar as mensagens", error);
      return (data as LinhaMensagem[]).map(paraMensagem);
    },

    async salvar(mensagem) {
      const { error } = await admin
        .from("mensagens_externas")
        .upsert(paraLinhaMensagem(mensagem), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar a mensagem", error);
    },
  };
}

export function criarModelosMensagem(): Dependencias["modelos"] {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("modelos_mensagem")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os modelos", error);
      return (data as LinhaModelo[]).map(paraModelo);
    },

    async salvar(modelo) {
      const { error } = await admin
        .from("modelos_mensagem")
        .upsert(paraLinhaModelo(modelo), { onConflict: "clinica_id,tipo" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o modelo", error);
    },
  };
}

export function criarEnviador(): Dependencias["enviador"] {
  return {
    async enviar() {
      return { ok: true };
    },
  };
}
