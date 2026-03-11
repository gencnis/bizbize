import { useMemo } from 'react';

export default function ResultsLoop({ state, onNext }) {
  const { roles, assignments, players, phasePayload } = state;
  const idx = phasePayload.resultsRoleIndex ?? 0;
  const role = roles[idx];
  const isLast = idx >= roles.length - 1;

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
      <h2>Results</h2>
      <p className="role-label">{role?.label}</p>
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
      <button onClick={onNext}>{isLast ? 'See scores' : 'Next role'}</button>
    </div>
  );
}
