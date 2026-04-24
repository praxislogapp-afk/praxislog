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
      <div className="app">
        <h1>PraxisLog</h1>
        <input
          placeholder="Όνομα χρήστη"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            localStorage.setItem(USER_KEY, name);
            setUser(name);
          }}
          className="button"
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
    <div className="app">
      <style>{`
        .app {
          padding: 40px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #111;
        }

        .input, textarea {
          width: 100%;
          max-width: 620px;
          padding: 10px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 15px;
        }

        textarea {
          min-height: 140px;
        }

        .button {
          padding: 10px 14px;
          border: 1px solid #111;
          background: #111;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 8px;
          margin-top: 8px;
        }

        .button-light {
          padding: 8px 12px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 8px;
          margin-top: 8px;
        }

        .client-item {
          cursor: pointer;
          margin-bottom: 14px;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .print-box {
          max-width: 800px;
          background: white;
        }

        .session-box {
          border: 1px solid #ddd;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 8px;
        }

        @media print {
          body {
            background: white;
          }

          .no-print {
            display: none !important;
          }

          .app {
            padding: 0;
            font-size: 12pt;
          }

          .print-box {
            max-width: none;
            width: 100%;
          }

          .print-title {
            text-align: center;
            font-size: 18pt;
            margin-bottom: 20px;
          }

          .session-box {
            border: 1px solid #999;
            page-break-inside: avoid;
          }

          textarea, input, button {
            display: none !important;
          }
        }
      `}</style>

      <h1 className="no-print">PraxisLog</h1>

      <div className="no-print" style={{ marginBottom: 20 }}>
        Χρήστης: <b>{user}</b>{" "}
        <button
          onClick={() => {
            localStorage.removeItem(USER_KEY);
            setUser("");
            setActiveClient(null);
          }}
          className="button-light"
        >
          Logout
        </button>
      </div>

      <hr className="no-print" />

      {activeClient === null && (
        <div className="no-print">
          <h2>Ωφελούμενοι</h2>

          <input
            placeholder="Αναζήτηση ωφελούμενου..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />

          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {filteredClients.map((c, i) => (
              <li
                key={i}
                className="client-item"
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
            className="button"
          >
            + Προσθήκη
          </button>
        </div>
      )}

      {activeClient !== null && data.clients[activeClient] && (
        <>
          <div className="no-print">
            <button onClick={() => setActiveClient(null)} className="button-light">
              ← Πίσω
            </button>
          </div>

          <div className="print-box">
            <h2 className="print-title">Φάκελος Ωφελούμενου</h2>

            <h2>{data.clients[activeClient].fullname}</h2>

            {data.clients[activeClient].createdAt && (
              <div>
                <b>Ημερομηνία δημιουργίας:</b>{" "}
                {data.clients[activeClient].createdAt}
              </div>
            )}

            {data.clients[activeClient].notes && (
              <div style={{ marginTop: 10 }}>
                <b>Παρατηρήσεις:</b> {data.clients[activeClient].notes}
              </div>
            )}

            <hr style={{ margin: "20px 0" }} />

            <div className="no-print">
              <h3>Νέα συνεδρία</h3>

              <input type="date" id="sessionDate" className="input" />

              <textarea
                placeholder="Σημειώσεις συνεδρίας"
                value={sessionText}
                onChange={(e) => setSessionText(e.target.value)}
              />

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
                className="button"
              >
                Αποθήκευση συνεδρίας
              </button>
            </div>

            <h3 style={{ marginTop: 24 }}>Ιστορικό Συνεδριών</h3>

            {(data.clients[activeClient].sessions || []).map((s, i) => (
              <div key={i} className="session-box">
                <b>{s.date}</b>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{s.text}</div>

                <div className="no-print" style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      const updated = prompt("Επεξεργασία σημειώσεων", s.text);
                      if (updated === null) return;

                      const clients = [...data.clients];
                      clients[activeClient].sessions[i].text = updated;
                      setData({ ...data, clients });
                    }}
                    className="button-light"
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
                    className="button-light"
                  >
                    Διαγραφή
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="button no-print"
            style={{ marginTop: 20 }}
          >
            Εκτύπωση / PDF
          </button>
        </>
      )}
    </div>
  );
}
