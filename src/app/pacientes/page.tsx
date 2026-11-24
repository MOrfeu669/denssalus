import Link from "next/link";
import type { ReactNode } from "react";
import { MENSAGEM_PAPEL, type Sessao } from "../../domain/auth/tipos";
import { CascaAberta } from "../casca";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { lerConsulta } from "./consulta";
import { Pacientes } from "./form";
import { consultarLista } from "./ler";
import "./tela.css";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

const primeiro = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

async function abrirSessao(): Promise<{ ok: true; sessao: Sessao | null } | { ok: false; mensagem: string }> {
  try {
    return { ok: true, sessao: await sessaoAtual() };
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

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
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

  const query = await searchParams;
  const consulta = lerConsulta({
    q: primeiro(query.q),
    chip: primeiro(query.chip),
    pagina: primeiro(query.pagina),
    linhas: primeiro(query.linhas),
  });

  let resultado;
  try {
    resultado = await consultarLista(sessao, consulta);
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

  return (
    <Moldura>
      <Pacientes pagina={resultado.valor} consulta={consulta} />
    </Moldura>
  );
}
