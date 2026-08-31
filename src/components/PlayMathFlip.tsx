import { useState } from "react";
import type { Card } from "../types";
import FitText from "./FitText";
import { formatResult, parseMath, type MathExpr } from "../lib/math";
import { speak } from "../lib/tts";
import { useVoiceAvailable } from "../lib/useVoice";

export default function PlayMathFlip({
  order,
  onReset
}: {
  order: Card[];
  onReset: () => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const canSpeak = useVoiceAvailable("pt-BR");
  const allFlipped = order.length > 0 && flipped.size === order.length;

  function toggleFlip(card: Card, expr: MathExpr | null) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
        if (expr && canSpeak) speak(formatResult(expr.result), "pt-BR");
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {flipped.size} de {order.length} respondidos
        {!canSpeak && (
          <span className="block text-xs text-slate-400 mt-1">
            Sem voz em português neste aparelho — os cards ficam sem som.
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {order.map((c) => {
          const expr = parseMath(c.word);
          return (
            <li key={c.id}>
              <MathCard
                card={c}
                expr={expr}
                isFlipped={flipped.has(c.id)}
                canSpeak={canSpeak}
                onClick={() => toggleFlip(c, expr)}
              />
            </li>
          );
        })}
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

function MathCard({
  card,
  expr,
  isFlipped,
  canSpeak,
  onClick
}: {
  card: Card;
  expr: MathExpr | null;
  isFlipped: boolean;
  canSpeak: boolean;
  onClick: () => void;
}) {
  const front = expr ? expr.display : card.word;
  const back = expr ? formatResult(expr.result) : "?";

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
          <div className="flip-card-face flip-card-front rounded-3xl bg-white border-2 border-slate-200 shadow-sm p-6">
            <FitText className="font-black text-slate-800">{front}</FitText>
          </div>
          <div className="flip-card-face flip-card-back rounded-3xl bg-brand-50 border-2 border-brand-200 shadow-sm p-6 flex flex-col">
            <div className="text-center text-sm font-bold text-brand-700/70">{front} =</div>
            <div className="flex-1 min-h-0">
              <FitText className="font-black text-brand-700">{back}</FitText>
            </div>
          </div>
        </div>
      </button>

      {isFlipped && expr && canSpeak && (
        <button
          onClick={() => speak(formatResult(expr.result), "pt-BR")}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-brand-500 text-white text-xl shadow-md grid place-items-center hover:bg-brand-600 transition"
          aria-label={`Ouvir o resultado de ${front}`}
        >
          🔊
        </button>
      )}
    </div>
  );
}
