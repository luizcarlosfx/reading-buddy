import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeAnswer } from "../lib/normalize";
import type { Card } from "../types";

export default function PlayImageType({
  order,
  onReset
}: {
  order: Card[];
  onReset: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const correctIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of order) {
      const a = answers[c.id] ?? "";
      if (a && normalizeAnswer(a) === normalizeAnswer(c.word)) set.add(c.id);
    }
    return set;
  }, [answers, order]);

  const allCorrect = correctIds.size === order.length && order.length > 0;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevCorrectRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (let i = 0; i < order.length; i++) {
      const id = order[i].id;
      if (correctIds.has(id) && !prevCorrectRef.current.has(id)) {
        for (let j = i + 1; j < order.length; j++) {
          const nextId = order[j].id;
          if (!correctIds.has(nextId) && !revealed.has(nextId)) {
            inputRefs.current[j]?.focus();
            break;
          }
        }
      }
    }
    prevCorrectRef.current = new Set(correctIds);
  }, [correctIds, order, revealed]);

  function reveal(card: Card) {
    setAnswers((prev) => ({ ...prev, [card.id]: card.word }));
    setRevealed((prev) => new Set(prev).add(card.id));
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {correctIds.size} de {order.length} acertos
      </div>

      <ul className="space-y-3">
        {order.map((c, idx) => (
          <li key={c.id}>
            <TypeRow
              card={c}
              index={idx}
              answer={answers[c.id] ?? ""}
              isCorrect={correctIds.has(c.id)}
              isRevealed={revealed.has(c.id)}
              inputRef={(el) => {
                inputRefs.current[idx] = el;
              }}
              onChange={(value) =>
                setAnswers((prev) => ({ ...prev, [c.id]: value }))
              }
              onReveal={() => reveal(c)}
            />
          </li>
        ))}
      </ul>

      {allCorrect && (
        <div className="card p-6 text-center space-y-3 bg-emerald-50 border-emerald-200">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold">Muito bem!</h2>
          <button onClick={onReset} className="btn-primary">
            Jogar de novo
          </button>
        </div>
      )}
    </div>
  );
}

function TypeRow({
  card,
  index,
  answer,
  isCorrect,
  isRevealed,
  inputRef,
  onChange,
  onReveal
}: {
  card: Card;
  index: number;
  answer: string;
  isCorrect: boolean;
  isRevealed: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onReveal: () => void;
}) {
  const hasInput = answer.trim().length > 0;
  const wrongAttempt = hasInput && !isCorrect && !isRevealed;

  let borderClass = "border-slate-200";
  if (isCorrect) borderClass = "border-emerald-500";
  else if (wrongAttempt) borderClass = "border-rose-300";

  return (
    <div
      className={`card p-3 flex items-center gap-3 sm:gap-4 border-2 transition ${borderClass}`}
    >
      <span className="text-sm font-bold text-slate-400 w-6 text-center flex-shrink-0">
        {index + 1}
      </span>
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={card.imageThumb || card.imageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite a palavra"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isCorrect || isRevealed}
            className={`input pr-12 text-2xl font-bold ${
              isCorrect
                ? "bg-emerald-50 text-emerald-900 border-emerald-500"
                : isRevealed
                ? "bg-amber-50 text-amber-900 border-amber-400"
                : ""
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
            {isCorrect ? "✅" : isRevealed ? "👁" : ""}
          </div>
        </div>
        {!isCorrect && !isRevealed && (
          <button
            onClick={onReveal}
            className="self-start text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Mostrar resposta
          </button>
        )}
      </div>
    </div>
  );
}
