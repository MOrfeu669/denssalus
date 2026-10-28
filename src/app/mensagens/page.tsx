import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { listarModelos } from "../../domain/mensagem/casos";
import { dependenciasMensagem } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Mensagens } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Mensagens</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  if (sessao.usuario.papel !== "admin") {
    return (
      <main>
        <h1>Mensagens</h1>
        <p role="alert" tabIndex={-1}>
          {MENSAGEM_PAPEL}
        </p>
        <p className="nav">
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  let resultado;
  try {
    resultado = await listarModelos(dependenciasMensagem(), sessao);
  } catch (erro) {
    resultado = falha(erro);
  }

  if (!resultado.ok) {
    return (
      <main>
        <h1>Mensagens</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href="/mensagens">Tentar de novo</Link>
          {" · "}
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Mensagens</h1>
      <Mensagens modelos={resultado.valor} />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
