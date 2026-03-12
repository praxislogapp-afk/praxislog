import { useEffect, useState } from "react";
import { loadData, saveData } from "./storage";

const USER_KEY = "praxislog_user";

export default function App() {
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [data, setData] = useState({ clients: [], sessions: [] });
  const [activeClient, setActiveClient] = useState(null);
  const [noteText, setNoteText] = useState("");

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

  function addSession() {
    if (!noteText.trim()) return;

    const session = {
      id: Date.now(),
      clientId: activeClient.id,
      date: new Date().toLocaleDateString("el-GR"),
      notes: noteText,
    };

    const next = {
      ...data,
      sessions: [session, ...data.sessions],
    };

    setData(next);
    saveData(user, next);
    setNoteText("");
  }

  function deleteSession(id) {
    const next = {
      ...data,
      sessions: data.sessions.filter((s) => s.id !== id),
    };

    setData(next);
    saveData(user, next);
  }

  function editSession(session) {
    const updated = prompt("Επεξεργασία σημειώσεων", session.notes);
    if (updated === null) return;

    const next = {
      ...data,
      sessions: data.sessions.map((s) =>
        s.id === session.id ? { ...s, notes: updated } : s
      ),
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

  if (activeClient) {
    const clientSessions = data.sessions.filter(
      (s) => s.clientId === activeClient.id
    );

    return (
      <div style={s.page}>
        <div style={s.cardLarge}>
          <button style={s.btn2} onClick={() => setActiveClient(null)}>
            ← Πίσω
          </button>

          <h2>{activeClient.fullname}</h2>

          <div>Ημερομηνία δημιουργίας: {activeClient.createdAt}</div>

          {activeClient.notes && (
            <div style={{ marginTop: 10 }}>
              Παρατηρήσεις: {activeClient.notes}
            </div>
          )}

          <hr style={{ margin: "20px 0" }} />

          <h3>Συνεδρίες</h3>

          <textarea
            style={s.textarea}
            placeholder="Σημειώσεις συνεδρίας..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />

          <button style={s.btn} onClick={addSession}>
            Καταχώρηση συνεδρίας
          </button>

          <div style={{ marginTop: 20 }}>
            {clientSessions.map((sess) => (
              <div key={sess.id} style={s.session}>
                <b>{sess.date}</b>
                <div>{sess.notes}</div>

                <button
                  style={s.editBtn}
                  onClick={() => editSession(sess)}
                >
                  Επεξεργασία
                </button>

                <button
                  style={s.deleteBtn}
                  onClick={() => deleteSession(sess.id)}
                >
                  Διαγραφή
                </button>
              </div>
            ))}
          </div>
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
              <li
                key={c.id}
                style={{ cursor: "pointer", marginBottom: 10 }}
                onClick={() => setActiveClient(c)}
              >
                <b>{c.fullname}</b>
                <div>Ημερομηνία: {c.createdAt}</div>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    fontFamily: "system-ui",
  },

  card: {
    width: 360,
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
  },

  cardLarge: {
    width: 600,
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
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

  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 10,
    marginTop: 10,
  },

  btn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
  },

  btn2: {
    padding: 8,
  },

  editBtn: {
    marginTop: 8,
    marginRight: 8,
    padding: 6,
    background: "#e6f0ff",
    border: "none",
    cursor: "pointer",
  },

  deleteBtn: {
    marginTop: 8,
    padding: 6,
    background: "#ffdddd",
    border: "none",
    cursor: "pointer",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sep: {
    marginTop: 10,
  },

  session: {
    border: "1px solid #eee",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
};
