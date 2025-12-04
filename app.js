async function initDashboard() {
  try {
    const [pagesRes, docsRes] = await Promise.all([
      fetch("pages.json"),
      fetch("documents.json")
    ]);

    const pages = await pagesRes.json();
    const documents = await docsRes.json();

    window._pages = pages;
    window._documents = documents;

    renderSummary(pages, documents);
    setupPagesSection(pages);
    setupDocsSection(documents);
  } catch (error) {
    console.error("Error loading data", error);
    showError("There was a problem loading the dashboard data.");
  }
}

function showError(message) {
  const header = document.querySelector(".site-header");
  const div = document.createElement("div");
  div.textContent = message;
  div.style.background = "#fdecea";
  div.style.color = "#611a15";
  div.style.padding = "0.75rem 1rem";
  div.style.marginTop = "0.5rem";
  div.style.borderRadius = "6px";
  header.appendChild(div);
}

// ---------- SUMMARY CARDS ----------
function renderSummary(pages, documents) {
  const totalPages = pages.length;
  const pagesWithIssues = pages.filter(p => p.issuesCount > 0).length;
  const avgAccessibility =
    totalPages === 0
      ? 0
      : Math.round(
          pages.reduce((sum, p) => sum + p.accessibilityScore, 0) / totalPages
        );

  const totalDocs = documents.length;
  const sensitiveDocs = documents.filter(
    d => d.sensitivity === "Internal" || d.sensitivity === "Restricted"
  ).length;

  document.getElementById("total-pages").textContent = totalPages;
  document.getElementById("pages-with-issues").textContent = pagesWithIssues;
  document.getElementById("avg-accessibility").textContent =
    avgAccessibility + " / 100";
  document.getElementById("total-docs").textContent = totalDocs;
  document.getElementById("sensitive-docs").textContent = sensitiveDocs;
}

// ---------- PAGES ----------
function setupPagesSection(pages) {
  const searchInput = document.getElementById("pageSearch");
  const statusFilter = document.getElementById("statusFilter");
  const accessibilityFilter = document.getElementById("accessibilityFilter");
  const tbody = document.querySelector("#pagesTable tbody");

  function applyFilters() {
    const q = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;
    const minA11y = accessibilityFilter.value
      ? parseInt(accessibilityFilter.value, 10)
      : null;

    const filtered = pages.filter(p => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.url.toLowerCase().includes(q);
      const matchesStatus = !status || p.status === status;
      const matchesA11y = !minA11y || p.accessibilityScore >= minA11y;
      return matchesSearch && matchesStatus && matchesA11y;
    });

    renderPagesTable(filtered, tbody);
  }

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  accessibilityFilter.addEventListener("change", applyFilters);

  renderPagesTable(pages, tbody);
}

function renderPagesTable(pages, tbody) {
  tbody.innerHTML = "";

  if (!pages.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No pages match the selected filters.";
    tbody.appendChild(row);
    row.appendChild(cell);
    return;
  }

  pages.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${p.title}</strong><br/>
        <span style="color:#5b6170;font-size:0.8rem;">${p.url}</span>
      </td>
      <td>${p.owner}</td>
      <td>${p.status}</td>
      <td>${p.lastReviewed}</td>
      <td>${p.accessibilityScore}</td>
      <td>${p.issuesCount}</td>
      <td>${renderPriorityBadge(p.priority)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderPriorityBadge(priority) {
  const label = priority || "Unknown";
  const cls =
    priority === "High"
      ? "badge badge-danger"
      : priority === "Medium"
      ? "badge badge-warning"
      : priority === "Low"
      ? "badge badge-success"
      : "badge badge-neutral";

  return `<span class="${cls}">${label}</span>`;
}

// ---------- DOCUMENTS ----------
function setupDocsSection(documents) {
  const libraryFilter = document.getElementById("libraryFilter");
  const sensitivityFilter = document.getElementById("sensitivityFilter");
  const teamsFilter = document.getElementById("teamsFilter");
  const tbody = document.querySelector("#docsTable tbody");

  // populate library dropdown
  const libraries = [...new Set(documents.map(d => d.library))].sort();
  libraries.forEach(lib => {
    const opt = document.createElement("option");
    opt.value = lib;
    opt.textContent = lib;
    libraryFilter.appendChild(opt);
  });

  function applyFilters() {
    const lib = libraryFilter.value;
    const sens = sensitivityFilter.value;
    const teamsVal = teamsFilter.value;

    const filtered = documents.filter(d => {
      const matchesLib = !lib || d.library === lib;
      const matchesSens = !sens || d.sensitivity === sens;
      const matchesTeams =
        !teamsVal || String(d.syncedToTeams) === teamsVal;
      return matchesLib && matchesSens && matchesTeams;
    });

    renderDocsTable(filtered, tbody);
  }

  libraryFilter.addEventListener("change", applyFilters);
  sensitivityFilter.addEventListener("change", applyFilters);
  teamsFilter.addEventListener("change", applyFilters);

  renderDocsTable(documents, tbody);
}

function renderDocsTable(documents, tbody) {
  tbody.innerHTML = "";

  if (!documents.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No documents match the selected filters.";
    tbody.appendChild(row);
    row.appendChild(cell);
    return;
  }

  documents.forEach(d => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${d.name}</td>
      <td>${d.library}</td>
      <td>${d.owner}</td>
      <td>${d.lastModified}</td>
      <td>${d.sensitivity}</td>
      <td>${d.retentionLabel}</td>
      <td>${d.syncedToTeams ? "Yes" : "No"}</td>
    `;

    tbody.appendChild(row);
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", initDashboard);
