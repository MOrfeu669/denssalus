"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { RetornoVisivel } from "../../domain/retorno/tipos";
import { estadoVazio } from "../formulario";
import { salvarPrazo } from "./actions";
import { Alerta } from "./alerta";
import {
  NOTA_LISTA,
  PENDENTE_MARCAR,
  PENDENTE_PRAZO,
  ROTULO_DATA_PREVISTA,
  ROTULO_IR_AGENDAMENTOS,
  ROTULO_MARCAR_RETORNO,
  ROTULO_PRAZO,
  ROTULO_REAGENDAR,
  ROTULO_SALVAR_PRAZO,
  TEXTO_MARCAR,
  TITULO_LISTA,
  TITULO_MARCAR,
  TITULO_PRAZO,
  VAZIO_RETORNOS,
  hrefReagendar,
  textoPrazo,
  textoPrevisto,
} from "./texto";
import "./tela.css";

export function Retornos({ retornos }: { retornos: RetornoVisivel[] }) {
  return (
    <section className="retornos-secao" aria-labelledby="retornos-lista-titulo">
      <h2 id="retornos-lista-titulo">{TITULO_LISTA}</h2>
      {retornos.length === 0 ? (
        <p className="retornos-vazio">{VAZIO_RETORNOS}</p>
      ) : (
        <>
          <p className="retornos-nota">{NOTA_LISTA}</p>
          <ul className="retornos-lista">
            {retornos.map((retorno) => (
              <li key={retorno.id} className="retornos-item">
                <div className="retornos-resumo">
                  <span className="retornos-texto">{retorno.texto}</span>
                  <span className="retornos-meta">{textoPrevisto(retorno.dataPrevista)}</span>
                </div>
                <Link className="casca-botao" href={hrefReagendar(retorno.pacienteId)}>
                  {ROTULO_REAGENDAR}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// Quem marca (admin e dentista) é levado ao agendamento: o retorno nasce de uma consulta concluída.
export function RegiaoMarcar() {
  return (
    <section className="retornos-secao" aria-labelledby="retornos-marcar-titulo">
      <h2 id="retornos-marcar-titulo">{TITULO_MARCAR}</h2>
      <p className="retornos-nota">{TEXTO_MARCAR}</p>
      <Link className="casca-botao" href="/agendamentos">
        {ROTULO_IR_AGENDAMENTOS}
      </Link>
    </section>
  );
}

export function FormularioPrazo({ prazo }: { prazo: number }) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(salvarPrazo, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <section className="retornos-secao retornos-prazo" aria-labelledby="retornos-prazo-titulo">
      <h2 id="retornos-prazo-titulo">{TITULO_PRAZO}</h2>
      <p className="retornos-prazo-aviso">{textoPrazo(prazo)}</p>
      {resultado.status === "vazio" ? null : (
        <Alerta tipo={resultado.status} mensagem={resultado.mensagem} quando={resultado.quando} />
      )}
      <form className="retornos-form" action={acao} aria-busy={pendente}>
        <label className="retornos-campo">
          {ROTULO_PRAZO}
          <input
            name="diasAntecedencia"
            type="number"
            min={1}
            step={1}
            defaultValue={prazo}
            required
          />
        </label>
        <button className="retornos-botao" type="submit" disabled={pendente}>
          {pendente ? PENDENTE_PRAZO : ROTULO_SALVAR_PRAZO}
        </button>
      </form>
    </section>
  );
}

export function FormularioMarcarRetorno({
  id,
  acao,
  pendente,
}: {
  id: string;
  acao: (formData: FormData) => void;
  pendente: boolean;
}) {
  return (
    <form className="retornos-form retornos-form-marcar" action={acao} aria-busy={pendente}>
      <input type="hidden" name="agendamentoOrigemId" value={id} />
      <label className="retornos-campo">
        {ROTULO_DATA_PREVISTA}
        <input name="dataPrevista" type="date" required />
      </label>
      <button className="retornos-botao" type="submit" disabled={pendente}>
        {pendente ? PENDENTE_MARCAR : ROTULO_MARCAR_RETORNO}
      </button>
    </form>
  );
}
