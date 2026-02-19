// PraxisLog — stable functional version with Settings (Session Types)
// Static SPA — erase & paste safe

const app = document.getElementById("app");

/* ================= DATA ================= */
let beneficiaries = [
  { id: "1111", name: "Αλέξανδρος Αλαμάνος", age: 43, note: "ΙΣ", deleted: false },
];

let sessions = [];
let tasks = [];
let history = [];

let view = "beneficiaries";
let selectedBenId = null;

/* =============== SETTINGS =============== */
const LS_SESSION_TYPES = "praxislog_session_types";
const DEFAULT_SESSION_TYPES = [
  "Ατομική",
  "Ομαδική",
  "Οικογενειακή",
  "Τηλεσυνεδρία",
];

function loadSessionTypes() {
  const raw = localStorage.getItem(LS_SESSION_TYPES);
  if (!raw) return DEFAULT_SESSION_TYPES.slice();
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_SESSION_TYPES.slice();
  } catch {
    return DEFAULT_SESSION_TYPES.slice();
  }
}

function saveSessionTypes(arr) {
  localStorage.setItem(LS_SESSION_TYPES, JSON.stringify(arr));
}

let SESSION_TYPES = loadSessionTypes();

/* =============== HELPERS =============== */
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function show(v) {
  view = v;
  render();
}

function selectedBen() {
  return beneficiaries.find(b => b.id === selectedBenId);
}

/* =============== RENDER =============== */
function render() {
  if (view === "settings") return renderSettings();
  if (view === "sessions") return renderSessions();
  return renderBeneficiaries();
}

/* =============== BENEFICIARIES =============== */
function renderBeneficiaries() {
  if (!selectedBenId) {
    app.innerHTML = `
      <div class="page">
        <h1>Ωφελούμενοι</h1>
        <ul class="list">
          ${beneficiaries.map(b => `
            <li class="list-item">
              <button class="linklike" onclick="openBen('${b.id}')">
                ${esc(b.name)}
              </button>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
    return;
  }

  const b = selectedBen();
  app.innerHTML = `
    <div class="page">
      <h1>${esc(b.name)}</h1>
      <button class="btn" onclick="show('sessions')">Συνεδρίες</button>
      <button class="btn" onclick="show('settings')">Ρυθμίσεις</button>
    </div>
  `;
}

function openBen(id) {
  selectedBenId = id;
  render();
}

/* =============== SESSIONS =============== */
function renderSessions() {
  const b = selectedBen();
  if (!b) return show("beneficiaries");

  const own = sessions.filter(s => s.benId === b.id);

  app.innerHTML = `
    <div class="page">
      <h1>${esc(b.name)}</h1>

      <div class="card">
        <h3>Νέα συνεδρία</h3>

        <label class="lbl">Τύπος</label>
        <select class="inp" id="s_type">
          ${SESSION_TYPES.map(t => `<option>${esc(t)}</option>`).join("")}
        </select>

        <label class="lbl">Καταγραφή</label>
        <textarea class="inp" id="s_note" rows="8"></textarea>

        <button class="btn btn-primary" onclick="saveSession()">Αποθήκευση</button>
      </div>

      <div class="card mt">
        <h3>Συνεδρίες</h3>
        ${own.length ? own.map(s => `
          <div class="session">
            <strong>${esc(s.type)}</strong>
            <div>${esc(s.note)}</div>
            <button class="btn btn-danger btn-sm" onclick="delSession('${s.id}')">
              Διαγραφή
            </button>
          </div>
        `).join("") : "<div class='muted'>Καμία συνεδρία</div>"}
      </div>
    </div>
  `;
}

function saveSession() {
  const type = document.getElementById("s_type").value;
  const note = document.getElementById("s_note").value.trim();
  if (!note) return alert("Γράψε καταγραφή");

  sessions.push({
    id: Math.random().toString(16).slice(2),
    benId: selectedBenId,
    type,
    note,
  });

  render();
}

function delSession(id) {
  if (!confirm("Διαγραφή συνεδρίας;")) return;
  sessions = sessions.filter(s => s.id !== id);
  render();
}

/* =============== SETTINGS =============== */
function renderSettings() {
  app.innerHTML = `
    <div class="page">
      <h1>Ρυθμίσεις</h1>

      <div class="card">
        <h3>Τύποι συνεδρίας</h3>
        <textarea class="inp" id="set_types" rows="8">
${SESSION_TYPES.join("\n")}
        </textarea>

        <button class="btn btn-primary" onclick="saveTypes()">
          Αποθήκευση
        </button>
      </div>
    </div>
  `;
}

function saveTypes() {
  const raw = document.getElementById("set_types").value;
  const arr = raw.split("\n").map(x => x.trim()).filter(Boolean);
  if (!arr.length) return alert("Βάλε τουλάχιστον έναν τύπο");
  SESSION_TYPES = arr;
  saveSessionTypes(arr);
  alert("Αποθηκεύτηκε");
}

/* =============== START =============== */
render();
