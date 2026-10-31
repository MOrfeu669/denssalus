import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { listarModelos } from "../../domain/mensagem/casos";
import { Aviso } from "../aviso";
import { CascaAberta } from "../casca";
import { dependenciasMensagem } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Mensagens } from "./form";
import { MENSAGENS_NOTA_ENVIO } from "./texto";
import "./tela.css";

export const dynamic = "force-dynamic";

function Alerta({ mensagem, href, rotulo }: { mensagem: string; href: string; rotulo: string }) {
  return (
    <div className="mensagens-tela">
      <h1>Mensagens</h1>
      <div className="mensagens-alerta">
        <Aviso tipo="erro" mensagem={mensagem} />
        <Link className="casca-botao" href={href}>
          {rotulo}
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
    return <Alerta mensagem={falha(erro).mensagem} href="/mensagens" rotulo="Tentar de novo" />;
  }
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Mensagens</h1>
        <p className="casca-texto">Nenhuma sessão aberta.</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
    );
  }

  if (sessao.usuario.papel !== "admin") {
    return <Alerta mensagem={MENSAGEM_PAPEL} href="/" rotulo="Voltar" />;
  }

  let resultado;
  try {
    resultado = await listarModelos(dependenciasMensagem(), sessao);
  } catch (erro) {
    resultado = falha(erro);
  }

  if (!resultado.ok) {
    return <Alerta mensagem={resultado.mensagem} href="/mensagens" rotulo="Tentar de novo" />;
  }

  return (
    <div className="mensagens-tela">
      <h1>Mensagens</h1>
      <p className="mensagens-nota">{MENSAGENS_NOTA_ENVIO}</p>
      <Mensagens modelos={resultado.valor} />
    </div>
  );
}
