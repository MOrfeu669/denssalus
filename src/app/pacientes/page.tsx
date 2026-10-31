import Link from "next/link";
import type { ReactNode } from "react";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { lerBaseDaClinica } from "../../domain/inicio/casos";
import { listarPacientes } from "../../domain/paciente/casos";
import { idadeEm } from "../../domain/paciente/regras";
import { CascaAberta } from "../casca";
import { dependenciasInicio, dependenciasPaciente } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Pacientes, type PacienteLinha } from "./form";
import "./tela.css";

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

function Falha({ mensagem }: { mensagem: string }) {
  return (
    <>
      <h1>Pacientes</h1>
      <div className="pacientes-alerta" role="alert" tabIndex={-1}>
        <p>{mensagem}</p>
        <Link className="casca-botao" href="/pacientes">
          Tentar de novo
        </Link>
      </div>
    </>
  );
}

function SemPermissao() {
  return (
    <>
      <h1>Pacientes</h1>
      <div className="pacientes-alerta" role="alert" tabIndex={-1}>
        <p>{MENSAGEM_PAPEL}</p>
        <Link className="casca-botao" href="/">
          Voltar
        </Link>
      </div>
    </>
  );
}

function SemSessao() {
  return (
    <>
      <h1>Pacientes</h1>
      <p className="casca-texto">Nenhuma sessão aberta.</p>
      <Link className="casca-botao" href="/login">
        Entrar
      </Link>
    </>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  return <div className="pacientes-tela">{children}</div>;
}

export default async function Page() {
  const aberta = await abrirSessao();
  if (!aberta.ok) {
    return (
      <CascaAberta>
        <Falha mensagem={aberta.mensagem} />
      </CascaAberta>
    );
  }

  const sessao = aberta.sessao;
  if (!sessao) {
    return (
      <CascaAberta>
        <SemSessao />
      </CascaAberta>
    );
  }

  const base = await lerBase(sessao);
  if (!base.ok && base.mensagem === MENSAGEM_PAPEL) {
    return (
      <Moldura>
        <SemPermissao />
      </Moldura>
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
      <Moldura>
        {resultado.mensagem === MENSAGEM_PAPEL ? <SemPermissao /> : <Falha mensagem={resultado.mensagem} />}
      </Moldura>
    );
  }

  const hoje = new Date();
  const pacientes: PacienteLinha[] = resultado.valor.map((paciente) => ({
    ...paciente,
    idade: paciente.dataNascimento ? idadeEm(paciente.dataNascimento, hoje) : null,
  }));

  return (
    <Moldura>
      <h1>Pacientes</h1>
      <p className="pacientes-nota">Nome completo e ao menos um canal de comunicação são obrigatórios.</p>
      <Pacientes pacientes={pacientes} />
      <p className="pacientes-voltar">
        <Link className="casca-link" href="/">
          Voltar
        </Link>
      </p>
    </Moldura>
  );
}
