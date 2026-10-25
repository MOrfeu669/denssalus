import Link from "next/link";
import { obterClinica } from "../../domain/clinica/casos";
import { dependenciasClinica } from "../dependencias";
import { sessaoAtual } from "../sessao";
import { Clinica } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Clínica</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  const resultado = await obterClinica(dependenciasClinica(), sessao);
  if (!resultado.ok) {
    return (
      <main>
        <h1>Clínica</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Clínica</h1>
      <Clinica detalhe={resultado.valor} />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
