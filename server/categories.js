/**
 * Category definitions are stored in categories.json to make it easy
 * to add/edit categories without touching code.
 */

// eslint-disable-next-line global-require, import/no-dynamic-require
const raw = require('./categories.json');

function toId(str, fallback) {
  if (!str && fallback) return fallback;
  if (!str) return `cat-${Date.now()}`;
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const baseCategories = Array.isArray(raw) ? raw : raw.categories || [];

const categories = baseCategories.map((c, index) => {
  const id = c.id || toId(c.category, `cat-${index}`);
  return {
    id,
    name: c.category || c.name || id,
    emoji: c.emoji || '',
    description: c.description || '',
    roles: (c.roles || []).map((r) => ({
      name: r.role || r.name,
      description: r.description || '',
      traits: r.traits || [],
    })),
  };
});

function getCategory(id) {
  return categories.find((c) => c.id === id) || null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Select n roles from category.roles (random, no duplicates).
 * Returns array of { id, label, description } for use in game state.
 */
function selectRolesForPlayerCount(category, n) {
  if (!category || !category.roles || n < 1) return [];
  const pool = shuffle(category.roles);
  const selected = pool.slice(0, Math.min(n, pool.length));
  return selected.map((role, index) => ({
    id: `role-${index}-${toId(role.name || String(index)).slice(0, 12)}`,
    label: role.name,
    description: role.description || '',
    traits: role.traits || [],
  }));
}

function getRandomCategories(count) {
  if (!Array.isArray(categories) || categories.length === 0) return [];
  return shuffle(categories).slice(0, Math.min(count, categories.length));
}

module.exports = {
  categories,
  getCategory,
  getRandomCategories,
  selectRolesForPlayerCount,
};

