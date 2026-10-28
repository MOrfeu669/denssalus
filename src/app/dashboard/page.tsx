import Link from "next/link";
import { obterResumo } from "../../domain/dashboard/casos";
import type { VisaoDashboard } from "../../domain/dashboard/tipos";
import { dependenciasDashboard } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Painel } from "./painel";

export const dynamic = "force-dynamic";

function Erro({ mensagem }: { mensagem: string }) {
  return (
    <main>
      <h1>Dashboard</h1>
      <p role="alert" tabIndex={-1}>
        {mensagem}
      </p>
      <p className="nav">
        <Link href="/dashboard">Tentar de novo</Link>
        {" · "}
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Dashboard</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  let visao: VisaoDashboard;
  try {
    const lida = await obterResumo(dependenciasDashboard(), sessao, null, new Date());
    if (!lida.ok) return <Erro mensagem={lida.mensagem} />;
    visao = lida.valor;
  } catch (erro) {
    return <Erro mensagem={falha(erro).mensagem} />;
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <Painel
        papel={sessao.usuario.papel}
        resumo={visao.resumo}
        ocultos={visao.ocultos}
        periodoSalvo={visao.periodoSalvo}
      />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
