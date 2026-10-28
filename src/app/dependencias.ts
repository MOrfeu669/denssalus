import { criarGateway } from "../lib/supabase/gateway";
import { criarAgendaAlertas } from "../lib/supabase/agenda-alertas";
import { criarAgendaDentistas } from "../lib/supabase/agenda-dentistas";
import { criarAgendamentos } from "../lib/supabase/agendamentos";
import { criarAvisos } from "../lib/supabase/avisos";
import { criarBloqueios } from "../lib/supabase/bloqueios";
import { criarCadeiras, criarClinicas } from "../lib/supabase/clinicas";
import { criarDebitos } from "../lib/supabase/debitos";
import { criarDentistas } from "../lib/supabase/dentistas";
import { criarOdontograma } from "../lib/supabase/odontograma";
import { criarPacientes } from "../lib/supabase/pacientes";
import { criarPlanos } from "../lib/supabase/plano";
import { criarProcedimentos } from "../lib/supabase/procedimentos";
import { criarProntuario } from "../lib/supabase/prontuario";
import { criarConfiguracoesRetorno, criarRetornos } from "../lib/supabase/retornos";
import { ErroAplicacao } from "../lib/supabase/erro";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias as DependenciasAgendamento } from "../domain/agendamento/portas";
import type { Dependencias } from "../domain/auth/portas";
import type { Dependencias as DependenciasClinica } from "../domain/clinica/portas";
import { gerarDebitosDoAtendimento as gerarDebitosDoAtendimentoCaso } from "../domain/debito/casos";
import type { Dependencias as DependenciasDebito } from "../domain/debito/portas";
import type { Dependencias as DependenciasDentista } from "../domain/dentista/portas";
import { reverterDoAgendamento as reverterDoAgendamentoCaso } from "../domain/odontograma/casos";
import type { Dependencias as DependenciasOdontograma } from "../domain/odontograma/portas";
import type { Dependencias as DependenciasPaciente } from "../domain/paciente/portas";
import { concluirItensDoAgendamento as concluirItensDoAgendamentoCaso } from "../domain/plano/casos";
import type { Dependencias as DependenciasPlano } from "../domain/plano/portas";
import type { Dependencias as DependenciasProcedimento } from "../domain/procedimento/portas";
import type { Dependencias as DependenciasProntuario } from "../domain/prontuario/portas";
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

export function dependenciasAgendamento(): DependenciasAgendamento {
  return {
    agendamentos: criarAgendamentos(),
    avisos: criarAvisos(),
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

export function dependenciasRetorno(): DependenciasRetorno {
  return {
    retornos: criarRetornos(),
    configuracoes: criarConfiguracoesRetorno(),
    agendamentos: criarAgendamentos(),
    pacientes: criarPacientes(),
    avisos: criarAvisos(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasProntuario(): DependenciasProntuario {
  const prontuario = criarProntuario();
  return {
    anamneses: prontuario.anamneses,
    evolucoes: prontuario.evolucoes,
    auditoria: prontuario.auditoria,
    estoque: prontuario.estoque,
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
