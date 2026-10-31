import Link from "next/link";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { listarDentistas } from "../../domain/dentista/casos";
import { CascaAberta } from "../casca";
import { dependenciasDentista } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Dentistas } from "./form";
import { DENTISTAS_SEM_SESSAO } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

async function carregar(sessao: Sessao) {
  try {
    return await listarDentistas(dependenciasDentista(), sessao);
  } catch (erro) {
    return falha(erro);
  }
}

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Dentistas</h1>
        <p className="casca-texto">{DENTISTAS_SEM_SESSAO}</p>
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
        <h1>Dentistas</h1>
        <div className="casca-alerta" role="alert" tabIndex={-1}>
          <p>{resultado.mensagem}</p>
          <Link className="casca-link" href={semPermissao ? "/" : "/dentistas"}>
            {semPermissao ? "Voltar" : "Tentar de novo"}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Dentistas</h1>
      <Dentistas dentistas={resultado.valor} />
      <p className="dentistas-voltar">
        <Link className="casca-link" href="/">
          Voltar
        </Link>
      </p>
    </>
  );
}
