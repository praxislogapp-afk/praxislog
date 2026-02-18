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
      <p><strong>Όνομα:</strong> ${b.name}</p>
      <p><strong>Σημείωση:</strong></p>
      <p>${b.note || "-"}</p>

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
            <strong>${b.name}</strong> – ${b.note || ""}
          </li>`
      ).join("")}
    </ul>
  `;
}

function add() {
  const name = prompt("Όνομα ωφελούμενου:");
  if (!name) return;
  const note = prompt("Σημείωση:");
  beneficiaries.push({ name, note });
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
