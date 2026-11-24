import { autorizarAcao } from "../../domain/auth/casos";
import type { Resultado, Sessao } from "../../domain/auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../../domain/clinica/tipos";
import { fatosParaExportar, recortarLista, type PedidoLista } from "../../domain/paciente/lista";
import { carregarFatosLista } from "../../lib/supabase/lista-pacientes";
import { dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { apresentarLinha } from "./apresentar";
import type { ConsultaLista } from "./consulta";
import type { LinhaVisivel, PaginaLista } from "./tipos-lista";

async function clinicaDaSessao(sessao: Sessao): Promise<{ ok: true; clinicaId: string } | { ok: false; mensagem: string }> {
  const permitido = autorizarAcao(sessao, "paciente:cadastrar");
  if (!permitido.ok) return permitido;
  const clinica = await dependenciasPaciente().clinicas.buscarPorId(sessao.usuario.clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinicaId: clinica.id };
}

function pedidoDe(clinicaId: string, consulta: ConsultaLista, agora: Date): PedidoLista {
  return { clinicaId, termo: consulta.termo, chip: consulta.chip, pagina: consulta.pagina, porPagina: consulta.porPagina, agora };
}

export async function consultarLista(
  sessao: Sessao,
  consulta: ConsultaLista,
  agora = new Date(),
): Promise<Resultado<PaginaLista>> {
  const contexto = await clinicaDaSessao(sessao);
  if (!contexto.ok) return contexto;
  try {
    const fatos = await carregarFatosLista(contexto.clinicaId, agora);
    const recorte = recortarLista(fatos, pedidoDe(contexto.clinicaId, consulta, agora));
    return {
      ok: true,
      valor: {
        linhas: recorte.fatos.map((fato) => apresentarLinha(fato, agora)),
        totalFiltrado: recorte.totalFiltrado,
        totalClinica: recorte.totalClinica,
        pagina: recorte.pagina,
        porPagina: recorte.porPagina,
        contagens: recorte.contagens,
      },
    };
  } catch (erro) {
    return falha(erro);
  }
}

export async function linhasDoCsv(
  sessao: Sessao,
  consulta: ConsultaLista,
  ids: string[],
  agora = new Date(),
): Promise<Resultado<LinhaVisivel[]>> {
  const contexto = await clinicaDaSessao(sessao);
  if (!contexto.ok) return contexto;
  try {
    const fatos = await carregarFatosLista(contexto.clinicaId, agora);
    const escolhidos = fatosParaExportar(fatos, pedidoDe(contexto.clinicaId, consulta, agora), ids);
    return { ok: true, valor: escolhidos.map((fato) => apresentarLinha(fato, agora)) };
  } catch (erro) {
    return falha(erro);
  }
}
