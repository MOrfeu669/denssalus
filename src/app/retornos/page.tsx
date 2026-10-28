import Link from "next/link";
import {
  listarRetornosPendentes,
  obterPrazo,
  verificarRetornos,
} from "../../domain/retorno/casos";
import { dependenciasRetorno } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { FormularioPrazo, Retornos } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Retornos</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  let resultado;
  let prazo = 0;
  try {
    const deps = dependenciasRetorno();
    await verificarRetornos(deps, new Date());
    resultado = await listarRetornosPendentes(deps, sessao);
    if (sessao.usuario.papel === "admin") {
      prazo = await obterPrazo(deps, sessao.usuario.clinicaId);
    }
  } catch (erro) {
    resultado = falha(erro);
  }
  if (!resultado.ok) {
    return (
      <main>
        <h1>Retornos</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href="/retornos">Tentar de novo</Link>
          {" · "}
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Retornos</h1>
      <Retornos retornos={resultado.valor} />
      {sessao.usuario.papel === "admin" ? <FormularioPrazo prazo={prazo} /> : null}
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
