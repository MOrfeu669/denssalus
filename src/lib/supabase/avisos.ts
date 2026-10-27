import type { Avisos } from "../../domain/agendamento/portas";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

export function criarAvisos(): Avisos {
  const admin = createAdminClient();

  return {
    async avisarRecepcionista(aviso) {
      const { error } = await admin.from("avisos_recepcao").insert({
        clinica_id: aviso.clinicaId,
        agendamento_id: aviso.agendamentoId,
        paciente_id: aviso.pacienteId,
        motivo: aviso.motivo,
      });
      if (error) throw new ErroAplicacao("Não foi possível avisar a recepção", error);
    },
  };
}
