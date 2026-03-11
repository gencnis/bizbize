export default function Lobby({ state, isHost, onStart }) {
  const { players, roomId } = state;
  const count = players?.length ?? 0;
  const canStart = isHost && count >= 2 && count <= 10;

  return (
    <div className="view lobby-page">
      <div className="lobby-hero card">
        <div className="saziye-card-header">
          <h1 className="lobby-title">Bekleme Odası</h1>
          <img src="/assets/saziye-gulumseyen.png" alt="Şaziye Teyze" className="saziye-card-img" />
        </div>
        <div className="lobby-speech-bubble">
          <p className="lobby-speech-text">Herkes gelsin, çay demleniyor... ☕</p>
        </div>
      </div>

      {roomId && (
        <div className="lobby-code-card card">
          <div className="lobby-code-label">ODA KODU</div>
          <div className="lobby-code-value">{roomId}</div>
          <p className="lobby-code-subtitle">Bu kodu arkadaşlarınla paylaş</p>
        </div>
      )}

      <div className="lobby-players-section">
        <p className="lobby-players-count">{count}/10 oyuncu</p>
        <ul className="lobby-player-chips">
          {players?.map((p, i) => (
            <li key={p.id} className={`lobby-player-chip ${i === 0 ? 'lobby-player-chip--host' : ''}`}>
              {i === 0 && <span className="lobby-crown" aria-hidden>👑</span>}
              {p.name}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <>
          <button onClick={onStart} disabled={!canStart} className="lobby-start-btn">
            Oyunu Başlat
          </button>
          {!canStart && count > 0 && (
            <p className="hint">2–10 oyuncu gerekli.</p>
          )}
        </>
      )}
      {!isHost && (
        <div className="lobby-waiting">
          <p className="lobby-waiting-text">Arkadaşınız oyunu başlatacak... inşallah yani.</p>
          <div className="lobby-thinking">
            <img src="/assets/saziye-gulumseyen.png" alt="" className="lobby-thinking-img" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}
