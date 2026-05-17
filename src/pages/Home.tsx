import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteActivity, loadActivities } from "../lib/storage";
import { subscribeUser } from "../lib/auth";
import { ACTIVITY_KINDS, type Activity } from "../types";

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setActivities(await loadActivities());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    return subscribeUser(() => refresh());
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a atividade "${name}"?`)) return;
    try {
      await deleteActivity(id);
      await refresh();
    } catch (e) {
      alert(`Erro ao excluir: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Minhas atividades</h1>
        <Link to="/atividade/nova" className="btn-primary">
          + Nova atividade
        </Link>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-500">Carregando…</div>
      ) : error ? (
        <div className="card p-6 bg-rose-50 border-rose-200 text-rose-900 text-sm">
          Erro ao carregar atividades: {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="card p-10 text-center space-y-4">
          <div className="text-5xl">📚</div>
          <h2 className="text-xl font-bold">Nenhuma atividade ainda</h2>
          <p className="text-slate-500">
            Crie a primeira atividade para começar a praticar.
          </p>
          <Link to="/atividade/nova" className="btn-primary inline-flex">
            Criar primeira atividade
          </Link>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {activities.map((a) => (
            <li key={a.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold leading-tight">{a.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                      {ACTIVITY_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind}
                    </span>
                    <span className="text-sm text-slate-500">
                      {a.cards.length} {a.cards.length === 1 ? "card" : "cards"}
                    </span>
                  </div>
                </div>
                <ThumbStrip cards={a.cards} />
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link to={`/atividade/${a.id}/jogar`} className="btn-primary flex-1">
                  ▶ Jogar
                </Link>
                <Link to={`/atividade/${a.id}/editar`} className="btn-secondary">
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  className="btn-ghost text-rose-600 hover:bg-rose-50"
                  aria-label="Excluir"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ThumbStrip({ cards }: { cards: Activity["cards"] }) {
  const preview = cards.slice(0, 3);
  if (preview.length === 0) return null;
  return (
    <div className="flex -space-x-2">
      {preview.map((c) => (
        <div
          key={c.id}
          className="w-10 h-10 rounded-lg border-2 border-white bg-slate-100 overflow-hidden"
        >
          {c.imageThumb || c.imageUrl ? (
            <img
              src={c.imageThumb || c.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
