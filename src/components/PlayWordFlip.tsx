import { useState } from "react";
import type { Card } from "../types";
import FitText from "./FitText";

export default function PlayWordFlip({
  order,
  onReset
}: {
  order: Card[];
  onReset: () => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const allFlipped = order.length > 0 && flipped.size === order.length;

  function toggleFlip(cardId: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {flipped.size} de {order.length} virados
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {order.map((c) => (
          <li key={c.id}>
            <FlipCard
              card={c}
              isFlipped={flipped.has(c.id)}
              onClick={() => toggleFlip(c.id)}
            />
          </li>
        ))}
      </ul>

      {allFlipped && (
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

function FlipCard({
  card,
  isFlipped,
  onClick
}: {
  card: Card;
  isFlipped: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flip-card w-full aspect-[3/2] focus:outline-none focus:ring-4 focus:ring-brand-300 rounded-3xl ${
        isFlipped ? "flipped" : ""
      }`}
      aria-pressed={isFlipped}
    >
      <div className="flip-card-inner">
        <div className="flip-card-face flip-card-front rounded-3xl bg-white border-2 border-slate-200 shadow-sm p-6">
          <FitText className="font-black text-slate-800">{card.word}</FitText>
        </div>
        <div className="flip-card-face flip-card-back rounded-3xl overflow-hidden bg-slate-100 shadow-sm">
          <img
            src={card.imageThumb || card.imageUrl}
            alt={card.imageAlt || card.word}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </button>
  );
}
