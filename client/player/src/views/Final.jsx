function pickOneTrait(playerId, roleIndex, list) {
  if (!list.length) return null;
  let h = 0;
  for (let j = 0; j < playerId.length; j++) h = (h * 31 + playerId.charCodeAt(j)) >>> 0;
  const idx = (h + roleIndex * 17) % list.length;
  return list[idx];
}

function getTraitsDisplay(player) {
  const wonRoles = player.wonRoles || [];
  if (wonRoles.length === 0) return 'Gizemli Tip';
  const traits = [];
  for (let i = 0; i < Math.min(3, wonRoles.length); i++) {
    const list = wonRoles[i].traits || [];
    const t = pickOneTrait(player.id, i, list);
    if (t) traits.push(t);
  }
  return traits.length ? traits.join(' · ') : 'Gizemli Tip';
}

export default function Final({ state, playerId }) {
  const sorted = [...(state.players || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sorted[0];
  return (
    <div className="view">
      <div className="card">
        <div className="saziye-card-header">
          <h1>Oyun Bitti!</h1>
          <img src="/assets/saziye-gulen.png" alt="" className="saziye-card-img" aria-hidden />
        </div>
      {winner && (
        <p className="winner">
          Ay maşallah! {Math.round(winner.score ?? 0)} puanla kazanan {winner.name} oldu!
        </p>
      )}
      <ol className="ul-clean final-leaderboard">
        {sorted.map((p, i) => (
          <li key={p.id} className="final-leaderboard-item">
            <div>
              {i + 1}. {p.name}
              {p.id === playerId && ' (sen)'} — <strong>{Math.round(p.score ?? 0)}</strong>
            </div>
            <div className="final-traits">{getTraitsDisplay(p)}</div>
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}
