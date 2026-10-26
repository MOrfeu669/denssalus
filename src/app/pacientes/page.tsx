import Link from "next/link";
import { listarPacientes } from "../../domain/paciente/casos";
import { idadeEm } from "../../domain/paciente/regras";
import { dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Pacientes, type PacienteLinha } from "./form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Pacientes</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  let resultado;
  try {
    resultado = await listarPacientes(dependenciasPaciente(), sessao);
  } catch (erro) {
    resultado = falha(erro);
  }
  if (!resultado.ok) {
    return (
      <main>
        <h1>Pacientes</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href="/pacientes">Tentar de novo</Link>
          {" · "}
          <Link href="/">Voltar</Link>
        </p>
      </main>
    );
  }

  const hoje = new Date();
  const pacientes: PacienteLinha[] = resultado.valor.map((paciente) => ({
    ...paciente,
    idade: paciente.dataNascimento ? idadeEm(paciente.dataNascimento, hoje) : null,
  }));

  return (
    <main>
      <h1>Pacientes</h1>
      <Pacientes pacientes={pacientes} />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
