import { criarGateway } from "../lib/supabase/gateway";
import { agendaSemTabela } from "../lib/supabase/agenda-alertas";
import { criarCadeiras, criarClinicas } from "../lib/supabase/clinicas";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias } from "../domain/auth/portas";
import type { Dependencias as DependenciasClinica } from "../domain/clinica/portas";

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
