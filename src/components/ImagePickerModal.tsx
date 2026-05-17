import { useEffect, useRef, useState } from "react";
import { searchPixabay } from "../lib/pixabay";
import type { PixabayHit } from "../types";

interface Props {
  initialQuery: string;
  onClose: () => void;
  onPick: (hit: PixabayHit) => void;
}

export default function ImagePickerModal({ initialQuery, onClose, onPick }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<PixabayHit[]>([]);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialQuery.trim()) {
      void runSearch(initialQuery);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(q: string) {
    setLoading(true);
    setError(null);
    setTranslatedQuery(null);
    try {
      const result = await searchPixabay(q);
      setHits(result.hits);
      setTranslatedQuery(result.translatedQuery ?? null);
      if (result.hits.length === 0) setError("Nenhuma imagem encontrada. Tente outra palavra.");
    } catch (e) {
      setError((e as Error).message);
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Buscar imagem</h2>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 border-b border-slate-100 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: gato, cachorro, maçã..."
            className="input"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "..." : "Buscar"}
          </button>
        </form>

        <div className="flex-1 overflow-auto p-5">
          {translatedQuery && (
            <div className="mb-3 p-3 rounded-xl bg-brand-50 text-brand-700 text-xs">
              Buscando também por <strong>{translatedQuery}</strong> (tradução)
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-900 text-sm">{error}</div>
          )}
          {loading && hits.length === 0 && (
            <div className="text-center text-slate-500 py-10">Buscando...</div>
          )}
          {hits.length > 0 && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    onClick={() => onPick(hit)}
                    className="block w-full aspect-square rounded-xl overflow-hidden bg-slate-100 hover:ring-4 hover:ring-brand-200 transition focus:outline-none focus:ring-4 focus:ring-brand-300"
                    title={hit.tags}
                  >
                    <img
                      src={hit.previewURL}
                      alt={hit.tags}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
          Imagens fornecidas pela{" "}
          <a
            href="https://pixabay.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Pixabay
          </a>
        </div>
      </div>
    </div>
  );
}
