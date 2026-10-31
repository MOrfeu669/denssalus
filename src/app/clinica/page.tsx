import Link from "next/link";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { obterClinica } from "../../domain/clinica/casos";
import { CascaAberta } from "../casca";
import { dependenciasClinica } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Clinica } from "./form";
import { CLINICA_SEM_SESSAO } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

async function carregar(sessao: Sessao) {
  try {
    return await obterClinica(dependenciasClinica(), sessao);
  } catch (erro) {
    return falha(erro);
  }
}

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Clínica</h1>
        <p className="casca-texto">{CLINICA_SEM_SESSAO}</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
    );
  }

  const resultado = await carregar(sessao);

  if (!resultado.ok) {
    const semPermissao = resultado.mensagem === MENSAGEM_PAPEL;
    return (
      <>
        <h1>Clínica</h1>
        <div className="casca-alerta" role="alert" tabIndex={-1}>
          <p>{resultado.mensagem}</p>
          <Link className="casca-link" href={semPermissao ? "/" : "/clinica"}>
            {semPermissao ? "Voltar" : "Tentar de novo"}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Clínica</h1>
      <Clinica detalhe={resultado.valor} />
      <p className="clinica-voltar">
        <Link className="casca-link" href="/">
          Voltar
        </Link>
      </p>
    </>
  );
}
