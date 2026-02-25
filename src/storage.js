const key = (user) => `praxislog:${user}:data`;

export function loadData(user) {
  try {
    const raw = localStorage.getItem(key(user));
    if (!raw) return { clients: [], sessions: [] };
    return JSON.parse(raw);
  } catch {
    return { clients: [], sessions: [] };
  }
}

export function saveData(user, data) {
  localStorage.setItem(key(user), JSON.stringify(data));
}
