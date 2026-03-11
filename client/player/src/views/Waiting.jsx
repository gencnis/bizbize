export default function Waiting({ state, message = 'Revealing results…', playerId, onNext, characterSrc }) {
  const phasePayload = state?.phasePayload || {};
  const ready = phasePayload.readyPlayerIds || {};
  const readyCount = Object.keys(ready).length;
  const total = state?.players?.length ?? 0;
  const iReady = playerId && !!ready[playerId];

  const content = (
    <>
      {onNext ? (
        iReady ? (
          <p className="hint">Az sabret, diğerlerini bekliyoruz: ({readyCount}/{total})…</p>
        ) : (
          <button onClick={onNext}>Sonraki</button>
        )
      ) : (
        <p className="hint">Ay bi bekle canım!</p>
      )}
    </>
  );

  if (characterSrc) {
    return (
      <div className="view">
        <div className="card">
          <div className="saziye-card-header">
            <h2>{message}</h2>
            <img src={characterSrc} alt="" className="saziye-card-img" aria-hidden />
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h2>{message}</h2>
      {content}
    </div>
  );
}
