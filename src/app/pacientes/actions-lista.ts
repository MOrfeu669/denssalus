"use server";

import { autorizarAcao } from "../../domain/auth/casos";
import { idadeEm } from "../../domain/paciente/regras";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../../domain/paciente/tipos";
import { dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { textoCsv } from "./csv";
import { lerConsulta } from "./consulta";
import { linhasDoCsv } from "./ler";
import { TEXTO_EXPORTAR_VAZIO } from "./texto";
import type { PacienteLinha } from "./linha";

const SEM_SESSAO = "Nenhuma sessão aberta";

function idsLimpos(ids: string[]): string[] {
  const unicos = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const texto = id.trim();
    if (texto === "" || texto.length > 80) continue;
    unicos.add(texto);
    if (unicos.size >= 5000) break;
  }
  return [...unicos];
}

export async function exportarCsv(entrada: {
  termo: string;
  chip: string;
  ids: string[];
}): Promise<{ ok: true; csv: string; nome: string } | { ok: false; mensagem: string }> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const consulta = lerConsulta({ q: entrada.termo, chip: entrada.chip, pagina: "1", linhas: "10" });
    const linhas = await linhasDoCsv(sessao, consulta, idsLimpos(entrada.ids));
    if (!linhas.ok) return linhas;
    if (linhas.valor.length === 0) return { ok: false, mensagem: TEXTO_EXPORTAR_VAZIO };
    return { ok: true, csv: textoCsv(linhas.valor), nome: "pacientes.csv" };
  } catch (erro) {
    return falha(erro);
  }
}

export async function lerParaEditar(
  id: string,
): Promise<{ ok: true; paciente: PacienteLinha } | { ok: false; mensagem: string }> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const permitido = autorizarAcao(sessao, "paciente:cadastrar");
    if (!permitido.ok) return permitido;
    const paciente = await dependenciasPaciente().pacientes.buscarPorId(id);
    if (!paciente || paciente.clinicaId !== sessao.usuario.clinicaId) {
      return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
    }
    const hoje = new Date();
    return {
      ok: true,
      paciente: {
        ...paciente,
        idade: paciente.dataNascimento ? idadeEm(paciente.dataNascimento, hoje) : null,
      },
    };
  } catch (erro) {
    return falha(erro);
  }
}
