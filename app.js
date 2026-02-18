const app = document.getElementById('app');

let beneficiaries = JSON.parse(localStorage.getItem("beneficiaries")) || [];
let selected = null;

function save() {
  localStorage.setItem("beneficiaries", JSON.stringify(beneficiaries));
}

function render() {
  if (selected !== null) {
    const b = beneficiaries[selected];
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
      <br><br>
      <button onclick="back()">← Πίσω στη λίστα</button>
    `;
    return;
  }

  app.innerHTML = `
    <h2>Ωφελούμενοι</h2>
    <button onclick="add()">+ Νέος Ωφελούμενος</button>
    <ul>
      ${beneficiaries.map(
        (b, i) =>
          `<li onclick="openCard(${i})" style="cursor:pointer">
            <strong>${b.name}</strong>
          </li>`
      ).join("")}
    </ul>
  `;
}

function add() {
  const name = prompt("Όνομα ωφελούμενου:");
  if (!name) return;
  const code = prompt("Κωδικός (προαιρετικό):");
  const age = prompt("Ηλικία (προαιρετικό):");
  const note = prompt("Γενική σημείωση:");
  beneficiaries.push({ name, code, age, note });
  save();
  render();
}

function editDemographics() {
  const b = beneficiaries[selected];
  b.name = prompt("Όνομα:", b.name) || b.name;
  b.code = prompt("Κωδικός:", b.code || "") || b.code;
  b.age = prompt("Ηλικία:", b.age || "") || b.age;
  b.note = prompt("Γενική σημείωση:", b.note || "") || b.note;
  save();
  render();
}

function openCard(index) {
  selected = index;
  render();
}

function back() {
  selected = null;
  render();
}

render();
