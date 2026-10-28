export type ImagemAtiva = {
  id: string;
  dente: number | null;
  tipoCaso: string;
  descricao: string;
  adicionadoEm: string;
  url: string;
};

export type ImagemPendente = {
  id: string;
  dente: number | null;
  tipoCaso: string;
  descricao: string;
};

export type ImagemDoDente = Pick<ImagemAtiva, "id" | "dente" | "tipoCaso" | "descricao" | "url">;
