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
    if (!name) return;
    const newClient = {
      id: Date.now(),
      name,
      sessions: [],
    };
    setData({ clients: [...data.clients, newClient] });
    setName("");
  };

  const selectedClient = data.clients.find(c => c.id === selectedClientId);

  const addSession = () => {
    if (!sessionDate || !sessionNotes) return;

    const updatedClients = data.clients.map(c => {
      if (c.id === selectedClientId) {
        return {
          ...c,
          sessions: [
            ...c.sessions,
            { id: Date.now(), date: sessionDate, notes: sessionNotes }
          ]
        };
      }
      return c;
    });

    setData({ clients: updatedClients });
    setSessionDate("");
    setSessionNotes("");
  };

  const deleteClient = () => {
    const confirmDelete = window.confirm("Θέλεις σίγουρα να διαγράψεις τον ωφελούμενο;");
    if (!confirmDelete) return;

    const updated = data.clients.filter(c => c.id !== selectedClientId);
    setData({ clients: updated });
    setSelectedClientId(null);
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
            localStorage.setItem(USER_KEY, name);
            setUser(name);
            setData(loadUserData(name));
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
        <button onClick={() => setSelectedClientId(null)}>← Πίσω</button>

        <h2>Φάκελος Ωφελούμενου</h2>
        <h3>{selectedClient.name}</h3>

        <button
          onClick={deleteClient}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "20px",
            cursor: "pointer"
          }}
        >
          Διαγραφή ωφελούμενου
        </button>

        <h4>Νέα συνεδρία</h4>
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
          style={{ width: "100%", height: "100px" }}
        />
        <br /><br />
        <button onClick={addSession}>Αποθήκευση συνεδρίας</button>

        <h4>Ιστορικό Συνεδριών</h4>
        {selectedClient.sessions.map(s => (
          <div key={s.id} style={{ marginBottom: 10 }}>
            <strong>{s.date}</strong>
            <div>{s.notes}</div>
          </div>
        ))}

        <button onClick={() => window.print()}>Εκτύπωση / PDF</button>
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

      {data.clients.map(c => (
        <div key={c.id}>
          <button onClick={() => setSelectedClientId(c.id)}>
            {c.name}
          </button>
        </div>
      ))}
    </div>
  );
}
