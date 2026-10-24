import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { mensagemCausa } from "../../../lib/supabase/erro";

const destinoPadrao = "/recuperar/nova-senha";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = destinoSeguro(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.json(
      { code: "codigo_ausente", message: "Código de recuperação ausente" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const causa = mensagemCausa(error);
    console.error(causa ? `troca_falhou: ${causa}` : "troca_falhou");
    return NextResponse.json(
      { code: "troca_falhou", message: "Não foi possível abrir a sessão de recuperação" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return destinoPadrao;
  return next;
}
