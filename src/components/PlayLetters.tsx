import { useState } from "react";
import { applyCase } from "../lib/letterCase";
import { letterName } from "../lib/letters";
import { speak } from "../lib/tts";
import { useScrollToActive } from "../lib/useScrollToActive";
import { useTimedTurns } from "../lib/useTimedTurns";
import { useVoiceAvailable } from "../lib/useVoice";
import type { Card, LetterCase } from "../types";
import FitText from "./FitText";
import RoundSummary from "./RoundSummary";
import TimerBar from "./TimerBar";

export default function PlayLetters({
  order,
  letterCase,
  timeLimit,
  onReset
}: {
  order: Card[];
  letterCase: LetterCase;
  timeLimit: number | null;
  onReset: () => void;
}) {
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const canSpeak = useVoiceAvailable("pt-BR");

  const turns = useTimedTurns(order.length, timeLimit, (index) => {
    const card = order[index];
    if (!card) return;
    setHeard((prev) => new Set(prev).add(card.id));
    setMissed((prev) => new Set(prev).add(card.id));
    speak(letterName(card.word), "pt-BR");
  });

  const itemRefs = useScrollToActive(turns.activeIndex, turns.timed);

  const finished = turns.timed
    ? turns.done
    : order.length > 0 && heard.size === order.length;

  function handleTap(card: Card, index: number) {
    // Letra já ouvida pode ser tocada de novo pra repetir o som, sem mexer na vez.
    if (turns.timed && heard.has(card.id)) {
      speak(letterName(card.word), "pt-BR");
      return;
    }
    if (!turns.isActive(index)) return;
    speak(letterName(card.word), "pt-BR");
    setHeard((prev) => new Set(prev).add(card.id));
    turns.resolve(index);
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {heard.size} de {order.length} letras
        {turns.timed && missed.size > 0 && (
          <span className="text-rose-600 font-bold"> · {missed.size} sem tempo</span>
        )}
        {!canSpeak && (
          <span className="block text-xs text-slate-400 mt-1">
            Sem voz em português neste aparelho — as letras ficam sem som.
          </span>
        )}
      </div>

      <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {order.map((c, idx) => (
          <li
            key={c.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
          >
            <LetterTile
              text={applyCase(c.word, letterCase)}
              isHeard={heard.has(c.id)}
              isMissed={missed.has(c.id)}
              highlight={turns.timed && idx === turns.activeIndex}
              dimmed={turns.timed && !heard.has(c.id) && idx !== turns.activeIndex}
              showTimerSlot={turns.timed}
              timer={
                turns.counting && idx === turns.activeIndex
                  ? { fraction: turns.fraction, secondsLeft: turns.secondsLeft }
                  : null
              }
              onClick={() => handleTap(c, idx)}
            />
          </li>
        ))}
      </ul>

      {finished && <RoundSummary missed={missed.size} onReset={onReset} />}
    </div>
  );
}

function LetterTile({
  text,
  isHeard,
  isMissed,
  highlight,
  dimmed,
  showTimerSlot,
  timer,
  onClick
}: {
  text: string;
  isHeard: boolean;
  isMissed: boolean;
  highlight: boolean;
  dimmed: boolean;
  showTimerSlot: boolean;
  timer: { fraction: number; secondsLeft: number } | null;
  onClick: () => void;
}) {
  let ringClass = "";
  if (isMissed) ringClass = "ring-4 ring-rose-300";
  else if (highlight) ringClass = "ring-4 ring-brand-400";

  const faceClass = isHeard
    ? "bg-brand-50 border-brand-200 text-brand-700"
    : "bg-white border-slate-200 text-slate-800";

  return (
    <div className={`transition-opacity ${dimmed ? "opacity-40" : ""}`}>
      <button
        onClick={onClick}
        disabled={dimmed}
        className={`w-full aspect-square rounded-3xl border-2 shadow-sm p-4 transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-300 ${faceClass} ${ringClass}`}
        aria-label={`Ouvir a letra ${text}`}
      >
        <FitText className="font-black">{text}</FitText>
      </button>

      {showTimerSlot && <div className="h-6 mt-2">{timer && <TimerBar {...timer} />}</div>}
    </div>
  );
}
