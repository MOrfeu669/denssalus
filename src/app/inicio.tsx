import Link from "next/link";
import { cn } from "@/lib/utils";
import { MENSAGEM_PAPEL, type Sessao } from "../domain/auth/tipos";
import type { BaseDaClinica } from "../domain/inicio/tipos";
import { menuDaCasca, rotuloPapel } from "./casca-menu";
import { guiaDoInicio, type GuiaDoInicio } from "./inicio-guia";
import { IconeOk } from "./login/icones";

function Passos({ guia }: { guia: Extract<GuiaDoInicio, { tipo: "passos" }> }) {
  return (
    <ol id="guia-passos" aria-labelledby="guia-titulo" className="m-0 flex max-w-[560px] flex-col gap-3 p-0">
      {guia.passos.map((passo, indice) => {
        const concluido = indice < guia.atual;
        const atual = indice === guia.atual;
        return (
          <li
            key={passo.href}
            className={cn(
              "flex flex-col items-start gap-3 rounded-2xl border bg-white p-4 max-[600px]:items-stretch min-[601px]:min-h-16 min-[601px]:flex-row min-[601px]:items-center min-[601px]:justify-between",
              concluido ? "border-ok bg-ok-fundo" : atual ? "border-acao shadow-[0_0_0_2px_#d3f3ec]" : "border-linha",
            )}
          >
            <span className="flex items-center gap-3 text-base leading-6 font-semibold text-tinta">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
                  concluido ? "bg-ok text-white" : atual ? "bg-acao text-white" : "bg-[#e8eef0] text-apagado",
                )}
              >
                {concluido ? <IconeOk cor="#fff" /> : indice + 1}
              </span>
              {concluido ? passo.rotulo : null}
              {atual ? <span>{passo.rotulo}</span> : null}
              {!concluido && !atual ? (
                <Link className="casca-link" href={passo.href}>
                  {passo.rotulo}
                </Link>
              ) : null}
            </span>
            {concluido ? <span className="text-[13px] leading-[18px] font-semibold text-ok-tinta">Concluído</span> : null}
            {atual ? (
              <Link className="casca-botao max-[600px]:w-full max-[600px]:justify-center" href={passo.href}>
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
    <div className="flex max-w-[720px] flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] leading-9 font-bold tracking-[-0.005em] text-tinta">Início</h1>
        <p className="m-0 text-sm leading-5 text-apagado">
          Olá, <span className="font-semibold text-tinta">{nome}</span> · {rotuloPapel(papel)}
        </p>
      </header>

      <section aria-labelledby="guia-titulo" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="guia-titulo" className="!m-0 text-lg leading-6 font-bold text-tinta">
            Guia do caminho mínimo
          </h2>
          {guia.tipo === "passos" ? (
            <p className="m-0 max-w-[560px] text-sm leading-5 text-apagado">
              Siga esta ordem para colocar a agenda da clínica para funcionar.
            </p>
          ) : null}
        </div>
        {guia.tipo === "aguardando" ? (
          <p className="m-0 max-w-[560px] rounded-2xl border border-linha bg-white p-4 text-base leading-6 text-tinta">
            {guia.texto}
          </p>
        ) : (
          <Passos guia={guia} />
        )}
      </section>

      <MenuDoInicio papel={papel} />
    </div>
  );
}

function MenuDoInicio({ papel }: { papel: Sessao["usuario"]["papel"] }) {
  return (
    <nav aria-labelledby="atalhos-titulo" className="flex max-w-[720px] flex-col gap-3">
      <h2 id="atalhos-titulo" className="!m-0 text-lg leading-6 font-bold text-tinta">
        Atalhos
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {menuDaCasca(papel).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-linha bg-white px-3 py-2 font-semibold text-marca no-underline hover:bg-nevoa"
            >
              {item.rotulo}
            </Link>
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
