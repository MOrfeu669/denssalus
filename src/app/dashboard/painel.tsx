"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { CampoDashboard, ResumoDashboard } from "../../domain/dashboard/tipos";
import { Aviso } from "../aviso";
import {
  exportarResumo,
  salvarPreferencia,
  type FormatoExportacao,
  type Papel,
  type RespostaDashboard,
} from "./actions";
import { baixarArquivo } from "./baixar";
import { CamposDoPapel } from "./campos-papel";

type AvisoTela = { tipo: "erro" | "sucesso"; mensagem: string; quando: number };

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Bloco({
  campo,
  titulo,
  ocultos,
  pendente,
  ocultar,
  children,
}: {
  campo: CampoDashboard;
  titulo: string;
  ocultos: CampoDashboard[];
  pendente: boolean;
  ocultar: (campo: CampoDashboard) => void;
  children: ReactNode;
}) {
  if (ocultos.includes(campo)) return null;
  const id = `bloco-${campo}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
      <button type="button" aria-describedby={id} disabled={pendente} onClick={() => ocultar(campo)}>
        Ocultar
      </button>
    </section>
  );
}

function Valores({ titulo, itens }: { titulo: string; itens: { id: string; valor: number }[] }) {
  if (itens.length === 0) return null;
  return (
    <ul className="lista" aria-label={titulo}>
      {itens.map((item) => (
        <li key={item.id}>{`${item.id} — ${moeda(item.valor)}`}</li>
      ))}
    </ul>
  );
}

export function Painel({
  papel,
  resumo,
  ocultos,
  periodoSalvo,
}: {
  papel: Papel;
  resumo: ResumoDashboard;
  ocultos: CampoDashboard[];
  periodoSalvo: string;
}) {
  const roteador = useRouter();
  const [pendente, setPendente] = useState(false);
  const [aviso, setAviso] = useState<AvisoTela | null>(null);

  async function executar(acao: () => Promise<RespostaDashboard>, sucesso: string) {
    setPendente(true);
    setAviso(null);
    try {
      const resposta = await acao();
      if (resposta.ok) {
        setAviso({ tipo: "sucesso", mensagem: sucesso, quando: Date.now() });
        roteador.refresh();
      } else setAviso({ tipo: "erro", mensagem: resposta.mensagem, quando: Date.now() });
    } catch {
      setAviso({ tipo: "erro", mensagem: "Não foi possível concluir a ação", quando: Date.now() });
    } finally {
      setPendente(false);
    }
  }

  const escolherPeriodo = (periodo: string) =>
    executar(() => salvarPreferencia(ocultos, periodo), "Período aplicado");

  function aplicarIntervalo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    escolherPeriodo(`${String(dados.get("inicio") ?? "")}/${String(dados.get("fim") ?? "")}`);
  }

  async function exportarComo(formato: FormatoExportacao) {
    setPendente(true);
    setAviso(null);
    try {
      const resposta = await exportarResumo(periodoSalvo, formato);
      if (resposta.ok) baixarArquivo(resposta.base64, resposta.nome, resposta.mediaType);
      else setAviso({ tipo: "erro", mensagem: resposta.mensagem, quando: Date.now() });
    } catch {
      setAviso({ tipo: "erro", mensagem: "Não foi possível concluir a ação", quando: Date.now() });
    } finally {
      setPendente(false);
    }
  }

  const ocultar = (campo: CampoDashboard) =>
    executar(() => salvarPreferencia([...ocultos, campo], periodoSalvo), "Bloco ocultado");
  const bloco = { ocultos, pendente, ocultar };
  const semDetalhe = resumo.porDentista.length === 0 && resumo.porProcedimento.length === 0;

  return (
    <>
      {aviso ? <Aviso key={aviso.quando} tipo={aviso.tipo} mensagem={aviso.mensagem} /> : null}

      <section aria-label="Período" aria-busy={pendente}>
        <p>{`Período: ${resumo.periodo.inicio} a ${resumo.periodo.fim}`}</p>
        <button type="button" disabled={pendente} onClick={() => escolherPeriodo("mes")}>
          Mês atual
        </button>
        <button type="button" disabled={pendente} onClick={() => escolherPeriodo("7dias")}>
          Últimos 7 dias
        </button>
        <form onSubmit={aplicarIntervalo}>
          <label>
            Início
            <input name="inicio" type="date" required />
          </label>
          <label>
            Fim
            <input name="fim" type="date" required />
          </label>
          <button type="submit" disabled={pendente}>
            Aplicar período
          </button>
        </form>
        <button type="button" disabled={pendente} onClick={() => exportarComo("pdf")}>
          Exportar PDF
        </button>
        <button type="button" disabled={pendente} onClick={() => exportarComo("excel")}>
          Exportar Excel
        </button>
      </section>

      <Bloco campo="faturamento" titulo="Faturamento" {...bloco}>
        <p>{moeda(resumo.faturado)}</p>
      </Bloco>
      <Bloco campo="recebido" titulo="Recebido" {...bloco}>
        <p>{moeda(resumo.recebido)}</p>
      </Bloco>
      <Bloco campo="despesa" titulo="Despesa de prótese" {...bloco}>
        <p>{moeda(resumo.despesaProtese)}</p>
      </Bloco>
      <Bloco campo="ocupacao" titulo="Ocupação" {...bloco}>
        <p>{`${resumo.ocupacao}%`}</p>
      </Bloco>
      <Bloco campo="estoque" titulo="Estoque" {...bloco}>
        {resumo.estoque.length === 0 ? (
          <p>Nenhum material abaixo do mínimo</p>
        ) : (
          <ul className="lista">
            {resumo.estoque.map((item) => (
              <li key={item.materialId} className="alerta">
                {`${item.nome} — ${item.quantidade} unidades restantes`}
              </li>
            ))}
          </ul>
        )}
      </Bloco>
      <Bloco campo="detalhe" titulo="Detalhe" {...bloco}>
        {semDetalhe ? <p>Nenhum faturamento no período</p> : null}
        <Valores
          titulo="Por dentista"
          itens={resumo.porDentista.map((item) => ({ id: item.dentistaId, valor: item.valor }))}
        />
        <Valores
          titulo="Por procedimento"
          itens={resumo.porProcedimento.map((item) => ({
            id: item.procedimentoId,
            valor: item.valor,
          }))}
        />
      </Bloco>

      {papel === "admin" ? <CamposDoPapel pendente={pendente} executar={executar} /> : null}
    </>
  );
}
