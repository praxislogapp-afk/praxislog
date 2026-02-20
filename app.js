const USER_KEY = "praxislog_user";

function getUser() {
  return localStorage.getItem(USER_KEY) || "";
}

function setUser(u) {
  localStorage.setItem(USER_KEY, u);
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

function App() {
  const root = document.getElementById("app");
  const user = getUser();

  if (!user) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
        <div style="width:min(560px,100%);border:1px solid #e5e5e5;border-radius:12px;padding:16px;">
          <div style="font-size:22px;font-weight:700;margin-bottom:6px;">PraxisLog</div>
          <div style="opacity:.75;margin-bottom:12px;">Σύνδεση (προσωρινή)</div>

          <div style="display:flex;gap:10px;align-items:center;">
            <input id="u" placeholder="Γράψε ένα όνομα χρήστη (π.χ. alex)"
              style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid #d9d9d9;font-size:14px;" />
            <button id="login"
              style="padding:10px 14px;border-radius:10px;border:1px solid #111;background:#111;color:#fff;cursor:pointer;font-size:14px;">
              Login
            </button>
          </div>

          <div style="margin-top:12px;font-size:12px;opacity:.75;">
            Αυτό κρατάει ξεχωριστά δεδομένα ανά χρήστη στο ίδιο browser. (Προσωρινό)
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById("u");
    const btn = document.getElementById("login");

    function doLogin() {
      const v = (input.value || "").trim();
      if (!v) return;
      setUser(v);
      App();
    }

    btn.addEventListener("click", doLogin);
    input.addEventListener("keydown", (e) => (e.key === "Enter" ? doLogin() : null));
    return;
  }

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
      <div style="width:min(560px,100%);border:1px solid #e5e5e5;border-radius:12px;padding:16px;">
        <div style="font-size:22px;font-weight:700;margin-bottom:6px;">PraxisLog</div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <div>Συνδεδεμένος ως: <b>${user}</b></div>
          <button id="logout"
            style="padding:8px 12px;border-radius:10px;border:1px solid #d9d9d9;background:#fff;cursor:pointer;font-size:14px;">
            Logout
          </button>
        </div>

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #eee;">
          Επόμενο βήμα: θα “δένουμε” όλα τα δεδομένα (ωφελούμενοι/συνεδρίες) στον χρήστη <b>${user}</b>.
        </div>
      </div>
    </div>
  `;

  document.getElementById("logout").addEventListener("click", () => {
    clearUser();
    App();
  });
}

App();
