export default function Podium({ state }) {
  const payload = state?.phasePayload || {};
  const { first, second, third } = payload;

  function PodiumCard({ place, data, className }) {
    if (!data) return null;
    return (
      <div className={`podium-card podium-card--${place} ${className || ''}`}>
        {place === 'first' && <span className="podium-crown" aria-hidden>👑</span>}
        <div className="podium-card-name">{data.name}</div>
        <div className="podium-card-score">{Math.round(data.score ?? 0)} puan</div>
        {data.subText ? (
          <div className="podium-card-subtext">{data.subText}</div>
        ) : (
          (data.traits || []).map((t, i) => (
            <div key={i} className="podium-card-trait">{t}</div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="view podium-view">
      <img src="/assets/saziye-gulen.png" alt="" className="podium-character" aria-hidden />
      <div className="podium-bubble">
        <p className="podium-speech">
          İşte böyle! Kazananlar belli oldu... ama herkesin sırrını öğrendik hehehe 😄
        </p>
      </div>
      <div className="podium-stand">
        <PodiumCard place="second" data={second} className="podium-card--left" />
        <PodiumCard place="first" data={first} className="podium-card--center" />
        <PodiumCard place="third" data={third} className="podium-card--right" />
      </div>
    </div>
  );
}
