const app = document.getElementById('app');

// Φόρτωση από αποθήκευση
let beneficiaries = JSON.parse(localStorage.getItem("beneficiaries")) || [];

function save() {
  localStorage.setItem("beneficiaries", JSON.stringify(beneficiaries));
}

function render() {
  if (beneficiaries.length === 0) {
    app.innerHTML = `
      <h2>Ωφελούμενοι</h2>
      <button onclick="add()">+ Νέος Ωφελούμενος</button>
      <p>Δεν υπάρχουν καταχωρήσεις.</p>
    `;
  } else {
    app.innerHTML = `
      <h2>Ωφελούμενοι</h2>
      <button onclick="add()">+ Νέος Ωφελούμενος</button>
      <ul>
        ${beneficiaries
          .map(b => `<li><strong>${b.name}</strong> – ${b.note}</li>`)
          .join("")}
      </ul>
    `;
  }
}

function add() {
  const name = prompt("Όνομα ωφελούμενου:");
  if (!name) return;
  const note = prompt("Σημείωση:");
  beneficiaries.push({ name, note });
  save();
  render();
}

render();
