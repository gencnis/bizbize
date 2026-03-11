import { useEffect, useState } from 'react';

const ASSIGN_TOTAL_SECONDS = 30;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 16;

export default function Assign({ state, playerId, onAssign }) {
  const { roles, phasePayload, players, assignments, category } = state;
  const idx = phasePayload.assignRoleIndex ?? 0;
  const role = roles[idx];
  const timerEndsAt = phasePayload.timerEndsAt;
  const [secondsLeft, setSecondsLeft] = useState(ASSIGN_TOTAL_SECONDS);
  const [pendingSelection, setPendingSelection] = useState(null);

  useEffect(() => {
    if (!timerEndsAt) return;
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  const myAssignment = role && assignments[role.id]?.[playerId];
  const hasSubmitted = !!myAssignment?.selectedPlayerId;
  const timeUp = secondsLeft <= 0;
  const disabled = hasSubmitted || timeUp;

  const handleSelect = (selectedPlayerId) => {
    if (disabled) return;
    setPendingSelection(selectedPlayerId);
  };

  const handleConfirm = () => {
    if (disabled || !pendingSelection || !role) return;
    onAssign(role.id, pendingSelection);
  };

  const timerPercent = Math.max(0, (secondsLeft / ASSIGN_TOTAL_SECONDS) * 100);
  const timerColor = secondsLeft <= 10 ? 'var(--red)' : 'var(--green)';

  if (!role) {
    return (
      <div className="view assign-view">
        <p className="assign-waiting">Sonraki rol için bekleniyor…</p>
      </div>
    );
  }

  return (
    <div className="view assign-view">
      <div className="card assign-card">
        <div className="saziye-card-header">
          <h1 className="assign-role-name">{role.label}</h1>
          <img src="/assets/saziye-dedikodu.png" alt="" className="saziye-card-img" aria-hidden />
        </div>
        <div className="assign-top">
        {role.description && (
          <p className="assign-role-desc">{role.description}</p>
        )}
        {category?.name && (
          <p className="assign-category-name">{category.emoji && `${category.emoji} `}{category.name}</p>
        )}
        <div className="assign-timer-wrap">
          <svg className="assign-timer-svg" viewBox="0 0 36 36">
            <circle className="assign-timer-bg" cx="18" cy="18" r="16" />
            <circle
              className="assign-timer-fill"
              cx="18"
              cy="18"
              r="16"
              style={{
                stroke: timerColor,
                strokeDasharray: `${(timerPercent / 100) * TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`,
              }}
            />
          </svg>
          <span className="assign-timer-value">{secondsLeft}</span>
        </div>
      </div>
      </div>

      <p className="assign-speed-hint">Hızlı seç, çok kazan! ⚡</p>

      {disabled ? (
        <p className="assign-done hint">
          Seçimin: {players.find((p) => p.id === myAssignment?.selectedPlayerId)?.name ?? '—'}. Dur bakalım, millet daha düşünüyor...
        </p>
      ) : (
        <>
          <ul className="assign-player-list">
            {players.map((p) => {
              const isSelected = pendingSelection === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`assign-player-card ${isSelected ? 'assign-player-card--selected' : ''}`}
                    onClick={() => handleSelect(p.id)}
                  >
                    {isSelected && <span className="assign-check" aria-hidden>✓</span>}
                    <span className="assign-player-name">{p.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {pendingSelection && (
            <button
              type="button"
              className="assign-confirm-btn"
              onClick={handleConfirm}
            >
              Seç
            </button>
          )}
        </>
      )}
    </div>
  );
}
