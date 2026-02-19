// PraxisLog — Full app with Beneficiary Card + Tasks + Sessions + Beneficiary Events (History)
// No global History tab. No Settings tab. Data persists in localStorage (refresh-safe).

const app = document.getElementById("app");

/* =========================
   Persistence
   ========================= */
const LS_KEY_DATA = "praxislog_data_v2";

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
    // BENEFICIARY EVENTS = "Ιστορικό ωφελούμενου"
    // { id, benId, date, title, details }
    events: [
      { id: "e1", benId: "1111", date: new Date().toLocaleDateString("el-GR"), title: "Έναρξη φακέλου", details: "Δημιουργήθηκε ο φάκελος του ωφελούμενου." }
    ],
  };
}

function loadData() {
  // tries v2, otherwise attempts to migrate older versions gracefully
  try {
    const raw = localStorage.getItem(LS_KEY_DATA);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultData();

    const d = defaultData();
    const beneficiaries = Array.isArray(parsed.beneficiaries) ? parsed.beneficiaries : d.beneficiaries;
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : d.tasks;
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : d.sessions;

    let events = Array.isArray(parsed.events) ? parsed.events : null;

    // If no events found, create simple events from sessions as a starting point
    if (!events) {
      events = [];
      for (const s of sessions) {
        events.push({
          id: "e" + Math.random().toString(16).slice(2),
          benId: s.benId,
          date: s.date || new Date().toLocaleDateString("el-GR"),
          title: `Συνεδρία: ${s.type || "—"}`,
          details: "",
        });
      }
      // keep also default initial event if nothing exists
      if (!events.length) events = d.events;
    }

    return { beneficiaries, tasks, sessions, events };
  } catch {
    return defaultData();
  }
}

function saveData() {
  localStorage.setItem(LS_KEY_DATA, JSON.stringify({ beneficiaries, tasks, sessions, events }));
}

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

function todayGR() {
  return new Date().toLocaleDateString("el-GR");
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
    sessionFormOpen = false;
    editingSessionId = null;
    eventFormOpen = false;
    editingEventId = null;
  }
}

/* =========================
   Load data
   ========================= */
const initial = loadData();
let beneficiaries = initial.beneficiaries;
let tasks = initial.tasks;
let sessions = initial.sessions;
let events = initial.events;

saveData(); // ensure storage exists

/* =========================
   App state
   ========================= */
let view = "beneficiaries"; // beneficiaries | sessions | tasks
let selectedBenId = null;

let benEditMode = false;

// Sessions UI state
let sessionFormOpen = false;
let newSessionDraft = { date: "", type: "Ατομική", note: "" };
let editingSessionId = null;
let editSessionDraft = { date: "", type: "Ατομική", note: "" };

// Events UI state (History of beneficiary)
let eventFormOpen = false;
let newEventDraft = { date: "", title: "", details: "" };
let editingEventId = null;
let editEventDraft = { date: "", title: "", details: "" };

/* =========================
   Navigation
   ========================= */
window.show = function (which) {
  view = which;
  render();
};

/* =========================
   Beneficiary Events helpers
   ========================= */
function addEvent(benId, date, title, details = "") {
  events.unshift({
    id: "e" + Math.random().toString(16).slice(2),
    benId,
    date: date || todayGR(),
    title: title || "Γεγονός",
    details: details || "",
  });
  saveData();
}

function eventsForBen(benId) {
  return events.filter((e) => e.benId === benId);
}

/* =========================
   Render router
   ========================= */
function render() {
  ensureSelectedValid();

  if (view === "beneficiaries") return renderBeneficiaries();
  if (view === "sessions") return renderSessions();
  if (view === "tasks") return renderTasks();

  view = "beneficiaries";
  renderBeneficiaries();
}

/* =========================
   Views
   ========================= */
function renderBeneficiaries() {
  // LIST
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

  // CARD
  const b = getSelectedBen();
  if (!b) {
    selectedBenId = null;
    return renderBeneficiaries();
  }

  const benSessions = sessions.filter((s) => s.benId === selectedBenId);
  const benTasks = tasks.filter((t) => t.benId === selectedBenId);
  const benEvents = eventsForBen(selectedBenId);

  const openTasksCount = benTasks.filter((t) => !t.done).length;

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
                  <div class="kv"><span>Όνομα</span><strong>${esc(b.name)}</strong></div>
                  <div class="kv"><span>Κωδικός</span><strong>${esc(b.id)}</strong></div>
                  <div class="kv"><span>Ηλικία</span><strong>${esc(b.age)}</strong></div>
                  <div class="kv"><span>Γενική σημείωση</span><strong>${esc(b.note)}</strong></div>
                  <button class="btn btn-primary mt-sm" onclick="uiToggleBenEdit(true)">✏️ Επεξεργασία</button>
                `
                : `
                  <label class="lbl">Όνομα</label>
                  <input class="inp" id="ben_name" value="${esc(b.name)}" />

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
            <div class="muted">Η διαγραφή ωφελούμενου είναι οριστική για το demo.</div>
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
            <div class="kv"><span>Γεγονότα ιστορικού</span><strong>${benEvents.length}</strong></div>

            <div class="row mt-sm">
              <button class="btn btn-sm" onclick="show('sessions')">Συνεδρίες</button>
              <button class="btn btn-sm" onclick="show('tasks')">Tasks</button>
            </div>
          </div>

          <!-- HISTORY (beneficiary only) -->
          <div class="section">
            <div class="row between">
              <h3>Ιστορικό — ${esc(b.name)}</h3>
              <button class="btn btn-primary btn-sm" onclick="uiOpenNewEvent()">+ Νέο γεγονός</button>
            </div>

            ${renderEventFormHTML()}

            ${
              benEvents.length
                ? `
                  <ul class="timeline mt-sm">
                    ${benEvents
                      .map(
                        (e) => `
                          <li>
                            <div class="muted">${esc(e.date)}</div>
                            <div><strong>${esc(e.title)}</strong></div>
                            ${e.details ? `<div class="muted mt-xs">${esc(e.details)}</div>` : ""}
                            <div class="row mt-sm">
                              <button class="btn btn-sm" onclick="uiStartEditEvent('${esc(e.id)}')">Επεξεργασία</button>
                              <button class="btn btn-danger btn-sm" onclick="uiDeleteEvent('${esc(e.id)}')">Διαγραφή</button>
                            </div>
                          </li>`
                      )
                      .join("")}
                  </ul>
                `
                : `<div class="muted mt-sm">Δεν υπάρχει ιστορικό ακόμα. Πρόσθεσε “Νέο γεγονός”.</div>`
            }
          </div>

          <!-- TASKS -->
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

          <!-- SESSIONS -->
          <div class="section">
            <div class="row between">
              <h3>Συνεδρίες</h3>
              <button class="btn btn-primary" onclick="uiOpenNewSession()">+ Νέα συνεδρία</button>
            </div>

            ${renderSessionFormHTML()}

            ${
              benSessions.length
                ? `
                  <div class="mt-sm">
                    ${benSessions.map((s) => `<div class="session">${renderSessionCardHTML(s)}</div>`).join("")}
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
        ${b ? `<strong>${esc(b.name)}</strong> • ` : "Διάλεξε ωφελούμενο για να δεις τις δικές του συνεδρίες."}
        ${b ? `Σύνολο: ${filtered.length}` : ""}
      </div>

      <div class="card mt">
        ${b ? `<div class="row"><button class="btn btn-sm" onclick="show('beneficiaries')">Επιστροφή στην καρτέλα</button></div>` : ""}

        ${
          filtered.length
            ? filtered.slice().reverse().map((s) => `<div class="session">${renderSessionCardHTML(s)}</div>`).join("")
            : `<div class="muted mt-sm">${b ? "Δεν υπάρχουν συνεδρίες." : "—"}</div>`
        }
      </div>
    </div>
  `;
}

function renderTasks() {
  const b = getSelectedBen();
  const filtered = b ? tasks.filter((t) => t.benId === b.id) : tasks.slice();

  app.innerHTML = `
    <div class="page">
      <h1>Tasks</h1>
      <div class="muted">
        ${b ? `<strong>${esc(b.name)}</strong> • Σύνολο: ${filtered.length}` : "Διάλεξε ωφελούμενο για να δεις τα δικά του tasks."}
      </div>

      <div class="card mt">
        ${b ? `<div class="row"><button class="btn btn-sm" onclick="show('beneficiaries')">Επιστροφή στην καρτέλα</button></div>` : ""}

        ${
          filtered.length
            ? `
              <ul class="checklist mt-sm">
                ${filtered
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
            : `<div class="muted mt-sm">${b ? "Δεν υπάρχουν tasks." : "—"}</div>`
        }
      </div>
    </div>
  `;
}

/* =========================
   Sessions UI (form + card)
   ========================= */
function renderSessionFormHTML() {
  const b = getSelectedBen();
  if (!b || !sessionFormOpen) return "";

  if (editingSessionId) {
    return `
      <div class="session mt-sm">
        <div class="session-title"><strong>Επεξεργασία συνεδρίας</strong></div>

        <label class="lbl">Ημερομηνία</label>
        <input class="inp" id="es_date" value="${esc(editSessionDraft.date)}" />

        <label class="lbl">Τύπος</label>
        <select class="inp" id="es_type">
          ${["Ατομική", "Ομαδική", "Οικογενειακή", "Τηλεσυνεδρία", "Άλλο"].map(t => `
            <option value="${esc(t)}" ${t === editSessionDraft.type ? "selected" : ""}>${esc(t)}</option>
          `).join("")}
        </select>

        <label class="lbl">Καταγραφή συνεδρίας</label>
        <textarea class="inp" id="es_note" rows="10">${esc(editSessionDraft.note)}</textarea>

        <div class="row mt-sm">
          <button class="btn btn-primary" onclick="uiSaveEditSession('${esc(editingSessionId)}')">Αποθήκευση</button>
          <button class="btn" onclick="uiCloseSessionForm()">Ακύρωση</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="session mt-sm">
      <div class="session-title"><strong>Νέα συνεδρία</strong></div>

      <label class="lbl">Ημερομηνία</label>
      <input class="inp" id="ns_date" placeholder="π.χ. 19.02.26" value="${esc(newSessionDraft.date)}" />

      <label class="lbl">Τύπος</label>
      <select class="inp" id="ns_type">
        ${["Ατομική", "Ομαδική", "Οικογενειακή", "Τηλεσυνεδρία", "Άλλο"].map(t => `
          <option value="${esc(t)}" ${t === newSessionDraft.type ? "selected" : ""}>${esc(t)}</option>
        `).join("")}
      </select>

      <label class="lbl">Καταγραφή συνεδρίας</label>
      <textarea class="inp" id="ns_note" rows="10" placeholder="Γράψε εδώ τη σημείωση...">${esc(newSessionDraft.note)}</textarea>

      <div class="row mt-sm">
        <button class="btn btn-primary" onclick="uiSaveNewSession()">Αποθήκευση</button>
        <button class="btn" onclick="uiCloseSessionForm()">Ακύρωση</button>
      </div>
    </div>
  `;
}

function renderSessionCardHTML(s) {
  return `
    <div class="session-title">
      <strong>${esc(s.date || "—")}</strong> — ${esc(s.type || "—")}
    </div>
    <div class="mt-xs">${esc(s.note || "")}</div>
    <div class="row mt-sm">
      <button class="btn btn-sm" onclick="uiStartEditSession('${esc(s.id)}')">Επεξεργασία</button>
      <button class="btn btn-danger btn-sm" onclick="uiDeleteSession('${esc(s.id)}')">Διαγραφή</button>
    </div>
  `;
}

/* =========================
   Events UI (beneficiary history)
   ========================= */
function renderEventFormHTML() {
  const b = getSelectedBen();
  if (!b || !eventFormOpen) return "";

  if (editingEventId) {
    return `
      <div class="session mt-sm">
        <div class="session-title"><strong>Επεξεργασία γεγονότος</strong></div>

        <label class="lbl">Ημερομηνία</label>
        <input class="inp" id="ee_date" value="${esc(editEventDraft.date)}" />

        <label class="lbl">Τίτλος</label>
        <input class="inp" id="ee_title" value="${esc(editEventDraft.title)}" />

        <label class="lbl">Λεπτομέρειες (προαιρετικό)</label>
        <textarea class="inp" id="ee_details" rows="6">${esc(editEventDraft.details)}</textarea>

        <div class="row mt-sm">
          <button class="btn btn-primary" onclick="uiSaveEditEvent('${esc(editingEventId)}')">Αποθήκευση</button>
          <button class="btn" onclick="uiCloseEventForm()">Ακύρωση</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="session mt-sm">
      <div class="session-title"><strong>Νέο γεγονός</strong></div>

      <label class="lbl">Ημερομηνία</label>
      <input class="inp" id="ne_date" value="${esc(newEventDraft.date)}" />

      <label class="lbl">Τίτλος</label>
      <input class="inp" id="ne_title" placeholder="π.χ. Κατάθεση αίτησης" value="${esc(newEventDraft.title)}" />

      <label class="lbl">Λεπτομέρειες (προαιρετικό)</label>
      <textarea class="inp" id="ne_details" rows="6" placeholder="π.χ. έγγραφα που ζητήθηκαν, επόμενα βήματα...">${esc(newEventDraft.details)}</textarea>

      <div class="row mt-sm">
        <button class="btn btn-primary" onclick="uiSaveNewEvent()">Αποθήκευση</button>
        <button class="btn" onclick="uiCloseEventForm()">Ακύρωση</button>
      </div>
    </div>
  `;
}

/* =========================
   UI actions — navigation
   ========================= */
window.uiBackToList = function () {
  selectedBenId = null;
  benEditMode = false;
  sessionFormOpen = false;
  editingSessionId = null;
  eventFormOpen = false;
  editingEventId = null;
  render();
};

window.uiOpenBeneficiary = function (id) {
  selectedBenId = id;
  benEditMode = false;
  sessionFormOpen = false;
  editingSessionId = null;
  eventFormOpen = false;
  editingEventId = null;
  view = "beneficiaries";
  render();
};

/* =========================
   UI actions — beneficiaries
   ========================= */
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

  saveData();
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
  // Start history with a meaningful first event
  addEvent(id, todayGR(), "Δημιουργία φακέλου", "");
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

  // soft-delete beneficiary, keep data (demo)
  b.deleted = true;
  b.deletedAt = new Date().toLocaleString("el-GR");
  saveData();

  selectedBenId = null;
  render();
};

/* =========================
   UI actions — tasks
   ========================= */
window.uiAddTask = function () {
  if (!selectedBenId) return alert("Διάλεξε πρώτα ωφελούμενο.");

  const title = prompt("Τίτλος task:");
  if (!title) return;
  const due = prompt("Προθεσμία (π.χ. 25/02):") || "—";

  const id = "t" + Math.random().toString(16).slice(2);
  tasks.unshift({ id, title, due, done: false, benId: selectedBenId });

  saveData();
  render();
};

window.uiToggleTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;
  t.done = !t.done;
  saveData();
  render();
};

window.uiDeleteTask = function (taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;
  if (!confirm("Να διαγραφεί το task;")) return;

  tasks = tasks.filter((x) => x.id !== taskId);
  saveData();
  render();
};

/* =========================
   UI actions — sessions
   ========================= */
window.uiOpenNewSession = function () {
  if (!selectedBenId) return alert("Διάλεξε πρώτα ωφελούμενο.");
  sessionFormOpen = true;
  editingSessionId = null;
  newSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiCloseSessionForm = function () {
  sessionFormOpen = false;
  editingSessionId = null;
  newSessionDraft = { date: "", type: "Ατομική", note: "" };
  editSessionDraft = { date: "", type: "Ατομική", note: "" };
  render();
};

window.uiSaveNewSession = function () {
  if (!selectedBenId) return;

  const date = document.getElementById("ns_date")?.value?.trim() || todayGR();
  const type = document.getElementById("ns_type")?.value?.trim() || "Ατομική";
  const note = document.getElementById("ns_note")?.value?.trim() || "";

  if (!note) return alert("Γράψε καταγραφή συνεδρίας.");

  const id = "s" + Math.random().toString(16).slice(2);
  sessions.push({ id, date, type, note, benId: selectedBenId });

  // Meaningful history event for the beneficiary
  addEvent(selectedBenId, date, `Συνεδρία: ${type}`, "");

  saveData();
  sessionFormOpen = false;
  render();
};

window.uiStartEditSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;

  editingSessionId = sessionId;
  sessionFormOpen = true;
  editSessionDraft = { date: s.date || "", type: s.type || "Ατομική", note: s.note || "" };
  render();
};

window.uiSaveEditSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;

  const date = document.getElementById("es_date")?.value?.trim() || todayGR();
  const type = document.getElementById("es_type")?.value?.trim() || "Ατομική";
  const note = document.getElementById("es_note")?.value?.trim() || "";

  if (!note) return alert("Η καταγραφή δεν μπορεί να είναι κενή.");

  s.date = date;
  s.type = type;
  s.note = note;

  saveData();
  sessionFormOpen = false;
  editingSessionId = null;
  render();
};

window.uiDeleteSession = function (sessionId) {
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return;
  if (!confirm("Να διαγραφεί η συνεδρία;")) return;

  sessions = sessions.filter((x) => x.id !== sessionId);
  saveData();
  render();
};

/* =========================
   UI actions — events (history)
   ========================= */
window.uiOpenNewEvent = function () {
  if (!selectedBenId) return alert("Διάλεξε πρώτα ωφελούμενο.");
  eventFormOpen = true;
  editingEventId = null;
  newEventDraft = { date: todayGR(), title: "", details: "" };
  render();
};

window.uiCloseEventForm = function () {
  eventFormOpen = false;
  editingEventId = null;
  newEventDraft = { date: todayGR(), title: "", details: "" };
  editEventDraft = { date: todayGR(), title: "", details: "" };
  render();
};

window.uiSaveNewEvent = function () {
  if (!selectedBenId) return;

  const date = document.getElementById("ne_date")?.value?.trim() || todayGR();
  const title = document.getElementById("ne_title")?.value?.trim() || "";
  const details = document.getElementById("ne_details")?.value?.trim() || "";

  if (!title) return alert("Βάλε τίτλο (π.χ. Κατάθεση αίτησης).");

  addEvent(selectedBenId, date, title, details);
  eventFormOpen = false;
  saveData();
  render();
};

window.uiStartEditEvent = function (eventId) {
  const e = events.find((x) => x.id === eventId);
  if (!e) return;

  editingEventId = eventId;
  eventFormOpen = true;
  editEventDraft = { date: e.date || todayGR(), title: e.title || "", details: e.details || "" };
  render();
};

window.uiSaveEditEvent = function (eventId) {
  const e = events.find((x) => x.id === eventId);
  if (!e) return;

  const date = document.getElementById("ee_date")?.value?.trim() || todayGR();
  const title = document.getElementById("ee_title")?.value?.trim() || "";
  const details = document.getElementById("ee_details")?.value?.trim() || "";

  if (!title) return alert("Ο τίτλος δεν μπορεί να είναι κενός.");

  e.date = date;
  e.title = title;
  e.details = details;

  saveData();
  eventFormOpen = false;
  editingEventId = null;
  render();
};

window.uiDeleteEvent = function (eventId) {
  const e = events.find((x) => x.id === eventId);
  if (!e) return;
  if (!confirm("Να διαγραφεί το γεγονός;")) return;

  events = events.filter((x) => x.id !== eventId);
  saveData();
  render();
};

/* =========================
   Start
   ========================= */
render();
