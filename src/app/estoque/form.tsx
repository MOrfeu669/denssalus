"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrarMaterial, reabastecerMaterial, vincular } from "./actions";
import { Historico } from "./historico";

export type MovimentoTela = {
  id: string;
  tipo: string;
  quantidade: number;
  usuario: string;
  registradoEm: string;
};

export type MaterialTela = {
  id: string;
  nome: string;
  quantidade: number;
  quantidadeMinima: number;
  historico: MovimentoTela[];
};

export function Estoque({
  materiais,
  procedimentos,
}: {
  materiais: MaterialTela[];
  procedimentos: { id: string; nome: string }[];
}) {
  const roteador = useRouter();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState(false);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrarMaterial, estadoVazio);
  const [reposicao, acaoReabastecer, pendenteReabastecer] = useActionState(
    reabastecerMaterial,
    estadoVazio,
  );
  const [vinculo, acaoVincular, pendenteVincular] = useActionState(vincular, estadoVazio);
  const aviso = avisoVisivel(cadastro, reposicao, vinculo);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;

  useEffect(() => {
    if (cadastro.status === "sucesso") setAberto(false);
  }, [cadastro]);

  useEffect(() => {
    if ([cadastro, reposicao, vinculo].some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, reposicao, vinculo, roteador]);

  useEffect(() => {
    if (aberto) painelRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !pendenteCadastrar) {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, pendenteCadastrar]);

  function fechar() {
    if (pendenteCadastrar) return;
    setAberto(false);
    botaoRef.current?.focus();
  }

  return (
    <>
      <div className="estoque-cabeca">
        <h1>Estoque</h1>
        <button
          ref={botaoRef}
          type="button"
          className="estoque-botao"
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={aberto ? "estoque-cadastro" : undefined}
          onClick={() => setAberto(true)}
        >
          Novo material
        </button>
      </div>
      {erroNoPainel ? null : <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} />}
      {aberto ? (
        <div className="estoque-overlay">
          <div className="estoque-overlay-fundo" onClick={fechar} />
          <section
            ref={painelRef}
            id="estoque-cadastro"
            className="estoque-painel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="estoque-titulo-novo"
            tabIndex={-1}
          >
            <div className="estoque-painel-topo">
              <h2 id="estoque-titulo-novo">Novo material</h2>
              <button type="button" className="estoque-botao estoque-botao-secundario" onClick={fechar}>
                Fechar
              </button>
            </div>
            {erroNoPainel ? <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} /> : null}
            <form
              className="estoque-form"
              key={cadastro.status === "sucesso" ? cadastro.quando : 0}
              action={acaoCadastrar}
              aria-busy={pendenteCadastrar}
            >
              <div className="estoque-campos">
                <label className="estoque-campo">
                  Nome
                  <input name="nome" required />
                </label>
                <label className="estoque-campo">
                  Quantidade
                  <input name="quantidade" type="number" min={1} step={1} required />
                </label>
                <label className="estoque-campo">
                  Quantidade mínima
                  <input name="quantidadeMinima" type="number" min={0} step={1} required />
                </label>
                <label className="estoque-campo">
                  Validade
                  <input name="validade" type="date" required />
                </label>
              </div>
              <button type="submit" className="estoque-botao" disabled={pendenteCadastrar}>
                {pendenteCadastrar ? "Salvando…" : "Cadastrar material"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
      <section className="estoque-secao" aria-labelledby="estoque-titulo-lista">
        <h2 id="estoque-titulo-lista">Materiais da clínica</h2>
        {materiais.length === 0 ? (
          <p className="estoque-vazio">Nenhum material cadastrado nesta clínica.</p>
        ) : (
          <ul className="estoque-lista">
            {materiais.map((material) => {
              const abaixo = material.quantidade < material.quantidadeMinima;
              return (
                <li
                  key={material.id}
                  className={abaixo ? "estoque-item estoque-item-abaixo abaixo" : "estoque-item"}
                >
                  <div className="estoque-resumo">
                    <span className="estoque-nome">{material.nome}</span>
                    <span className="estoque-quantidade">{`Quantidade válida: ${material.quantidade}`}</span>
                    <span className="estoque-minimo">{`Quantidade mínima: ${material.quantidadeMinima}`}</span>
                    {abaixo ? <strong className="estoque-selo">Abaixo do mínimo</strong> : null}
                  </div>
                  <form
                    className="estoque-form estoque-form-linha"
                    action={acaoReabastecer}
                    aria-busy={pendenteReabastecer}
                  >
                    <input type="hidden" name="materialId" value={material.id} />
                    <input type="hidden" name="nomeMaterial" value={material.nome} />
                    <label className="estoque-campo">
                      {`Quantidade a reabastecer de ${material.nome}`}
                      <input name="quantidade" type="number" min={1} step={1} required />
                    </label>
                    <label className="estoque-campo">
                      {`Validade do lote de ${material.nome}`}
                      <input name="validade" type="date" required />
                    </label>
                    <button
                      type="submit"
                      className="estoque-botao estoque-botao-secundario"
                      disabled={pendenteReabastecer}
                    >
                      {pendenteReabastecer ? "Salvando…" : "Reabastecer"}
                    </button>
                  </form>
                  <Historico material={material} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="estoque-secao" aria-labelledby="estoque-titulo-vinculo">
        <h2 id="estoque-titulo-vinculo">Material de cada procedimento</h2>
        <form
          className="estoque-form"
          key={vinculo.status === "sucesso" ? vinculo.quando : 1}
          action={acaoVincular}
          aria-busy={pendenteVincular}
        >
          <div className="estoque-campos">
            <label className="estoque-campo">
              Procedimento
              <select name="procedimentoId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {procedimentos.map((procedimento) => (
                  <option key={procedimento.id} value={procedimento.id}>
                    {procedimento.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="estoque-campo">
              Material
              <select name="materialId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {materiais.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="estoque-campo">
              Quantidade por consulta
              <input name="quantidade" type="number" min={1} step={1} required />
            </label>
          </div>
          <button type="submit" className="estoque-botao" disabled={pendenteVincular}>
            {pendenteVincular ? "Salvando…" : "Vincular material"}
          </button>
        </form>
      </section>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem, quando: escolhido.quando };
}
