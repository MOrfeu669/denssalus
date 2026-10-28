import {
  listarProteses,
  listarResponsaveis,
  obterLimiteAtraso,
} from "../../../domain/protese/casos";
import type { Protese } from "../../../domain/protese/tipos";
import { dependenciasProtese } from "../../dependencias";
import { falha } from "../../falha";
import type { sessaoAtual } from "../../sessao";
import type { ResponsavelOpcao } from "./tipos-protese";

type Sessao = NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>;

const LIMITE_PADRAO = 15;

export type ResultadoProteses =
  | { ok: true; proteses: Protese[]; responsaveis: ResponsavelOpcao[]; limite: number }
  | { ok: false; mensagem: string };

export async function carregarProteses(
  sessao: Sessao,
  pacienteId: string,
): Promise<ResultadoProteses> {
  try {
    const deps = dependenciasProtese();
    const lista = await listarProteses(deps, sessao, pacienteId, new Date());
    if (!lista.ok) return lista;
    const responsaveis = await listarResponsaveis(deps, sessao);
    if (!responsaveis.ok) return responsaveis;
    // O limite só aparece para o Admin; os demais papéis não precisam dele.
    let limite = LIMITE_PADRAO;
    if (sessao.usuario.papel === "admin") {
      const atual = await obterLimiteAtraso(deps, sessao);
      if (!atual.ok) return atual;
      limite = atual.valor;
    }
    return {
      ok: true,
      proteses: lista.valor,
      responsaveis: responsaveis.valor.map(({ id, nome }) => ({ id, nome })),
      limite,
    };
  } catch (erro) {
    return falha(erro);
  }
}
