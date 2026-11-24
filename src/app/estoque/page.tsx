import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { listarPainel } from "../../domain/estoque/casos";
import { Aviso } from "../aviso";
import { CascaAberta } from "../casca";
import { dependenciasEstoque } from "../dependencias";
import { falha } from "../falha";
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
  try {
    const lista = await listarPainel(dependenciasEstoque(), sessao, hoje);
    if (!lista.ok) return <Erro mensagem={lista.mensagem} />;
    materiais = lista.valor.map((material) => ({
      id: material.id,
      nome: material.nome,
      quantidade: material.quantidade,
      quantidadeMinima: material.quantidadeMinima,
      validade: material.validade,
      historico: material.movimentos.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        quantidade: item.quantidade,
        usuario: item.usuarioId ?? "Automático",
        registradoEm: item.registradoEm,
      })),
    }));
  } catch (erro) {
    return <Erro mensagem={falha(erro).mensagem} />;
  }

  return (
    <div className="estoque-tela">
      <Estoque materiais={materiais} hoje={hoje.toISOString().slice(0, 10)} />
    </div>
  );
}
