import { criarGateway } from "../lib/supabase/gateway";
import { criarAgendaAlertas } from "../lib/supabase/agenda-alertas";
import { criarAgendaDentistas } from "../lib/supabase/agenda-dentistas";
import { criarAgendamentos } from "../lib/supabase/agendamentos";
import { criarAvisos } from "../lib/supabase/avisos";
import { criarBloqueios } from "../lib/supabase/bloqueios";
import { criarCadeiras, criarClinicas } from "../lib/supabase/clinicas";
import { criarDebitos } from "../lib/supabase/debitos";
import { criarDentistas } from "../lib/supabase/dentistas";
import { criarDocumentos } from "../lib/supabase/documentos";
import { criarEstoque } from "../lib/supabase/estoque";
import { criarImagens } from "../lib/supabase/imagens";
import { criarNotificacoes } from "../lib/supabase/notificacoes";
import { criarOdontograma } from "../lib/supabase/odontograma";
import { criarPacientes } from "../lib/supabase/pacientes";
import { criarPlanos } from "../lib/supabase/plano";
import { criarProcedimentos } from "../lib/supabase/procedimentos";
import { criarProntuario } from "../lib/supabase/prontuario";
import { criarProteses } from "../lib/supabase/proteses";
import { criarConfiguracoesRetorno, criarRetornos } from "../lib/supabase/retornos";
import { ErroAplicacao } from "../lib/supabase/erro";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias as DependenciasAgendamento } from "../domain/agendamento/portas";
import type { Dependencias } from "../domain/auth/portas";
import type { Dependencias as DependenciasClinica } from "../domain/clinica/portas";
import { gerarDebitosDoAtendimento as gerarDebitosDoAtendimentoCaso } from "../domain/debito/casos";
import type { Dependencias as DependenciasDebito } from "../domain/debito/portas";
import type { Dependencias as DependenciasDentista } from "../domain/dentista/portas";
import type { Dependencias as DependenciasDocumento } from "../domain/documento/portas";
import { baixarPorAtendimento } from "../domain/estoque/casos";
import type { Dependencias as DependenciasEstoque } from "../domain/estoque/portas";
import type { Dependencias as DependenciasImagem } from "../domain/imagem/portas";
import { publicar } from "../domain/notificacao/casos";
import type { Dependencias as DependenciasNotificacao } from "../domain/notificacao/portas";
import { destinatarios } from "../domain/notificacao/regras";
import type { TipoNotificacao } from "../domain/notificacao/tipos";
import { reverterDoAgendamento as reverterDoAgendamentoCaso } from "../domain/odontograma/casos";
import type { Dependencias as DependenciasOdontograma } from "../domain/odontograma/portas";
import type { Dependencias as DependenciasPaciente } from "../domain/paciente/portas";
import { concluirItensDoAgendamento as concluirItensDoAgendamentoCaso } from "../domain/plano/casos";
import type { Dependencias as DependenciasPlano } from "../domain/plano/portas";
import type { Dependencias as DependenciasProcedimento } from "../domain/procedimento/portas";
import type { Dependencias as DependenciasProntuario } from "../domain/prontuario/portas";
import type { Dependencias as DependenciasProtese } from "../domain/protese/portas";
import { reagendarPorNovoAgendamento } from "../domain/retorno/casos";
import type { Dependencias as DependenciasRetorno } from "../domain/retorno/portas";

export function dependencias(): Dependencias {
  return {
    auth: criarGateway(),
    usuarios: criarUsuarios(),
  };
}

export function dependenciasClinica(): DependenciasClinica {
  return {
    clinicas: criarClinicas(),
    cadeiras: criarCadeiras(),
    agenda: criarAgendaAlertas(),
    usuarios: criarUsuarios(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasDentista(): DependenciasDentista {
  return {
    dentistas: criarDentistas(),
    agenda: criarAgendaDentistas(),
    auth: criarGateway(),
    usuarios: criarUsuarios(),
    clinicas: criarClinicas(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasPaciente(): DependenciasPaciente {
  return {
    pacientes: criarPacientes(),
    clinicas: criarClinicas(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasProcedimento(): DependenciasProcedimento {
  return {
    procedimentos: criarProcedimentos(),
    clinicas: criarClinicas(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasNotificacao(): DependenciasNotificacao {
  const usuarios = criarUsuarios();
  return {
    notificacoes: criarNotificacoes(),
    usuarios: {
      async listarAtivos(clinicaId) {
        const todos = await usuarios.listarDaClinica(clinicaId);
        return todos
          .filter((usuario) => usuario.ativo)
          .map((usuario) => ({ id: usuario.id, papel: usuario.papel, ativo: usuario.ativo }));
      },
    },
    ids: { novo: () => crypto.randomUUID() },
    agora: () => new Date().toISOString(),
  };
}

async function publicarParaClinica(
  clinicaId: string,
  tipo: TipoNotificacao,
  referenciaId: string,
  mensagem: string,
): Promise<void> {
  const deps = dependenciasNotificacao();
  const ativos = await deps.usuarios.listarAtivos(clinicaId);
  await publicar(deps, {
    clinicaId,
    tipo,
    referenciaId,
    mensagem,
    destinatarioIds: destinatarios(ativos, tipo),
  });
}

export function dependenciasAgendamento(): DependenciasAgendamento {
  return {
    agendamentos: criarAgendamentos(),
    avisos: criarAvisos(),
    notificacoes: dependenciasNotificacao(),
    bloqueios: criarBloqueios(),
    clinicas: criarClinicas(),
    cadeiras: criarCadeiras(),
    dentistas: criarDentistas(),
    pacientes: criarPacientes(),
    procedimentos: criarProcedimentos(),
    retornos: {
      async concluirPendentes(clinicaId, pacienteId) {
        await reagendarPorNovoAgendamento(dependenciasRetorno(), clinicaId, pacienteId);
      },
    },
    reverterDoAgendamento: (clinicaId, agendamentoId, confirmouReversao) =>
      reverterDoAgendamentoCaso(
        dependenciasOdontograma(),
        clinicaId,
        agendamentoId,
        confirmouReversao,
      ),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasOdontograma(): DependenciasOdontograma {
  return {
    registros: criarOdontograma(),
    auditoria: criarProntuario().auditoria,
    pacientes: criarPacientes(),
    procedimentos: criarProcedimentos(),
    agendamentos: criarAgendamentos(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasPlano(): DependenciasPlano {
  const plano = criarPlanos();
  return {
    planos: plano.planos,
    itens: plano.itens,
    pacientes: criarPacientes(),
    procedimentos: criarProcedimentos(),
    agendamentos: criarAgendamentos(),
    registros: criarOdontograma(),
    auditoria: criarProntuario().auditoria,
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasDebito(): DependenciasDebito {
  const debitos = criarDebitos();
  return {
    debitos: debitos.debitos,
    pagamentos: debitos.pagamentos,
    itens: criarPlanos().itens,
    agendamentos: criarAgendamentos(),
    procedimentos: criarProcedimentos(),
    pacientes: criarPacientes(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasDocumento(): DependenciasDocumento {
  const documentos = criarDocumentos();
  return {
    modelos: documentos.modelos,
    documentos: documentos.documentos,
    importacoes: documentos.importacoes,
    pacientes: criarPacientes(),
    dentistas: criarDentistas(),
    auditoria: criarProntuario().auditoria,
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasImagem(): DependenciasImagem {
  const imagens = criarImagens();
  return {
    imagens: imagens.imagens,
    arquivos: imagens.arquivos,
    pacientes: criarPacientes(),
    agendamentos: criarAgendamentos(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function urlsImagem() {
  return criarImagens().arquivos;
}

export function dependenciasRetorno(): DependenciasRetorno {
  return {
    retornos: criarRetornos(),
    configuracoes: criarConfiguracoesRetorno(),
    agendamentos: criarAgendamentos(),
    pacientes: criarPacientes(),
    avisos: criarAvisos(),
    notificacoes: dependenciasNotificacao(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasProntuario(): DependenciasProntuario {
  const prontuario = criarProntuario();
  return {
    anamneses: prontuario.anamneses,
    evolucoes: prontuario.evolucoes,
    auditoria: prontuario.auditoria,
    estoque: {
      async baixar(agendamentoId, ajustes, usuarioId, agora) {
        await baixarPorAtendimento(
          dependenciasEstoque(),
          agendamentoId,
          ajustes,
          usuarioId,
          agora,
        );
      },
    },
    agendamentos: criarAgendamentos(),
    pacientes: criarPacientes(),
    concluirItensDoAgendamento: async (clinicaId, agendamentoId, ator, agora) => {
      const resultado = await concluirItensDoAgendamentoCaso(
        dependenciasPlano(),
        clinicaId,
        agendamentoId,
        ator,
        agora,
      );
      if (!resultado.ok) throw new ErroAplicacao(resultado.mensagem);
    },
    gerarDebitosDoAtendimento: async (_clinicaId, agendamentoId, ator) => {
      const resultado = await gerarDebitosDoAtendimentoCaso(
        dependenciasDebito(),
        ator,
        agendamentoId,
      );
      if (!resultado.ok) throw new ErroAplicacao(resultado.mensagem);
    },
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasEstoque(): DependenciasEstoque {
  const estoque = criarEstoque();
  return {
    materiais: estoque.materiais,
    lotes: estoque.lotes,
    vinculos: estoque.vinculos,
    movimentacoes: estoque.movimentacoes,
    avisos: {
      ...estoque.avisos,
      async registrar(aviso) {
        await estoque.avisos.registrar(aviso);
        const material = await estoque.materiais.buscarPorId(aviso.materialId);
        if (!material) return;
        await publicarParaClinica(
          material.clinicaId,
          aviso.tipo === "estoque_minimo" ? "estoque_abaixo_minimo" : "estoque_baixa_insuficiente",
          aviso.materialId,
          aviso.texto,
        );
      },
    },
    agendamentos: criarAgendamentos(),
    itensPlano: criarPlanos().itens,
    procedimentos: criarProcedimentos(),
    clinicas: criarClinicas(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasProtese(): DependenciasProtese {
  const proteses = criarProteses();
  return {
    proteses: proteses.proteses,
    configuracoes: proteses.configuracoes,
    avisos: {
      ...proteses.avisos,
      async salvar(aviso) {
        await proteses.avisos.salvar(aviso);
        await publicarParaClinica(
          aviso.clinicaId,
          "atraso_protese",
          aviso.proteseId,
          "Atraso de prótese",
        );
      },
    },
    pacientes: criarPacientes(),
    dentistas: criarDentistas(),
    procedimentos: criarProcedimentos(),
    agendamentos: criarAgendamentos(),
    ids: { novo: () => crypto.randomUUID() },
  };
}
