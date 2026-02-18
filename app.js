const app = document.getElementById('app');

let beneficiaries = JSON.parse(localStorage.getItem("beneficiaries")) || [];
let selected = null;

const SESSION_TYPES = [
  "Ατομική συνεδρία",
  "Τηλεφωνική επικοινωνία",
  "Δια ζώσης επαφή",
  "Διαδικτυακή συνεδρία",
  "Διασύνδεση / παραπομπή",
  "Διοικητική πράξη",
  "Άλλο"
];

function save() {
  localStorage.setItem("beneficiaries", JSON.stringify(beneficiaries));
}

function ensureArrays(b) {
  if (!Array.isArray(b.tasks)) b.tasks = [];
  if (!Array.isArray(b.sessions)) b.sessions = [];
}

function render() {
  if (selected !== null) {
    const b = beneficiaries[selected];
    ensureArrays(b);

    const openTasks = b.tasks.filter(t => !t.done).length;

    app.innerHTML = `
      <h2>Καρτέλα Ωφελούμενου</h2>

      <section>
        <h3>Δημογραφικά στοιχεία</h3>
        <p><strong>Όνομα:</strong> ${b.name}</p>
        <p><strong>Κωδικός:</strong> ${b.code || "-"}</p>
        <p><strong>Ηλικία:</strong> ${b.age || "-"}</p>
        <p><strong>Γενική σημείωση:</strong></p>
        <p>${b.note || "-"}</p>
      </section>

      <button onclick="editDemographics()">✏️ Επεξεργασία δημογραφικών</button>

      <section style="margin-top:20px">
        <h3>Ιστορικό (σύνοψη)</h3>
        <p><strong>Συνεδρίες:</strong> ${b.sessions.length}</p>
        <p><strong>Ανοιχτά tasks:</strong> ${openTasks}</p>
        <p><strong>Τελευταία ενέργεια:</strong> —</p>
      </section>

      <section style="margin-top:20px">
        <h3>Tasks</h3>
        <button onclick="addTask()">+ Νέο task</button>
        ${
          b.tasks.length === 0
            ? `<p>Δεν υπάρχουν tasks.</p>`
            : `<ul>
                ${b.tasks.map((t,i)=>`
                  <li style="display:flex; gap:10px; align-items:center; justify-content:space-between">
                    <label style="display:flex; gap:10px; align-items:center; flex:1">
                      <input type="checkbox" ${t.done?"checked":""} onchange="toggleTask(${i})"/>
                      <span style="${t.done?"text-decoration:line-through;opacity:.7":""}">
                        ${t.title}${t.due?` <em style="opacity:.75">(${t.due})</em>`:""}
                      </span>
                    </label>
                    <button onclick="deleteTask(${i})" style="background:#b3261e">Διαγραφή</button>
                  </li>`).join("")}
              </ul>`
        }
      </section>

      <section style="margin-top:20px">
        <h3>Συνεδρίες</h3>
        <button onclick="addSession()">+ Νέα συνεδρία</button>
        ${
          b.sessions.length === 0
            ? `<p>Δεν υπάρχουν συνεδρίες.</p>`
            : `<ul>
                ${b.sessions.map((s)=>`
                  <li>
                    <strong>${s.date}</strong> — ${s.type}
                    <div style="opacity:.8">${s.note || ""}</div>
                  </li>`).join("")}
              </ul>`
        }
      </section>

      <br>
      <button onclick="back()">← Πίσω στη λίστα</button>
    `;
    return;
  }

  app.innerHTML = `
    <h2>Ωφελούμενοι</h2>
    <button onclick="add()">+ Νέος Ωφελούμενος</button>
    <ul>
      ${beneficiaries.map((b,i)=>`
        <li onclick="openCard(${i})" style="cursor:pointer">
          <strong>${b.name}</strong>
        </li>`).join("")}
    </ul>
  `;
}

function add() {
  const name = prompt("Όνομα ωφελούμενου:");
  if (!name) return;
  const code = prompt("Κωδικός (προαιρετικό):");
  const age = prompt("Ηλικία (προαιρετικό):");
  const note = prompt("Γενική σημείωση:");
  beneficiaries.push({ name, code, age, note, tasks: [], sessions: [] });
  save(); render();
}

function editDemographics() {
  const b = beneficiaries[selected];
  b.name = prompt("Όνομα:", b.name) || b.name;
  b.code = prompt("Κωδικός:", b.code || "") || b.code;
  b.age  = prompt("Ηλικία:", b.age || "") || b.age;
  b.note = prompt("Γενική σημείωση:", b.note || "") || b.note;
  save(); render();
}

function addTask() {
  const b = beneficiaries[selected]; ensureArrays(b);
  const title = prompt("Τίτλος task:");
  if (!title) return;
  const due = prompt("Προθεσμία (προαιρετικό):");
  b.tasks.unshift({ title, due, done:false });
  save(); render();
}

function toggleTask(i) {
  const b = beneficiaries[selected];
  b.tasks[i].done = !b.tasks[i].done;
  save(); render();
}

function deleteTask(i) {
  const b = beneficiaries[selected];
  if (!confirm("Να διαγραφεί το task;")) return;
  b.tasks.splice(i,1);
  save(); render();
}

function addSession() {
  const b = beneficiaries[selected]; ensureArrays(b);
  const date = prompt("Ημερομηνία (πχ 18/02/2026):");
  if (!date) return;
  const type = prompt(
    "Τύπος συνεδρίας:\n" + SESSION_TYPES.map((t,i)=>`${i+1}. ${t}`).join("\n")
  );
  let chosen = SESSION_TYPES.find(t => t === type) || SESSION_TYPES[0];
  const note = prompt("Σύντομη σημείωση:");
  b.sessions.unshift({ date, type: chosen, note });
  save(); render();
}

function openCard(i){ selected=i; render(); }
function back(){ selected=null; render(); }

render();
