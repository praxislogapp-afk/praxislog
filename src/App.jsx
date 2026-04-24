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
  const [data, setData] = useState({ clients: [] });
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setUser(savedUser);
      setData(loadUserData(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      saveUserData(user, data);
    }
  }, [data, user]);

  const addClient = () => {
    if (!name.trim()) return;

    const newClient = {
      id: Date.now(),
      name: name.trim(),
      sessions: [],
    };

    setData({ clients: [...data.clients, newClient] });
    setName("");
  };

  const selectedClient = data.clients.find(c => c.id === selectedClientId);

  const saveSession = () => {
    if (!sessionDate || !sessionNotes.trim()) return;

    const updatedClients = data.clients.map(c => {
      if (c.id !== selectedClientId) return c;

      if (editingSessionId) {
        return {
          ...c,
          sessions: c.sessions.map(s =>
            s.id === editingSessionId
              ? { ...s, date: sessionDate, notes: sessionNotes.trim() }
              : s
          ),
        };
      }

      return {
        ...c,
        sessions: [
          ...c.sessions,
          {
            id: Date.now(),
            date: sessionDate,
            notes: sessionNotes.trim(),
          },
        ],
      };
    });

    setData({ clients: updatedClients });
    setSessionDate("");
    setSessionNotes("");
    setEditingSessionId(null);
  };

  const deleteClient = () => {
    const ok = window.confirm("Θέλεις σίγουρα να διαγράψεις τον ωφελούμενο;");
    if (!ok) return;

    const updated = data.clients.filter(c => c.id !== selectedClientId);
    setData({ clients: updated });
    setSelectedClientId(null);
  };

  const editSession = (session) => {
    setSessionDate(session.date);
    setSessionNotes(session.notes);
    setEditingSessionId(session.id);
  };

  const cancelEdit = () => {
    setSessionDate("");
    setSessionNotes("");
    setEditingSessionId(null);
  };

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Είσοδος</h2>

        <input
          placeholder="Όνομα χρήστη"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={() => {
            if (!name.trim()) return;
            localStorage.setItem(USER_KEY, name.trim());
            setUser(name.trim());
            setData(loadUserData(name.trim()));
            setName("");
          }}
        >
          Είσοδος
        </button>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <div style={{ padding: 20 }}>
        <style>
          {`
            @media print {
              button,
              input,
              textarea,
              .no-print {
                display: none !important;
              }

              body {
                font-family: Arial, sans-serif;
                color: #000;
              }

              .print-area {
                width: 100%;
              }

              .session-card {
                border: 1px solid #ccc;
                padding: 12px;
                margin-bottom: 12px;
                page-break-inside: avoid;
              }
            }
          `}
        </style>

        <button className="no-print" onClick={() => setSelectedClientId(null)}>
          ← Πίσω
        </button>

        <div className="print-area">
          <h2>Φάκελος Ωφελούμενου</h2>
          <h3>{selectedClient.name}</h3>

          <hr />

          <div className="no-print">
            <button
              onClick={deleteClient}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              Διαγραφή ωφελούμενου
            </button>

            <h4>{editingSessionId ? "Επεξεργασία συνεδρίας" : "Νέα συνεδρία"}</h4>

            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />

            <br /><br />

            <textarea
              placeholder="Σημειώσεις συνεδρίας"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              style={{ width: "100%", height: "120px" }}
            />

            <br /><br />

            <button onClick={saveSession}>
              {editingSessionId ? "Αποθήκευση αλλαγών" : "Αποθήκευση συνεδρίας"}
            </button>

            {editingSessionId && (
              <button onClick={cancelEdit} style={{ marginLeft: 10 }}>
                Ακύρωση
              </button>
            )}
          </div>

          <h4>Ιστορικό Συνεδριών</h4>

          {selectedClient.sessions.length === 0 && (
            <p>Δεν υπάρχουν καταχωρημένες συνεδρίες.</p>
          )}

          {selectedClient.sessions.map(s => (
            <div className="session-card" key={s.id}>
              <strong>{s.date}</strong>
              <p>{s.notes}</p>

              <button className="no-print" onClick={() => editSession(s)}>
                Επεξεργασία
              </button>
            </div>
          ))}
        </div>

        <button className="no-print" onClick={() => window.print()}>
          Εκτύπωση / PDF
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Ωφελούμενοι</h2>

      <input
        placeholder="Νέος ωφελούμενος"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={addClient}>Προσθήκη</button>

      <div style={{ marginTop: 20 }}>
        {data.clients.map(c => (
          <div key={c.id} style={{ marginBottom: 10 }}>
            <button onClick={() => setSelectedClientId(c.id)}>
              {c.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
