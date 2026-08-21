export type ActivityKind = "word-flip" | "image-type" | "english-flip";

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
  }
];

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

export const PLAY_MODE_PILLS: { value: ActivityKind; label: string }[] = [
  { value: "word-flip", label: "Virar" },
  { value: "image-type", label: "Escrever" },
  { value: "english-flip", label: "Inglês" }
];

export interface PixabayHit {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
}
