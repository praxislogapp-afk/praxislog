// PraxisLog — UI restore (HTML-based) + horizontal demographics via CSS
const app = document.getElementById("app");

const LS_KEY = "praxislog_data_clean_v2";
const LS_OLD = "praxislog_data_clean";

function today() {
  const d = new Date();
  return d.toLocaleDateString("el-GR");
}

function uid(prefix) {
  return prefix + Math.random().toString(16).slice(2);
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ================= DATA ================= */
function defaultData() {
  return {
    beneficiaries: [
      { id: "1111", name: "Αλέξανδρος Αλαμάνος", dob: "11/11/1982", note: "ΙΣ", deleted: false },
    ],
    tasks: [
      { id: "t1", title: "Δημιουργία αίτησης", due: "25/02", done: false, benId: "1111" },
      { id: "t2", title: "Τηλέφωνο για ραντεβού", due: "26/02", done: false, benId: "1111" },
    ],
    sessions: [
      { id: "s1", date: "23.01.26", type: "Ατομική", note: "Ο ωφελούμενος ήρθε ψυχικά φορτισμένος", benId: "1111" },
      { id: "s2", date: "18.02.26", type: "Ατομική", note: "Ανασκόπηση στόχων", benId: "1111" },
    ],
    history: [
      { id: "h1", benId: "1111", date: today(), title: "Έναρξη φακέλου", details: "" },
    ],
  };
}

function load() {
  try {
    const rawNew = localStorage.getItem(LS_KEY);
    if (rawNew) return JSON.parse(rawNew);

    const rawOld = localStorage.getItem(LS_OLD);
    if (rawOld) {
      const old = JSON.parse(rawOld);
      const migrated = {
        beneficiaries: Array.isArray(old.beneficiaries) ? old.beneficiaries : defaultData().beneficiaries,
        tasks: Array.isArray(old.tasks) ? old.tasks : defaultData().tasks,
        sessions: Array.isArray(old.sessions) ? old.sessions : defaultData().sessions,
        history: defaultData().history,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return defaultData();
  } catch {
    return defaultData();
  }
}

let { beneficiaries, tasks, sessions, history } = load();
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify({ beneficiaries, tasks, sessions, history }));
}

let selectedBenId = null;
let editMode = false;

/* ================= NAV (tabs) ================= */
window.show = function (tab) {
  // κρατάμε την τρέχουσα κάρτα, απλά σκρολάρουμε στο section
  if (!selectedBenId) return render();

  const id = tab === "tasks" ? "sec-tasks" : tab === "sessions" ? "sec-sessions" : "sec-history";
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ================= RENDER ================= */
function render() {
  if (!selectedBenId) return renderList();
  renderCard();
}

function renderList() {
  const list = beneficiaries.filter((b) => !b.deleted);
  app.innerHTML = `
    <div class="page">
      <h1>Ωφελούμενοι</h1>

      <div class="grid">
        ${list
          .map(
            (b) => `
          <div class="card">
            <div class="cardTitle">${esc(b.name)}</div>
            <div class="muted">Κωδικός: <strong>${esc(b.id)}</strong></div>
            <div class="muted">Ημ. Γέννησης: <strong>${esc(b.dob || "")}</strong></div>
            <div class="mt"></div>
            <button class="btn btn-primary" onclick="openBen('${esc(b.id)}')">Άνοιγμα καρτέλας</button>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

window.openBen = function (id) {
  selectedBenId = id;
  editMode = false;
  render();
};

window.backToList = function () {
  selectedBenId = null;
  editMode = false;
  render();
};

function renderCard() {
  const b = beneficiaries.find((x) => x.id === selectedBenId);
  if (!b) return renderList();

  const benTasks = tasks.filter((t) => t.benId === b.id);
  const benSessions = sessions.filter((s) => s.benId === b.id);
  const benHistory = history.filter((h) => h.benId === b.id);

  app.innerHTML = `
    <div class="page">
      <div class="topRow">
        <h1>Καρτέλα ωφελούμενου</h1>
        <button class="btn" onclick="backToList()">← Πίσω</button>
      </div>

      <div class="split">
        <!-- LEFT: Demographics -->
        <div class="panel">
          <div class="panelTitle">Δημογραφικά</div>

          ${
            !editMode
              ? `
            <div class="kvRow">
              <div class="kv"><span>Όνομα:</span> <strong>${esc(b.name)}</strong></div>
              <div class="kv"><span>Κωδικός:</span> <strong>${esc(b.id)}</strong></div>
              <div class="kv"><span>Ημ. Γέννησης:</span> <strong>${esc(b.dob || "")}</strong></div>
              <div class="kv"><span>Σημείωση:</span> <strong>${esc(b.note || "")}</strong></div>
            </div>

            <div class="row mt">
              <button class="btn btn-primary" onclick="toggleEdit(true)">Επεξεργασία</button>
              <button class="btn btn-danger" onclick="deleteBen()">Διαγραφή</button>
            </div>
          `
              : `
            <label class="lbl">Όνομα</label>
            <input class="inp" id="bn" value="${esc(b.name)}" />

            <label class="lbl">Ημ. Γέννησης</label>
            <input class="inp" id="bd" value="${esc(b.dob || "")}" />

            <label class="lbl">Σημείωση</label>
            <input class="inp" id="bt" value="${esc(b.note || "")}" />

            <div class="row mt">
              <button class="btn btn-primary" onclick="saveBen()">Αποθήκευση</button>
              <button class="btn" onclick="toggleEdit(false)">Άκυρο</button>
            </div>
          `
          }
        </div>

        <!-- RIGHT: Work -->
        <div class="rightCol">

          <div class="section" id="sec-tasks">
            <div class="sectionHead">
              <div class="sectionTitle">Tasks</div>
              <button class="btn btn-primary" onclick="addTask()">+ Νέο task</button>
            </div>

            <div class="list">
              ${
                benTasks.length
                  ? benTasks
                      .map(
                        (t) => `
                <div class="listItem">
                  <label class="check">
                    <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask('${esc(t.id)}')" />
                    <span>${esc(t.title)} <span class="muted">(${esc(t.due)})</span></span>
                  </label>
                  <button class="btn btn-danger btn-sm" onclick="deleteTask('${esc(t.id)}')">Διαγραφή</button>
                </div>
              `
                      )
                      .join("")
                  : `<div class="muted">Δεν υπάρχουν tasks.</div>`
              }
            </div>
          </div>

          <div class="section mt" id="sec-sessions">
            <div class="sectionHead">
              <div class="sectionTitle">Συνεδρίες</div>
              <button class="btn btn-primary" onclick="addSession()">+ Νέα συνεδρία</button>
            </div>

            <div class="cards">
              ${
                benSessions.length
                  ? benSessions
                      .map((s) => {
                        const title = (s.note || "").trim();
                        const short = title.length > 80 ? title.slice(0, 80) + "…" : title;
                        return `
                  <div class="cardRow">
                    <div class="cardRowTitle">${esc(s.date)} — ${esc(s.type)}</div>
                    <div class="cardRowText">${esc(short)}</div>
                    <div class="row mt-xs">
                      <details class="details">
                        <summary>Πλήρες κείμενο</summary>
                        <div class="detailsBody">${esc(title).replaceAll("\n", "<br/>")}</div>
                      </details>
                      <button class="btn btn-danger btn-sm" onclick="deleteSession('${esc(s.id)}')">Διαγραφή</button>
                    </div>
                  </div>
                `;
                      })
                      .join("")
                  : `<div class="muted">Δεν υπάρχουν συνεδρίες.</div>`
              }
            </div>
          </div>

          <div class="section mt" id="sec-history">
            <div class="sectionHead">
              <div class="sectionTitle">Ιστορικό</div>
              <button class="btn btn-primary" onclick="addHistory()">+ Νέο γεγονός</button>
            </div>

            <div class="cards">
              ${
                benHistory.length
                  ? benHistory
                      .map(
                        (h) => `
                  <div class="cardRow">
                    <div class="muted">${esc(h.date)}</div>
                    <div class="cardRowTitle">${esc(h.title)}</div>
                    ${
                      h.details
                        ? `<div class="cardRowText">${esc(h.details).replaceAll("\n", "<br/>")}</div>`
                        : ``
                    }
                    <div class="mt-xs">
                      <button class="btn btn-danger btn-sm" onclick="deleteHistory('${esc(h.id)}')">Διαγραφή</button>
                    </div>
                  </div>
                `
                      )
                      .join("")
                  : `<div class="muted">Δεν υπάρχει ιστορικό ακόμα.</div>`
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/* ================= ACTIONS ================= */
window.toggleEdit = function (on) {
  editMode = !!on;
  render();
};

window.saveBen = function () {
  const b = beneficiaries.find((x) => x.id === selectedBenId);
  if (!b) return;

  b.name = document.getElementById("bn").value.trim();
  b.dob = document.getElementById("bd").value.trim();
  b.note = document.getElementById("bt").value.trim();

  editMode = false;
  save();
  render();
};

window.deleteBen = function () {
  if (!confirm("Διαγραφή ωφελούμενου;")) return;

  beneficiaries = beneficiaries.filter((b) => b.id !== selectedBenId);
  tasks = tasks.filter((t) => t.benId !== selectedBenId);
  sessions = sessions.filter((s) => s.benId !== selectedBenId);
  history = history.filter((h) => h.benId !== selectedBenId);

  selectedBenId = null;
  save();
  render();
};

window.addTask = function () {
  const title = prompt("Τίτλος task");
  if (!title) return;
  const due = prompt("Προθεσμία (π.χ. 25/02)") || today();

  tasks.push({ id: uid("t"), title, due, done: false, benId: selectedBenId });
  save();
  render();
};

window.toggleTask = function (id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save();
  render();
};

window.deleteTask = function (id) {
  tasks = tasks.filter((x) => x.id !== id);
  save();
  render();
};

window.addSession = function () {
  const type = prompt("Τύπος (π.χ. Ατομική)") || "Ατομική";
  const date = prompt("Ημερομηνία (π.χ. 19.02.26)") || today();
  const note = prompt("Καταγραφή συνεδρίας (πλήρες κείμενο)");
  if (!note) return;

  sessions.push({ id: uid("s"), date, type, note, benId: selectedBenId });
  save();
  render();
};

window.deleteSession = function (id) {
  sessions = sessions.filter((x) => x.id !== id);
  save();
  render();
};

window.addHistory = function () {
  const date = prompt("Ημερομηνία", today()) || today();
  const title = prompt("Τίτλος γεγονότος (π.χ. Κατάθεση αίτησης)");
  if (!title) return;
  const details = prompt("Λεπτομέρειες (προαιρετικό)") || "";

  history.unshift({ id: uid("h"), benId: selectedBenId, date, title, details });
  save();
  render();
};

window.deleteHistory = function (id) {
  history = history.filter((x) => x.id !== id);
  save();
  render();
};

render();
