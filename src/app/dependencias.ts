import { criarGateway } from "../lib/supabase/gateway";
import { agendaSemTabela } from "../lib/supabase/agenda-alertas";
import { agendaDentistaSemTabela } from "../lib/supabase/agenda-dentistas";
import { criarCadeiras, criarClinicas } from "../lib/supabase/clinicas";
import { criarDentistas } from "../lib/supabase/dentistas";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias } from "../domain/auth/portas";
import type { Dependencias as DependenciasClinica } from "../domain/clinica/portas";
import type { Dependencias as DependenciasDentista } from "../domain/dentista/portas";

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
    agenda: agendaSemTabela(),
    usuarios: criarUsuarios(),
    ids: { novo: () => crypto.randomUUID() },
  };
}

export function dependenciasDentista(): DependenciasDentista {
  return {
    dentistas: criarDentistas(),
    agenda: agendaDentistaSemTabela(),
    auth: criarGateway(),
    usuarios: criarUsuarios(),
    clinicas: criarClinicas(),
    ids: { novo: () => crypto.randomUUID() },
  };
}
