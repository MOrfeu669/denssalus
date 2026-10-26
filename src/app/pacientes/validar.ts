import type { Resultado } from "../../domain/auth/tipos";
import { dataValida, menorDeIdade, normalizarCanais, paraTextoData } from "../../domain/paciente/regras";
import {
  CANAIS,
  MENSAGEM_NASCIMENTO_INVALIDO,
  MENSAGEM_NOME_OBRIGATORIO,
  MENSAGEM_RESPONSAVEL_CPF,
  MENSAGEM_RESPONSAVEL_NOME,
  MENSAGEM_SEM_CANAL,
  MENSAGEM_SEXO_INVALIDO,
  SEXOS,
  type Canal,
  type CanalComunicacao,
  type ResponsavelLegal,
  type Sexo,
} from "../../domain/paciente/tipos";

export type PacienteValido = {
  nome: string;
  canais: CanalComunicacao[];
  cpf: string | null;
  endereco: string | null;
  dataNascimento: string | null;
  sexo: Sexo | null;
  responsavel: ResponsavelLegal | null;
};

export type CamposPaciente = {
  nome: string;
  canais: string; // JSON: lista de { canal, contato, preferido }
  cpf: string;
  endereco: string;
  dataNascimento: string;
  sexo: string;
  responsavelNome: string;
  responsavelCpf: string;
  responsavelTelefone: string;
};

function vazioParaNulo(valor: string): string | null {
  const limpo = valor.trim();
  return limpo ? limpo : null;
}

// Lê o JSON enviado pelo formulário. Linha sem contato ou com canal desconhecido sai da lista.
export function lerCanais(json: string): CanalComunicacao[] {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(bruto)) return [];
  const lista: CanalComunicacao[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) continue;
    const { canal, contato, preferido } = item as Record<string, unknown>;
    if (typeof canal !== "string" || !(CANAIS as readonly string[]).includes(canal)) continue;
    const limpo = typeof contato === "string" ? contato.trim() : "";
    if (!limpo) continue;
    lista.push({ canal: canal as Canal, contato: limpo, preferido: preferido === true });
  }
  return lista;
}

export function validarPaciente(campos: CamposPaciente, hoje: Date): Resultado<PacienteValido> {
  const nome = campos.nome.trim();
  if (!nome) return { ok: false, mensagem: MENSAGEM_NOME_OBRIGATORIO };

  const lista = lerCanais(campos.canais);
  if (lista.length === 0) return { ok: false, mensagem: MENSAGEM_SEM_CANAL };
  const canais = normalizarCanais(lista);
  if (!canais.ok) return canais;

  const sexo = vazioParaNulo(campos.sexo);
  if (sexo !== null && !(SEXOS as readonly string[]).includes(sexo)) {
    return { ok: false, mensagem: MENSAGEM_SEXO_INVALIDO };
  }

  const dataNascimento = vazioParaNulo(campos.dataNascimento);
  if (dataNascimento !== null && (!dataValida(dataNascimento) || dataNascimento > paraTextoData(hoje))) {
    return { ok: false, mensagem: MENSAGEM_NASCIMENTO_INVALIDO };
  }

  let responsavel: ResponsavelLegal | null = null;
  if (menorDeIdade(dataNascimento, hoje)) {
    const responsavelNome = campos.responsavelNome.trim();
    const responsavelCpf = campos.responsavelCpf.trim();
    if (!responsavelNome) return { ok: false, mensagem: MENSAGEM_RESPONSAVEL_NOME };
    if (!responsavelCpf) return { ok: false, mensagem: MENSAGEM_RESPONSAVEL_CPF };
    responsavel = {
      nome: responsavelNome,
      cpf: responsavelCpf,
      telefone: vazioParaNulo(campos.responsavelTelefone),
    };
  }

  return {
    ok: true,
    valor: {
      nome,
      canais: canais.valor,
      cpf: vazioParaNulo(campos.cpf),
      endereco: vazioParaNulo(campos.endereco),
      dataNascimento,
      sexo: sexo as Sexo | null,
      responsavel,
    },
  };
}
