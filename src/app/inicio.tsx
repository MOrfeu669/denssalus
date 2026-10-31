import Link from "next/link";
import { MENSAGEM_PAPEL, type Sessao } from "../domain/auth/tipos";
import type { BaseDaClinica } from "../domain/inicio/tipos";
import { menuDaCasca, rotuloPapel } from "./casca-menu";
import { guiaDoInicio, type GuiaDoInicio } from "./inicio-guia";

function Passos({ guia }: { guia: Extract<GuiaDoInicio, { tipo: "passos" }> }) {
  return (
    <ol className="casca-guia" aria-label="Guia do caminho mínimo">
      {guia.passos.map((passo, indice) => {
        const concluido = indice < guia.atual;
        const atual = indice === guia.atual;
        const classe = concluido
          ? "casca-passo casca-passo-concluido"
          : atual
            ? "casca-passo casca-passo-atual"
            : "casca-passo";
        return (
          <li key={passo.href} className={classe}>
            <span className="casca-passo-rotulo">
              <span className="casca-passo-numero" aria-hidden="true">
                {indice + 1}
              </span>
              {concluido ? passo.rotulo : null}
              {!concluido && !atual ? (
                <Link className="casca-link" href={passo.href}>
                  {passo.rotulo}
                </Link>
              ) : null}
            </span>
            {concluido ? <span className="casca-passo-estado">Concluído</span> : null}
            {atual ? (
              <Link className="casca-botao" href={passo.href}>
                {passo.rotulo}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function Inicio({ sessao, base }: { sessao: Sessao; base: BaseDaClinica }) {
  const { nome, papel } = sessao.usuario;
  const guia = guiaDoInicio(papel, base);
  return (
    <>
      <h1>Início</h1>
      <p className="casca-quem">
        {nome} · {rotuloPapel(papel)}
      </p>
      {guia.tipo === "aguardando" ? (
        <p className="casca-aviso">{guia.texto}</p>
      ) : (
        <Passos guia={guia} />
      )}
      <MenuDoInicio papel={papel} />
    </>
  );
}

function MenuDoInicio({ papel }: { papel: Sessao["usuario"]["papel"] }) {
  return (
    <nav className="casca-atalhos" aria-label="Menu">
      <ul>
        {menuDaCasca(papel).map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.rotulo}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function InicioSemSessao() {
  return (
    <>
      <h1>Início</h1>
      <p className="casca-texto">Nenhuma sessão aberta.</p>
      <Link className="casca-botao" href="/login">
        Entrar
      </Link>
    </>
  );
}

export function InicioFalha({ mensagem }: { mensagem: string }) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <>
      <h1>Início</h1>
      <div className="casca-alerta" role="alert" tabIndex={-1} autoFocus>
        <p>{mensagem}</p>
        <Link className="casca-botao" href="/">
          {semPermissao ? "Voltar" : "Tentar de novo"}
        </Link>
      </div>
    </>
  );
}
