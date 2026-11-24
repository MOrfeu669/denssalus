import type { ContagensLista, SituacaoLista } from "../../domain/paciente/lista";

export type LinhaVisivel = {
  id: string;
  nome: string;
  iniciais: string;
  complemento: string;
  cpf: string;
  telefone: string;
  ultimaVisita: string;
  proximaConsulta: string | null;
  situacao: SituacaoLista;
};

export type PaginaLista = {
  linhas: LinhaVisivel[];
  totalFiltrado: number;
  totalClinica: number;
  pagina: number;
  porPagina: number;
  contagens: ContagensLista;
};
