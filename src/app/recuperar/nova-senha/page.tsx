import { Casca } from "../casca";
import { FormNovaSenha } from "./form";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Casca>
      <FormNovaSenha />
    </Casca>
  );
}
