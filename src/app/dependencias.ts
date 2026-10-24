import { criarGateway } from "../lib/supabase/gateway";
import { criarUsuarios } from "../lib/supabase/usuarios";
import type { Dependencias } from "../domain/auth/portas";

export function dependencias(): Dependencias {
  return {
    auth: criarGateway(),
    usuarios: criarUsuarios(),
  };
}
