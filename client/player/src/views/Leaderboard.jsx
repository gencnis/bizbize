export default function Leaderboard({ state, playerId, onNext }) {
  const sorted = [...(state.players || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const phasePayload = state?.phasePayload || {};
  const ready = phasePayload.readyPlayerIds || {};
  const readyCount = Object.keys(ready).length;
  const total = state?.players?.length ?? 0;
  const iReady = playerId && !!ready[playerId];

  return (
    <div className="view">
      <div className="card">
        <div className="saziye-card-header">
          <h2>Lider Tablosu</h2>
          <img src="/assets/saziye-gulen.png" alt="" className="saziye-card-img" aria-hidden />
        </div>
      <ol className="ul-clean">
        {sorted.map((p, i) => (
          <li key={p.id} className="leaderboard-item">
            {i + 1}. {p.name}: <strong>{Math.round(p.score ?? 0)}</strong>
            {p.id === playerId && ' (sen)'}
          </li>
        ))}
      </ol>
      {onNext && (
        iReady ? (
          <p className="hint">Dur biraz canım, diğerlerini bekliyoruz: ({readyCount}/{total})…</p>
        ) : (
          <button onClick={onNext}>Sonraki</button>
        )
      )}
      </div>
    </div>
  );
}
