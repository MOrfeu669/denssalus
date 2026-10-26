export const CANAIS = ["sms", "email", "whatsapp"] as const;
export type Canal = (typeof CANAIS)[number];

export const SEXOS = ["masculino", "feminino", "outro"] as const;
export type Sexo = (typeof SEXOS)[number];

export type CanalComunicacao = { canal: Canal; contato: string; preferido: boolean };

export type ResponsavelLegal = { nome: string; cpf: string; telefone: string | null };

export type Paciente = {
  id: string;
  clinicaId: string;
  nome: string;
  canais: CanalComunicacao[];
  cpf: string | null;
  endereco: string | null;
  dataNascimento: string | null;
  sexo: Sexo | null;
  responsavel: ResponsavelLegal | null;
};

export type ResultadoPaciente =
  | { ok: true; valor: Paciente }
  | { ok: false; mensagem: string; existente?: Paciente };

export type EntradaPaciente = {
  nome: string;
  canais: CanalComunicacao[];
  cpf?: string | null;
  endereco?: string | null;
  dataNascimento?: string | null;
  sexo?: string | null;
  responsavel?: {
    nome?: string | null;
    cpf?: string | null;
    telefone?: string | null;
  } | null;
};

export const MENSAGEM_NOME_OBRIGATORIO = "Informe o nome do paciente";
export const MENSAGEM_SEM_CANAL = "Informe ao menos um canal";
export const MENSAGEM_CANAL_PREFERIDO = "Marque exatamente um canal preferido";
export const MENSAGEM_SEXO_INVALIDO = "Informe um sexo válido";
export const MENSAGEM_NASCIMENTO_INVALIDO = "Informe uma data de nascimento válida";
export const MENSAGEM_RESPONSAVEL_NOME = "Informe o nome do responsável";
export const MENSAGEM_RESPONSAVEL_CPF = "Informe o CPF do responsável";
export const MENSAGEM_CPF_JA_CADASTRADO = "CPF já cadastrado";
export const MENSAGEM_PACIENTE_NAO_ENCONTRADO = "Paciente não encontrado";
