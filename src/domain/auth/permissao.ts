import type { Acao, Papel } from "./tipos";

const NIVEL: Record<Papel, number> = {
  recepcionista: 0,
  dentista: 1,
  admin: 2,
};

const MINIMO: Record<Acao, Papel> = {
  "clinica:configurar": "admin",
  "dentista:cadastrar": "admin",
  "odontograma:preencher": "dentista",
  "paciente:cadastrar": "recepcionista",
  "procedimento:cadastrar": "dentista",
  "procedimento:excluir": "admin",
  "usuario:cadastrar": "admin",
  "usuario:remover": "admin",
};

export function permite(papel: Papel, acao: Acao): boolean {
  return NIVEL[papel] >= NIVEL[MINIMO[acao]];
}
