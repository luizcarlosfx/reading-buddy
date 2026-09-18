import { useState } from "react";
import type { Card } from "../types";
import FitText from "./FitText";
import RoundSummary from "./RoundSummary";
import TimerBar from "./TimerBar";
import { formatResult, parseMath, type MathExpr } from "../lib/math";
import { speak } from "../lib/tts";
import { useScrollToActive } from "../lib/useScrollToActive";
import { useTimedTurns } from "../lib/useTimedTurns";
import { useVoiceAvailable } from "../lib/useVoice";

export default function PlayMathFlip({
  order,
  timeLimit,
  onReset
}: {
  order: Card[];
  timeLimit: number | null;
  onReset: () => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const canSpeak = useVoiceAvailable("pt-BR");

  const turns = useTimedTurns(order.length, timeLimit, (index) => {
    const card = order[index];
    if (!card) return;
    setFlipped((prev) => new Set(prev).add(card.id));
    setMissed((prev) => new Set(prev).add(card.id));
    const expr = parseMath(card.word);
    if (expr && canSpeak) speak(formatResult(expr.result), "pt-BR");
  });

  const itemRefs = useScrollToActive(turns.activeIndex, turns.timed);

  const finished = turns.timed
    ? turns.done
    : order.length > 0 && flipped.size === order.length;

  function toggleFlip(card: Card, expr: MathExpr | null, index: number) {
    if (!turns.isActive(index)) return;
    const isFlipped = flipped.has(card.id);
    if (turns.timed && isFlipped) return;

    setFlipped((prev) => {
      const next = new Set(prev);
      if (isFlipped) next.delete(card.id);
      else next.add(card.id);
      return next;
    });
    if (!isFlipped) {
      if (expr && canSpeak) speak(formatResult(expr.result), "pt-BR");
      turns.resolve(index);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {flipped.size} de {order.length} respondidos
        {turns.timed && missed.size > 0 && (
          <span className="text-rose-600 font-bold"> · {missed.size} sem tempo</span>
        )}
        {!canSpeak && (
          <span className="block text-xs text-slate-400 mt-1">
            Sem voz em português neste aparelho — os cards ficam sem som.
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {order.map((c, idx) => {
          const expr = parseMath(c.word);
          return (
            <li
              key={c.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
            >
              <MathCard
                card={c}
                expr={expr}
                isFlipped={flipped.has(c.id)}
                isMissed={missed.has(c.id)}
                canSpeak={canSpeak}
                highlight={turns.timed && idx === turns.activeIndex}
                dimmed={turns.timed && !flipped.has(c.id) && idx !== turns.activeIndex}
                showTimerSlot={turns.timed}
                timer={
                  turns.counting && idx === turns.activeIndex
                    ? { fraction: turns.fraction, secondsLeft: turns.secondsLeft }
                    : null
                }
                onClick={() => toggleFlip(c, expr, idx)}
              />
            </li>
          );
        })}
      </ul>

      {finished && <RoundSummary missed={missed.size} onReset={onReset} />}
    </div>
  );
}

function MathCard({
  card,
  expr,
  isFlipped,
  isMissed,
  canSpeak,
  highlight,
  dimmed,
  showTimerSlot,
  timer,
  onClick
}: {
  card: Card;
  expr: MathExpr | null;
  isFlipped: boolean;
  isMissed: boolean;
  canSpeak: boolean;
  highlight: boolean;
  dimmed: boolean;
  showTimerSlot: boolean;
  timer: { fraction: number; secondsLeft: number } | null;
  onClick: () => void;
}) {
  const front = expr ? expr.display : card.word;
  const back = expr ? formatResult(expr.result) : "?";

  let ringClass = "";
  if (isMissed) ringClass = "ring-4 ring-rose-300";
  else if (highlight) ringClass = "ring-4 ring-brand-400";

  return (
    <div className={`transition-opacity ${dimmed ? "opacity-40" : ""}`}>
      <div className="relative">
        <button
          onClick={onClick}
          disabled={dimmed}
          className={`flip-card w-full aspect-[3/2] focus:outline-none focus:ring-4 focus:ring-brand-300 rounded-3xl ${ringClass} ${
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

      {showTimerSlot && <div className="h-6 mt-2">{timer && <TimerBar {...timer} />}</div>}
    </div>
  );
}
