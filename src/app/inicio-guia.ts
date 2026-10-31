import type { Papel } from "../domain/auth/tipos";
import type { BaseDaClinica } from "../domain/inicio/tipos";

export const TEXTO_AGUARDANDO_ADMIN =
  "O Admin ainda precisa configurar a clínica e cadastrar um dentista.";

export type PassoGuia = { rotulo: string; href: string };

const CONFIGURAR_CLINICA: PassoGuia = { rotulo: "Configurar a clínica", href: "/clinica" };
const CADASTRAR_DENTISTA: PassoGuia = { rotulo: "Cadastrar dentista", href: "/dentistas" };
const CADASTRAR_PACIENTE: PassoGuia = { rotulo: "Cadastrar paciente", href: "/pacientes" };
const CRIAR_AGENDAMENTO: PassoGuia = { rotulo: "Criar agendamento", href: "/agendamentos" };
const VER_NA_AGENDA: PassoGuia = { rotulo: "Ver na agenda", href: "/agenda" };

const PASSOS_ADMIN: PassoGuia[] = [
  CONFIGURAR_CLINICA,
  CADASTRAR_DENTISTA,
  CADASTRAR_PACIENTE,
  CRIAR_AGENDAMENTO,
  VER_NA_AGENDA,
];

const PASSOS_SEM_ADMIN: PassoGuia[] = [CADASTRAR_PACIENTE, CRIAR_AGENDAMENTO, VER_NA_AGENDA];

export function passosDoGuia(papel: Papel): PassoGuia[] {
  return (papel === "admin" ? PASSOS_ADMIN : PASSOS_SEM_ADMIN).map((passo) => ({ ...passo }));
}

export function indicePassoAtual(concluidos: boolean[]): number {
  const indice = concluidos.indexOf(false);
  return indice === -1 ? Math.max(concluidos.length - 1, 0) : indice;
}

export function baseExiste(base: BaseDaClinica): boolean {
  return base.temClinica && base.temCadeiraAtiva && base.temDentistaAtivo;
}

export function concluidosDoGuia(papel: Papel, base: BaseDaClinica): boolean[] {
  if (papel === "admin") {
    return [
      base.temCadeiraAtiva && base.temClinica,
      base.temDentistaAtivo,
      base.temPaciente,
      base.temAgendamento,
      false,
    ];
  }
  return [base.temPaciente, base.temAgendamento, false];
}

export type GuiaDoInicio =
  | { tipo: "aguardando"; texto: string }
  | { tipo: "passos"; passos: PassoGuia[]; concluidos: boolean[]; atual: number };

export function guiaDoInicio(papel: Papel, base: BaseDaClinica): GuiaDoInicio {
  if (papel !== "admin" && !baseExiste(base)) {
    return { tipo: "aguardando", texto: TEXTO_AGUARDANDO_ADMIN };
  }
  const concluidos = concluidosDoGuia(papel, base);
  return {
    tipo: "passos",
    passos: passosDoGuia(papel),
    concluidos,
    atual: indicePassoAtual(concluidos),
  };
}
