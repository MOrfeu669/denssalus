import { ErroAplicacao, mensagemCausa } from "../lib/supabase/erro";

export function falha(erro: unknown): { ok: false; mensagem: string } {
  if (erro instanceof ErroAplicacao) {
    const causa = mensagemCausa(erro.cause);
    console.error(causa ? `${erro.message}: ${causa}` : erro.message);
    return { ok: false, mensagem: erro.message };
  }
  console.error(erro instanceof Error ? erro.message : "erro");
  return { ok: false, mensagem: "Não foi possível concluir a ação" };
}
