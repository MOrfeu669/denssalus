import { listarImagens } from "../../../domain/imagem/casos";
import type { ImagemProntuario } from "../../../domain/imagem/tipos";
import { dependenciasImagem, urlsImagem } from "../../dependencias";
import { falha } from "../../falha";
import type { sessaoAtual } from "../../sessao";
import type { ImagemAtiva, ImagemPendente } from "./tipos-imagem";

type Sessao = NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>;

export type ResultadoImagens =
  | { ok: true; ativas: ImagemAtiva[]; pendentes: ImagemPendente[] }
  | { ok: false; mensagem: string };

async function urlDeLeitura(imagem: ImagemProntuario): Promise<string> {
  try {
    return await urlsImagem().urlDeLeitura(imagem.caminho);
  } catch (erro) {
    falha(erro);
    return "";
  }
}

export async function carregarImagens(
  sessao: Sessao,
  pacienteId: string,
): Promise<ResultadoImagens> {
  try {
    const lista = await listarImagens(dependenciasImagem(), sessao, pacienteId, new Date());
    if (!lista.ok) return lista;
    const ativas = await Promise.all(
      lista.valor.ativas.map(async (imagem) => ({
        id: imagem.id,
        dente: imagem.dente,
        tipoCaso: imagem.tipoCaso,
        descricao: imagem.descricao,
        adicionadoEm: imagem.adicionadoEm,
        url: await urlDeLeitura(imagem),
      })),
    );
    const pendentes = lista.valor.pendentes.map(({ id, dente, tipoCaso, descricao }) => ({
      id,
      dente,
      tipoCaso,
      descricao,
    }));
    return { ok: true, ativas, pendentes };
  } catch (erro) {
    return falha(erro);
  }
}
