import type { Dentista } from "../../domain/dentista/tipos";

export function Campos({ dentista }: { dentista?: Dentista }) {
  return (
    <>
      <label className="dentistas-campo">
        Nome
        <input name="nome" defaultValue={dentista?.nome} required />
      </label>
      <label className="dentistas-campo">
        CRO
        <input name="cro" defaultValue={dentista?.cro} required />
      </label>
      <label className="dentistas-campo">
        Telefone
        <input name="telefone" type="tel" defaultValue={dentista?.telefone} required />
      </label>
      <label className="dentistas-campo">
        CPF
        <input name="cpf" defaultValue={dentista?.cpf} required />
      </label>
      <label className="dentistas-campo dentistas-campo-largo">
        Especialidades (separadas por vírgula)
        <input name="especialidades" defaultValue={dentista?.especialidades.join(", ")} />
      </label>
    </>
  );
}
