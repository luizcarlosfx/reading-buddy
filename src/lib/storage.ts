import { api } from "./api";
import {
  RUNTIME_MODES,
  type Activity,
  type ActivityKind,
  type LetterCase,
  type PlaySettings
} from "../types";

const PIXABAY_KEY_KEY = "leitura-tobias:pixabay-key";
const PLAY_SETTINGS_KEY = "leitura-tobias:play-settings";
const LETTER_CASE_KEY = "leitura-tobias:letter-case";

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeActivity(a: Activity): Activity {
  return { ...a, kind: a.kind ?? "word-flip" };
}

export async function loadActivities(): Promise<Activity[]> {
  const list = await api.get<Activity[]>("/activities");
  return list.map(normalizeActivity);
}

export async function getActivity(id: string): Promise<Activity | undefined> {
  try {
    const a = await api.get<Activity>(`/activities/${encodeURIComponent(id)}`);
    return normalizeActivity(a);
  } catch (err) {
    if (err && (err as { status?: number }).status === 404) return undefined;
    throw err;
  }
}

export async function upsertActivity(activity: Activity): Promise<Activity> {
  const saved = await api.put<{ ok: boolean; id: string; createdAt: number; updatedAt: number }>(
    `/activities/${encodeURIComponent(activity.id)}`,
    {
      name: activity.name,
      kind: activity.kind,
      cards: activity.cards,
      createdAt: activity.createdAt
    }
  );
  return { ...activity, createdAt: saved.createdAt, updatedAt: saved.updatedAt };
}

export async function deleteActivity(id: string): Promise<void> {
  await api.delete(`/activities/${encodeURIComponent(id)}`);
}

export function getPixabayKey(): string {
  const fromEnv = import.meta.env.VITE_PIXABAY_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return localStorage.getItem(PIXABAY_KEY_KEY) ?? "";
}

export function setPixabayKey(key: string): void {
  localStorage.setItem(PIXABAY_KEY_KEY, key.trim());
}

/**
 * Preferências de jogo salvas para a atividade. O modo é sempre limitado aos
 * modos compatíveis com o tipo da atividade — um modo antigo/incompatível
 * salvo no localStorage cai de volta para o tipo em que a atividade foi criada.
 */
export function getPlaySettings(activityId: string, kind: ActivityKind): PlaySettings {
  const allowed = RUNTIME_MODES[kind] ?? [kind];
  try {
    const raw = localStorage.getItem(PLAY_SETTINGS_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, Partial<PlaySettings>>;
      const s = all[activityId];
      if (s) {
        return {
          mode: s.mode && allowed.includes(s.mode) ? s.mode : kind,
          shuffled: s.shuffled ?? true,
          limit: s.limit ?? null
        };
      }
    }
  } catch {}
  return { mode: kind, shuffled: true, limit: null };
}

export function setPlaySettings(activityId: string, settings: PlaySettings): void {
  try {
    const raw = localStorage.getItem(PLAY_SETTINGS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PlaySettings>) : {};
    all[activityId] = settings;
    localStorage.setItem(PLAY_SETTINGS_KEY, JSON.stringify(all));
  } catch {}
}

/** A caixa das letras é global: vale para todas as atividades de leitura/escrita. */
export function getLetterCase(): LetterCase {
  const raw = localStorage.getItem(LETTER_CASE_KEY);
  if (raw === "upper" || raw === "lower" || raw === "original") return raw;
  return "original";
}

export function setLetterCase(letterCase: LetterCase): void {
  try {
    localStorage.setItem(LETTER_CASE_KEY, letterCase);
  } catch {}
}

export async function exportJSON(): Promise<string> {
  const activities = await loadActivities();
  return JSON.stringify({ version: 1, activities }, null, 2);
}

export async function importJSON(
  json: string
): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(json);
    const list = (Array.isArray(data) ? data : data?.activities) as Activity[] | undefined;
    if (!Array.isArray(list)) return { ok: false, count: 0, error: "Formato inválido" };
    for (const a of list) {
      if (!a?.id || !a?.name || !a?.kind || !Array.isArray(a.cards)) continue;
      await upsertActivity(normalizeActivity(a));
    }
    return { ok: true, count: list.length };
  } catch (e) {
    return { ok: false, count: 0, error: (e as Error).message };
  }
}
