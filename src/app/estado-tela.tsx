import Link from "next/link";
import { MENSAGEM_PAPEL } from "../domain/auth/tipos";

export function FalhaTela({
  mensagem,
  tentar,
  voltar = "/",
}: {
  mensagem: string;
  tentar?: string;
  voltar?: string;
}) {
  const semPermissao = mensagem === MENSAGEM_PAPEL;
  return (
    <div className="casca-alerta" role="alert" tabIndex={-1}>
      <p>{mensagem}</p>
      <p className="nav">
        {semPermissao || !tentar ? null : <Link href={tentar}>Tentar de novo</Link>}
        <Link href={voltar}>Voltar</Link>
      </p>
    </div>
  );
}
