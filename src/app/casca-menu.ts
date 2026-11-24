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
const AGENDA: ItemMenu = { href: "/agenda", rotulo: "Agenda" };
const RETORNOS: ItemMenu = { href: "/retornos", rotulo: "Retornos" };
const ESTOQUE: ItemMenu = { href: "/estoque", rotulo: "Estoque" };
const LABORATORIOS: ItemMenu = { href: "/laboratorios", rotulo: "Laboratórios" };
const DASHBOARD: ItemMenu = { href: "/dashboard", rotulo: "Dashboard" };
const MENSAGENS: ItemMenu = { href: "/mensagens", rotulo: "Mensagens" };

const MENU: Record<Papel, ItemMenu[]> = {
  admin: [USUARIOS, CLINICA, DENTISTAS, PROCEDIMENTOS, PACIENTES, AGENDA],
  dentista: [PROCEDIMENTOS, PACIENTES, AGENDA],
  recepcionista: [PACIENTES, AGENDA],
};

const ETAPA_2: Record<Papel, ItemMenu[]> = {
  admin: [RETORNOS, ESTOQUE, LABORATORIOS, DASHBOARD, MENSAGENS],
  dentista: [RETORNOS, ESTOQUE, LABORATORIOS, DASHBOARD],
  recepcionista: [RETORNOS, ESTOQUE, LABORATORIOS, DASHBOARD],
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

export type GrupoMenu = {
  id: "atendimento" | "clinica" | "gestao";
  rotulo: string;
  itens: ItemMenu[];
};

const ROTULO_ROTA: Record<string, string> = {
  "/": "Início",
  "/agenda": "Agenda",
  "/pacientes": "Pacientes",
  "/retornos": "Retornos",
  "/procedimentos": "Procedimentos",
  "/dentistas": "Dentistas",
  "/laboratorios": "Laboratórios",
  "/estoque": "Estoque",
  "/dashboard": "Dashboard",
  "/mensagens": "Mensagens",
  "/usuarios": "Usuários",
  "/clinica": "Clínica",
  "/voz": "Assistente de voz",
};

const GRUPOS: { id: GrupoMenu["id"]; rotulo: string; hrefs: string[] }[] = [
  { id: "atendimento", rotulo: "Atendimento", hrefs: ["/", "/agenda", "/pacientes", "/retornos"] },
  { id: "clinica", rotulo: "Clínica", hrefs: ["/procedimentos", "/dentistas", "/laboratorios", "/estoque"] },
  { id: "gestao", rotulo: "Gestão", hrefs: ["/dashboard", "/mensagens", "/usuarios", "/clinica", "/voz"] },
];

/** A voz e o início valem para quem já entra na casca. O resto segue o menu do papel. */
export function gruposDaCasca(papel: Papel): GrupoMenu[] {
  const permitidos = new Set<string>(["/", "/voz", ...menuDaCasca(papel).map((item) => item.href)]);
  return GRUPOS.map((grupo) => ({
    id: grupo.id,
    rotulo: grupo.rotulo,
    itens: grupo.hrefs
      .filter((href) => permitidos.has(href))
      .map((href) => ({ href, rotulo: ROTULO_ROTA[href] ?? href })),
  })).filter((grupo) => grupo.itens.length > 0);
}
