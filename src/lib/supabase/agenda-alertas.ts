import type { Dependencias as DependenciasClinica } from "../../domain/clinica/portas";

type AgendaAlertas = DependenciasClinica["agenda"];

// A tabela `agendamentos` nasce na Feature 006. Até lá não há o que ler nem gravar.
export function agendaSemTabela(): AgendaAlertas {
  return {
    async listarAgendadosFuturos() {
      return [];
    },
    async salvarAlertas() {},
  };
}
