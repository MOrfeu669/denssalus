import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { historico, listarMateriais } from "../../domain/estoque/casos";
import { listarProcedimentos } from "../../domain/procedimento/casos";
import { Aviso } from "../aviso";
import { CascaAberta } from "../casca";
import { dependenciasEstoque, dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { instante } from "../prontuarios/[pacienteId]/formato";
import { sessaoAtual } from "../sessao";
import { Estoque, type MaterialTela } from "./form";
import "./tela.css";

export const dynamic = "force-dynamic";

function Erro({ mensagem }: { mensagem: string }) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <div className="estoque-tela">
      <h1>Estoque</h1>
      <div className="estoque-alerta">
        <Aviso tipo="erro" mensagem={mensagem} />
        <Link className="casca-botao" href={semPermissao ? "/" : "/estoque"}>
          {semPermissao ? "Voltar" : "Tentar de novo"}
        </Link>
      </div>
    </div>
  );
}

export default async function Page() {
  let sessao;
  try {
    sessao = await sessaoAtual();
  } catch (erro) {
    return <Erro mensagem={falha(erro).mensagem} />;
  }
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Estoque</h1>
        <p className="casca-texto">Nenhuma sessão aberta.</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
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
        quantidadeMinima: material.quantidadeMinima,
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
    <div className="estoque-tela">
      <h1>Estoque</h1>
      <Estoque materiais={materiais} procedimentos={procedimentos} />
    </div>
  );
}
