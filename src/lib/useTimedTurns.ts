import { useCallback, useEffect, useRef, useState } from "react";
import { playTimeoutSound } from "./sound";

/** Pausa depois de responder no tempo, só pra olhar a resposta. */
const OK_PAUSE_MS = 2000;
/** Pausa depois de estourar o tempo — mais longa, porque aqui ele precisa estudar a resposta. */
const TIMEOUT_PAUSE_MS = 7000;

type Phase = "running" | "pause-ok" | "pause-timeout" | "done";

export interface TimedTurns {
  /** Falso quando o tempo está desligado: tudo fica liberado, como antes. */
  timed: boolean;
  /** Card da vez; -1 quando a rodada acabou ou o tempo está desligado. */
  activeIndex: number;
  /** Um card só pode ser respondido se estiver liberado. */
  isActive: (index: number) => boolean;
  /** Fração do tempo que ainda resta, de 1 a 0. */
  fraction: number;
  secondsLeft: number;
  /** True enquanto a contagem do card da vez está correndo. */
  counting: boolean;
  done: boolean;
  /** Avisa que o card foi respondido no tempo. */
  resolve: (index: number) => void;
}

/**
 * Governa a vez de cada card quando há limite de tempo: conta o tempo do card
 * atual, avisa no estouro e dá uma pausa mostrando a resposta antes de liberar
 * o próximo. Com `seconds` nulo o hook fica inerte e libera todos os cards.
 */
export function useTimedTurns(
  count: number,
  seconds: number | null,
  onTimeout: (index: number) => void
): TimedTurns {
  const timed = seconds !== null && seconds > 0 && count > 0;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("running");
  const [secondsLeft, setSecondsLeft] = useState(seconds ?? 0);

  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!timed || phase !== "running") return;
    const total = seconds as number;
    const deadline = Date.now() + total * 1000;
    setSecondsLeft(total);
    const id = window.setInterval(() => {
      const left = (deadline - Date.now()) / 1000;
      if (left > 0) {
        setSecondsLeft(left);
        return;
      }
      window.clearInterval(id);
      setSecondsLeft(0);
      playTimeoutSound();
      onTimeoutRef.current(index);
      setPhase("pause-timeout");
    }, 100);
    return () => window.clearInterval(id);
  }, [timed, phase, index, seconds]);

  useEffect(() => {
    if (phase !== "pause-ok" && phase !== "pause-timeout") return;
    const ms = phase === "pause-timeout" ? TIMEOUT_PAUSE_MS : OK_PAUSE_MS;
    const id = window.setTimeout(() => {
      if (index + 1 >= count) {
        setPhase("done");
      } else {
        setIndex(index + 1);
        setPhase("running");
      }
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, index, count]);

  const resolve = useCallback(
    (i: number) => {
      if (!timed || i !== index) return;
      setPhase((p) => (p === "running" ? "pause-ok" : p));
    },
    [timed, index]
  );

  const isActive = useCallback(
    (i: number) => !timed || (phase === "running" && i === index),
    [timed, phase, index]
  );

  return {
    timed,
    activeIndex: !timed || phase === "done" ? -1 : index,
    isActive,
    fraction: seconds ? Math.max(0, Math.min(1, secondsLeft / seconds)) : 0,
    secondsLeft,
    counting: timed && phase === "running",
    done: timed && phase === "done",
    resolve
  };
}
