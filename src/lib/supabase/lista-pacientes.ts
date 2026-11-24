import { montarFatos, type MarcaBruta, type VisitaBruta } from "../../domain/paciente/lista-fatos";
import type { FatoLista } from "../../domain/paciente/lista";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";
import { criarPacientes } from "./pacientes";

type Admin = ReturnType<typeof createAdminClient>;

async function lerVisitas(admin: Admin, clinicaId: string): Promise<VisitaBruta[]> {
  const { data, error } = await admin
    .from("agendamentos")
    .select("paciente_id, inicio, status")
    .eq("clinica_id", clinicaId);
  if (error) throw new ErroAplicacao("Não foi possível listar os agendamentos", error);
  return (data as { paciente_id: string; inicio: string; status: string }[]).map((linha) => ({
    pacienteId: linha.paciente_id,
    inicio: linha.inicio,
    status: linha.status,
  }));
}

async function lerMarcas(
  admin: Admin,
  tabela: "debitos" | "retornos" | "planos_tratamento",
  clinicaId: string,
  mensagem: string,
): Promise<MarcaBruta[]> {
  const { data, error } = await admin.from(tabela).select("paciente_id, status").eq("clinica_id", clinicaId);
  if (error) throw new ErroAplicacao(mensagem, error);
  return (data as { paciente_id: string; status: string }[]).map((linha) => ({
    pacienteId: linha.paciente_id,
    status: linha.status,
  }));
}

/** Toda leitura da lista passa pela clínica da sessão. */
export async function carregarFatosLista(clinicaId: string, agora: Date): Promise<FatoLista[]> {
  const admin = createAdminClient();
  const [pacientes, visitas, debitos, retornos, planos] = await Promise.all([
    criarPacientes().listar(clinicaId),
    lerVisitas(admin, clinicaId),
    lerMarcas(admin, "debitos", clinicaId, "Não foi possível listar os débitos"),
    lerMarcas(admin, "retornos", clinicaId, "Não foi possível listar os retornos"),
    lerMarcas(admin, "planos_tratamento", clinicaId, "Não foi possível listar os planos"),
  ]);
  return montarFatos(pacientes, visitas, debitos, retornos, planos, agora);
}
