"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import { cadastrarPaciente, editarPaciente } from "../../domain/paciente/casos";
import type { ResultadoPaciente } from "../../domain/paciente/tipos";
import { dependencias, dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { validarPaciente, type CamposPaciente } from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function campos(formData: FormData): CamposPaciente {
  return {
    nome: texto(formData, "nome"),
    canais: texto(formData, "canais"),
    cpf: texto(formData, "cpf"),
    endereco: texto(formData, "endereco"),
    dataNascimento: texto(formData, "dataNascimento"),
    sexo: texto(formData, "sexo"),
    responsavelNome: texto(formData, "responsavelNome"),
    responsavelCpf: texto(formData, "responsavelCpf"),
    responsavelTelefone: texto(formData, "responsavelTelefone"),
  };
}

// CPF duplicado mostra o nome do paciente que já tem esse CPF.
function erro(resultado: Extract<ResultadoPaciente, { ok: false }>): EstadoFormulario {
  return estado("erro", resultado.mensagem, resultado.existente?.nome ?? "");
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const hoje = new Date();
  const validado = validarPaciente(campos(formData), hoje);
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await cadastrarPaciente(dependenciasPaciente(), sessao, validado.valor, hoje);
    if (!resultado.ok) return erro(resultado);
    revalidatePath("/pacientes");
    return estado("sucesso", "Paciente cadastrado", validado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function editar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const hoje = new Date();
  const validado = validarPaciente(campos(formData), hoje);
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await editarPaciente(
      dependenciasPaciente(),
      sessao,
      texto(formData, "id"),
      validado.valor,
      hoje,
    );
    if (!resultado.ok) return erro(resultado);
    revalidatePath("/pacientes");
    return estado("sucesso", "Paciente salvo", validado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
