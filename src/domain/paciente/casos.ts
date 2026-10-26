import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dependencias } from "./portas";
import { dataValida, menorDeIdade, normalizarCanais, paraTextoData } from "./regras";
import {
  MENSAGEM_CPF_JA_CADASTRADO,
  MENSAGEM_NASCIMENTO_INVALIDO,
  MENSAGEM_NOME_OBRIGATORIO,
  MENSAGEM_PACIENTE_NAO_ENCONTRADO,
  MENSAGEM_RESPONSAVEL_CPF,
  MENSAGEM_RESPONSAVEL_NOME,
  MENSAGEM_SEXO_INVALIDO,
  SEXOS,
  type EntradaPaciente,
  type Paciente,
  type ResultadoPaciente,
  type Sexo,
} from "./tipos";

type Falha = { ok: false; mensagem: string };
type Dados = Omit<Paciente, "id" | "clinicaId">;

function textoOuNulo(valor: string | null | undefined): string | null {
  const texto = (valor ?? "").trim();
  return texto === "" ? null : texto;
}

async function clinicaDaSessao(
  deps: Dependencias,
  ator: Sessao,
): Promise<{ ok: true; clinicaId: string } | Falha> {
  const permitido = autorizarAcao(ator, "paciente:cadastrar");
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorId(ator.usuario.clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinicaId: clinica.id };
}

function montarDados(entrada: EntradaPaciente, hoje: Date): { ok: true; dados: Dados } | Falha {
  const nome = entrada.nome.trim();
  if (nome === "") return { ok: false, mensagem: MENSAGEM_NOME_OBRIGATORIO };

  const canais = normalizarCanais(entrada.canais);
  if (!canais.ok) return canais;

  const sexoTexto = textoOuNulo(entrada.sexo);
  if (sexoTexto !== null && !(SEXOS as readonly string[]).includes(sexoTexto)) {
    return { ok: false, mensagem: MENSAGEM_SEXO_INVALIDO };
  }

  const dataNascimento = textoOuNulo(entrada.dataNascimento);
  if (dataNascimento !== null) {
    if (!dataValida(dataNascimento) || dataNascimento > paraTextoData(hoje)) {
      return { ok: false, mensagem: MENSAGEM_NASCIMENTO_INVALIDO };
    }
  }

  let responsavel: Paciente["responsavel"] = null;
  if (menorDeIdade(dataNascimento, hoje)) {
    const nomeResponsavel = textoOuNulo(entrada.responsavel?.nome);
    if (nomeResponsavel === null) return { ok: false, mensagem: MENSAGEM_RESPONSAVEL_NOME };
    const cpfResponsavel = textoOuNulo(entrada.responsavel?.cpf);
    if (cpfResponsavel === null) return { ok: false, mensagem: MENSAGEM_RESPONSAVEL_CPF };
    responsavel = {
      nome: nomeResponsavel,
      cpf: cpfResponsavel,
      telefone: textoOuNulo(entrada.responsavel?.telefone),
    };
  }

  return {
    ok: true,
    dados: {
      nome,
      canais: canais.valor,
      cpf: textoOuNulo(entrada.cpf),
      endereco: textoOuNulo(entrada.endereco),
      dataNascimento,
      sexo: sexoTexto as Sexo | null,
      responsavel,
    },
  };
}

async function cpfEmUsoPorOutro(
  deps: Dependencias,
  clinicaId: string,
  cpf: string | null,
  pacienteId: string | null,
): Promise<Paciente | null> {
  if (cpf === null) return null;
  const existente = await deps.pacientes.buscarPorCpf(clinicaId, cpf);
  if (!existente || existente.id === pacienteId) return null;
  return existente;
}

export async function cadastrarPaciente(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaPaciente,
  hoje: Date,
): Promise<ResultadoPaciente> {
  const contexto = await clinicaDaSessao(deps, ator);
  if (!contexto.ok) return contexto;

  const montado = montarDados(entrada, hoje);
  if (!montado.ok) return montado;

  const existente = await cpfEmUsoPorOutro(deps, contexto.clinicaId, montado.dados.cpf, null);
  if (existente) return { ok: false, mensagem: MENSAGEM_CPF_JA_CADASTRADO, existente };

  const paciente: Paciente = {
    id: deps.ids.novo(),
    clinicaId: contexto.clinicaId,
    ...montado.dados,
  };
  await deps.pacientes.salvar(paciente);
  return { ok: true, valor: paciente };
}

export async function editarPaciente(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  entrada: EntradaPaciente,
  hoje: Date,
): Promise<ResultadoPaciente> {
  const contexto = await clinicaDaSessao(deps, ator);
  if (!contexto.ok) return contexto;

  const atual = await deps.pacientes.buscarPorId(pacienteId);
  if (!atual || atual.clinicaId !== contexto.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }

  const montado = montarDados(entrada, hoje);
  if (!montado.ok) return montado;

  const existente = await cpfEmUsoPorOutro(deps, contexto.clinicaId, montado.dados.cpf, atual.id);
  if (existente) return { ok: false, mensagem: MENSAGEM_CPF_JA_CADASTRADO, existente };

  const editado: Paciente = { ...atual, ...montado.dados };
  await deps.pacientes.salvar(editado);
  return { ok: true, valor: editado };
}

export async function listarPacientes(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Paciente[]>> {
  const contexto = await clinicaDaSessao(deps, ator);
  if (!contexto.ok) return contexto;

  const lista = await deps.pacientes.listar(contexto.clinicaId);
  const ordenada = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { ok: true, valor: ordenada };
}
