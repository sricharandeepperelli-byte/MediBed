const STORAGE_KEY = "medibed_demo_beds_v1";

const initialBeds = [
  { id: 1, number: "ER-101", hospital: "City Care Hospital", department: "Emergency", status: "Available", updated: "Just now" },
  { id: 2, number: "ICU-102", hospital: "City Care Hospital", department: "ICU", status: "Occupied", updated: "12 min ago" },
  { id: 3, number: "GW-103", hospital: "City Care Hospital", department: "General Ward", status: "Available", updated: "18 min ago" },
  { id: 4, number: "ICU-104", hospital: "Green Valley Medical Center", department: "ICU", status: "Occupied", updated: "25 min ago" },
  { id: 5, number: "MAT-105", hospital: "Green Valley Medical Center", department: "Maternity", status: "Available", updated: "32 min ago" },
  { id: 6, number: "PED-106", hospital: "Sunrise Multispecialty", department: "Pediatrics", status: "Maintenance", updated: "40 min ago" },
  { id: 7, number: "ER-107", hospital: "Sunrise Multispecialty", department: "Emergency", status: "Available", updated: "1 hr ago" },
  { id: 8, number: "GW-108", hospital: "City Care Hospital", department: "General Ward", status: "Occupied", updated: "1 hr ago" },
  { id: 9, number: "CAR-109", hospital: "Green Valley Medical Center", department: "Cardiology", status: "Available", updated: "1 hr ago" },
  { id: 10, number: "ORT-110", hospital: "Sunrise Multispecialty", department: "Orthopedics", status: "Occupied", updated: "2 hrs ago" },
  { id: 11, number: "ICU-111", hospital: "City Care Hospital", department: "ICU", status: "Available", updated: "2 hrs ago" },
  { id: 12, number: "MAT-112", hospital: "Green Valley Medical Center", department: "Maternity", status: "Maintenance", updated: "3 hrs ago" }
];

let beds = loadBeds();
let toastTimer;

const $ = (id) => document.getElementById(id);
const els = {
  total: $("totalBeds"), available: $("availableBeds"), occupied: $("occupiedBeds"),
  maintenance: $("maintenanceBeds"), availablePercent: $("availablePercent"),
  occupiedPercent: $("occupiedPercent"), donutTotal: $("donutTotal"),
  legendAvailable: $("legendAvailable"), legendOccupied: $("legendOccupied"),
  legendMaintenance: $("legendMaintenance"), donut: $("donutChart"),
  table: $("bedTableBody"), empty: $("emptyState"), count: $("resultCount"),
  search: $("searchInput"), hospitalFilter: $("hospitalFilter"),
  departmentFilter: $("departmentFilter"), statusFilter: $("statusFilter"),
  hospitalSummary: $("hospitalSummary"), modal: $("bedModal"), form: $("bedForm"),
  modalTitle: $("modalTitle"), editId: $("editBedId"), number: $("bedNumber"),
  hospital: $("hospitalName"), department: $("bedDepartment"), status: $("bedStatus"),
  toast: $("toast"), navBedCount: $("navBedCount")
};

function loadBeds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialBeds.map(b => ({ ...b }));
  } catch (error) {
    return initialBeds.map(b => ({ ...b }));
  }
}

function saveBeds() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(beds)); }
  catch (error) { console.warn("Browser storage is unavailable; changes will last for this session.", error); }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function getCounts(list = beds) {
  return {
    total: list.length,
    available: list.filter(b => b.status === "Available").length,
    occupied: list.filter(b => b.status === "Occupied").length,
    maintenance: list.filter(b => b.status === "Maintenance").length
  };
}

function renderStats() {
  const c = getCounts();
  const availablePct = c.total ? Math.round(c.available / c.total * 100) : 0;
  const occupiedPct = c.total ? Math.round(c.occupied / c.total * 100) : 0;
  els.total.textContent = c.total;
  els.available.textContent = c.available;
  els.occupied.textContent = c.occupied;
  els.maintenance.textContent = c.maintenance;
  els.availablePercent.textContent = `${availablePct}%`;
  els.occupiedPercent.textContent = `${occupiedPct}%`;
  els.donutTotal.textContent = c.total;
  els.legendAvailable.textContent = c.available;
  els.legendOccupied.textContent = c.occupied;
  els.legendMaintenance.textContent = c.maintenance;
  els.navBedCount.textContent = c.total;
  const availableDeg = c.total ? c.available / c.total * 360 : 0;
  const occupiedDeg = c.total ? c.occupied / c.total * 360 : 0;
  const maintenanceDeg = c.total ? c.maintenance / c.total * 360 : 0;
  els.donut.style.background = `conic-gradient(#28b98a 0deg ${availableDeg}deg, #f0a34a ${availableDeg}deg ${availableDeg + occupiedDeg}deg, #5198ed ${availableDeg + occupiedDeg}deg ${availableDeg + occupiedDeg + maintenanceDeg}deg, #eef1f6 ${availableDeg + occupiedDeg + maintenanceDeg}deg 360deg)`;
}

function renderHospitalSummary() {
  const names = [...new Set(beds.map(b => b.hospital))];
  if (!names.length) {
    els.hospitalSummary.innerHTML = '<p class="muted">No hospitals added yet.</p>';
    return;
  }
  els.hospitalSummary.innerHTML = names.slice(0, 4).map((name, index) => {
    const items = beds.filter(b => b.hospital === name);
    const available = items.filter(b => b.status === "Available").length;
    const percent = items.length ? Math.round(available / items.length * 100) : 0;
    const icons = ["✚", "✚", "✚", "✚"];
    return `<div class="hospital-row">
      <div class="hospital-icon">${icons[index % icons.length]}</div>
      <div class="hospital-info"><strong>${escapeHTML(name)}</strong><small>${items.length} beds · ${available} available</small><div class="mini-progress"><span style="width:${percent}%"></span></div></div>
      <div class="hospital-metric">${percent}%<small>available</small></div>
    </div>`;
  }).join("");
}

function updateFilterOptions() {
  const oldHospital = els.hospitalFilter.value;
  const oldDepartment = els.departmentFilter.value;
  const hospitals = [...new Set(beds.map(b => b.hospital))].sort();
  const departments = [...new Set(beds.map(b => b.department))].sort();
  els.hospitalFilter.innerHTML = '<option value="">All hospitals</option>' + hospitals.map(h => `<option value="${escapeHTML(h)}">${escapeHTML(h)}</option>`).join("");
  els.departmentFilter.innerHTML = '<option value="">All departments</option>' + departments.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join("");
  els.hospitalFilter.value = hospitals.includes(oldHospital) ? oldHospital : "";
  els.departmentFilter.value = departments.includes(oldDepartment) ? oldDepartment : "";
}

function getFilteredBeds() {
  const q = els.search.value.trim().toLowerCase();
  const hospital = els.hospitalFilter.value;
  const department = els.departmentFilter.value;
  const status = els.statusFilter.value;
  return beds.filter(b => {
    const matchesQuery = !q || [b.number, b.hospital, b.department, b.status].some(v => v.toLowerCase().includes(q));
    return matchesQuery && (!hospital || b.hospital === hospital) &&
      (!department || b.department === department) && (!status || b.status === status);
  });
}

function statusClass(status) {
  return status.toLowerCase();
}

function renderTable() {
  const filtered = getFilteredBeds();
  els.table.innerHTML = filtered.map(b => `
    <tr>
      <td><div class="bed-cell"><span class="bed-symbol">▤</span><span><strong>${escapeHTML(b.number)}</strong><small>Bed ID: MB-${String(b.id).padStart(3, "0")}</small></span></div></td>
      <td>${escapeHTML(b.hospital)}</td>
      <td>${escapeHTML(b.department)}</td>
      <td><span class="status ${statusClass(b.status)}">${escapeHTML(b.status)}</span></td>
      <td>${escapeHTML(b.updated)}</td>
      <td><div class="row-actions"><button class="action-btn" data-action="edit" data-id="${b.id}" title="Edit bed" aria-label="Edit ${escapeHTML(b.number)}">✎</button><button class="action-btn" data-action="status" data-id="${b.id}" title="Change status" aria-label="Change status for ${escapeHTML(b.number)}">↻</button><button class="action-btn" data-action="delete" data-id="${b.id}" title="Delete bed" aria-label="Delete ${escapeHTML(b.number)}">×</button></div></td>
    </tr>`).join("");
  els.empty.classList.toggle("hidden", filtered.length !== 0);
  els.table.closest("table").classList.toggle("hidden", filtered.length === 0);
  els.count.textContent = `Showing ${filtered.length} of ${beds.length} beds`;
}

function renderAll() {
  updateFilterOptions();
  renderStats();
  renderHospitalSummary();
  renderTable();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function openModal(bed = null) {
  els.form.reset();
  els.editId.value = bed ? bed.id : "";
  els.modalTitle.textContent = bed ? "Edit bed details" : "Add a bed";
  if (bed) {
    els.number.value = bed.number;
    els.hospital.value = bed.hospital;
    els.department.value = bed.department;
    els.status.value = bed.status;
  } else {
    els.status.value = "Available";
  }
  els.modal.classList.remove("hidden");
  setTimeout(() => els.number.focus(), 40);
}

function closeModal() {
  els.modal.classList.add("hidden");
}

function formatUpdated() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function handleFormSubmit(event) {
  event.preventDefault();
  const id = Number(els.editId.value);
  const number = els.number.value.trim().toUpperCase();
  const hospital = els.hospital.value.trim();
  const department = els.department.value;
  const status = els.status.value;

  if (!number || !hospital || !department || !status) {
    showToast("Please complete all fields.");
    return;
  }
  const duplicate = beds.some(b => b.number.toLowerCase() === number.toLowerCase() && b.hospital.toLowerCase() === hospital.toLowerCase() && b.id !== id);
  if (duplicate) {
    showToast("That bed number already exists in this hospital.");
    els.number.focus();
    return;
  }

  if (id) {
    beds = beds.map(b => b.id === id ? { ...b, number, hospital, department, status, updated: `Today, ${formatUpdated()}` } : b);
    showToast("Bed details updated successfully.");
  } else {
    const nextId = beds.reduce((max, b) => Math.max(max, b.id), 0) + 1;
    beds.unshift({ id: nextId, number, hospital, department, status, updated: `Today, ${formatUpdated()}` });
    showToast("New bed added successfully.");
  }
  saveBeds();
  closeModal();
  renderAll();
}

function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const bed = beds.find(b => b.id === id);
  if (!bed) return;

  if (button.dataset.action === "edit") {
    openModal(bed);
  } else if (button.dataset.action === "status") {
    const statuses = ["Available", "Occupied", "Maintenance"];
    const next = statuses[(statuses.indexOf(bed.status) + 1) % statuses.length];
    beds = beds.map(b => b.id === id ? { ...b, status: next, updated: `Today, ${formatUpdated()}` } : b);
    saveBeds();
    renderAll();
    showToast(`${bed.number} is now ${next.toLowerCase()}.`);
  } else if (button.dataset.action === "delete") {
    if (confirm(`Delete bed ${bed.number} from ${bed.hospital}?`)) {
      beds = beds.filter(b => b.id !== id);
      saveBeds();
      renderAll();
      showToast("Bed record deleted.");
    }
  }
}

function resetDemo() {
  if (!confirm("Reset all changes and restore the original sample beds?")) return;
  beds = initialBeds.map(b => ({ ...b }));
  saveBeds();
  els.search.value = "";
  els.hospitalFilter.value = "";
  els.departmentFilter.value = "";
  els.statusFilter.value = "";
  renderAll();
  showToast("Sample data restored.");
}

$("addBedTop").addEventListener("click", () => openModal());
$("addBedButton").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
els.modal.addEventListener("click", event => { if (event.target === els.modal) closeModal(); });
els.form.addEventListener("submit", handleFormSubmit);
els.table.addEventListener("click", handleTableAction);
[els.search, els.hospitalFilter, els.departmentFilter, els.statusFilter].forEach(el => {
  el.addEventListener(el === els.search ? "input" : "change", renderTable);
});
$("refreshBtn").addEventListener("click", resetDemo);
$("viewAllHospitals").addEventListener("click", () => {
  els.hospitalFilter.value = "";
  els.departmentFilter.value = "";
  els.statusFilter.value = "";
  els.search.value = "";
  renderTable();
  $("beds").scrollIntoView({ behavior: "smooth" });
});
$("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
  link.classList.add("active");
  $("sidebar").classList.remove("open");
}));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

renderAll();
