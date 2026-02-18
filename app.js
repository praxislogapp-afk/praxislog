const app = document.getElementById("app");

let beneficiaries = JSON.parse(localStorage.getItem("beneficiaries")) || [];

let selected = null;

function save() {
  localStorage.setItem("beneficiaries", JSON.stringify(beneficiaries));
}

function render() {
  app.innerHTML = "";

  if (selected === null) {
    app.innerHTML = `
      <h2>Ωφελούμενοι</h2>
      <button onclick="addBeneficiary()">+ Νέος Ωφελούμενος</button>
      <ul>
        ${beneficiaries
          .map(
            (b, i) =>
              `<li>
                <a href="#" onclick="openBeneficiary(${i})">${b.name}</a>
              </li>`
          )
          .join("")}
      </ul>
    `;
    return;
  }

  const b = beneficiaries[selected];
  const openTasks = b.tasks.filter(t => !t.done).length;

  app.innerHTML = `
    <div class="layout">
      <aside class="left">
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

        <section style="margin-top:16px">
          <h3>Ιστορικό (σύνοψη)</h3>
          <p><strong>Συνεδρίες:</strong> ${b.sessions.length}</p>
          <p><strong>Ανοιχτά tasks:</strong> ${openTasks}</p>
          <p><strong>Τελευταία ενέργεια:</strong> ${b.history[0] ? b.history[0].stamp : "—"}</p>
        </section>

        <div style="margin-top:16px">
          <button onclick="back()">← Πίσω στη λίστα</button>
        </div>
      </aside>

      <main class="right">
        <section>
          <h3>Ιστορικό (timeline)</h3>
          ${
            b.history.length === 0
              ? `<p>Δεν υπάρχει ιστορικό ακόμα.</p>`
              : `<ul>
                  ${b.history
                    .map(
                      h => `
                        <li>
                          <strong>${h.stamp}</strong>
                          <div style="opacity:.85">${h.text}</div>
                        </li>`
                    )
                    .join("")}
                </ul>`
          }
        </section>

        <section>
          <h3>Tasks</h3>
          <button onclick="addTask()">+ Νέο task</button>
          ${
            b.tasks.length === 0
              ? `<p>Δεν υπάρχουν tasks.</p>`
              : `<ul>
                  ${b.tasks
                    .map(
                      (t, i) => `
                        <li style="display:flex; justify-content:space-between; align-items:center">
                          <label style="flex:1">
                            <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${i})">
                            ${t.title}
                          </label>
                          <button onclick="deleteTask(${i})">Διαγραφή</button>
                        </li>`
                    )
                    .join("")}
                </ul>`
          }
        </section>

        <section>
          <h3>Συνεδρίες</h3>
          <button onclick="addSession()">+ Νέα συνεδρία</button>
          ${
            b.sessions.length === 0
              ? `<p>Δεν υπάρχουν συνεδρίες.</p>`
              : `<ul>
                  ${b.sessions
                    .map(
                      s => `
                        <li>
                          <strong>${s.date}</strong> — ${s.type}
                          <div>${s.note || ""}</div>
                        </li>`
                    )
                    .join("")}
                </ul>`
          }
        </section>
      </main>
    </div>
  `;
}

/* -------- actions -------- */

function addBeneficiary() {
  const name = prompt("Όνομα:");
  if (!name) return;
  beneficiaries.push({
    name,
    code: "",
    age: "",
    note: "",
    history: [],
    tasks: [],
    sessions: []
  });
  save();
  render();
}

function openBeneficiary(i) {
  selected = i;
  render();
}

function back() {
  selected = null;
  render();
}

function editDemographics() {
  const b = beneficiaries[selected];
  b.code = prompt("Κωδικός:", b.code);
  b.age = prompt("Ηλικία:", b.age);
  b.note = prompt("Γενική σημείωση:", b.note);
  save();
  render();
}

function addTask() {
  const title = prompt("Task:");
  if (!title) return;
  beneficiaries[selected].tasks.push({ title, done: false });
  save();
  render();
}

function toggleTask(i) {
  const t = beneficiaries[selected].tasks[i];
  t.done = !t.done;
  save();
  render();
}

function deleteTask(i) {
  beneficiaries[selected].tasks.splice(i, 1);
  save();
  render();
}

function addSession() {
  const type = prompt("Τύπος συνεδρίας:");
  if (!type) return;
  const note = prompt("Σημείωση:");
  const date = new Date().toLocaleDateString("el-GR");
  beneficiaries[selected].sessions.push({ type, note, date });
  beneficiaries[selected].history.unshift({
    stamp: new Date().toLocaleString("el-GR"),
    text: `Συνεδρία: ${type}`
  });
  save();
  render();
}

render();
