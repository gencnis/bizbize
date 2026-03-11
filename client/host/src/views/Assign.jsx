import { useEffect, useState } from 'react';

export default function Assign({ state, onAdvance }) {
  const { roles, phasePayload, players } = state;
  const idx = phasePayload.assignRoleIndex ?? 0;
  const role = roles[idx];
  const timerEndsAt = phasePayload.timerEndsAt;
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!timerEndsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  const isLastRole = idx >= roles.length - 1;

  return (
    <div className="view">
      <h2>Assigning roles</h2>
      <p className="role-label">Role {idx + 1} of {roles.length}: {role?.label}</p>
      <p className="timer">Time left: {secondsLeft}s</p>
      <p className="hint">{players.length} players choosing…</p>
      <button onClick={onAdvance}>{isLastRole ? 'Skip to results' : 'Next role'}</button>
    </div>
  );
}
