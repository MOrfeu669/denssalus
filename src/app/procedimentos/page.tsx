import Link from "next/link";
import { listarProcedimentos } from "../../domain/procedimento/casos";
import { dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Procedimentos } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Procedimentos</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  let resultado;
  try {
    resultado = await listarProcedimentos(dependenciasProcedimento(), sessao);
  } catch (erro) {
    resultado = falha(erro);
  }
  if (!resultado.ok) {
    return (
      <main>
        <h1>Procedimentos</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href="/procedimentos">Tentar de novo</Link>
          {" · "}
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Procedimentos</h1>
      <Procedimentos
        procedimentos={resultado.valor}
        podeExcluir={sessao.usuario.papel === "admin"}
      />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
