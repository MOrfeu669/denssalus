import Link from "next/link";
import { listarAgendamentos, listarOpcoesAgendamento } from "../../domain/agendamento/casos";
import { dependenciasAgendamento } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Agendamentos } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Agendamentos</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  try {
    const deps = dependenciasAgendamento();
    const agendamentos = await listarAgendamentos(deps, sessao);
    if (!agendamentos.ok) return erroDeCarregamento(agendamentos.mensagem);
    const opcoes = await listarOpcoesAgendamento(deps, sessao);
    if (!opcoes.ok) return erroDeCarregamento(opcoes.mensagem);

    return (
      <main>
        <h1>Agendamentos</h1>
        <Agendamentos
          agendamentos={agendamentos.valor}
          opcoes={opcoes.valor}
          papel={sessao.usuario.papel}
          usuarioId={sessao.usuario.id}
        />
        <p className="nav">
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  } catch (erro) {
    return erroDeCarregamento(falha(erro).mensagem);
  }
}

function erroDeCarregamento(mensagem: string) {
  return (
    <main>
      <h1>Agendamentos</h1>
      <p role="alert" tabIndex={-1}>
        {mensagem}
      </p>
      <p className="nav">
        <Link href="/agendamentos">Tentar de novo</Link>
        {" · "}
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
