import type { LetterCase } from "../types";

/** Aplica a caixa escolhida ao texto exibido. "original" mantém como foi cadastrado. */
export function applyCase(text: string, letterCase: LetterCase): string {
  if (letterCase === "upper") return text.toLocaleUpperCase("pt-BR");
  if (letterCase === "lower") return text.toLocaleLowerCase("pt-BR");
  return text;
}
