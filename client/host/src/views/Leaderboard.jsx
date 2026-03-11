export default function Leaderboard({ state }) {
  const sorted = [...(state.players || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (
    <div className="view">
      <h2>Leaderboard</h2>
      <ol className="leaderboard-list">
        {sorted.map((p, i) => (
          <li key={p.id}>
            <span className="rank">{i + 1}.</span> {p.name}: <strong>{Math.round(p.score ?? 0)}</strong>
          </li>
        ))}
      </ol>
      <p className="hint">Next: final results.</p>
    </div>
  );
}
