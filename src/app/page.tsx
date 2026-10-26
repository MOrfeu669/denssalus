import Link from "next/link";
import { sair } from "./auth/actions";
import { sessaoAtual } from "./sessao";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();

  if (!sessao) {
    return (
      <main>
        <h1>Sessão</h1>
        <p>Nenhuma sessão aberta.</p>
        <p className="nav">
          <Link className="acao" href="/login">
            Entrar
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Sessão aberta</h1>
      <p>
        {sessao.usuario.nome} · papel {sessao.usuario.papel} · clínica {sessao.usuario.clinicaId}
      </p>
      <form action={sair}>
        <button type="submit">Sair</button>
      </form>
      <p className="nav">
        {sessao.usuario.papel === "admin" ? (
          <>
            <Link href="/usuarios">Usuários</Link>
            {" · "}
            <Link href="/clinica">Clínica</Link>
            {" · "}
            <Link href="/dentistas">Dentistas</Link>
            {" · "}
          </>
        ) : null}
        {sessao.usuario.papel === "admin" || sessao.usuario.papel === "dentista" ? (
          <>
            <Link href="/procedimentos">Procedimentos</Link>
            {" · "}
          </>
        ) : null}
        <Link href="/pacientes">Pacientes</Link>
      </p>
    </main>
  );
}
