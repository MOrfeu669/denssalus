import { criarGateway } from "../lib/supabase/gateway";
import { criarAgendaAlertas } from "../lib/supabase/agenda-alertas";
import { criarAgendaDentistas } from "../lib/supabase/agenda-dentistas";
import { criarAgendamentos } from "../lib/supabase/agendamentos";
import { criarAvisos } from "../lib/supabase/avisos";
import { criarBloqueios } from "../lib/supabase/bloqueios";
import { criarCadeiras, criarClinicas } from "../lib/supabase/clinicas";
import { criarDentistas } from "../lib/supabase/dentistas";
import { criarPacientes } from "../lib/supabase/pacientes";
import { criarProcedimentos } from "../lib/supabase/procedimentos";
import { criarProntuario } from "../lib/supabase/prontuario";
import { criarConfiguracoesRetorno, criarRetornos } from "../lib/supabase/retornos";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias as DependenciasAgendamento } from "../domain/agendamento/portas";
import type { Dependencias } from "../domain/auth/portas";
import type { Dependencias as DependenciasClinica } from "../domain/clinica/portas";
import type { Dependencias as DependenciasDentista } from "../domain/dentista/portas";
import type { Dependencias as DependenciasPaciente } from "../domain/paciente/portas";
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
    ids: { novo: () => crypto.randomUUID() },
  };
}
