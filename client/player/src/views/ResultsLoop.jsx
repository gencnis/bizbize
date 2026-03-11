import { useMemo } from 'react';

export default function ResultsLoop({ state, playerId, onNext }) {
  const { roles, assignments, players, phasePayload } = state;
  const idx = phasePayload.resultsRoleIndex ?? 0;
  const role = roles[idx];
  const ready = phasePayload?.readyPlayerIds || {};
  const readyCount = Object.keys(ready).length;
  const total = players?.length ?? 0;
  const iReady = playerId && !!ready[playerId];

  const voteCounts = useMemo(() => {
    if (!role || !assignments[role.id]) return [];
    const counts = {};
    players.forEach((p) => (counts[p.id] = { name: p.name, count: 0 }));
    Object.values(assignments[role.id]).forEach(({ selectedPlayerId }) => {
      if (counts[selectedPlayerId]) counts[selectedPlayerId].count += 1;
    });
    return Object.entries(counts)
      .map(([id, { name, count }]) => ({ id, name, count }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [role, assignments, players]);

  const maxCount = voteCounts[0]?.count ?? 1;

  return (
    <div className="view">
      <div className="card">
        <div className="saziye-card-header">
          <h2>İşte Sonuçlar</h2>
          <img src="/assets/saziye-gulumseyen.png" alt="" className="saziye-card-img" aria-hidden />
        </div>
      <p className="role-prompt">{role?.label}</p>
      <div className="bar-chart">
        {voteCounts.map(({ id, name, count }) => (
          <div key={id} className="bar-row">
            <span className="bar-label">{name}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="bar-value">{count}</span>
          </div>
        ))}
      </div>
      <p className="hint">Daha {roles.length} rolden {idx + 1}. roldeyiz.</p>
      {onNext && (
        iReady ? (
          <p className="hint">Az sabret, diğerlerini bekliyoruz: ({readyCount}/{total})…</p>
        ) : (
          <button onClick={onNext}>{idx >= roles.length - 1 ? 'Sonuçları Gör' : 'Sonraki Rol'}</button>
        )
      )}
      </div>
    </div>
  );
}
