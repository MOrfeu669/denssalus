import type { Sessao } from "../domain/auth/tipos";
import { lerBaseDaClinica } from "../domain/inicio/casos";
import { CascaAberta } from "./casca";
import { dependenciasInicio } from "./dependencias";
import { falha } from "./falha";
import { Inicio, InicioFalha, InicioSemSessao } from "./inicio";
import { sessaoAtual } from "./sessao";

export const dynamic = "force-dynamic";

async function abrirSessao(): Promise<{ ok: true; sessao: Sessao | null } | { ok: false; mensagem: string }> {
  try {
    return { ok: true, sessao: await sessaoAtual() };
  } catch (erro) {
    return falha(erro);
  }
}

async function lerBase(sessao: Sessao) {
  try {
    return await lerBaseDaClinica(dependenciasInicio(), sessao);
  } catch (erro) {
    return falha(erro);
  }
}

export default async function Page() {
  const aberta = await abrirSessao();
  if (!aberta.ok) {
    return (
      <CascaAberta>
        <InicioFalha mensagem={aberta.mensagem} />
      </CascaAberta>
    );
  }

  const sessao = aberta.sessao;
  if (!sessao) {
    return (
      <CascaAberta>
        <InicioSemSessao />
      </CascaAberta>
    );
  }

  const base = await lerBase(sessao);
  if (!base.ok) return <InicioFalha mensagem={base.mensagem} />;

  return <Inicio sessao={sessao} base={base.valor} />;
}
