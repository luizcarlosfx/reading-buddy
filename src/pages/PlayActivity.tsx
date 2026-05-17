import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getActivity, getPlaySettings, setPlaySettings } from "../lib/storage";
import { shuffle } from "../lib/shuffle";
import {
  PLAY_LIMIT_OPTIONS,
  PLAY_MODE_PILLS,
  type Activity,
  type Card,
  type PlaySettings
} from "../types";
import PlayWordFlip from "../components/PlayWordFlip";
import PlayImageType from "../components/PlayImageType";

export default function PlayActivity() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [settings, setSettings] = useState<PlaySettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (id) {
      const a = getActivity(id) ?? null;
      setActivity(a);
      if (a) setSettings(getPlaySettings(a.id, a.kind));
    }
    setLoaded(true);
  }, [id]);

  const order = useMemo<Card[]>(() => {
    if (!activity || !settings) return [];
    const base = settings.shuffled ? shuffle(activity.cards) : activity.cards;
    return settings.limit ? base.slice(0, settings.limit) : base;
    // round entra como dep pra forçar novo shuffle ao reiniciar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, settings?.shuffled, settings?.limit, round]);

  if (!loaded) return null;

  if (!activity || !settings) {
    return (
      <div className="card p-10 text-center space-y-3">
        <h1 className="text-xl font-bold">Atividade não encontrada</h1>
        <Link to="/" className="btn-primary inline-flex">
          Voltar
        </Link>
      </div>
    );
  }

  function updateSettings(patch: Partial<PlaySettings>) {
    if (!settings || !activity) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setPlaySettings(activity.id, next);
    setRound((r) => r + 1);
  }

  function reset() {
    setRound((r) => r + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/" className="btn-ghost">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-extrabold">{activity.name}</h1>
      </div>

      <Controls settings={settings} onChange={updateSettings} onReset={reset} />

      {settings.mode === "image-type" ? (
        <PlayImageType key={`type-${round}`} order={order} onReset={reset} />
      ) : (
        <PlayWordFlip key={`flip-${round}`} order={order} onReset={reset} />
      )}
    </div>
  );
}

function Controls({
  settings,
  onChange,
  onReset
}: {
  settings: PlaySettings;
  onChange: (patch: Partial<PlaySettings>) => void;
  onReset: () => void;
}) {
  return (
    <div className="card p-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {PLAY_MODE_PILLS.map((k) => {
          const active = settings.mode === k.value;
          return (
            <button
              key={k.value}
              onClick={() => onChange({ mode: k.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                active
                  ? "bg-white shadow-sm text-brand-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {k.label}
            </button>
          );
        })}
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.shuffled}
          onChange={(e) => onChange({ shuffled: e.target.checked })}
          className="w-4 h-4 accent-brand-500"
        />
        Embaralhar
      </label>

      <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
        Limite
        <select
          value={settings.limit ?? "all"}
          onChange={(e) =>
            onChange({
              limit: e.target.value === "all" ? null : Number(e.target.value)
            })
          }
          className="rounded-lg border-2 border-slate-200 px-2 py-1 text-sm bg-white font-bold"
        >
          {PLAY_LIMIT_OPTIONS.map((opt) => (
            <option key={opt.value ?? "all"} value={opt.value ?? "all"}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex-1" />

      <button onClick={onReset} className="btn-secondary text-sm">
        ↻ Reiniciar
      </button>
    </div>
  );
}
