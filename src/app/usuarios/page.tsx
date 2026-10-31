import Link from "next/link";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { listarUsuarios } from "../../domain/auth/casos";
import { CascaAberta } from "../casca";
import { dependencias } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Painel } from "./painel";
import { USUARIOS_SEM_SESSAO } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

async function carregar(sessao: Sessao) {
  try {
    return await listarUsuarios(dependencias(), sessao);
  } catch (erro) {
    return falha(erro);
  }
}

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Usuários</h1>
        <p className="casca-texto">{USUARIOS_SEM_SESSAO}</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
    );
  }

  const lista = await carregar(sessao);

  if (!lista.ok) {
    const semPermissao = lista.mensagem === MENSAGEM_PAPEL;
    return (
      <>
        <h1>Usuários</h1>
        <div className="casca-alerta" role="alert" tabIndex={-1}>
          <p>{lista.mensagem}</p>
          <Link className="casca-link" href={semPermissao ? "/" : "/usuarios"}>
            {semPermissao ? "Voltar" : "Tentar de novo"}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Usuários</h1>
      <Painel usuarios={lista.valor} atualId={sessao.usuario.id} />
      <p className="usuarios-voltar">
        <Link className="casca-link" href="/">
          Voltar
        </Link>
      </p>
    </>
  );
}
