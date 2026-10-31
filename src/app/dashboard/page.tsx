import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { obterResumo } from "../../domain/dashboard/casos";
import type { VisaoDashboard } from "../../domain/dashboard/tipos";
import { Aviso } from "../aviso";
import { CascaAberta } from "../casca";
import { dependenciasDashboard } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Painel } from "./painel";
import "./tela.css";

export const dynamic = "force-dynamic";

function Erro({ mensagem }: { mensagem: string }) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <div className="dashboard-tela">
      <h1>Dashboard</h1>
      <div className="dashboard-alerta-tela">
        <Aviso tipo="erro" mensagem={mensagem} />
        <Link className="casca-botao" href={semPermissao ? "/" : "/dashboard"}>
          {semPermissao ? "Voltar" : "Tentar de novo"}
        </Link>
      </div>
    </div>
  );
}

export default async function Page() {
  let sessao;
  try {
    sessao = await sessaoAtual();
  } catch (erro) {
    return <Erro mensagem={falha(erro).mensagem} />;
  }
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Dashboard</h1>
        <p className="casca-texto">Nenhuma sessão aberta.</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
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
    <div className="dashboard-tela">
      <h1>Dashboard</h1>
      <Painel
        papel={sessao.usuario.papel}
        resumo={visao.resumo}
        ocultos={visao.ocultos}
        periodoSalvo={visao.periodoSalvo}
      />
    </div>
  );
}
