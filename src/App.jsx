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
    const fullname = prompt("Ονοματεπώνυμο ωφελούμενου");
    if (!fullname) return;

    const notes = prompt("Παρατηρήσεις (προαιρετικά)") || "";

    const client = {
      id: Date.now(),
      fullname,
      notes,
      createdAt: new Date().toLocaleDateString("el-GR"),
    };

    const next = {
      ...data,
      clients: [...data.clients, client],
    };

    setData(next);
    saveData(user, next);
  }

  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.title}>PraxisLog</div>

          <input
            style={s.input}
            placeholder="Όνομα χρήστη"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Χρήστης: <b>{user}</b>
          </div>
          <button style={s.btn2} onClick={logout}>
            Logout
          </button>
        </div>

        <div style={s.sep}>
          <b>Ωφελούμενοι</b>

          <ul>
            {data.clients.map((c) => (
              <li key={c.id}>
                <b>{c.fullname}</b>
                <div>Ημερομηνία: {c.createdAt}</div>
                {c.notes && <div style={{ opacity: 0.7 }}>{c.notes}</div>}
              </li>
            ))}
          </ul>

          <button style={s.btn} onClick={addClient}>
            + Προσθήκη
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
    fontFamily: "system-ui",
  },
  card: {
    width: 360,
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
  },
  btn: {
    width: "100%",
    padding: 10,
  },
  btn2: {
    padding: 8,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sep: {
    marginTop: 10,
  },
};
