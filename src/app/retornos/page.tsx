import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import {
  listarRetornosPendentes,
  obterPrazo,
  verificarRetornos,
} from "../../domain/retorno/casos";
import { dependenciasRetorno } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { FormularioPrazo, RegiaoMarcar, Retornos } from "./form";
import { SEM_SESSAO, TITULO } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

function SemSessao() {
  return (
    <div className="retornos-tela">
      <h1>{TITULO}</h1>
      <p className="casca-texto">{SEM_SESSAO}</p>
      <Link className="casca-botao" href="/login">
        Entrar
      </Link>
    </div>
  );
}

// Papel sem permissão mostra só o alerta e `Voltar`; qualquer outra falha oferece `Tentar de novo`.
function Falha({ mensagem }: { mensagem: string }) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <div className="retornos-tela">
      <h1>{TITULO}</h1>
      <div className="retornos-alerta retornos-alerta-erro" role="alert" tabIndex={-1}>
        <p>{mensagem}</p>
        <Link className="casca-botao" href={semPermissao ? "/" : "/retornos"}>
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
    return <Falha mensagem={falha(erro).mensagem} />;
  }
  if (!sessao) return <SemSessao />;

  const papel = sessao.usuario.papel;
  let resultado;
  let prazo = 0;
  try {
    const deps = dependenciasRetorno();
    await verificarRetornos(deps, new Date());
    resultado = await listarRetornosPendentes(deps, sessao);
    if (papel === "admin") {
      prazo = await obterPrazo(deps, sessao.usuario.clinicaId);
    }
  } catch (erro) {
    resultado = falha(erro);
  }
  if (!resultado.ok) return <Falha mensagem={resultado.mensagem} />;

  return (
    <div className="retornos-tela">
      <h1>{TITULO}</h1>
      <div className="retornos-regioes">
        <Retornos retornos={resultado.valor} />
        {papel === "admin" || papel === "dentista" ? <RegiaoMarcar /> : null}
        {papel === "admin" ? <FormularioPrazo prazo={prazo} /> : null}
      </div>
      <p className="retornos-voltar">
        <Link className="casca-link" href="/">
          Voltar
        </Link>
      </p>
    </div>
  );
}
