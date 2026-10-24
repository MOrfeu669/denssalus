import Link from "next/link";
import { listarUsuarios } from "../../domain/auth/casos";
import { dependencias } from "../dependencias";
import { sessaoAtual } from "../sessao";
import { Painel } from "./painel";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Usuários</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  const lista = await listarUsuarios(dependencias(), sessao);
  if (!lista.ok) {
    return (
      <main>
        <h1>Usuários</h1>
        <p role="alert" tabIndex={-1}>
          {lista.mensagem}
        </p>
        <p className="nav">
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Usuários</h1>
      <Painel usuarios={lista.valor} atualId={sessao.usuario.id} />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
