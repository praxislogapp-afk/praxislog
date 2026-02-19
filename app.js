// PraxisLog — Clean Beneficiary Card
// Left: Demographics only
// Right: Tasks + Sessions only
// No summary, no counters, no history

const app = document.getElementById("app");
const LS_KEY = "praxislog_data_clean";

function today() {
  return new Date().toLocaleDateString("el-GR");
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
  };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : defaultData();
  } catch {
    return defaultData();
  }
}

let { beneficiaries, tasks, sessions } = load();
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify({ beneficiaries, tasks, sessions }));
}

let selectedBenId = null;
let editMode = false;

/* ================= NAV ================= */
window.show = function () {
  render();
};

/* ================= RENDER ================= */
function render() {
  if (!selectedBenId) return renderList();
  renderCard();
}

function renderList() {
  const list = beneficiaries.filter(b => !b.deleted);
  app.innerHTML = `
    <div class="page">
      <h1>Ωφελούμενοι</h1>
      <ul class="list">
        ${list.map(b => `
          <li>
            <button class="linklike" onclick="openBen('${b.id}')">${esc(b.name)}</button>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

window.openBen = function(id) {
  selectedBenId = id;
  editMode = false;
  render();
};

function renderCard() {
  const b = beneficiaries.find(x => x.id === selectedBenId);
  if (!b) return renderList();

  const benTasks = tasks.filter(t => t.benId === b.id);
  const benSessions = sessions.filter(s => s.benId === b.id);

  app.innerHTML = `
    <div class="page">
      <div class="split">

        <!-- LEFT -->
        <aside class="panel">
          <h2>Δημογραφικά</h2>

          ${
            !editMode ? `
              <div><strong>Όνομα:</strong> ${esc(b.name)}</div>
              <div><strong>Κωδικός:</strong> ${esc(b.id)}</div>
              <div><strong>Ημ. Γέννησης:</strong> ${esc(b.dob)}</div>
              <div><strong>Σημείωση:</strong> ${esc(b.note)}</div>

              <div class="row mt">
                <button class="btn btn-primary" onclick="editMode=true;render()">Επεξεργασία</button>
                <button class="btn btn-danger" onclick="deleteBen()">Διαγραφή</button>
              </div>
            ` : `
              <label>Όνομα</label>
              <input id="bn" value="${esc(b.name)}"/>
              <label>Ημ. Γέννησης</label>
              <input id="bd" value="${esc(b.dob)}"/>
              <label>Σημείωση</label>
              <textarea id="bt">${esc(b.note)}</textarea>

              <div class="row mt">
                <button class="btn btn-primary" onclick="saveBen()">Αποθήκευση</button>
                <button class="btn" onclick="editMode=false;render()">Άκυρο</button>
              </div>
            `
          }

          <button class="btn mt" onclick="selectedBenId=null;render()">← Πίσω</button>
        </aside>

        <!-- RIGHT -->
        <section class="panel wide">

          <h2>Tasks</h2>
          <button class="btn btn-primary" onclick="addTask()">+ Νέο task</button>
          <ul class="list">
            ${benTasks.map(t => `
              <li>
                <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask('${t.id}')"/>
                ${esc(t.title)} (${esc(t.due)})
                <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">Διαγραφή</button>
              </li>
            `).join("")}
          </ul>

          <h2 class="mt">Συνεδρίες</h2>
          <button class="btn btn-primary" onclick="addSession()">+ Νέα συνεδρία</button>
          ${benSessions.map(s => `
            <div class="card mt-sm">
              <strong>${esc(s.date)} — ${esc(s.type)}</strong>
              <div>${esc(s.note)}</div>
              <button class="btn btn-danger btn-sm" onclick="deleteSession('${s.id}')">Διαγραφή</button>
            </div>
          `).join("")}

        </section>
      </div>
    </div>
  `;
}

/* ================= ACTIONS ================= */
window.saveBen = function() {
  const b = beneficiaries.find(x => x.id === selectedBenId);
  b.name = document.getElementById("bn").value;
  b.dob = document.getElementById("bd").value;
  b.note = document.getElementById("bt").value;
  editMode = false;
  save();
  render();
};

window.deleteBen = function() {
  if (!confirm("Διαγραφή ωφελούμενου;")) return;
  beneficiaries = beneficiaries.filter(b => b.id !== selectedBenId);
  selectedBenId = null;
  save();
  render();
};

window.addTask = function() {
  const title = prompt("Τίτλος task");
  if (!title) return;
  tasks.push({ id: Math.random()+"", title, due: today(), done:false, benId:selectedBenId });
  save(); render();
};

window.toggleTask = function(id) {
  const t = tasks.find(x=>x.id===id);
  t.done = !t.done;
  save(); render();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(x=>x.id!==id);
  save(); render();
};

window.addSession = function() {
  const note = prompt("Καταγραφή συνεδρίας");
  if (!note) return;
  sessions.push({ id: Math.random()+"", date: today(), type:"Ατομική", note, benId:selectedBenId });
  save(); render();
};

window.deleteSession = function(id) {
  sessions = sessions.filter(x=>x.id!==id);
  save(); render();
};

render();
