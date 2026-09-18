let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // O navegador suspende o contexto até o primeiro toque; retomar é barato e idempotente.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(ac: AudioContext, freq: number, startAt: number, duration: number): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** Som curto de "acabou o tempo": dois bipes graves descendentes. */
export function playTimeoutSound(): void {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  beep(ac, 220, now, 0.18);
  beep(ac, 155, now + 0.2, 0.28);
}
