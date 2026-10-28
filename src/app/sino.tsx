import type { Sessao } from "../domain/auth/tipos";
import { listarVisiveis } from "../domain/notificacao/casos";
import type { Notificacao } from "../domain/notificacao/tipos";
import { dependenciasNotificacao } from "./dependencias";
import { falha } from "./falha";
import { SinoPainel } from "./sino-painel";

export async function Sino({ sessao }: { sessao: Sessao }) {
  let notificacoes: Notificacao[] = [];
  let erro = "";

  try {
    notificacoes = await listarVisiveis(
      dependenciasNotificacao(),
      sessao.usuario.clinicaId,
      sessao.usuario.id,
    );
  } catch (causa) {
    erro = falha(causa).mensagem;
  }

  return <SinoPainel notificacoes={notificacoes} erro={erro} />;
}
