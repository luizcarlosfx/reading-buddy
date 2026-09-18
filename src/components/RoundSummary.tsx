/** Tela de fim de rodada. Muda de cara quando algum card estourou o tempo. */
export default function RoundSummary({
  missed,
  onReset
}: {
  missed: number;
  onReset: () => void;
}) {
  const perfect = missed === 0;

  return (
    <div
      className={`card p-6 text-center space-y-3 ${
        perfect ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="text-5xl">{perfect ? "🎉" : "💪"}</div>
      <h2 className="text-xl font-bold">{perfect ? "Muito bem!" : "Quase lá!"}</h2>
      {!perfect && (
        <p className="text-sm font-bold text-amber-800">
          {missed === 1 ? "1 card ficou" : `${missed} cards ficaram`} sem tempo.
        </p>
      )}
      <button onClick={onReset} className="btn-primary">
        Jogar de novo
      </button>
    </div>
  );
}
