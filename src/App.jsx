import { useEffect, useState } from "react";
import { loadData, saveData } from "./storage";

const USER_KEY = "praxislog_user";

export default function App() {
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [data, setData] = useState({ clients: [], sessions: [] });

  useEffect(() => {
    const u = localStorage.getItem(USER_KEY);
    if (u) {
      setUser(u);
      setData(loadData(u));
    }
  }, []);

  function login() {
    const v = name.trim();
    if (!v) return;
    localStorage.setItem(USER_KEY, v);
    setUser(v);
    setData(loadData(v));
    setName("");
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    setUser("");
    setData({ clients: [], sessions: [] });
  }

  function addClient() {
    const c = prompt("Όνομα ωφελούμενου");
    if (!c) return;
    const next = { ...data, clients: [...data.clients, c] };
    setData(next);
    saveData(user, next);
  }

  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.title}>PraxisLog</div>
          <div style={s.sub}>Σύνδεση (προσωρινή)</div>

          <input
            style={s.input}
            placeholder="Όνομα χρήστη"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? login() : null)}
          />

          <button style={s.btn} onClick={login}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>PraxisLog</div>

        <div style={s.row}>
          <div>Χρήστης: <b>{user}</b></div>
          <button style={s.btn2} onClick={logout}>Logout</button>
        </div>

        <div style={s.sep}>
          <b>Ωφελούμενοι</b>
          <ul>
            {data.clients.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <button style={s.btn} onClick={addClient}>+ Προσθήκη</button>
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
    width: 360,
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
    marginTop: 8,
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
  sep: { marginTop: 14, paddingTop: 12, borderTop: "1px solid #eee" },
};
