export type ActivityKind = "word-flip" | "image-type" | "english-flip" | "math-flip";

export const ACTIVITY_KINDS: { value: ActivityKind; label: string; description: string }[] = [
  {
    value: "word-flip",
    label: "Cartas viráveis",
    description: "Mostra a palavra; toque para revelar a imagem"
  },
  {
    value: "image-type",
    label: "Digitar a palavra",
    description: "Mostra a imagem; criança digita a palavra"
  },
  {
    value: "english-flip",
    label: "Inglês",
    description: "Mostra a imagem; toque para revelar a palavra em inglês e ouvir"
  },
  {
    value: "math-flip",
    label: "Contas",
    description: "Mostra a conta; toque para revelar o resultado e ouvir"
  }
];

/**
 * Modos de jogo que podem ser trocados durante a partida, por tipo de atividade.
 * Só faz sentido trocar entre modos que usam os mesmos dados nos cards — os
 * demais tipos são atividades diferentes e ficam travados no que foi criado.
 */
export const RUNTIME_MODES: Record<ActivityKind, ActivityKind[]> = {
  "word-flip": ["word-flip", "image-type"],
  "image-type": ["word-flip", "image-type"],
  "english-flip": ["english-flip"],
  "math-flip": ["math-flip"]
};

/** Tipos cujos cards precisam de imagem. */
export function needsImage(kind: ActivityKind): boolean {
  return kind !== "math-flip";
}

/** Caixa das letras mostrada nas atividades de leitura/escrita. */
export type LetterCase = "original" | "upper" | "lower";

export const LETTER_CASE_OPTIONS: { value: LetterCase; label: string }[] = [
  { value: "original", label: "Aa" },
  { value: "upper", label: "AA" },
  { value: "lower", label: "aa" }
];

/** Tipos de atividade em que a caixa das letras pode ser trocada. */
export function supportsLetterCase(kind: ActivityKind): boolean {
  return kind === "word-flip" || kind === "image-type";
}

export interface Card {
  id: string;
  word: string;
  imageUrl: string;
  imageThumb?: string;
  imageAlt?: string;
}

export interface Activity {
  id: string;
  name: string;
  kind: ActivityKind;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaySettings {
  mode: ActivityKind;
  shuffled: boolean;
  limit: number | null;
}

export const PLAY_LIMIT_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: 10, label: "10" },
  { value: 8, label: "8" },
  { value: 6, label: "6" }
];

export const PLAY_MODE_LABELS: Record<ActivityKind, string> = {
  "word-flip": "Virar",
  "image-type": "Escrever",
  "english-flip": "Inglês",
  "math-flip": "Contas"
};

export interface PixabayHit {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
}
