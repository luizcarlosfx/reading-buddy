import type { Activity, ActivityKind, PlaySettings } from "../types";

const ACTIVITIES_KEY = "leitura-tobias:activities";
const PIXABAY_KEY_KEY = "leitura-tobias:pixabay-key";
const PLAY_SETTINGS_KEY = "leitura-tobias:play-settings";

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Activity[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((a) => ({ ...a, kind: a.kind ?? "word-flip" }));
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export function getActivity(id: string): Activity | undefined {
  return loadActivities().find((a) => a.id === id);
}

export function upsertActivity(activity: Activity): void {
  const all = loadActivities();
  const i = all.findIndex((a) => a.id === activity.id);
  const now = Date.now();
  const next = { ...activity, updatedAt: now };
  if (i >= 0) all[i] = next;
  else all.unshift(next);
  saveActivities(all);
}

export function deleteActivity(id: string): void {
  saveActivities(loadActivities().filter((a) => a.id !== id));
}

export function getPixabayKey(): string {
  const fromEnv = import.meta.env.VITE_PIXABAY_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return localStorage.getItem(PIXABAY_KEY_KEY) ?? "";
}

export function setPixabayKey(key: string): void {
  localStorage.setItem(PIXABAY_KEY_KEY, key.trim());
}

export function getPlaySettings(activityId: string, defaultMode: ActivityKind): PlaySettings {
  try {
    const raw = localStorage.getItem(PLAY_SETTINGS_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, Partial<PlaySettings>>;
      const s = all[activityId];
      if (s) {
        return {
          mode: s.mode ?? defaultMode,
          shuffled: s.shuffled ?? true,
          limit: s.limit ?? null
        };
      }
    }
  } catch {}
  return { mode: defaultMode, shuffled: true, limit: null };
}

export function setPlaySettings(activityId: string, settings: PlaySettings): void {
  try {
    const raw = localStorage.getItem(PLAY_SETTINGS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PlaySettings>) : {};
    all[activityId] = settings;
    localStorage.setItem(PLAY_SETTINGS_KEY, JSON.stringify(all));
  } catch {}
}

export function exportJSON(): string {
  return JSON.stringify({ version: 1, activities: loadActivities() }, null, 2);
}

export function importJSON(json: string): { ok: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(json);
    const list = Array.isArray(data) ? data : data?.activities;
    if (!Array.isArray(list)) return { ok: false, count: 0, error: "Formato inválido" };
    saveActivities(list as Activity[]);
    return { ok: true, count: list.length };
  } catch (e) {
    return { ok: false, count: 0, error: (e as Error).message };
  }
}
