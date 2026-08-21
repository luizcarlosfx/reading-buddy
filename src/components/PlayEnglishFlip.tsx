import { useState } from "react";
import type { Card } from "../types";
import FitText from "./FitText";
import { speak, ttsSupported } from "../lib/tts";

export default function PlayEnglishFlip({
  order,
  onReset
}: {
  order: Card[];
  onReset: () => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const allFlipped = order.length > 0 && flipped.size === order.length;

  function toggleFlip(card: Card) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
        speak(card.word);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {flipped.size} de {order.length} revelados
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {order.map((c) => (
          <li key={c.id}>
            <EnglishCard
              card={c}
              isFlipped={flipped.has(c.id)}
              onClick={() => toggleFlip(c)}
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

function EnglishCard({
  card,
  isFlipped,
  onClick
}: {
  card: Card;
  isFlipped: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`flip-card w-full aspect-[3/2] focus:outline-none focus:ring-4 focus:ring-brand-300 rounded-3xl ${
          isFlipped ? "flipped" : ""
        }`}
        aria-pressed={isFlipped}
      >
        <div className="flip-card-inner">
          <div className="flip-card-face flip-card-front rounded-3xl overflow-hidden bg-slate-100 shadow-sm">
            <img
              src={card.imageThumb || card.imageUrl}
              alt={card.imageAlt || ""}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flip-card-face flip-card-back rounded-3xl bg-white border-2 border-slate-200 shadow-sm p-6">
            <FitText className="font-black text-slate-800">{card.word}</FitText>
          </div>
        </div>
      </button>

      {isFlipped && ttsSupported() && (
        <button
          onClick={() => speak(card.word)}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-brand-500 text-white text-xl shadow-md grid place-items-center hover:bg-brand-600 transition"
          aria-label={`Ouvir "${card.word}"`}
        >
          🔊
        </button>
      )}
    </div>
  );
}
