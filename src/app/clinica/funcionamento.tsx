import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLINICA_SUGESTAO_HORARIO } from "./texto";
import { DIAS } from "./validar";

export type CamposFuncionamento = {
  dias: readonly string[];
  abertura: string;
  fechamento: string;
};

const campo = "w-full flex-col items-stretch gap-2 font-semibold";

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
            <Label key={dia.valor} className="clinica-dia font-normal">
              <input
                type="checkbox"
                name="dias"
                value={dia.valor}
                defaultChecked={campos.dias.includes(dia.valor)}
              />
              {dia.rotulo}
            </Label>
          ))}
        </div>
      </fieldset>
      <div className="clinica-horarios">
        <Label className={`clinica-campo ${campo}`}>
          Horário de abertura
          <Input name="abertura" type="time" defaultValue={campos.abertura} required />
        </Label>
        <Label className={`clinica-campo ${campo}`}>
          Horário de fechamento
          <Input name="fechamento" type="time" defaultValue={campos.fechamento} required />
        </Label>
      </div>
      {sugestao ? <p className="clinica-sugestao">{CLINICA_SUGESTAO_HORARIO}</p> : (
        <p className="clinica-sugestao">Dias desmarcados ficam indisponíveis na agenda.</p>
      )}
    </>
  );
}
