import { useEffect, useMemo, useRef, useState } from "react";
import { applyCase } from "../lib/letterCase";
import { normalizeAnswer } from "../lib/normalize";
import { useScrollToActive } from "../lib/useScrollToActive";
import { useTimedTurns } from "../lib/useTimedTurns";
import type { Card, LetterCase } from "../types";
import RoundSummary from "./RoundSummary";
import TimerBar from "./TimerBar";

export default function PlayImageType({
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());

  // Resposta entregue (pelo botão ou pelo estouro do tempo) não vira acerto.
  const correctIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of order) {
      if (revealed.has(c.id)) continue;
      const a = answers[c.id] ?? "";
      if (a && normalizeAnswer(a) === normalizeAnswer(c.word)) set.add(c.id);
    }
    return set;
  }, [answers, order, revealed]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevCorrectRef = useRef<Set<string>>(new Set());

  const turns = useTimedTurns(order.length, timeLimit, (index) => {
    const card = order[index];
    if (!card) return;
    setAnswers((prev) => ({ ...prev, [card.id]: applyCase(card.word, letterCase) }));
    setRevealed((prev) => new Set(prev).add(card.id));
    setMissed((prev) => new Set(prev).add(card.id));
  });

  const itemRefs = useScrollToActive(turns.activeIndex, turns.timed);

  const resolvedCount = correctIds.size + revealed.size;
  const finished = turns.timed ? turns.done : resolvedCount === order.length && order.length > 0;

  // Sem tempo, o foco anda sozinho pro próximo item assim que um acerto entra.
  useEffect(() => {
    if (turns.timed) return;
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
  }, [correctIds, order, revealed, turns.timed]);

  // Com tempo, quem manda no foco é a vez do card.
  useEffect(() => {
    if (!turns.counting) return;
    inputRefs.current[turns.activeIndex]?.focus();
  }, [turns.counting, turns.activeIndex]);

  // Acertou o card da vez dentro do tempo: encerra a contagem dele.
  const { counting, activeIndex, resolve } = turns;
  useEffect(() => {
    if (!counting) return;
    const card = order[activeIndex];
    if (card && correctIds.has(card.id)) resolve(activeIndex);
  }, [correctIds, order, counting, activeIndex, resolve]);

  function reveal(card: Card, index: number) {
    setAnswers((prev) => ({ ...prev, [card.id]: applyCase(card.word, letterCase) }));
    setRevealed((prev) => new Set(prev).add(card.id));
    turns.resolve(index);
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-slate-500">
        {correctIds.size} de {order.length} acertos
        {turns.timed && missed.size > 0 && (
          <span className="text-rose-600 font-bold"> · {missed.size} sem tempo</span>
        )}
      </div>

      <ul className="space-y-3">
        {order.map((c, idx) => (
          <li
            key={c.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
          >
            <TypeRow
              card={c}
              index={idx}
              letterCase={letterCase}
              answer={answers[c.id] ?? ""}
              isCorrect={correctIds.has(c.id)}
              isRevealed={revealed.has(c.id)}
              isMissed={missed.has(c.id)}
              locked={!turns.isActive(idx)}
              dimmed={
                turns.timed &&
                !correctIds.has(c.id) &&
                !revealed.has(c.id) &&
                idx !== turns.activeIndex
              }
              timer={
                turns.counting && idx === turns.activeIndex
                  ? { fraction: turns.fraction, secondsLeft: turns.secondsLeft }
                  : null
              }
              inputRef={(el) => {
                inputRefs.current[idx] = el;
              }}
              onChange={(value) =>
                setAnswers((prev) => ({ ...prev, [c.id]: value }))
              }
              onReveal={() => reveal(c, idx)}
            />
          </li>
        ))}
      </ul>

      {finished && <RoundSummary missed={missed.size} onReset={onReset} />}
    </div>
  );
}

function TypeRow({
  card,
  index,
  letterCase,
  answer,
  isCorrect,
  isRevealed,
  isMissed,
  locked,
  dimmed,
  timer,
  inputRef,
  onChange,
  onReveal
}: {
  card: Card;
  index: number;
  letterCase: LetterCase;
  answer: string;
  isCorrect: boolean;
  isRevealed: boolean;
  isMissed: boolean;
  locked: boolean;
  dimmed: boolean;
  timer: { fraction: number; secondsLeft: number } | null;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onReveal: () => void;
}) {
  const hasInput = answer.trim().length > 0;
  const wrongAttempt = hasInput && !isCorrect && !isRevealed;

  const caseClass =
    letterCase === "upper"
      ? "uppercase placeholder:normal-case"
      : letterCase === "lower"
      ? "lowercase placeholder:normal-case"
      : "";

  let borderClass = "border-slate-200";
  if (isCorrect) borderClass = "border-emerald-500";
  else if (isMissed) borderClass = "border-rose-400";
  else if (wrongAttempt) borderClass = "border-rose-300";

  return (
    <div
      className={`card p-3 flex items-center gap-3 sm:gap-4 border-2 transition ${borderClass} ${
        dimmed ? "opacity-40" : ""
      }`}
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
            disabled={isCorrect || isRevealed || locked}
            className={`input pr-12 text-2xl font-bold ${caseClass} ${
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

        {timer && <TimerBar {...timer} />}

        {!isCorrect && !isRevealed && !locked && (
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
