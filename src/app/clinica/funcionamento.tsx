import { CLINICA_SUGESTAO_HORARIO } from "./texto";
import { DIAS } from "./validar";

export type CamposFuncionamento = {
  dias: readonly string[];
  abertura: string;
  fechamento: string;
};

export function Funcionamento({
  campos,
  sugestao = false,
}: {
  campos: CamposFuncionamento;
  sugestao?: boolean;
}) {
  return (
    <>
      <fieldset className="clinica-dias">
        <legend>Dias de atendimento</legend>
        <div className="clinica-dias-lista">
          {DIAS.map((dia) => (
            <label key={dia.valor} className="clinica-dia">
              <input
                type="checkbox"
                name="dias"
                value={dia.valor}
                defaultChecked={campos.dias.includes(dia.valor)}
              />
              {dia.rotulo}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="clinica-horarios">
        <label className="clinica-campo">
          Abertura
          <input name="abertura" type="time" defaultValue={campos.abertura} required />
        </label>
        <label className="clinica-campo">
          Fechamento
          <input name="fechamento" type="time" defaultValue={campos.fechamento} required />
        </label>
      </div>
      {sugestao ? <p className="clinica-sugestao">{CLINICA_SUGESTAO_HORARIO}</p> : null}
    </>
  );
}
