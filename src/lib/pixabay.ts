import type { PixabayHit } from "../types";
import { getPixabayKey } from "./storage";

export class PixabayError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "PixabayError";
  }
}

export interface SearchResult {
  hits: PixabayHit[];
  translatedQuery?: string;
}

async function fetchPixabay(query: string, lang: string, perPage: number): Promise<PixabayHit[]> {
  const key = getPixabayKey();
  if (!key) throw new PixabayError("Chave da Pixabay não configurada");
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", lang);
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("image_type", "all");
  const res = await fetch(url.toString());
  if (!res.ok) throw new PixabayError(`Erro ${res.status} ao buscar`, res.status);
  const data = (await res.json()) as { hits?: PixabayHit[] };
  return data.hits ?? [];
}

async function translatePtToEn(text: string): Promise<string | null> {
  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "pt");
    url.searchParams.set("tl", "en");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    const segments = (data as [[[string, ...unknown[]]]] | null)?.[0];
    if (!Array.isArray(segments)) return null;
    const translated = segments
      .map((s) => (Array.isArray(s) ? String(s[0] ?? "") : ""))
      .join("")
      .trim();
    if (!translated) return null;
    if (translated.toLowerCase() === text.trim().toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  }
}

export async function searchPixabay(query: string, perPage = 24): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [] };

  const translated = await translatePtToEn(trimmed);

  if (translated) {
    const en = await fetchPixabay(translated, "en", perPage);
    if (en.length > 0) return { hits: en, translatedQuery: translated };
    const pt = await fetchPixabay(trimmed, "pt", perPage);
    return { hits: pt, translatedQuery: translated };
  }

  const pt = await fetchPixabay(trimmed, "pt", perPage);
  if (pt.length >= 6) return { hits: pt };
  const en = await fetchPixabay(trimmed, "en", perPage);
  if (pt.length === 0) return { hits: en };
  const seen = new Set(pt.map((h) => h.id));
  return { hits: [...pt, ...en.filter((h) => !seen.has(h.id))] };
}
