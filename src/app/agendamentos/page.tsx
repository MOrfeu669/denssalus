import { redirect } from "next/navigation";

type Query = Record<string, string | string[] | undefined>;

const primeiro = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query)) {
    const unico = primeiro(valor);
    if (unico) params.set(chave, unico);
  }
  const texto = params.toString();
  redirect(texto ? `/agenda?${texto}` : "/agenda");
}
