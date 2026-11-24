"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Bloco, Valores, data, moeda } from "./blocos";
import { CamposDoPapel, ROTULOS_CAMPO } from "./campos-papel";

type AvisoTela = { tipo: "erro" | "sucesso"; mensagem: string; quando: number };

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
    <div className="dashboard-painel">
      {aviso ? <Aviso key={aviso.quando} tipo={aviso.tipo} mensagem={aviso.mensagem} /> : null}

      <section className="dashboard-periodo" aria-labelledby="dashboard-titulo-periodo" aria-busy={pendente}>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 id="dashboard-titulo-periodo">Período</h2>
            <p className="dashboard-periodo-texto">{`Período: ${data(resumo.periodo.inicio)} a ${data(resumo.periodo.fim)}`}</p>
            <div className="dashboard-acoes">
              <Button
                type="button"
                variant="outline"
                className="dashboard-botao-secundario"
                aria-pressed={periodoSalvo === "mes"}
                disabled={pendente}
                onClick={() => escolherPeriodo("mes")}
              >
                Mês atual
              </Button>
              <Button
                type="button"
                variant="outline"
                className="dashboard-botao-secundario"
                aria-pressed={periodoSalvo === "7dias"}
                disabled={pendente}
                onClick={() => escolherPeriodo("7dias")}
              >
                Últimos 7 dias
              </Button>
            </div>
            <form className="dashboard-form dashboard-form-linha" onSubmit={aplicarIntervalo}>
              <Label className="dashboard-campo">
                Início
                <Input name="inicio" type="date" required />
              </Label>
              <Label className="dashboard-campo">
                Fim
                <Input name="fim" type="date" required />
              </Label>
              <Button type="submit" className="dashboard-botao" disabled={pendente}>
                Aplicar período
              </Button>
            </form>
            <div className="dashboard-acoes dashboard-exportar">
              <Button
                type="button"
                variant="outline"
                className="dashboard-botao-secundario"
                disabled={pendente}
                onClick={() => exportarComo("pdf")}
              >
                Exportar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="dashboard-botao-secundario"
                disabled={pendente}
                onClick={() => exportarComo("excel")}
              >
                Exportar Excel
              </Button>
            </div>
            <p className="dashboard-nota">Ocultar um bloco vale só para a sua visão.</p>
          </CardContent>
        </Card>
      </section>

      <Bloco campo="faturamento" titulo={ROTULOS_CAMPO.faturamento} {...bloco}>
        <p className="dashboard-numero">{moeda(resumo.faturado)}</p>
      </Bloco>
      <Bloco campo="detalhe" titulo={ROTULOS_CAMPO.detalhe} {...bloco}>
        {semDetalhe ? <p className="dashboard-vazio">Nenhum faturamento no período</p> : null}
        <Valores
          titulo="Por dentista"
          vazio="Nenhum faturamento por dentista no período"
          itens={resumo.porDentista.map((item) => ({ id: item.dentistaId, valor: item.valor }))}
        />
        <Valores
          titulo="Por procedimento"
          vazio="Nenhum faturamento por procedimento no período"
          itens={resumo.porProcedimento.map((item) => ({
            id: item.procedimentoId,
            valor: item.valor,
          }))}
        />
      </Bloco>
      <Bloco campo="recebido" titulo={ROTULOS_CAMPO.recebido} {...bloco}>
        <p className="dashboard-numero">{moeda(resumo.recebido)}</p>
      </Bloco>
      <Bloco campo="despesa" titulo={ROTULOS_CAMPO.despesa} {...bloco}>
        <p className="dashboard-numero">{moeda(resumo.despesaProtese)}</p>
        <p className="dashboard-nota">Fora do faturamento.</p>
      </Bloco>
      <Bloco campo="ocupacao" titulo={ROTULOS_CAMPO.ocupacao} {...bloco}>
        <p className="dashboard-numero">{`${resumo.ocupacao}%`}</p>
      </Bloco>
      <Bloco campo="estoque" titulo={ROTULOS_CAMPO.estoque} {...bloco}>
        {resumo.estoque.length === 0 ? (
          <p className="dashboard-vazio">Nenhum material abaixo do mínimo</p>
        ) : (
          <ul className="dashboard-alertas">
            {resumo.estoque.map((item) => (
              <li key={item.materialId} className="dashboard-alerta abaixo">
                <Badge variant="destructive" className="border-perigo bg-card text-perigo-tinta">
                  Abaixo do mínimo
                </Badge>
                <span>{`${item.nome} — ${item.quantidade} unidades restantes`}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      {papel === "admin" ? <CamposDoPapel pendente={pendente} executar={executar} /> : null}
    </div>
  );
}
