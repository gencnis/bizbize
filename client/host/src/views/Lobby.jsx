export default function Lobby({ state, onStart }) {
  const { players } = state;
  const canStart = players.length >= 2 && players.length <= 10;

  return (
    <div className="view">
      <h1>Lobby</h1>
      <p>Share the room code so players can join (2–10 players).</p>
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <button disabled={!canStart} onClick={onStart}>
        Start game
      </button>
      {!canStart && players.length > 0 && (
        <p className="hint">Need 2–10 players to start.</p>
      )}
    </div>
  );
}
