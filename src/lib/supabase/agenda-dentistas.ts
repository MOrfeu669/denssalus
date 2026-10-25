import type { Dependencias as DependenciasDentista } from "../../domain/dentista/portas";

type AgendaDentistas = DependenciasDentista["agenda"];

// A tabela `agendamentos` nasce na Feature 006. Até lá não há o que ler nem gravar.
export function agendaDentistaSemTabela(): AgendaDentistas {
  return {
    async listarAgendadosFuturos() {
      return [];
    },
    async salvarAlertas() {},
  };
}
