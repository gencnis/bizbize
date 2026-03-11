import { useEffect, useState } from 'react';

const DURATION_MS = 10000;

export default function BetweenRounds({ state }) {
  const roundNumber = state?.roundNumber ?? 1;
  const roundJustCompleted = Math.min(roundNumber - 1, 3);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="view between-rounds">
      <p className="between-rounds-label">{roundJustCompleted}. / 3. tur</p>
      <div className="between-rounds-hero">
        <img src="/assets/saziye-gulen.png" alt="" className="between-rounds-img" aria-hidden />
        <div className="between-rounds-bubble">
          <p className="between-rounds-speech">
            Hehehe... neler neler öğrendik herkes hakkında. Ama bana dedikodu yetmez, biraz daha lazım!
          </p>
        </div>
      </div>
      <div className="between-rounds-progress-wrap">
        <div className="between-rounds-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
