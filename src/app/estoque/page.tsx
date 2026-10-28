import Link from "next/link";
import { historico, listarMateriais } from "../../domain/estoque/casos";
import { listarProcedimentos } from "../../domain/procedimento/casos";
import { dependenciasEstoque, dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { instante } from "../prontuarios/[pacienteId]/formato";
import { sessaoAtual } from "../sessao";
import { Estoque, type MaterialTela } from "./form";

export const dynamic = "force-dynamic";

function Erro({ mensagem }: { mensagem: string }) {
  return (
    <main>
      <h1>Estoque</h1>
      <p role="alert" tabIndex={-1}>
        {mensagem}
      </p>
      <p className="nav">
        <Link href="/estoque">Tentar de novo</Link>
        {" · "}
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}

export default async function Page() {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Estoque</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  const hoje = new Date();
  let materiais: MaterialTela[];
  let procedimentos: { id: string; nome: string }[] = [];
  try {
    const deps = dependenciasEstoque();
    const lista = await listarMateriais(deps, sessao, hoje);
    if (!lista.ok) return <Erro mensagem={lista.mensagem} />;
    const procedimentosLidos = await listarProcedimentos(dependenciasProcedimento(), sessao);
    if (procedimentosLidos.ok) {
      procedimentos = procedimentosLidos.valor.map(({ id, nome }) => ({ id, nome }));
    }
    materiais = [];
    for (const material of lista.valor) {
      const movimentos = await historico(deps, sessao, material.id, hoje);
      if (!movimentos.ok) return <Erro mensagem={movimentos.mensagem} />;
      materiais.push({
        id: material.id,
        nome: material.nome,
        quantidade: material.quantidade,
        historico: movimentos.valor.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          quantidade: item.quantidade,
          usuario: item.usuarioId ?? "—",
          registradoEm: instante(item.registradoEm),
        })),
      });
    }
  } catch (erro) {
    return <Erro mensagem={falha(erro).mensagem} />;
  }

  return (
    <main>
      <h1>Estoque</h1>
      <Estoque materiais={materiais} procedimentos={procedimentos} />
      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
