// PraxisLog - simple single-page app (static demo)
// Everything renders inside <main id="app"></main>

const app = document.getElementById("app");

// --- Demo data (temporary) ---
let beneficiaries = [
  { id: "1111", name: "Αλέξανδρος Αλαμάνος", age: 43, note: "ΙΣ", deleted: false, deletedAt: null },
  { id: "2244", name: "Μ.Κ.", age: 29, note: "Follow-up", deleted: false, deletedAt: null },
];

let tasks = [
  { id: "t1", title: "Δημιουργία αίτησης", due: "25/02", done: false, benId: "1111" },
  { id: "t2", title: "Τηλέφωνο για ραντεβού", due: "26/02", done: false, benId: "1111" },
];

let sessions = [
  { id: "s1", date: "23.01.26", type: "Ατομική", note: "Ο ωφελούμενος ήρθε ψυχικά φορτισμένος", benId: "1111" },
  { id: "s2", date: "18.02.26", type: "Ατομική", note: "Έγινε ανασκόπηση στόχων και σχεδιασμός επόμενων βημάτων", benId: "1111" },
];

let history = [
  { id: "h1", ts: new Date().toLocaleString("el-GR"), text: "Δημιουργήθηκε νέο task: Δημιουργία αίτησης (1111)" },
];

// UI state
let view = "beneficiaries";           // beneficiaries | sessions | tasks | history
let selectedBenId = null;             // persists across tabs
let benEditMode = false;
let historyCollapsed = true;

// Sessions UI state
let showNewSessionForm = false;
let newSessionDraft = { date: "", type: "Ατομική", note: "" };
let editingSessionId = null;
let editSessionDraft = { date: "", type: "Ατομική", note: "" };

const SESSION_TYPES = ["Ατομική", "Ομαδική", "Οικογενειακή", "Τηλεσυνεδρία", "Άλλο"];

// --- Helpers ---
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
}

function getSelectedBen() {
  if (!selectedBenId) return null;
  return beneficiaries.find((x) => x.id === selectedBenId) || null;
}

function ensureSelectedNotDeleted() {
  const b = getSelectedBen();
  if (b && b.deleted) {
    selectedBenId = null;
    benEditMode = false;
    showNewSessionForm = false;
    editingSessionId = null;
  }
}

function render() {
  ensureSelectedNotDeleted();

  if (view === "beneficiaries") return renderBeneficiaries();
  if (view === "sessions") return renderSessions();
  if (view === "tasks") return renderTasks();
  if (view === "history") return renderHistory();
}

// --- Navbar integration (called from index.html buttons) ---
window.show = function (which) {
  view = which;
  render();
};

// --- Views ---
function renderBeneficiaries() {
  // List view
  if (!selectedBenId) {
    const activeBeneficiaries = beneficiaries.filter(b => !b.deleted);

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

  // Card view (2-column layout: left = profile, right = work)
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
        <!-- LEFT -->
        <aside class="panel">
          <h2 class="panel-title">Καρτέλα ωφελούμενου</h2>

          <div class="card">
            <h3>Δημογραφικά στοιχεία</h3>

            ${
              !benEditMode
                ? `
              <div class="kv"><span>Όνομα</span><strong>${esc(b?.name)}</strong></div>
              <div class="kv"><span>Κωδικός</span><strong>${esc(b?.id)}</strong></div>
              <div class="kv"><span>Ηλικία</span><strong>${esc(b?.age)}</strong></div>
              <div class="kv"><span>Γενική σημείωση</span><strong>${esc(b?.note)}</strong></div>

              <button class="btn btn-primary mt-sm" onclick="uiToggleBenEdit(true)">✏️ Επεξεργασία</button>
            `
                : `
              <label class="lbl">Όνομα</label>
              <input class="inp" id="ben_name" value="${esc(b?.name)}" />
              <label class="lbl">Κωδικός</label>
              <input class="inp" id="ben_id" value="${esc(b?.id)}" disabled />
              <label class="lbl">Ηλικία</label>
              <input class="inp" id="ben_age" value="${esc(b?.age)}" />
              <label class="lbl">Γενική σημείωση</label>
              <textarea class="inp" id="ben_note" rows="3">${esc(b?.note)}</textarea>

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

          <!-- DANGER ZONE -->
          <div class="card mt">
            <h3>Ενέργειες</h3>
            <div class="muted">Η διαγραφή καταγράφεται στο ιστορικό.</div>
            <div class="row mt-sm">
              <button class="btn btn-danger" onclick="uiDeleteBeneficiary()">🗑️ Διαγραφή ωφελούμενου</button>
            </div>
          </div>
        </aside>

        <!-- RIGHT -->
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
            </div>
          </div>

          <div class="section">
            <div class="row between">
              <h3>Ιστορικό (timeline)</h3>
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
              </ul>`
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
                      <span class="${t.done ? "done" : ""}">${esc(t.title)} <span class="muted">(${esc(t.due)})</span></span>
                    </label>
                    <button class="btn btn-danger btn-sm" onclick="uiDeleteTask('${esc(t.id)}')">Διαγραφή</button>
                  </li>`
                  )
                  .join("")}
              </ul>`
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
                ${benSessions
                  .map((s) => renderSessionCardHTML(s, true))
                  .join("")}
              </div>`
                : `<div class="muted mt-sm">Δεν υπάρχουν συνεδρίες ακόμα.</div>`
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderTasks() {
  const b = getSelectedBen();
  const filtered = b ? tasks.filter(t => t.benId === b.id) : tasks.slice();
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
          ${filtered
            .map((t) => {
              const bb = beneficiaries.find((x) => x.id === t.benId);
              return `
                <li class="check-item">
                  <label class="check-left">
                    <input type="checkbox" ${t.done ? "checked" : ""} onchange="uiToggleTask('${esc(t.id)}')" />
                    <span class="${t.done ? "done" : ""}">
                      ${esc(t.title)} <span class="muted">(${esc(t.due)})</span>
                      ${b ? "" : `<span class="muted">— ${esc(bb?.name || t.benId)}</span>`}
                    </span>
                  </label>
                  ${b ? "" : `<button class="btn btn-sm" onclick="uiOpenBeneficiaryFromGlobal('${esc(t.benId)}')">Άνοιγμα καρτέλας</button>`}
                </li>
              `;
            })
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderSessions() {
  const b = getSelectedBen();
  const filtered = b ? sessions.filter(s => s.benId === b.id) : sessions.slice();

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
                .map((s) => {
                  const bb = beneficiaries.find((x) => x.id === s.benId);
                  return `
                    <div class="session">
                      ${renderSessionCardBodyHTML(s, !!b, bb)}
                    </div>
                  `;
                })
                .join("")
            : `<div class="muted mt-sm">Δεν υπάρχουν συνεδρίες.</div>`
        }
      </div>
    </div>
  `;
}

function renderHistory() {
  const b = getSelectedBen();
  const itemsAll = history.slice(0, 50);
  const items = b ? itemsAll.filter(h => h.text.includes(`(${b.id})`)) : itemsAll;

  app.innerHTML = `
    <div class="page">
      <h1>Ιστορικό</h1>
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

/* ---------- Sessions rendering helpers ---------- */
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
        ${SESSION_TYPES.map(t => `<option value="${esc(t)}" ${t === newSessionDraft.type ? "selected" : ""}>${esc(t)}</option>`).join("")}
      </select>

      <label class="lbl">Καταγραφή συνεδρίας</label>
      <textarea class="inp" id="ns_note" rows="8" placeholder="Γράψε εδώ τη σημείωση...">${esc(newSessionDraft.note)}</textarea>

      <div class="row mt-sm">
        <button class="btn btn-primary" onclick="uiSaveNewSession()">Αποθήκευση</button>
        <button class="btn" onclick="uiCancelNewSession()">Ακύρωση</button>
      </div>
    </div>
  `;
}

function renderSessionCardHTML(s, forSelectedBen) {
  return `
    <div class="session">
      ${renderSessionCardBodyHTML(s, forSelectedBen, null)}
    </div>
  `;
}

function renderSessionCardBodyHTML(s, forSelectedBen, bb) {
  const isEditing = editingSessionId === s.id;

  if (isEditing) {
    return `
      <div class="session-title"><strong>Επεξεργασία συνεδρίας</strong></div>

      <label class="lbl">Ημερομηνία</label>
      <input class="inp" id="es_date" value="${esc(editSessionDraft.date)}" />

      <label class="lbl">Τύπος</label>
      <select class="inp" id="es_type">
        ${SESSION_TYPES.map(t => `<option value="${esc(t)}" ${t === editSessionDraft.type ? "selected" : ""}>${esc(t)}</option>`).join("")}
      </select>

      <label class="lbl">Καταγραφή συνεδρίας</label>
      <textarea class="inp" id="es_note" rows="8">${esc(editSessionDraft.note)}</textarea>

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
    ${forSelectedBen ? "" : `<div class="muted">${esc(bb?.name || s.benId)}</div>`}
    <div class="mt-xs">${esc(s.note || "")}</div>

    ${forSelectedBen ? `
      <div class="row mt-sm">
        <button class="btn btn-sm" onclick="uiStartEditSession('${esc(s.id)}')">Επεξεργασία</button>
        <button class="btn btn-danger btn-sm" onclick="uiDeleteSession('${esc(s.id)}')">Διαγραφή</button>
      </div>
    ` : `
      <div class="row mt-sm">
        <button class="btn btn-sm" onclick="uiOpenBeneficiaryFromGlobal('${esc(s.benId)}')">Άνοιγμα καρτέλας</button>
      </div>
    `}
  `;
}

/* ---------- UI actions ---------- */
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

window.uiOpenBeneficiaryFromGlobal = function (benId) {
  view = "beneficiaries";
  selectedBenId = benId;
  benEditMode = false;
  showNewSessionForm = false;
  editingSessionId = null;
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
  render();
};

window.uiToggleTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;
  t.done = !t.done;

  pushHistory(`${t.done ? "Ολοκλήρωση" : "Επαναφορά"} task: ${t.title} (${t.benId})`);
  render();
};

window.uiDeleteTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;

  if (!confirm("Να διαγραφεί το task;")) return;

  tasks = tasks.filter((x) => x.id !== taskId);
  pushHistory(`Διαγραφή task: ${t.title} (${t.benId})`);
  render();
};

/* ---------- Sessions actions (NEW UX) ---------- */
window.uiStartNewSession = function () {
  if (!selectedBenId) {
    alert("Διάλεξε πρώτα ωφελούμενο.");
    return;
  }
  showNewSessionForm = true;
  editingSessionId = null;
  newSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiCancelNewSession = function () {
  showNewSessionForm = false;
  newSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiSaveNewSession = function () {
  if (!selectedBenId) return;

  const date = document.getElementById("ns_date")?.value?.trim() || "—";
  const type = document.getElementById("ns_type")?.value?.trim() || "—";
  const note = document.getElementById("ns_note")?.value?.trim() || "";

  if (!note) {
    alert("Γράψε μια σημείωση (καταγραφή) για τη συνεδρία.");
    return;
  }

  const id = "s" + Math.random().toString(16).slice(2);
  sessions.push({ id, date, type, note, benId: selectedBenId });

  pushHistory(`Νέα συνεδρία: ${type} (${selectedBenId})`);
  showNewSessionForm = false;
  newSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiStartEditSession = function (sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;
  editingSessionId = sessionId;
  showNewSessionForm = false;
  editSessionDraft = { date: s.date || "", type: s.type || "Ατομική", note: s.note || "" };
  render();
};

window.uiCancelEditSession = function () {
  editingSessionId = null;
  editSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiSaveEditSession = function (sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  const date = document.getElementById("es_date")?.value?.trim() || "—";
  const type = document.getElementById("es_type")?.value?.trim() || "—";
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
  editSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiDeleteSession = function (sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  if (!confirm("Να διαγραφεί η συνεδρία;")) return;

  sessions = sessions.filter(x => x.id !== sessionId);
  pushHistory(`Διαγραφή συνεδρίας: ${s.type} (${s.benId})`);

  editingSessionId = null;
  showNewSessionForm = false;
  render();
};

window.uiToggleHistory = function () {
  historyCollapsed = !historyCollapsed;
  render();
};

// initial render
render();
