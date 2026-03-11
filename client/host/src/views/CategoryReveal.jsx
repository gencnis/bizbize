export default function CategoryReveal({ state }) {
  const { category, roles, categoryOptions } = state;
  const options = categoryOptions || [];

  return (
    <div className="view">
      <h1>
        {category?.emoji && <span className="emoji-spacer">{category.emoji}</span>}
        {category?.name ?? 'Category'}
      </h1>
      {options.length > 0 && (
        <>
          <p className="hint">Categories this round:</p>
          <ul className="roles-list">
            {options.map((c) => (
              <li key={c.id}>
                {c.id === category?.id ? <strong>{c.name}</strong> : c.name}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>Roles</h2>
      <ul className="roles-list">
        {roles?.map((r) => (
          <li key={r.id}>
            {r.label}
          </li>
        ))}
      </ul>
      <p className="hint">Get ready to assign one person per role.</p>
    </div>
  );
}
