import Link from "next/link";
import type { ReactNode } from "react";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { listarProcedimentos } from "../../domain/procedimento/casos";
import { CascaAberta } from "../casca";
import { dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Procedimentos } from "./form";
import { NOTA_ESTIMATIVA } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

async function abrirSessao(): Promise<{ ok: true; sessao: Sessao | null } | { ok: false; mensagem: string }> {
  try {
    return { ok: true, sessao: await sessaoAtual() };
  } catch (erro) {
    return falha(erro);
  }
}

function Falha({ mensagem }: { mensagem: string }) {
  return (
    <>
      <h1>Procedimentos</h1>
      <div className="procedimentos-alerta" role="alert" tabIndex={-1}>
        <p>{mensagem}</p>
        <Link className="casca-botao" href="/procedimentos">
          Tentar de novo
        </Link>
      </div>
    </>
  );
}

function SemPermissao() {
  return (
    <>
      <h1>Procedimentos</h1>
      <div className="procedimentos-alerta" role="alert" tabIndex={-1}>
        <p>{MENSAGEM_PAPEL}</p>
        <Link className="casca-botao" href="/">
          Voltar
        </Link>
      </div>
    </>
  );
}

function SemSessao() {
  return (
    <>
      <h1>Procedimentos</h1>
      <p className="casca-texto">Nenhuma sessão aberta.</p>
      <Link className="casca-botao" href="/login">
        Entrar
      </Link>
    </>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  return <div className="procedimentos-tela">{children}</div>;
}

export default async function Page() {
  const aberta = await abrirSessao();
  if (!aberta.ok) {
    return (
      <CascaAberta>
        <Falha mensagem={aberta.mensagem} />
      </CascaAberta>
    );
  }

  const sessao = aberta.sessao;
  if (!sessao) {
    return (
      <CascaAberta>
        <SemSessao />
      </CascaAberta>
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
      <Moldura>
        {resultado.mensagem === MENSAGEM_PAPEL ? <SemPermissao /> : <Falha mensagem={resultado.mensagem} />}
      </Moldura>
    );
  }

  return (
    <Moldura>
      <h1>Procedimentos</h1>
      <p className="procedimentos-nota">{NOTA_ESTIMATIVA}</p>
      <Procedimentos
        procedimentos={resultado.valor}
        podeExcluir={sessao.usuario.papel === "admin"}
      />
    </Moldura>
  );
}
