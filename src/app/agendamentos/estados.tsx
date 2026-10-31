import Link from "next/link";
import type { Sessao } from "../../domain/auth/tipos";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { lerBaseDaClinica } from "../../domain/inicio/casos";
import { dependenciasInicio } from "../dependencias";
import { falha } from "../falha";
import { Alerta } from "./alerta";
import { SEM_SESSAO } from "./texto";

// null quando a leitura falha: a Casca aparece sem o nome da clínica.
export async function nomeDaClinica(sessao: Sessao): Promise<string | null> {
  try {
    const base = await lerBaseDaClinica(dependenciasInicio(), sessao);
    return base.ok ? base.valor.nome : null;
  } catch (erro) {
    falha(erro);
    return null;
  }
}

export function TelaSemSessao({ titulo }: { titulo: string }) {
  return (
    <>
      <h1>{titulo}</h1>
      <p className="casca-texto">{SEM_SESSAO}</p>
      <Link className="casca-botao" href="/login">
        Entrar
      </Link>
    </>
  );
}

// Papel sem permissão mostra só o alerta e `Voltar`; qualquer outra falha oferece `Tentar de novo`.
export function TelaFalha({
  titulo,
  mensagem,
  href,
}: {
  titulo: string;
  mensagem: string;
  href: string;
}) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <>
      <h1>{titulo}</h1>
      <div className="casca-alerta">
        <Alerta tipo="erro" mensagem={mensagem} />
        <Link className="casca-botao" href={semPermissao ? "/" : href}>
          {semPermissao ? "Voltar" : "Tentar de novo"}
        </Link>
      </div>
    </>
  );
}
