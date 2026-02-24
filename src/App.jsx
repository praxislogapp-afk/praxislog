import { useEffect, useState } from "react";

const USER_KEY = "praxislog_user";

export default function App() {
  const [user, setUser] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const u = localStorage.getItem(USER_KEY);
    if (u) setUser(u);
  }, []);

  function login() {
    const v = name.trim();
    if (!v) return;
    localStorage.setItem(USER_KEY, v);
    setUser(v);
    setName("");
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    setUser("");
  }

  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.title}>PraxisLog</div>
          <div style={s.sub}>Σύνδεση (προσωρινή)</div>

          <input
            style={s.input}
            placeholder="Όνομα χρήστη (π.χ. alex)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? login() : null)}
          />

          <button style={s.btn} onClick={login}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>PraxisLog</div>
        <div style={s.row}>
          <div>
            Συνδεδεμένος ως: <b>{user}</b>
          </div>
          <button style={s.btn2} onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  card: {
    width: 320,
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  sub: { opacity: 0.75, marginBottom: 12 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d9d9d9",
    fontSize: 14,
    marginBottom: 10,
  },
  btn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  btn2: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #d9d9d9",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
};
