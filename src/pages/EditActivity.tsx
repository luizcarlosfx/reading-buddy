import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getActivity, getPixabayKey, uid, upsertActivity } from "../lib/storage";
import {
  ACTIVITY_KINDS,
  needsImage,
  type Activity,
  type ActivityKind,
  type Card
} from "../types";
import { formatResult, parseMath } from "../lib/math";
import ImagePickerModal from "../components/ImagePickerModal";

export default function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [name, setName] = useState("");
  const [kind, setKind] = useState<ActivityKind>("word-flip");
  const [cards, setCards] = useState<Card[]>([]);
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scrollToCardId, setScrollToCardId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id) {
        try {
          const a = await getActivity(id);
          if (cancelled) return;
          if (!a) {
            alert("Atividade não encontrada");
            navigate("/");
            return;
          }
          setName(a.name);
          setKind(a.kind);
          setCards(a.cards);
        } catch (e) {
          if (cancelled) return;
          alert(`Erro ao carregar: ${(e as Error).message}`);
          navigate("/");
          return;
        }
      }
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const hasKey = useMemo(() => Boolean(getPixabayKey()), [pickingFor, loaded]);
  const isEnglish = kind === "english-flip";
  const isMath = kind === "math-flip";
  const withImage = needsImage(kind);
  const kindLabel = ACTIVITY_KINDS.find((k) => k.value === kind)?.label ?? kind;

  useEffect(() => {
    if (!scrollToCardId) return;
    const el = cardRefs.current.get(scrollToCardId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector<HTMLInputElement>('input[type="text"]');
      input?.focus();
    }
    setScrollToCardId(null);
  }, [scrollToCardId, cards]);

  function addCard() {
    const newId = uid();
    setCards((c) => [...c, { id: newId, word: "", imageUrl: "" }]);
    setScrollToCardId(newId);
  }

  function removeCard(cardId: string) {
    setCards((c) => c.filter((x) => x.id !== cardId));
  }

  function updateCard(cardId: string, patch: Partial<Card>) {
    setCards((c) => c.map((x) => (x.id === cardId ? { ...x, ...patch } : x)));
  }

  function moveCard(cardId: string, dir: -1 | 1) {
    setCards((c) => {
      const i = c.findIndex((x) => x.id === cardId);
      if (i < 0) return c;
      const j = i + dir;
      if (j < 0 || j >= c.length) return c;
      const next = [...c];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Dê um nome para a atividade.");
      return;
    }

    let valid: Card[];
    if (isMath) {
      const filled = cards.filter((c) => c.word.trim());
      const invalid = filled.filter((c) => !parseMath(c.word));
      if (invalid.length > 0) {
        const lista = invalid.map((c) => `"${c.word.trim()}"`).join(", ");
        alert(
          `Contas inválidas: ${lista}.\nUse números, + − × ÷ ^ e parênteses — por exemplo "5 + 8" ou "2 × (3 + 4)".`
        );
        return;
      }
      valid = filled.map((c) => ({
        id: c.id,
        word: parseMath(c.word)!.display,
        imageUrl: ""
      }));
    } else {
      valid = cards
        .filter((c) => c.word.trim() && c.imageUrl)
        .map((c) => ({ ...c, word: c.word.trim() }));
    }

    if (valid.length === 0) {
      alert(
        isMath
          ? "Adicione ao menos uma conta."
          : "Adicione ao menos um card com palavra e imagem."
      );
      return;
    }

    const now = Date.now();
    const activity: Activity = {
      id: id ?? uid(),
      name: trimmed,
      kind,
      cards: valid,
      createdAt: now,
      updatedAt: now
    };
    setSaving(true);
    try {
      await upsertActivity(activity);
      navigate("/");
    } catch (e) {
      alert(`Erro ao salvar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-ghost">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-extrabold">{isNew ? "Nova atividade" : "Editar atividade"}</h1>
      </div>

      {withImage && !hasKey && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-900">
            Você ainda não configurou a chave da Pixabay.{" "}
            <Link to="/configuracoes" className="underline font-bold">
              Configurar agora
            </Link>
            .
          </p>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Nome da atividade</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isMath ? "Ex.: Tabuada da soma" : "Ex.: Animais da fazenda"}
            className="input mt-1"
          />
        </label>

        <div>
          <span className="text-sm font-bold text-slate-700">Tipo de atividade</span>
          {isNew ? (
            <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ACTIVITY_KINDS.map((opt) => {
                const selected = kind === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setKind(opt.value)}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-brand-100 text-brand-700 text-sm font-bold">
                {kindLabel}
              </span>
              <span className="text-xs text-slate-500">
                O tipo é escolhido na criação e não muda depois.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="sticky top-[72px] z-10 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {isMath ? "Contas" : "Cards"} ({cards.length})
          </h2>
          <button onClick={addCard} className="btn-primary">
            + {isMath ? "Adicionar conta" : "Adicionar card"}
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            {isMath
              ? "Nenhuma conta. Clique em “Adicionar conta” para começar."
              : "Nenhum card. Clique em “Adicionar card” para começar."}
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((c, idx) => (
              <li
                key={c.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(c.id, el);
                  else cardRefs.current.delete(c.id);
                }}
                className="card p-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-shrink-0 flex sm:flex-col items-center gap-1">
                  <button
                    onClick={() => moveCard(c.id, -1)}
                    disabled={idx === 0}
                    className="btn-ghost p-2 disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <span className="text-xs font-bold text-slate-400 w-6 text-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => moveCard(c.id, 1)}
                    disabled={idx === cards.length - 1}
                    className="btn-ghost p-2 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                </div>

                {isMath ? (
                  <MathCardFields
                    card={c}
                    onChange={(word) => updateCard(c.id, { word })}
                    onRemove={() => removeCard(c.id)}
                  />
                ) : (
                  <>
                    <div className="flex-1 space-y-2">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500">
                          {isEnglish ? "Palavra em inglês" : "Palavra"}
                        </span>
                        <input
                          type="text"
                          value={c.word}
                          onChange={(e) => updateCard(c.id, { word: e.target.value })}
                          placeholder={isEnglish ? "Ex.: cat" : "Ex.: gato"}
                          className="input mt-1"
                        />
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setPickingFor(c.id)}
                          className="btn-secondary text-sm"
                          disabled={!hasKey}
                        >
                          🔍 {c.imageUrl ? "Trocar imagem" : "Buscar imagem"}
                        </button>
                        <input
                          type="url"
                          placeholder="ou cole um link de imagem"
                          className="input text-sm flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          onBlur={(e) => {
                            const url = e.target.value.trim();
                            if (!url) return;
                            try {
                              new URL(url);
                            } catch {
                              alert("URL inválida.");
                              return;
                            }
                            updateCard(c.id, {
                              imageUrl: url,
                              imageThumb: url,
                              imageAlt: c.word
                            });
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="w-28 h-28 rounded-xl bg-slate-100 overflow-hidden grid place-items-center">
                        {c.imageUrl ? (
                          <img
                            src={c.imageThumb || c.imageUrl}
                            alt={c.imageAlt || c.word}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400 text-xs text-center px-2">
                            Sem imagem
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeCard(c.id)}
                        className="btn-ghost text-sm text-rose-600"
                      >
                        Remover
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-50 -mx-4 px-4 py-3 border-t border-slate-200">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
          {saving ? "Salvando…" : "Salvar atividade"}
        </button>
        <Link to="/" className="btn-secondary">
          Cancelar
        </Link>
      </div>

      {pickingFor && (
        <ImagePickerModal
          initialQuery={cards.find((c) => c.id === pickingFor)?.word ?? ""}
          onClose={() => setPickingFor(null)}
          onPick={(hit) => {
            updateCard(pickingFor, {
              imageUrl: hit.webformatURL,
              imageThumb: hit.previewURL,
              imageAlt: hit.tags
            });
            setPickingFor(null);
          }}
        />
      )}
    </div>
  );
}

function MathCardFields({
  card,
  onChange,
  onRemove
}: {
  card: Card;
  onChange: (word: string) => void;
  onRemove: () => void;
}) {
  const expr = parseMath(card.word);
  const empty = !card.word.trim();

  return (
    <>
      <div className="flex-1">
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Conta</span>
          <input
            type="text"
            value={card.word}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex.: 5 + 8   ou   2 × (3 + 4)"
            className="input mt-1 font-bold"
          />
        </label>
        {!empty && !expr && (
          <p className="text-xs font-bold text-rose-600 mt-1">
            Não consegui calcular. Use números, + − × ÷ ^ e parênteses.
          </p>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="w-28 h-20 rounded-xl bg-slate-100 grid place-items-center px-2">
          {expr ? (
            <span className="text-2xl font-black text-brand-700">
              = {formatResult(expr.result)}
            </span>
          ) : (
            <span className="text-slate-400 text-xs text-center">—</span>
          )}
        </div>
        <button onClick={onRemove} className="btn-ghost text-sm text-rose-600">
          Remover
        </button>
      </div>
    </>
  );
}
