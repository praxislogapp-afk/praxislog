// PraxisLog — Full functional version + PERSISTENCE + Better History Title
// Static SPA. Data now saved to localStorage so refresh won't “bring back” deleted items.

const app = document.getElementById("app");

/* =========================
   Storage (Persistence)
   ========================= */
const LS_KEY_DATA = "praxislog_data_v1";

function defaultData() {
  return {
    beneficiaries: [
      { id: "1111", name: "Αλέξανδρος Αλαμάνος", age: 43, note: "ΙΣ", deleted: false, deletedAt: null },
      { id: "2244", name: "Μ.Κ.", age: 29, note: "Follow-up", deleted: false, deletedAt: null },
    ],
    tasks: [
      { id: "t1", title: "Δημιουργία αίτησης", due: "25/02", done: false, benId: "1111" },
      { id: "t2", title: "Τηλέφωνο για ραντεβού", due: "26/02", done: false, benId: "1111" },
    ],
    sessions: [
      { id: "s1", date: "23.01.26", type: "Ατομική", note: "Ο ωφελούμενος ήρθε ψυχικά φορτισμένος", benId: "1111" },
      { id: "s2", date: "18.02.26", type: "Ατομική", note: "Ανασκόπηση στόχων και σχεδιασμός επόμενων βημάτων", benId: "1111" },
    ],
    history: [
      { id: "h1", ts: new Date().toLocaleString("el-GR"), text: "Δημιουργήθηκε νέο task: Δημιουργία αίτησης (1111)" },
    ],
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY_DATA);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultData();
    return {
      beneficiaries: Array.isArray(parsed.beneficiaries) ? parsed.beneficiaries : defaultData().beneficiaries,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultData().tasks,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : defaultData().sessions,
      history: Array.isArray(parsed.history) ? parsed.history : defaultData().history,
    };
  } catch {
    return defaultData();
  }
}

function saveData() {
  const payload = { beneficiaries, tasks, sessions, history };
  localStorage.setItem(LS_KEY_DATA, JSON.stringify(payload));
}

/* =========================
   Settings — Session types
   ========================= */
const LS_KEY_SESSION_TYPES = "praxislog_session_types_v1";
const DEFAULT_SESSION_TYPES = ["Ατομική", "Ομαδική", "Οικογενειακή", "Τηλεσυνεδρία", "Άλλο"];

function loadSessionTypes() {
  try {
    const raw = localStorage.getItem(LS_KEY_SESSION_TYPES);
    if (!raw) return DEFAULT_SESSION_TYPES.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SESSION_TYPES.slice();
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return DEFAULT_SESSION_TYPES.slice();
  }
}
function saveSessionTypes(types) {
  localStorage.setItem(LS_KEY_SESSION_TYPES, JSON.stringify(types));
}

let SESSION_TYPES = loadSessionTypes();

/* =========================
   Helpers
   ========================= */
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function nowGR() {
  return new Date().toLocaleString("el-GR");
}
function pushHistory(text) {
  history.unshift({ id: "h" + Math.random().toString(16).slice(2), ts: nowGR(), text });
  saveData();
}
function getSelectedBen() {
  if (!selectedBenId) return null;
  return beneficiaries.find((x) => x.id === selectedBenId) || null;
}
function ensureSelectedValid() {
  const b = getSelectedBen();
  if (b && b.deleted) {
    selectedBenId = null;
    benEditMode = false;
    showNewSessionForm = false;
    editingSessionId = null;
  }
}
function normalizeSessionDraftTypes() {
  if (!SESSION_TYPES.length) SESSION_TYPES = DEFAULT_SESSION_TYPES.slice();
  if (!newSessionDraft.type) newSessionDraft.type = SESSION_TYPES[0];
  if (!editSessionDraft.type) editSessionDraft.type = SESSION_TYPES[0];

  if (!SESSION_TYPES.includes(newSessionDraft.type)) newSessionDraft.type = SESSION_TYPES[0];
  if (!SESSION_TYPES.includes(editSessionDraft.type)) editSessionDraft.type = SESSION_TYPES[0];
}

/* =========================
   Load persisted data
   ========================= */
const initial = loadData();
let beneficiaries = initial.beneficiaries;
let tasks = initial.tasks;
let sessions = initial.sessions;
let history = initial.history;

/* =========================
   App state
   ========================= */
let view = "beneficiaries"; // beneficiaries | sessions | tasks | history | settings
let selectedBenId = null;   // persists across tabs
let benEditMode = false;

let historyCollapsed = true;

// Sessions UI state
let showNewSessionForm = false;
let newSessionDraft = { date: "", type: "", note: "" };

let editingSessionId = null;
let editSessionDraft = { date: "", type: "", note: "" };

/* =========================
   Navigation (called by index.html buttons)
   ========================= */
window.show = function (which) {
  view = which;
  render();
};

/* =========================
   Render router
   ========================= */
function render() {
  ensureSelectedValid();
  normalizeSessionDraftTypes();

  if (view === "beneficiaries") return renderBeneficiaries();
  if (view === "sessions") return renderSessions();
  if (view === "tasks") return renderTasks();
  if (view === "history") return renderHistory();
  if (view === "settings") return renderSettings();

  view = "beneficiaries";
  renderBeneficiaries();
}

/* =========================
   Views
   ========================= */
function renderBeneficiaries() {
  if (!selectedBenId) {
    const activeBeneficiaries = beneficiaries.filter((b) => !b.deleted);

    app.innerHTML = `
      <div class="page">
        <h1>Ωφελούμενοι</h1>
        <button class="btn btn-primary" onclick="uiAddBeneficiary()">+ Νέος ωφελούμενος</button>

        <div class="card mt">
          <div class="muted">Πατήστε έναν ωφελούμενο για να ανοίξει η καρτέλα.</div>
          <ul class="list mt-sm">
            ${activeBeneficiaries
              .map(
                (b) => `
                <li class="list-item">
                  <button class="linklike" onclick="uiOpenBeneficiary('${esc(b.id)}')">
                    <strong>${esc(b.name)}</strong>
                  </button>
                  <span class="muted"> — Κωδικός ${esc(b.id)}</span>
                </li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
    `;
    return;
  }

  const b = getSelectedBen();
  if (!b) {
    selectedBenId = null;
    return renderBeneficiaries();
  }

  const benSessions = sessions.filter((s) => s.benId === selectedBenId);
  const benTasks = tasks.filter((t) => t.benId === selectedBenId);

  const openTasksCount = benTasks.filter((t) => !t.done).length;
  const lastAction = history.find((h) => h.text.includes(`(${selectedBenId})`))?.ts || "—";

  const timelineItems = history
    .filter((h) => h.text.includes(`(${selectedBenId})`))
    .slice(0, historyCollapsed ? 2 : 50);

  app.innerHTML = `
    <div class="page">
      <div class="split">
        <aside class="panel">
          <h2 class="panel-title">Καρτέλα ωφελούμενου</h2>

          <div class="card">
            <h3>Δημογραφικά στοιχεία</h3>

            ${
              !benEditMode
                ? `
                  <div class="kv"><span>Όνομα</span><strong>${esc(b.name)}</strong></div>
                  <div class="kv"><span>Κωδικός</span><strong>${esc(b.id)}</strong></div>
                  <div class="kv"><span>Ηλικία</span><strong>${esc(b.age)}</strong></div>
                  <div class="kv"><span>Γενική σημείωση</span><strong>${esc(b.note)}</strong></div>

                  <button class="btn btn-primary mt-sm" onclick="uiToggleBenEdit(true)">✏️ Επεξεργασία</button>
                `
                : `
                  <label class="lbl">Όνομα</label>
                  <input class="inp" id="ben_name" value="${esc(b.name)}" />

                  <label class="lbl">Κωδικός</label>
                  <input class="inp" id="ben_id" value="${esc(b.id)}" disabled />

                  <label class="lbl">Ηλικία</label>
                  <input class="inp" id="ben_age" value="${esc(b.age)}" />

                  <label class="lbl">Γενική σημείωση</label>
                  <textarea class="inp" id="ben_note" rows="3">${esc(b.note)}</textarea>

                  <div class="row mt-sm">
                    <button class="btn btn-primary" onclick="uiSaveBenEdit()">Αποθήκευση</button>
                    <button class="btn" onclick="uiToggleBenEdit(false)">Ακύρωση</button>
                  </div>
                `
            }
          </div>

          <div class="row mt">
            <button class="btn" onclick="uiBackToList()">← Πίσω στη λίστα</button>
          </div>

          <div class="card mt">
            <h3>Ενέργειες</h3>
            <div class="muted">Η διαγραφή καταγράφεται στο ιστορικό.</div>
            <div class="row mt-sm">
              <button class="btn btn-danger" onclick="uiDeleteBeneficiary()">🗑️ Διαγραφή ωφελούμενου</button>
            </div>
          </div>
        </aside>

        <section class="panel wide">
          <div class="section">
            <h3>${esc(b.name)}</h3>
            <div class="kv"><span>Συνεδρίες</span><strong>${benSessions.length}</strong></div>
            <div class="kv"><span>Ανοιχτά tasks</span><strong>${openTasksCount}</strong></div>
            <div class="kv"><span>Τελευταία ενέργεια</span><strong>${esc(lastAction)}</strong></div>

            <div class="row mt-sm">
              <button class="btn btn-sm" onclick="show('sessions')">Συνεδρίες</button>
              <button class="btn btn-sm" onclick="show('tasks')">Tasks</button>
              <button class="btn btn-sm" onclick="show('history')">Ιστορικό</button>
              <button class="btn btn-sm" onclick="show('settings')">Ρυθμίσεις</button>
            </div>
          </div>

          <div class="section">
            <div class="row between">
              <h3>Ιστορικό (σύνοψη)</h3>
              <button class="btn btn-sm" onclick="uiToggleHistory()">
                ${historyCollapsed ? "Εμφάνιση όλων" : "Σύμπτυξη"}
              </button>
            </div>

            ${
              timelineItems.length
                ? `
                  <ul class="timeline mt-sm">
                    ${timelineItems
                      .map(
                        (h) => `
                          <li>
                            <div class="muted">${esc(h.ts)}</div>
                            <div>${esc(h.text)}</div>
                          </li>`
                      )
                      .join("")}
                  </ul>
                `
                : `<div class="muted mt-sm">Δεν υπάρχει ιστορικό ακόμα.</div>`
            }
          </div>

          <div class="section">
            <div class="row between">
              <h3>Tasks</h3>
              <button class="btn btn-primary" onclick="uiAddTask()">+ Νέο task</button>
            </div>

            ${
              benTasks.length
                ? `
                  <ul class="checklist mt-sm">
                    ${benTasks
                      .map(
                        (t) => `
                          <li class="check-item">
                            <label class="check-left">
                              <input type="checkbox" ${t.done ? "checked" : ""} onchange="uiToggleTask('${esc(t.id)}')" />
                              <span class="${t.done ? "done" : ""}">
                                ${esc(t.title)} <span class="muted">(${esc(t.due)})</span>
                              </span>
                            </label>
                            <button class="btn btn-danger btn-sm" onclick="uiDeleteTask('${esc(t.id)}')">Διαγραφή</button>
                          </li>`
                      )
                      .join("")}
                  </ul>
                `
                : `<div class="muted mt-sm">Δεν υπάρχουν tasks ακόμα.</div>`
            }
          </div>

          <div class="section">
            <div class="row between">
              <h3>Συνεδρίες</h3>
              <button class="btn btn-primary" onclick="uiStartNewSession()">+ Νέα συνεδρία</button>
            </div>

            ${renderNewSessionFormHTML()}

            ${
              benSessions.length
                ? `
                  <div class="mt-sm">
                    ${benSessions.map((s) => `<div class="session">${renderSessionCardBodyHTML(s, true)}</div>`).join("")}
                  </div>
                `
                : `<div class="muted mt-sm">Δεν υπάρχουν συνεδρίες ακόμα.</div>`
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderSessions() {
  const b = getSelectedBen();
  const filtered = b ? sessions.filter((s) => s.benId === b.id) : sessions.slice();

  app.innerHTML = `
    <div class="page">
      <h1>Συνεδρίες</h1>
      <div class="muted">
        ${b ? `<strong>${esc(b.name)}</strong> • ` : ""}
        Σύνολο: ${filtered.length}
      </div>

      <div class="card mt">
        ${b ? `<div class="row"><button class="btn btn-sm" onclick="uiClearSelected()">Εμφάνιση όλων</button></div>` : ""}
        ${b ? `<div class="row mt-sm"><button class="btn btn-primary" onclick="uiStartNewSession()">+ Νέα συνεδρία</button></div>` : ""}

        ${b ? renderNewSessionFormHTML() : ""}

        ${
          filtered.length
            ? filtered
                .slice()
                .reverse()
                .map((s) => `<div class="session">${renderSessionCardBodyHTML(s, !!b)}</div>`)
                .join("")
            : `<div class="muted mt-sm">Δεν υπάρχουν συνεδρίες.</div>`
        }
      </div>
    </div>
  `;
}

function renderTasks() {
  const b = getSelectedBen();
  const filtered = b ? tasks.filter((t) => t.benId === b.id) : tasks.slice();
  const open = filtered.filter((t) => !t.done).length;

  app.innerHTML = `
    <div class="page">
      <h1>Tasks</h1>
      <div class="muted">
        ${b ? `<strong>${esc(b.name)}</strong> • ` : ""}
        Σύνολο: ${filtered.length} • Ανοιχτά: ${open}
      </div>

      <div class="card mt">
        ${b ? `<div class="row"><button class="btn btn-sm" onclick="uiClearSelected()">Εμφάνιση όλων</button></div>` : ""}
        <ul class="checklist mt-sm">
          ${
            filtered.length
              ? filtered
                  .map(
                    (t) => `
                      <li class="check-item">
                        <label class="check-left">
                          <input type="checkbox" ${t.done ? "checked" : ""} onchange="uiToggleTask('${esc(t.id)}')" />
                          <span class="${t.done ? "done" : ""}">
                            ${esc(t.title)} <span class="muted">(${esc(t.due)})</span>
                          </span>
                        </label>
                        <button class="btn btn-danger btn-sm" onclick="uiDeleteTask('${esc(t.id)}')">Διαγραφή</button>
                      </li>`
                  )
                  .join("")
              : `<div class="muted">Δεν υπάρχουν tasks.</div>`
          }
        </ul>
      </div>
    </div>
  `;
}

function renderHistory() {
  const b = getSelectedBen();
  const itemsAll = history.slice(0, 120);
  const items = b ? itemsAll.filter((h) => h.text.includes(`(${b.id})`)) : itemsAll;

  app.innerHTML = `
    <div class="page">
      <h1>${b ? `Ιστορικό — ${esc(b.name)}` : "Ιστορικό"}</h1>
      <div class="muted">
        ${b ? `<strong>${esc(b.name)}</strong> • ` : ""}
        Πρόσφατες ενέργειες (${items.length}).
      </div>

      <div class="card mt">
        ${b ? `<div class="row"><button class="btn btn-sm" onclick="uiClearSelected()">Εμφάνιση όλων</button></div>` : ""}
        <ul class="timeline mt-sm">
          ${items
            .map(
              (h) => `
                <li>
                  <div class="muted">${esc(h.ts)}</div>
                  <div>${esc(h.text)}</div>
                </li>`
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderSettings() {
  app.innerHTML = `
    <div class="page">
      <h1>Ρυθμίσεις</h1>

      <div class="card mt">
        <h3>Τύποι συνεδρίας</h3>
        <div class="muted">Ένας τύπος ανά γραμμή. Αυτά γεμίζουν το dropdown στη “Νέα συνεδρία”.</div>

        <label class="lbl">Λίστα τύπων</label>
        <textarea class="inp" id="set_session_types" rows="8" placeholder="Ατομική\nΟμαδική\n...">${esc(SESSION_TYPES.join("\n"))}</textarea>

        <div class="row mt-sm">
          <button class="btn btn-primary" onclick="uiSaveSessionTypes()">Αποθήκευση</button>
          <button class="btn" onclick="uiResetSessionTypes()">Επαναφορά default</button>
        </div>
      </div>

      <div class="card mt">
        <h3>Δεδομένα</h3>
        <div class="muted">Αν κάτι πάει στραβά, μπορείς να καθαρίσεις όλα τα τοπικά δεδομένα.</div>
        <div class="row mt-sm">
          <button class="btn btn-danger btn-sm" onclick="uiResetAllData()">Reset όλα</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   Sessions HTML helpers
   ========================= */
function renderNewSessionFormHTML() {
  const b = getSelectedBen();
  if (!b || !showNewSessionForm) return "";

  return `
    <div class="session mt-sm">
      <div class="session-title"><strong>Νέα συνεδρία</strong></div>

      <label class="lbl">Ημερομηνία</label>
      <input class="inp" id="ns_date" placeholder="π.χ. 19.02.26" value="${esc(newSessionDraft.date)}" />

      <label class="lbl">Τύπος</label>
      <select class="inp" id="ns_type">
        ${SESSION_TYPES.map((t) => `<option value="${esc(t)}" ${t === newSessionDraft.type ? "selected" : ""}>${esc(t)}</option>`).join("")}
      </select>

      <label class="lbl">Καταγραφή συνεδρίας</label>
      <textarea class="inp" id="ns_note" rows="10" placeholder="Γράψε εδώ τη σημείωση...">${esc(newSessionDraft.note)}</textarea>

      <div class="row mt-sm">
        <button class="btn btn-primary" onclick="uiSaveNewSession()">Αποθήκευση</button>
        <button class="btn" onclick="uiCancelNewSession()">Ακύρωση</button>
      </div>
    </div>
  `;
}

function renderSessionCardBodyHTML(s, forSelectedBen) {
  const isEditing = editingSessionId === s.id;

  if (isEditing) {
    return `
      <div class="session-title"><strong>Επεξεργασία συνεδρίας</strong></div>

      <label class="lbl">Ημερομηνία</label>
      <input class="inp" id="es_date" value="${esc(editSessionDraft.date)}" />

      <label class="lbl">Τύπος</label>
      <select class="inp" id="es_type">
        ${SESSION_TYPES.map((t) => `<option value="${esc(t)}" ${t === editSessionDraft.type ? "selected" : ""}>${esc(t)}</option>`).join("")}
      </select>

      <label class="lbl">Καταγραφή συνεδρίας</label>
      <textarea class="inp" id="es_note" rows="10">${esc(editSessionDraft.note)}</textarea>

      <div class="row mt-sm">
        <button class="btn btn-primary" onclick="uiSaveEditSession('${esc(s.id)}')">Αποθήκευση</button>
        <button class="btn" onclick="uiCancelEditSession()">Ακύρωση</button>
      </div>
    `;
  }

  return `
    <div class="session-title">
      <strong>${esc(s.date || "—")}</strong> — ${esc(s.type || "—")}
    </div>
    <div class="mt-xs">${esc(s.note || "")}</div>

    ${
      forSelectedBen
        ? `
          <div class="row mt-sm">
            <button class="btn btn-sm" onclick="uiStartEditSession('${esc(s.id)}')">Επεξεργασία</button>
            <button class="btn btn-danger btn-sm" onclick="uiDeleteSession('${esc(s.id)}')">Διαγραφή</button>
          </div>
        `
        : ``
    }
  `;
}

/* =========================
   UI actions
   ========================= */
window.uiBackToList = function () {
  selectedBenId = null;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;
  render();
};

window.uiClearSelected = function () {
  selectedBenId = null;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;
  render();
};

window.uiOpenBeneficiary = function (id) {
  selectedBenId = id;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;
  view = "beneficiaries";
  render();
};

window.uiToggleBenEdit = function (on) {
  benEditMode = on;
  render();
};

window.uiSaveBenEdit = function () {
  const b = getSelectedBen();
  if (!b) return;

  const name = document.getElementById("ben_name")?.value?.trim();
  const age = document.getElementById("ben_age")?.value?.trim();
  const note = document.getElementById("ben_note")?.value?.trim();

  b.name = name || b.name;
  b.age = Number(age || b.age) || b.age;
  b.note = note ?? b.note;

  pushHistory(`Επεξεργασία δημογραφικών (${selectedBenId})`);
  benEditMode = false;
  saveData();
  render();
};

window.uiAddBeneficiary = function () {
  const name = prompt("Όνομα ωφελούμενου:");
  if (!name) return;

  const id = prompt("Κωδικός (π.χ. 1234):") || Math.random().toString().slice(2, 6);
  const age = Number(prompt("Ηλικία:") || "0") || 0;
  const note = prompt("Γενική σημείωση:") || "";

  beneficiaries.unshift({ id, name, age, note, deleted: false, deletedAt: null });
  pushHistory(`Προσθήκη ωφελούμενου: ${name} (${id})`);
  saveData();
  render();
};

window.uiDeleteBeneficiary = function () {
  const b = getSelectedBen();
  if (!b) return;

  if (!confirm(`Να διαγραφεί ο ωφελούμενος "${b.name}" (Κωδικός ${b.id});`)) return;

  const typed = prompt(`Γράψε τον κωδικό (${b.id}) για επιβεβαίωση:`);
  if (String(typed || "").trim() !== String(b.id)) {
    alert("Άκυρο. Δεν έγινε διαγραφή.");
    return;
  }

  b.deleted = true;
  b.deletedAt = nowGR();
  pushHistory(`Διαγραφή ωφελούμενου: ${b.name} (${b.id})`);

  selectedBenId = null;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;

  saveData();
  render();
};

window.uiAddTask = function () {
  if (!selectedBenId) {
    alert("Διάλεξε πρώτα ωφελούμενο.");
    return;
  }

  const title = prompt("Τίτλος task:");
  if (!title) return;

  const due = prompt("Προθεσμία (π.χ. 25/02):") || "—";
  const id = "t" + Math.random().toString(16).slice(2);

  tasks.unshift({ id, title, due, done: false, benId: selectedBenId });
  pushHistory(`Νέο task: ${title} (${selectedBenId})`);
  saveData();
  render();
};

window.uiToggleTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;

  t.done = !t.done;
  pushHistory(`${t.done ? "Ολοκλήρωση" : "Επαναφορά"} task: ${t.title} (${t.benId})`);
  saveData();
  render();
};

window.uiDeleteTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;

  if (!confirm("Να διαγραφεί το task;")) return;

  tasks = tasks.filter((x) => x.id !== taskId);
  pushHistory(`Διαγραφή task: ${t.title} (${t.benId})`);
  saveData();
  render();
};

window.uiStartNewSession = function () {
  if (!selectedBenId) {
    alert("Διάλεξε πρώτα ωφελούμενο.");
    return;
  }
  showNewSessionForm = true;
  editingSessionId = null;
  newSessionDraft = { date: "", type: SESSION_TYPES[0], note: "" };
  render();
};

window.uiCancelNewSession = function () {
  showNewSessionForm = false;
  newSessionDraft = { date: "", type: SESSION_TYPES[0], note: "" };
  render();
};

window.uiSaveNewSession = function () {
  if (!selectedBenId) return;

  const date = document.getElementById("ns_date")?.value?.trim() || "—";
  const type = document.getElementById("ns_type")?.value?.trim() || SESSION_TYPES[0];
  const note = document.getElementById("ns_note")?.value?.trim() || "";

  if (!note) {
    alert("Γράψε μια σημείωση (καταγραφή) για τη συνεδρία.");
    return;
  }

  const id = "s" + Math.random().toString(16).slice(2);
  sessions.push({ id, date, type, note, benId: selectedBenId });

  pushHistory(`Νέα συνεδρία: ${type} (${selectedBenId})`);
  showNewSessionForm = false;
  newSessionDraft = { date: "", type: SESSION_TYPES[0], note: "" };

  saveData();
  render();
};

window.uiStartEditSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;

  editingSessionId = sessionId;
  showNewSessionForm = false;
  editSessionDraft = { date: s.date || "", type: s.type || SESSION_TYPES[0], note: s.note || "" };
  render();
};

window.uiCancelEditSession = function () {
  editingSessionId = null;
  editSessionDraft = { date: "", type: SESSION_TYPES[0], note: "" };
  render();
};

window.uiSaveEditSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;

  const date = document.getElementById("es_date")?.value?.trim() || "—";
  const type = document.getElementById("es_type")?.value?.trim() || SESSION_TYPES[0];
  const note = document.getElementById("es_note")?.value?.trim() || "";

  if (!note) {
    alert("Η καταγραφή δεν μπορεί να είναι κενή.");
    return;
  }

  s.date = date;
  s.type = type;
  s.note = note;

  pushHistory(`Επεξεργασία συνεδρίας: ${type} (${s.benId})`);
  editingSessionId = null;

  saveData();
  render();
};

window.uiDeleteSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;

  if (!confirm("Να διαγραφεί η συνεδρία;")) return;

  sessions = sessions.filter((x) => x.id !== sessionId);
  pushHistory(`Διαγραφή συνεδρίας: ${s.type} (${s.benId})`);

  editingSessionId = null;
  showNewSessionForm = false;

  saveData();
  render();
};

window.uiToggleHistory = function () {
  historyCollapsed = !historyCollapsed;
  render();
};

window.uiSaveSessionTypes = function () {
  const raw = document.getElementById("set_session_types")?.value ?? "";
  const lines = raw.split("\n").map((x) => x.trim()).filter(Boolean);

  if (lines.length === 0) {
    alert("Βάλε τουλάχιστον 1 τύπο συνεδρίας.");
    return;
  }

  SESSION_TYPES = Array.from(new Set(lines));
  saveSessionTypes(SESSION_TYPES);

  newSessionDraft.type = SESSION_TYPES[0];
  editSessionDraft.type = SESSION_TYPES[0];

  pushHistory(`Αλλαγή τύπων συνεδρίας (${SESSION_TYPES.length} τύποι) (${selectedBenId || "SYS"})`);
  alert("Αποθηκεύτηκαν.");
  render();
};

window.uiResetSessionTypes = function () {
  SESSION_TYPES = DEFAULT_SESSION_TYPES.slice();
  saveSessionTypes(SESSION_TYPES);
  newSessionDraft.type = SESSION_TYPES[0];
  editSessionDraft.type = SESSION_TYPES[0];
  alert("Έγινε επαναφορά.");
  render();
};

window.uiResetAllData = function () {
  if (!confirm("Reset όλων των δεδομένων;")) return;
  localStorage.removeItem(LS_KEY_DATA);
  const d = defaultData();
  beneficiaries = d.beneficiaries;
  tasks = d.tasks;
  sessions = d.sessions;
  history = d.history;
  selectedBenId = null;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;
  saveData();
  alert("Έγινε reset.");
  render();
};

/* =========================
   Start
   ========================= */
saveData(); // ensure baseline exists
render();
