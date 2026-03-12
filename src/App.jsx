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
      <div style={{ padding: 40 }}>
        <h1>PraxisLog</h1>
        <input
          placeholder="Όνομα χρήστη"
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <button
          onClick={() => {
            localStorage.setItem(USER_KEY, name);
            setUser(name);
          }}
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
    <div style={{ padding: 40 }}>
      <h1>PraxisLog</h1>

      <div>
        Χρήστης: <b>{user}</b>{" "}
        <button
          onClick={() => {
            localStorage.removeItem(USER_KEY);
            setUser("");
          }}
        >
          Logout
        </button>
      </div>

      <hr />

      {!activeClient && (
        <>
          <h2>Ωφελούμενοι</h2>

          <input
            placeholder="Αναζήτηση"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul>
            {filteredClients.map((c, i) => (
              <li
                key={i}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveClient(i)}
              >
                <b>{c.fullname}</b>
                <br />
                {c.notes}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              const fullname = prompt("Ονοματεπώνυμο ωφελούμενου");
              if (!fullname) return;

              const notes = prompt("Παρατηρήσεις (προαιρετικά)");

              const newClients = [
                ...data.clients,
                { fullname, notes, sessions: [] },
              ];

              setData({ ...data, clients: newClients });
            }}
          >
            + Προσθήκη
          </button>
        </>
      )}

      {activeClient !== null && (
        <>
          <button onClick={() => setActiveClient(null)}>← Πίσω</button>

          <h2>{data.clients[activeClient].fullname}</h2>

          <h3>Νέα συνεδρία</h3>

          <input
            type="date"
            id="sessionDate"
          />

          <br />

          <textarea
            rows="6"
            style={{ width: "100%" }}
            placeholder="Σημειώσεις συνεδρίας"
            value={sessionText}
            onChange={(e) => setSessionText(e.target.value)}
          />

          <br />

          <button
            onClick={() => {
              const date = document.getElementById("sessionDate").value;

              const clients = [...data.clients];

              clients[activeClient].sessions.push({
                date,
                text: sessionText,
              });

              setSessionText("");

              setData({ ...data, clients });
            }}
          >
            Αποθήκευση συνεδρίας
          </button>

          <h3>Ιστορικό</h3>

          <ul>
            {data.clients[activeClient].sessions.map((s, i) => (
              <li key={i}>
                <b>{s.date}</b>
                <br />
                {s.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
