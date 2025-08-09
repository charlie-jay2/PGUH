// app.js
// API endpoints (netlify functions)
const API = {
  registerStaff: "/.netlify/functions/registerStaff", // optional admin endpoint
  login: "/.netlify/functions/login",
  getHospital: "/.netlify/functions/getHospitalData",
  updateHospital: "/.netlify/functions/updateHospitalData",
  getPatients: "/.netlify/functions/getPatients",
  getPatientById: "/.netlify/functions/getPatientById", // new endpoint to get single patient
  createPatient: "/.netlify/functions/createPatient",
  updatePatient: "/.netlify/functions/updatePatient",
  deletePatient: "/.netlify/functions/deletePatient",
  addPatientRecord: "/.netlify/functions/addPatientRecord", // new endpoint for patient clinical records
};

function el(id) {
  return document.getElementById(id);
}
function show(elm) {
  elm.classList.remove("hidden");
}
function hide(elm) {
  elm.classList.add("hidden");
}

function getAuthToken() {
  return localStorage.getItem("token");
}
function setAuthToken(t) {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
function getUsername() {
  return localStorage.getItem("username");
}
function setUsername(u) {
  if (u) localStorage.setItem("username", u);
  else localStorage.removeItem("username");
}

async function fetchJson(url, opts = {}) {
  opts.headers = opts.headers || {};
  opts.headers["Content-Type"] = "application/json";
  const token = getAuthToken();
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, opts);
  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized: please login again");
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return res.json();
}

/* ---------- AUTH UI ---------- */
const loginPanel = el("loginPanel");
const dashboard = el("dashboard");
const metaArea = el("metaArea");

el("loginBtn").addEventListener("click", async () => {
  const u = el("loginUsername").value.trim();
  const p = el("loginPassword").value;
  if (!u || !p) return alert("username & password required");
  try {
    const res = await fetchJson(API.login, {
      method: "POST",
      body: JSON.stringify({ username: u, password: p }),
    });
    setAuthToken(res.token);
    setUsername(res.username);
    el("loginPassword").value = "";
    await onLogin();
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});

function logout() {
  setAuthToken(null);
  setUsername(null);
  renderLoggedOut();
}

function renderLoggedIn() {
  const name = getUsername() || "Staff";
  metaArea.innerHTML = `<div>Signed in as <strong>${escapeHtml(
    name
  )}</strong></div>
    <div><button id="logoutBtn" class="secondary">Log out</button></div>`;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  hide(loginPanel);
  show(dashboard);
}

function renderLoggedOut() {
  metaArea.innerHTML = "";
  show(loginPanel);
  hide(dashboard);
}

/* ---------- Styling helper for waitTime and bedsAvailable ---------- */
function updateColor(element, value, type) {
  element.classList.remove("red", "yellow", "green");
  if (value === null || isNaN(value)) return;

  if (type === "beds") {
    if (value < 20) element.classList.add("red");
    else if (value < 50) element.classList.add("yellow");
    else if (value >= 100) element.classList.add("green");
  } else if (type === "waitTime") {
    if (value < 20) element.classList.add("green");
    else if (value <= 60) element.classList.add("yellow");
    else if (value > 60) element.classList.add("red");
  }
}

/* ---------- Hospital data ---------- */
async function loadHospital() {
  const data = await fetchJson(API.getHospital);
  const h = data && data.hospital ? data.hospital : {};
  const waitTimeVal = h.waitTime != null ? h.waitTime : null;
  const bedsAvailableVal = h.bedsAvailable != null ? h.bedsAvailable : null;

  el("waitTime").innerText = waitTimeVal != null ? `${waitTimeVal} min` : "—";
  el("bedsAvailable").innerText =
    bedsAvailableVal != null ? bedsAvailableVal : "—";
  el("totalBeds").innerText = h.totalBeds != null ? h.totalBeds : "—";
  el("lastUpdated").innerText = h.updatedAt
    ? new Date(h.updatedAt).toLocaleString()
    : "—";
  el("inputWaitTime").value = waitTimeVal ?? "";
  el("inputBedsAvailable").value = bedsAvailableVal ?? "";
  el("inputTotalBeds").value = h.totalBeds ?? "";

  // Remove " min" before passing to color helper:
  updateColor(el("waitTime"), waitTimeVal, "waitTime");
  updateColor(el("bedsAvailable"), bedsAvailableVal, "beds");
}

el("editHospitalBtn").addEventListener("click", () => show(el("hospitalForm")));
el("cancelHospitalBtn").addEventListener("click", () =>
  hide(el("hospitalForm"))
);
el("saveHospitalBtn").addEventListener("click", async () => {
  const payload = {
    waitTime: Number(el("inputWaitTime").value || 0),
    bedsAvailable: Number(el("inputBedsAvailable").value || 0),
    totalBeds: Number(el("inputTotalBeds").value || 0),
  };
  try {
    await fetchJson(API.updateHospital, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    hide(el("hospitalForm"));
    await loadHospital();
  } catch (e) {
    alert("Failed to save hospital data: " + e.message);
  }
});

/* ---------- Patients ---------- */
let patientsCache = [];
async function loadPatients() {
  const res = await fetchJson(API.getPatients);
  patientsCache = res.patients || [];
  renderPatients(patientsCache);
}

function renderPatients(list) {
  const body = el("patientsBody");
  body.innerHTML = "";
  list.forEach((p) => {
    // Calculate age from dateOfBirth
    let age = "";
    if (p.dateOfBirth) {
      const dob = new Date(p.dateOfBirth);
      const diff = Date.now() - dob.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Priority label mapping
    const priorityLabels = [
      "0 - Minor Care",
      "1 - Low Medium",
      "2 - High Medium",
      "3 - Critical Care",
      "4 - Deceased",
    ];
    const priorityText =
      p.priority !== undefined &&
      p.priority >= 0 &&
      p.priority < priorityLabels.length
        ? priorityLabels[p.priority]
        : "Unknown";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.robloxName || "")}</td>
      <td>${
        p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : ""
      }</td>
      <td>${age}</td>
      <td>${escapeHtml(p.presentingComplaint || "")}</td>
      <td><a href="patient.html?id=${p._id}" target="_blank">${escapeHtml(
      p.patientId || ""
    )}</a></td>
      <td class="priority-${p.priority ?? 0}">${priorityText}</td>
      <td>
        <button data-id="${p._id}" class="edit">Edit</button>
        <button data-id="${p._id}" class="del">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  });

  document.querySelectorAll(".edit").forEach((btn) => {
    btn.onclick = (ev) => {
      const id = ev.target.getAttribute("data-id");
      openPatientForm("edit", id);
    };
  });
  document.querySelectorAll(".del").forEach((btn) => {
    btn.onclick = async (ev) => {
      const id = ev.target.getAttribute("data-id");
      if (!confirm("Delete patient?")) return;
      try {
        await fetchJson(API.deletePatient, {
          method: "POST",
          body: JSON.stringify({ id }),
        });
        await loadPatients();
      } catch (e) {
        alert("Failed to delete: " + e.message);
      }
    };
  });
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

el("cancelPatientBtn").addEventListener("click", () => {
  hide(el("patientForm"));
});

function openPatientForm(mode, id) {
  show(el("patientForm"));
  el("patientFormTitle").innerText =
    mode === "new" ? "Add patient" : "Edit patient";

  if (mode === "new") {
    el("patientRobloxName").value = "";
    el("patientDOB").value = "";
    el("patientId").value = "";
    el("patientNilByMouth").value = "";
    el("patientComplaint").value = "";
    el("patientPriority").value = "0"; // default priority
    el("savePatientBtn").dataset.mode = "new";
    delete el("savePatientBtn").dataset.id;
  } else {
    const p = patientsCache.find((x) => x._id === id);
    if (!p) return alert("Patient not found");
    el("patientRobloxName").value = p.robloxName || "";
    el("patientDOB").value = p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "";
    el("patientId").value = p.patientId || "";
    el("patientNilByMouth").value = p.nilByMouth || "";
    el("patientComplaint").value = p.presentingComplaint || "";
    el("patientPriority").value = (p.priority ?? 0).toString();
    el("savePatientBtn").dataset.mode = "edit";
    el("savePatientBtn").dataset.id = id;
  }
}

el("savePatientBtn").addEventListener("click", async () => {
  const mode = el("savePatientBtn").dataset.mode || "new";
  const priorityValue = parseInt(el("patientPriority").value, 10) || 0;

  const payload = {
    robloxName: el("patientRobloxName").value.trim(),
    dateOfBirth: el("patientDOB").value,
    patientId: el("patientId").value.trim(),
    nilByMouth: el("patientNilByMouth").value,
    presentingComplaint: el("patientComplaint").value.trim(),
    priority: priorityValue,
  };
  try {
    if (mode === "new") {
      await fetchJson(API.createPatient, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } else {
      payload.id = el("savePatientBtn").dataset.id;
      await fetchJson(API.updatePatient, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    hide(el("patientForm"));
    await loadPatients();
  } catch (e) {
    alert("Failed to save patient: " + e.message);
  }
});

el("searchPatient").addEventListener("input", (ev) => {
  const q = ev.target.value.trim().toLowerCase();
  if (!q) return renderPatients(patientsCache);
  const filtered = patientsCache.filter(
    (p) =>
      (p.robloxName || "").toLowerCase().includes(q) ||
      (p.patientId || "").toLowerCase().includes(q) ||
      (p.presentingComplaint || "").toLowerCase().includes(q)
  );
  renderPatients(filtered);
});

/* ---------- Init ---------- */
async function onLogin() {
  try {
    renderLoggedIn();
    await loadHospital();
    await loadPatients();
  } catch (e) {
    console.error(e);
    alert("Initialization error: " + e.message);
  }
}

(function init() {
  const token = getAuthToken();
  if (token) {
    onLogin();
  } else {
    renderLoggedOut();
  }
})();

/* ---------- NEW: API helper to get individual patient by ID (for patient.html) ---------- */
window.api = {
  getPatientById: async function (id) {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token");
    const url = `${API.getPatientById}?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to get patient");
    return res.json();
  },

  addPatientRecord: async function (patientId, record) {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token");
    const res = await fetch(API.addPatientRecord, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ patientId, record }),
    });
    if (!res.ok) throw new Error("Failed to add patient record");
    return res.json();
  },
};
