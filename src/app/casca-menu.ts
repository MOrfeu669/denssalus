import type { Papel } from "../domain/auth/tipos";

export type ItemMenu = { href: string; rotulo: string };

const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Admin",
  dentista: "Dentista",
  recepcionista: "Recepcionista",
};

const USUARIOS: ItemMenu = { href: "/usuarios", rotulo: "Usuários" };
const CLINICA: ItemMenu = { href: "/clinica", rotulo: "Clínica" };
const DENTISTAS: ItemMenu = { href: "/dentistas", rotulo: "Dentistas" };
const PROCEDIMENTOS: ItemMenu = { href: "/procedimentos", rotulo: "Procedimentos" };
const PACIENTES: ItemMenu = { href: "/pacientes", rotulo: "Pacientes" };
const AGENDAMENTOS: ItemMenu = { href: "/agendamentos", rotulo: "Agendamentos" };
const AGENDA: ItemMenu = { href: "/agenda", rotulo: "Agenda" };
const RETORNOS: ItemMenu = { href: "/retornos", rotulo: "Retornos" };
const ESTOQUE: ItemMenu = { href: "/estoque", rotulo: "Estoque" };
const DASHBOARD: ItemMenu = { href: "/dashboard", rotulo: "Dashboard" };
const MENSAGENS: ItemMenu = { href: "/mensagens", rotulo: "Mensagens" };

const MENU: Record<Papel, ItemMenu[]> = {
  admin: [USUARIOS, CLINICA, DENTISTAS, PROCEDIMENTOS, PACIENTES, AGENDAMENTOS, AGENDA],
  dentista: [PROCEDIMENTOS, PACIENTES, AGENDAMENTOS, AGENDA],
  recepcionista: [PACIENTES, AGENDAMENTOS, AGENDA],
};

const ETAPA_2: Record<Papel, ItemMenu[]> = {
  admin: [RETORNOS, ESTOQUE, DASHBOARD, MENSAGENS],
  dentista: [RETORNOS, ESTOQUE, DASHBOARD],
  recepcionista: [RETORNOS, ESTOQUE, DASHBOARD],
};

export function rotuloPapel(papel: Papel): string {
  return ROTULO_PAPEL[papel];
}

export function itensMenu(papel: Papel): ItemMenu[] {
  return MENU[papel].map((item) => ({ ...item }));
}

export function itensEtapa2(papel: Papel): ItemMenu[] {
  return ETAPA_2[papel].map((item) => ({ ...item }));
}

export function menuDaCasca(papel: Papel): ItemMenu[] {
  return [...itensMenu(papel), ...itensEtapa2(papel)];
}
