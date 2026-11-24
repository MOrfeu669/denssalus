"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApresentacaoDashboard, CampoDashboard, ResumoDashboard } from "../../domain/dashboard/tipos";
import { Aviso } from "../aviso";
import { exportarResumo, salvarPreferencia, type FormatoExportacao, type Papel, type RespostaDashboard } from "./actions";
import { baixarArquivo } from "./baixar";
import { CamposDoPapel } from "./campos-papel";
import { data, subtituloDashboard } from "./formato";
import { GraficoDiario } from "./grafico";
import { EstoqueCritico, Kpis, PorDentista, PorProcedimento, oculto } from "./secoes";

type AvisoTela = { tipo: "erro" | "sucesso"; mensagem: string; quando: number };

const PERIODOS = [
  ["hoje", "Hoje"],
  ["7dias", "7 dias"],
  ["mes", "Mês"],
] as const;

export function Painel({
  papel,
  resumo,
  apresentacao,
  ocultos,
  periodoSalvo,
  agora,
}: {
  papel: Papel;
  resumo: ResumoDashboard;
  apresentacao: ApresentacaoDashboard;
  ocultos: CampoDashboard[];
  periodoSalvo: string;
  agora: string;
}) {
  const roteador = useRouter();
  const [pendente, setPendente] = useState(false);
  const [aviso, setAviso] = useState<AvisoTela | null>(null);
  const [personalizado, setPersonalizado] = useState(periodoSalvo.includes("/"));
  const instante = new Date(agora);

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

  function escolherPeriodo(periodo: string) {
    if (periodo === "personalizado") {
      setPersonalizado(true);
      return;
    }
    setPersonalizado(false);
    void executar(() => salvarPreferencia(ocultos, periodo), "Período aplicado");
  }

  function aplicarIntervalo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    void executar(
      () => salvarPreferencia(ocultos, `${String(dados.get("inicio") ?? "")}/${String(dados.get("fim") ?? "")}`),
      "Período aplicado",
    );
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
    void executar(() => salvarPreferencia([...ocultos, campo], periodoSalvo), "Bloco ocultado");
  const ativo = personalizado ? "personalizado" : periodoSalvo;
  const [inicioSalvo, fimSalvo] = periodoSalvo.split("/");

  return (
    <div className="dashboard-painel" aria-busy={pendente}>
      <header className="dashboard-cabeca">
        <div>
          <h1>Dashboard financeiro</h1>
          <p className="dashboard-subtitulo">{subtituloDashboard(resumo.periodo.inicio, Number.isNaN(instante.getTime()) ? new Date() : instante)}</p>
        </div>
        <div className="dashboard-comandos">
          <div className="dashboard-segmento" role="group" aria-label="Período">
            {PERIODOS.map(([id, rotulo]) => (
              <button key={id} type="button" className="papel-botao" aria-pressed={ativo === id} disabled={pendente} onClick={() => escolherPeriodo(id)}>
                {rotulo}
              </button>
            ))}
            <button type="button" className="papel-botao" aria-pressed={ativo === "personalizado"} disabled={pendente} onClick={() => escolherPeriodo("personalizado")}>
              Personalizado
            </button>
          </div>
          <button type="button" className="papel-botao papel-botao-secundario" disabled={pendente} onClick={() => exportarComo("csv")}>
            <Download aria-hidden="true" /> Exportar CSV
          </button>
          <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => exportarComo("pdf")}>PDF</button>
          <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => exportarComo("excel")}>Excel</button>
        </div>
      </header>
      {aviso ? <Aviso key={aviso.quando} tipo={aviso.tipo} mensagem={aviso.mensagem} /> : null}
      <p className="dashboard-periodo-texto">{`Período: ${data(resumo.periodo.inicio)} a ${data(resumo.periodo.fim)}`}</p>
      {personalizado ? (
        <form className="dashboard-form dashboard-form-linha" onSubmit={aplicarIntervalo}>
          <Label className="dashboard-campo">
            Início
            <Input name="inicio" type="date" required defaultValue={inicioSalvo} aria-invalid={aviso?.tipo === "erro" ? true : undefined} />
          </Label>
          <Label className="dashboard-campo">
            Fim
            <Input name="fim" type="date" required defaultValue={fimSalvo} />
          </Label>
          <Button type="submit" className="h-10 px-4" disabled={pendente}>Aplicar período</Button>
        </form>
      ) : null}
      <Kpis resumo={resumo} apresentacao={apresentacao} ocultos={ocultos} ocultar={ocultar} pendente={pendente} />
      <div className="dashboard-meio">
        {oculto(ocultos, "faturamento") ? null : (
          <section className="dashboard-card" aria-labelledby="dashboard-diario">
            <h2 id="dashboard-diario" className="dashboard-sr">Faturamento diário</h2>
            <GraficoDiario dias={apresentacao.diario} meta={apresentacao.metaDiaria} hoje={agora.slice(0, 10)} />
          </section>
        )}
        {oculto(ocultos, "detalhe") ? null : <PorDentista apresentacao={apresentacao} pendente={pendente} ocultar={ocultar} />}
      </div>
      <div className="dashboard-meio">
        {oculto(ocultos, "detalhe") ? null : <PorProcedimento apresentacao={apresentacao} />}
        <EstoqueCritico resumo={resumo} apresentacao={apresentacao} ocultos={ocultos} pendente={pendente} ocultar={ocultar} />
      </div>
      {papel === "admin" ? <CamposDoPapel pendente={pendente} executar={executar} /> : null}
    </div>
  );
}
