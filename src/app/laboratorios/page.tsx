import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { listarLaboratorios } from "../../domain/protese/casos";
import { CascaAberta } from "../casca";
import { dependenciasProtese } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { FormularioLaboratorio } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  let sessao;
  try {
    sessao = await sessaoAtual();
  } catch (erro) {
    return <Falha mensagem={falha(erro).mensagem} />;
  }
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Laboratórios</h1>
        <p>Nenhuma sessão aberta.</p>
        <Link href="/login">Entrar</Link>
      </CascaAberta>
    );
  }

  try {
    const lista = await listarLaboratorios(dependenciasProtese(), sessao);
    if (!lista.ok) return <Falha mensagem={lista.mensagem} />;
    return (
      <div className="flex flex-col gap-4">
        <h1>Laboratórios</h1>
        <FormularioLaboratorio nomes={lista.valor.map((item) => item.nome)} />
      </div>
    );
  } catch (erro) {
    return <Falha mensagem={falha(erro).mensagem} />;
  }
}

function Falha({ mensagem }: { mensagem: string }) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <CascaAberta>
      <h1>Laboratórios</h1>
      <p role="alert" tabIndex={-1}>
        {mensagem}
      </p>
      <Link href={semPermissao ? "/" : "/laboratorios"}>{semPermissao ? "Voltar" : "Tentar de novo"}</Link>
    </CascaAberta>
  );
}
