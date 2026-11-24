import type { Paciente } from "./tipos";
import type { FatoLista } from "./lista";

const STATUS_ATIVO = new Set(["agendado", "em_espera", "iniciado"]);

export type VisitaBruta = { pacienteId: string; inicio: string; status: string };
export type MarcaBruta = { pacienteId: string; status: string };

function contato(paciente: Paciente): { telefone: string | null; email: string | null } {
  const telefones = paciente.canais.filter((canal) => canal.canal === "whatsapp" || canal.canal === "sms");
  const emails = paciente.canais.filter((canal) => canal.canal === "email");
  return {
    telefone: (telefones.find((canal) => canal.preferido) ?? telefones[0])?.contato ?? null,
    email: (emails.find((canal) => canal.preferido) ?? emails[0])?.contato ?? null,
  };
}

export function montarFatos(
  pacientes: Paciente[],
  visitas: VisitaBruta[],
  debitos: MarcaBruta[],
  retornos: MarcaBruta[],
  planos: MarcaBruta[],
  agora: Date,
): FatoLista[] {
  const porPaciente = new Map<string, VisitaBruta[]>();
  for (const visita of visitas) {
    const lista = porPaciente.get(visita.pacienteId) ?? [];
    lista.push(visita);
    porPaciente.set(visita.pacienteId, lista);
  }
  const comDebito = new Set(debitos.filter((item) => item.status === "em_aberto").map((item) => item.pacienteId));
  const retornoPendente = new Set(
    retornos
      .filter((item) => item.status === "pendente" || item.status === "notificado")
      .map((item) => item.pacienteId),
  );
  const emAndamento = new Set(planos.filter((item) => item.status === "em_andamento").map((item) => item.pacienteId));
  const agoraMs = agora.getTime();

  return pacientes.map((paciente) => {
    let ultima: string | null = null;
    let ultimaMs = Number.NEGATIVE_INFINITY;
    let proxima: string | null = null;
    let proximaMs = Number.POSITIVE_INFINITY;
    let futuro = false;
    for (const visita of porPaciente.get(paciente.id) ?? []) {
      const ms = new Date(visita.inicio).getTime();
      if (Number.isNaN(ms)) continue;
      if (visita.status === "concluido" && ms <= agoraMs && ms >= ultimaMs) {
        ultimaMs = ms;
        ultima = visita.inicio;
      }
      if (STATUS_ATIVO.has(visita.status) && ms > agoraMs && ms <= proximaMs) {
        proximaMs = ms;
        proxima = visita.inicio;
        futuro = true;
      }
    }
    const canais = contato(paciente);
    return {
      clinicaId: paciente.clinicaId,
      id: paciente.id,
      nome: paciente.nome,
      cpf: paciente.cpf,
      dataNascimento: paciente.dataNascimento,
      telefone: canais.telefone,
      email: canais.email,
      responsavelNome: paciente.responsavel?.nome ?? null,
      emTratamento: futuro || emAndamento.has(paciente.id),
      comDebito: comDebito.has(paciente.id),
      retornoPendente: retornoPendente.has(paciente.id),
      ultimaVisita: ultima,
      proximaConsulta: proxima,
    };
  });
}
