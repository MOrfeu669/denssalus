import { listarAgendamentos, listarOpcoesAgendamento } from "../../domain/agendamento/casos";
import type { Sessao } from "../../domain/auth/tipos";
import { CascaAberta } from "../casca";
import { dependenciasAgendamento } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { TelaFalha, TelaSemSessao } from "./estados";
import { Agendamentos } from "./form";
import "./tela.css";

export const dynamic = "force-dynamic";

const TITULO = "Agendamentos";
const CAMINHO = "/agendamentos";

type Query = Record<string, string | string[] | undefined>;

const primeiro = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

// Só pré-preenche com id que existe nas opções; id desconhecido cai no valor vazio.
function idConhecido(valor: string | undefined, ids: string[]): string {
  return valor && ids.includes(valor) ? valor : "";
}

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <CascaAberta>
        <TelaSemSessao titulo={TITULO} />
      </CascaAberta>
    );
  }

  return <>{await conteudo(query, sessao)}</>;
}

async function conteudo(query: Query, sessao: Sessao) {
  try {
    const deps = dependenciasAgendamento();
    const agendamentos = await listarAgendamentos(deps, sessao);
    if (!agendamentos.ok) return erroDeCarregamento(agendamentos.mensagem);
    const opcoes = await listarOpcoesAgendamento(deps, sessao);
    if (!opcoes.ok) return erroDeCarregamento(opcoes.mensagem);

    const inicial = {
      pacienteId: idConhecido(
        primeiro(query.paciente),
        opcoes.valor.pacientes.map((item) => item.id),
      ),
      dentistaId: idConhecido(
        primeiro(query.dentista),
        opcoes.valor.dentistas.map((item) => item.id),
      ),
      procedimentoId: idConhecido(
        primeiro(query.procedimento),
        opcoes.valor.procedimentos.map((item) => item.id),
      ),
    };

    return (
      <>
        <h1>{TITULO}</h1>
        <Agendamentos
          agendamentos={agendamentos.valor}
          opcoes={opcoes.valor}
          papel={sessao.usuario.papel}
          usuarioId={sessao.usuario.id}
          inicial={inicial}
        />
      </>
    );
  } catch (erro) {
    return erroDeCarregamento(falha(erro).mensagem);
  }
}

function erroDeCarregamento(mensagem: string) {
  return <TelaFalha titulo={TITULO} mensagem={mensagem} href={CAMINHO} />;
}
