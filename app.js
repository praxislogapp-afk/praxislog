// PraxisLog - simple single-page app (static demo)
// Everything renders inside <main id="app"></main>

const app = document.getElementById("app");

// --- Demo data (temporary) ---
let beneficiaries = [
  { id: "1111", name: "Αλέξανδρος Αλαμάνος", age: 43, note: "ΙΣ" },
  { id: "2244", name: "Μ.Κ.", age: 29, note: "Follow-up" },
];

let tasks = [
  { id: "t1", title: "Δημιουργία αίτησης", due: "25/02", done: false, benId: "1111" },
  { id: "t2", title: "Τηλέφωνο για ραντεβού", due: "26/02", done: false, benId: "1111" },
];

let sessions = [
  { id: "s1", date: "23.01.26", type: "Ατομική συνεδρία", note: "Ο ωφελούμενος ήρθε ψυχικά φορτισμένος", benId: "1111" },
  { id: "s2", date: "18.02.26", type: "Ατομική συνεδρία", note: "Έγινε ανασκόπηση στόχων και σχεδιασμός επόμενων βημάτων", benId: "1111" },
];

let history = [
  { id: "h1", ts: new Date().toLocaleString("el-GR"), text: "Δημιουργήθηκε νέο task: Δημιουργία αίτησης (1111)" },
];

// UI state
let view = "beneficiaries";           // beneficiaries | sessions | tasks | history
let selectedBenId = null;             // when user opens beneficiary card
let benEditMode = false;
let historyCollapsed = true;

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

function render() {
  if (view === "beneficiaries") return renderBeneficiaries();
  if (view === "sessions") return renderSessionsAll();
  if (view === "tasks") return renderTasksAll();
  if (view === "history") return renderHistoryAll();
}

// --- Navbar integration (called from index.html buttons) ---
window.show = function (which) {
  view = which;
  // reset selection when leaving beneficiaries
  if (view !== "beneficiaries") {
    selectedBenId = null;
    benEditMode = false;
  }
  render();
};

// --- Views ---
function renderBeneficiaries() {
  // List view
  if (!selectedBenId) {
    app.innerHTML = `
      <div class="page">
        <h1>Ωφελούμενοι</h1>
        <button class="btn btn-primary" onclick="uiAddBeneficiary()">+ Νέος ωφελούμενος</button>

        <div class="card mt">
          <div class="muted">Πατήστε έναν ωφελούμενο για να ανοίξει η καρτέλα.</div>
          <ul class="list mt-sm">
            ${beneficiaries
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
  const b = beneficiaries.find((x) => x.id === selectedBenId);
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

          <div class="section">
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

          <button class="btn mt" onclick="uiBackToList()">← Πίσω στη λίστα</button>
        </aside>

        <!-- RIGHT -->
        <section class="panel wide">
          <div class="section">
            <h3>Ιστορικό (σύνοψη)</h3>
            <div class="kv"><span>Συνεδρίες</span><strong>${benSessions.length}</strong></div>
            <div class="kv"><span>Ανοιχτά tasks</span><strong>${openTasksCount}</strong></div>
            <div class="kv"><span>Τελευταία ενέργεια</span><strong>${esc(lastAction)}</strong></div>
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
              <button class="btn btn-primary" onclick="uiAddSession()">+ Νέα συνεδρία</button>
            </div>

            ${
              benSessions.length
                ? `
              <div class="mt-sm">
                ${benSessions
                  .map(
                    (s) => `
                  <div class="session">
                    <div class="session-title"><strong>${esc(s.date)}</strong> — ${esc(s.type)}</div>
                    <div class="muted">${esc(s.note)}</div>
                  </div>`
                  )
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

function renderTasksAll() {
  // Global tasks list (all beneficiaries)
  const open = tasks.filter((t) => !t.done).length;
  app.innerHTML = `
    <div class="page">
      <h1>Tasks</h1>
      <div class="muted">Σύνολο tasks: ${tasks.length} • Ανοιχτά: ${open}</div>

      <div class="card mt">
        <ul class="checklist">
          ${tasks
            .map((t) => {
              const b = beneficiaries.find((x) => x.id === t.benId);
              return `
                <li class="check-item">
                  <label class="check-left">
                    <input type="checkbox" ${t.done ? "checked" : ""} onchange="uiToggleTask('${esc(t.id)}')" />
                    <span class="${t.done ? "done" : ""}">
                      ${esc(t.title)} <span class="muted">(${esc(t.due)})</span>
                      <span class="muted">— ${esc(b?.name || t.benId)}</span>
                    </span>
                  </label>
                  <button class="btn btn-sm" onclick="uiOpenBeneficiaryFromGlobal('${esc(t.benId)}')">Άνοιγμα καρτέλας</button>
                </li>
              `;
            })
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderSessionsAll() {
  // Global sessions list (all beneficiaries)
  app.innerHTML = `
    <div class="page">
      <h1>Συνεδρίες</h1>
      <div class="muted">Όλες οι συνεδρίες (όλων των ωφελούμενων).</div>

      <div class="card mt">
        ${sessions
          .slice()
          .reverse()
          .map((s) => {
            const b = beneficiaries.find((x) => x.id === s.benId);
            return `
              <div class="session">
                <div class="session-title"><strong>${esc(s.date)}</strong> — ${esc(s.type)}</div>
                <div class="muted">${esc(b?.name || s.benId)}</div>
                <div class="mt-xs">${esc(s.note)}</div>
                <div class="mt-xs">
                  <button class="btn btn-sm" onclick="uiOpenBeneficiaryFromGlobal('${esc(s.benId)}')">Άνοιγμα καρτέλας</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderHistoryAll() {
  // Global timeline
  const items = history.slice(0, 50);
  app.innerHTML = `
    <div class="page">
      <h1>Ιστορικό</h1>
      <div class="muted">Πρόσφατες ενέργειες (τελευταίες ${items.length}).</div>

      <div class="card mt">
        <ul class="timeline">
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

// --- UI actions ---
window.uiBackToList = function () {
  selectedBenId = null;
  benEditMode = false;
  render();
};

window.uiOpenBeneficiary = function (id) {
  selectedBenId = id;
  benEditMode = false;
  render();
};

window.uiOpenBeneficiaryFromGlobal = function (benId) {
  view = "beneficiaries";
  selectedBenId = benId;
  benEditMode = false;
  render();
};

window.uiToggleBenEdit = function (on) {
  benEditMode = on;
  render();
};

window.uiSaveBenEdit = function () {
  const b = beneficiaries.find((x) => x.id === selectedBenId);
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

  const id = prompt("Κωδικός (π.χ. 1234):") || (Math.random().toString().slice(2, 6));
  const age = Number(prompt("Ηλικία:") || "0") || 0;
  const note = prompt("Γενική σημείωση:") || "";

  beneficiaries.unshift({ id, name, age, note });
  pushHistory(`Προσθήκη ωφελούμενου: ${name} (${id})`);
  render();
};

window.uiAddTask = function () {
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

window.uiAddSession = function () {
  const date = prompt("Ημερομηνία (π.χ. 23.01.26):") || "—";
  const type = prompt("Τύπος (π.χ. Ατομική συνεδρία):") || "—";
  const note = prompt("Σύντομη σημείωση:") || "";

  const id = "s" + Math.random().toString(16).slice(2);
  sessions.push({ id, date, type, note, benId: selectedBenId });

  pushHistory(`Νέα συνεδρία: ${type} (${selectedBenId})`);
  render();
};

window.uiToggleHistory = function () {
  historyCollapsed = !historyCollapsed;
  render();
};

// initial render
render();
