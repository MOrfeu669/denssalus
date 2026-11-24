"use server";

import { filtrarPacientes, mascararCpf, telefonesDoPaciente } from "../../domain/paciente/busca";
import { listarPacientes } from "../../domain/paciente/casos";
import { dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";

export type ItemBusca = {
  id: string;
  nome: string;
  cpfMascarado: string | null;
};

const LIMITE = 8;

export async function buscarPacientesGlobais(
  termo: string,
): Promise<{ ok: true; valor: ItemBusca[] } | { ok: false; mensagem: string }> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: "Nenhuma sessão aberta" };

    const lista = await listarPacientes(dependenciasPaciente(), sessao);
    if (!lista.ok) return lista;

    const clinicaId = sessao.usuario.clinicaId;
    const valor = filtrarPacientes(
      lista.valor.map((paciente) => ({
        id: paciente.id,
        clinicaId: paciente.clinicaId,
        nome: paciente.nome,
        cpf: paciente.cpf,
        telefones: telefonesDoPaciente(paciente),
      })),
      clinicaId,
      termo,
    )
      .slice(0, LIMITE)
      .map((paciente) => ({
        id: paciente.id,
        nome: paciente.nome,
        cpfMascarado: mascararCpf(paciente.cpf),
      }));

    return { ok: true, valor };
  } catch (causa) {
    return falha(causa);
  }
}
