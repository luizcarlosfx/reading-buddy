/** Barra de contagem regressiva mostrada embaixo do card da vez. */
export default function TimerBar({
  fraction,
  secondsLeft
}: {
  fraction: number;
  secondsLeft: number;
}) {
  const danger = fraction <= 0.25;

  return (
    <div className="flex items-center gap-2 h-full" aria-hidden="true">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full ease-linear ${
            danger ? "bg-rose-500" : "bg-brand-500"
          }`}
          style={{ width: `${fraction * 100}%`, transition: "width 100ms linear" }}
        />
      </div>
      <span
        className={`text-xs font-bold tabular-nums w-7 text-right ${
          danger ? "text-rose-600" : "text-slate-500"
        }`}
      >
        {Math.ceil(secondsLeft)}s
      </span>
    </div>
  );
}
