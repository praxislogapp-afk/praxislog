import { useState, useEffect } from "react";

const USER_KEY = "praxislog_user";

function loadUserData(user) {
  const data = localStorage.getItem("praxislog_data_" + user);
  if (!data) return { clients: [] };
  return JSON.parse(data);
}

function saveUserData(user, data) {
  localStorage.setItem("praxislog_data_" + user, JSON.stringify(data));
}

export default function App() {
  const [user, setUser] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ clients: [] });
  const [activeClient, setActiveClient] = useState(null);
  const [sessionText, setSessionText] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) setUser(stored);
  }, []);

  useEffect(() => {
    if (user) {
      const d = loadUserData(user);
      setData(d);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      saveUserData(user, data);
    }
  }, [data, user]);

  if (!user) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>PraxisLog</h1>
        <input
          placeholder="Όνομα χρήστη"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", maxWidth: 320, padding: 10, marginBottom: 10 }}
        />
        <br />
        <button
          onClick={() => {
            if (!name.trim()) return;
            localStorage.setItem(USER_KEY, name);
            setUser(name);
          }}
          style={{ padding: 10, minWidth: 160 }}
        >
          Login
        </button>
      </div>
    );
  }

  const filteredClients = data.clients.filter((c) =>
    (c.fullname || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>PraxisLog</h1>

      <div style={{ marginBottom: 20 }}>
        Χρήστης: <b>{user}</b>{" "}
        <button
          onClick={() => {
            localStorage.removeItem(USER_KEY);
            setUser("");
            setActiveClient(null);
          }}
          style={{ marginLeft: 10 }}
        >
          Logout
        </button>
      </div>

      <hr />

      {activeClient === null && (
        <>
          <h2>Ωφελούμενοι</h2>

          <input
            placeholder="Αναζήτηση ωφελούμενου..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: 420, padding: 10, marginBottom: 15 }}
          />

          <ul style={{ paddingLeft: 20 }}>
            {filteredClients.map((c, i) => (
              <li
                key={i}
                style={{ cursor: "pointer", marginBottom: 14 }}
                onClick={() => setActiveClient(i)}
              >
                <b>{c.fullname}</b>
                <br />
                {c.createdAt && <div>Ημερομηνία: {c.createdAt}</div>}
                {c.notes && <div style={{ opacity: 0.75 }}>{c.notes}</div>}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              const fullname = prompt("Ονοματεπώνυμο ωφελούμενου");
              if (!fullname) return;

              const notes = prompt("Παρατηρήσεις (προαιρετικά)") || "";

              const newClients = [
                ...data.clients,
                {
                  fullname,
                  notes,
                  createdAt: new Date().toLocaleDateString("el-GR"),
                  sessions: [],
                },
              ];

              setData({ ...data, clients: newClients });
            }}
            style={{ padding: 10, minWidth: 180 }}
          >
            + Προσθήκη
          </button>
        </>
      )}

      {activeClient !== null && data.clients[activeClient] && (
        <>
          <button onClick={() => setActiveClient(null)} style={{ marginBottom: 16 }}>
            ← Πίσω
          </button>

          <div id="print-area">
            <h2>{data.clients[activeClient].fullname}</h2>

            {data.clients[activeClient].createdAt && (
              <div>Ημερομηνία δημιουργίας: {data.clients[activeClient].createdAt}</div>
            )}

            {data.clients[activeClient].notes && (
              <div style={{ marginTop: 10 }}>
                Παρατηρήσεις: {data.clients[activeClient].notes}
              </div>
            )}

            <hr style={{ margin: "20px 0" }} />

            <h3>Νέα συνεδρία</h3>

            <input type="date" id="sessionDate" style={{ padding: 8, marginBottom: 10 }} />

            <br />

            <textarea
              rows="6"
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
              placeholder="Σημειώσεις συνεδρίας"
              value={sessionText}
              onChange={(e) => setSessionText(e.target.value)}
            />

            <br />

            <button
              onClick={() => {
                const date = document.getElementById("sessionDate").value;
                if (!sessionText.trim()) return;

                const clients = [...data.clients];
                const currentSessions = clients[activeClient].sessions || [];

                clients[activeClient].sessions = [
                  {
                    date: date || new Date().toLocaleDateString("el-GR"),
                    text: sessionText,
                  },
                  ...currentSessions,
                ];

                setSessionText("");
                setData({ ...data, clients });
              }}
              style={{ padding: 10, minWidth: 200 }}
            >
              Αποθήκευση συνεδρίας
            </button>

            <h3 style={{ marginTop: 24 }}>Ιστορικό</h3>

            <ul style={{ paddingLeft: 20 }}>
              {(data.clients[activeClient].sessions || []).map((s, i) => (
                <li key={i} style={{ marginBottom: 16 }}>
                  <b>{s.date}</b>
                  <br />
                  <div style={{ whiteSpace: "pre-wrap" }}>{s.text}</div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => {
                        const updated = prompt("Επεξεργασία σημειώσεων", s.text);
                        if (updated === null) return;

                        const clients = [...data.clients];
                        clients[activeClient].sessions[i].text = updated;
                        setData({ ...data, clients });
                      }}
                      style={{ marginRight: 8 }}
                    >
                      Επεξεργασία
                    </button>

                    <button
                      onClick={() => {
                        const yes = confirm("Να διαγραφεί η συνεδρία;");
                        if (!yes) return;

                        const clients = [...data.clients];
                        clients[activeClient].sessions.splice(i, 1);
                        setData({ ...data, clients });
                      }}
                    >
                      Διαγραφή
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => window.print()}
            style={{ marginTop: 20, padding: 10, minWidth: 180 }}
          >
            Εκτύπωση φακέλου
          </button>
        </>
      )}
    </div>
  );
}
