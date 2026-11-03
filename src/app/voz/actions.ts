"use server";

import { revalidatePath } from "next/cache";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { ESCRITA, FERRAMENTAS, type SaidaVoz } from "./ferramentas";

const SEM_SESSAO = "Nenhuma sessão aberta";

/**
 * Server Action (não é rota nova: o AGENTS.md mantém o callback como único HTTP).
 * A chave do ElevenLabs fica no servidor; o navegador recebe só a URL assinada.
 */
export async function obterUrlAssinada(): Promise<{ ok: true; url: string } | { ok: false; mensagem: string }> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };

    const agente = process.env.ELEVENLABS_AGENT_ID;
    const chave = process.env.ELEVENLABS_API_KEY;
    if (!agente || !chave) return { ok: false, mensagem: "Assistente de voz não configurado" };

    const resposta = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agente)}`,
      { headers: { "xi-api-key": chave }, cache: "no-store" },
    );
    if (!resposta.ok) return { ok: false, mensagem: "Não foi possível iniciar o assistente de voz" };
    const corpo = (await resposta.json()) as { signed_url?: string };
    if (!corpo.signed_url) return { ok: false, mensagem: "Não foi possível iniciar o assistente de voz" };
    return { ok: true, url: corpo.signed_url };
  } catch (causa) {
    return falha(causa);
  }
}

/**
 * Entrada única das tools de voz. Server Action é endpoint público: por isso a sessão é
 * conferida aqui e cada caso de uso do domínio ainda aplica papel, clínica e regras.
 */
export async function executarFerramenta(nome: string, parametros: Record<string, unknown>): Promise<SaidaVoz> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    if (!Object.hasOwn(FERRAMENTAS, nome)) return { ok: false, mensagem: "Ferramenta desconhecida" };

    const saida = await FERRAMENTAS[nome]!(sessao, parametros ?? {});
    if (saida.ok && ESCRITA.has(nome)) {
      revalidatePath("/agendamentos");
      revalidatePath("/agenda");
      revalidatePath("/pacientes");
      revalidatePath("/estoque");
    }
    return saida;
  } catch (causa) {
    return falha(causa);
  }
}