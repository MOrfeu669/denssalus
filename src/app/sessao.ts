import { obterSessao } from "../domain/auth/casos";
import { dependencias } from "./dependencias";

export async function sessaoAtual() {
  return obterSessao(dependencias());
}
