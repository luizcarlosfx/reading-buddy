export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Nome de cada letra escrito do jeito que se fala. Mandar só "B" pro TTS às
 * vezes sai como "b" mudo ou soletrado em inglês, então a fala usa o nome.
 */
const LETTER_NAMES: Record<string, string> = {
  A: "á",
  B: "bê",
  C: "cê",
  D: "dê",
  E: "é",
  F: "éfe",
  G: "gê",
  H: "agá",
  I: "i",
  J: "jota",
  K: "cá",
  L: "éle",
  M: "ême",
  N: "ene",
  O: "ó",
  P: "pê",
  Q: "quê",
  R: "érre",
  S: "ésse",
  T: "tê",
  U: "u",
  V: "vê",
  W: "dáblio",
  X: "xis",
  Y: "ípsilon",
  Z: "zê",
  Ç: "cê cedilha"
};

/** Texto a ser falado para a letra do card. Se não for uma letra conhecida, fala como está. */
export function letterName(text: string): string {
  const key = text.trim().toLocaleUpperCase("pt-BR");
  return LETTER_NAMES[key] ?? text;
}
