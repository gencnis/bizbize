export default function CategoryReveal({ state, playerId, onVote, onNext }) {
  const { category, roles, categoryOptions, phasePayload, players } = state;
  const stage = phasePayload?.stage || (!category ? 'vote' : 'roles');
  const ready = phasePayload?.readyPlayerIds || {};
  const readyCount = Object.keys(ready).length;
  const total = players?.length ?? 0;
  const iReady = !!ready[playerId];
  const options = categoryOptions || [];
  const categoryVotes = phasePayload?.categoryVotes || {};
  const myVote = categoryVotes[playerId];

  const getVoteCount = (categoryId) =>
    Object.values(categoryVotes).filter((id) => id === categoryId).length;

  return (
    <div className="view">
      <div className="card">
        <div className="saziye-card-header">
          {stage === 'vote' && <h1>Kategori Seç</h1>}
          {stage === 'roles' && (
            <h1>
              {category?.emoji && <span className="emoji-spacer">{category.emoji}</span>}
              {category?.name ?? 'Category'}
            </h1>
          )}
          <img src="/assets/saziye-dedikodu.png" alt="" className="saziye-card-img" aria-hidden />
        </div>
      {stage === 'vote' && (
        <>
          <ul className="ul-clean">
            {options.map((c) => {
              const voteCount = getVoteCount(c.id);
              const isSelected = myVote === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`btn-card category-vote-card ${isSelected ? 'category-vote-card--selected' : ''}`}
                    onClick={() => onVote && onVote(c.id)}
                  >
                    <span>
                      {c.emoji && <span className="emoji-spacer">{c.emoji}</span>}
                      {c.name}
                    </span>
                    <span className="category-vote-count">{voteCount}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="hint">Kategoriye oy vererek karar veriyorsunuz yavrum. Beraberlik olursa da artık kader… rastgele seçiyoruz.</p>
        </>
      )}
      {stage === 'roles' && (
        <>
          <p className="role-prompt">Bu turdaki roller şunlar bakalım:          </p>
          <ul className="ul-clean">
            {roles?.map((r) => (
              <li key={r.id}>
                {r.label}
              </li>
            ))}
          </ul>
          {iReady ? (
            <p className="hint">Dur biraz canım, diğerlerini bekliyoruz: ({readyCount}/{total})…</p>
          ) : (
            <button onClick={onNext}>Sonraki</button>
          )}
        </>
      )}
      </div>
    </div>
  );
}
