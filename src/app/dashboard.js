// SIGO2M Dashboard — Ordem dos Médicos de Angola
// Frontend-only reactive state with Chart.js

// ===== Estado inicial vazio =====
const doctors = [];

// Chart refs
let revenueChartRef, quotaDonutRef, revenueCompareRef, delinquencyChartRef;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // Auth check
  const userJson = localStorage.getItem("user");
  if (!userJson) { window.location.href = "index.html"; return; }
  const user = JSON.parse(userJson);

  // Set user info
  const name = user.username || "Administrador";
  const initials = name.substring(0, 2).toUpperCase();
  setText("usernameDisplay", name);
  setText("avatarDisplay", initials);
  setText("topAvatar", initials);
  setText("welcomeName", name);

  // Set date
  const now = new Date();
  const weekdays = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  setText("welcomeDate", `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()} · As informações aparecerão aqui conforme o sistema for usado.`);
  setText("todayDay", String(now.getDate()).padStart(2, "0"));
  setText("todayMonth", months[now.getMonth()].substring(0, 3).toUpperCase() + ". " + now.getFullYear());

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });

  // Sidebar navigation
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      const sectionId = item.dataset.section;
      // Activate nav item
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      // Show/hide sections
      const allSections = ["sec-dashboard","sec-payments","sec-issuance","sec-reports","sec-notifications"];
      allSections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = s === sectionId ? "block" : "none";
      });
      // Update top bar
      const titleMap = { "sec-dashboard":"Dashboard", "sec-payments":"Pagamentos", "sec-issuance":"Emissão de Carteiras", "sec-reports":"Relatórios", "sec-notifications":"Notificações" };
      const breadMap = { "sec-dashboard":"Início / Painel Principal", "sec-payments":"Início / Pagamentos", "sec-issuance":"Início / Emissão", "sec-reports":"Início / Relatórios", "sec-notifications":"Início / Notificações" };
      document.querySelector(".top-bar-left h2").textContent = titleMap[sectionId] || "Dashboard";
      document.querySelector(".top-bar-left .breadcrumb").textContent = breadMap[sectionId] || "";
      // Scroll to top
      document.querySelector(".content-scroll").scrollTop = 0;
      // Resize charts after tab switch
      setTimeout(() => { resizeAllCharts(); }, 150);
    });
  });

  // Build UI
  refreshAll();
  initCharts();
});

// ===== Helpers =====
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3500);
}

window.scrollToSection = function(sectionId) {
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) navItem.click();
};

// ===== Refresh All =====
function refreshAll() {
  updateMetrics();
  renderPaymentsTable();
  renderPipeline();
  updatePendingBadge();
}

// ===== Metrics =====
function updateMetrics() {
  const paid = doctors.filter(d => d.status === "paid").length;
  const pending = doctors.filter(d => d.status === "pending").length;
  const activeCount = doctors.length;
  const paidCount = paid;
  const overdueCount = pending;
  const revenueAOA = "0";
  const paidPercent = 0;

  setText("stat-active", activeCount.toLocaleString("pt-AO"));
  setText("stat-paid", paidCount.toLocaleString("pt-AO"));
  setText("stat-overdue", overdueCount.toString());
  setText("stat-revenue", `AOA ${revenueAOA}`);
  setText("stat-active-trend", "Sem dados ainda");
  setText("stat-paid-trend", "Aguardando uso do sistema");
  setText("stat-overdue-trend", "Sem movimentações");
  setText("stat-revenue-trend", "Os valores aparecerão aqui");

  setText("quotaPercent", `${paidPercent}%`);
  setText("quotaPaidCount", paidCount.toLocaleString("pt-AO"));
  setText("quotaOverdueCount", overdueCount.toString());
  const barPaid = document.getElementById("quotaBarPaid");
  const barOverdue = document.getElementById("quotaBarOverdue");
  if (barPaid) barPaid.style.width = "0%";
  if (barOverdue) barOverdue.style.width = "100%";
}

function updatePendingBadge() {
  const count = doctors.filter(d => d.status === "pending").length;
  const badge = document.getElementById("pendingBadge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline" : "none";
  }
}

// ===== Payments Table =====
function renderPaymentsTable() {
  const tbody = document.getElementById("pendingPaymentsTableBody");
  if (!tbody) return;
  const pending = doctors.filter(d => d.status === "pending");
  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Nenhuma informação disponível ainda. Os pagamentos aparecerão aqui após o uso do sistema.</td></tr>`;
    return;
  }
  tbody.innerHTML = pending.map(doc => `
    <tr>
      <td style="font-weight:600;">${doc.name}</td>
      <td style="color:var(--text-secondary);">${doc.cedula}</td>
      <td style="color:var(--red); font-weight:600;">AOA ${doc.dueValue.toLocaleString("pt-AO")}</td>
      <td>${doc.delayDays} dias</td>
      <td><span class="badge badge-warning">Pendente</span></td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-success" onclick="markAsPaid(${doc.id})">✓ Pago</button>
          <button class="btn btn-outline" onclick="generateInvoice('${doc.cedula}')">2ª Via</button>
          <button class="btn btn-danger-outline" onclick="sendReminder('${doc.name}')">Lembrete</button>
          <button class="btn btn-outline" onclick="viewHistory(${doc.id})">Histórico</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ===== Actions =====
window.markAsPaid = function(id) {
  const doc = doctors.find(d => d.id === id);
  if (!doc) return;
  doc.status = "paid";
  doc.dueValue = 0;
  doc.delayDays = 0;
  doc.issuanceStatus = "paid";
  doc.history.push({ date: new Date().toISOString().split("T")[0], method: "Multicaixa Express", value: 120000, receipt: `REC-2026-${Math.floor(100 + Math.random() * 900)}` });
  refreshAll();
  updateQuotaDonut();
  updateDelinquencyChart();
  showToast(`Pagamento de ${doc.name} confirmado com sucesso!`);
};

window.generateInvoice = function(cedula) { showToast(`2ª via da fatura gerada para ${cedula}.`); };
window.sendReminder = function(name) { showToast(`Lembrete enviado para ${name} via E-mail & SMS.`); };

window.viewHistory = function(id) {
  const doc = doctors.find(d => d.id === id);
  if (!doc) return;
  const modal = document.getElementById("historyModal");
  setText("modalTitle", `Histórico — ${doc.name}`);
  const body = document.getElementById("modalHistoryContent");
  if (doc.history.length === 0) {
    body.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Nenhum pagamento registrado.</p>`;
  } else {
    body.innerHTML = `<table class="data-table"><thead><tr><th>Data</th><th>Método</th><th>Valor</th><th>Recibo</th></tr></thead><tbody>${doc.history.map(h => `<tr><td>${h.date}</td><td>${h.method}</td><td style="color:var(--green); font-weight:600;">AOA ${h.value.toLocaleString("pt-AO")}</td><td><code>${h.receipt}</code></td></tr>`).join("")}</tbody></table>`;
  }
  modal.style.display = "flex";
};

window.closeHistoryModal = function() { document.getElementById("historyModal").style.display = "none"; };

// ===== Pipeline =====
function renderPipeline() {
  const container = document.getElementById("issuancePipelineContainer");
  if (!container) return;
  if (doctors.length === 0) {
    container.innerHTML = `<div style="padding:28px; text-align:center; color:var(--text-muted); border:1px dashed var(--border); border-radius:10px;">Ainda não há carteiras para exibir. As informações aparecerão aqui conforme a utilização do app.</div>`;
    return;
  }
  const stages = ["none","paid","approved","production","delivered"];
  const stageLabels = ["Pagamento","Pago","Aprovado","Produção","Entregue"];

  container.innerHTML = doctors.map(doc => {
    const isPaid = doc.status === "paid";
    const currentIdx = stages.indexOf(doc.issuanceStatus);
    let statusBadge = "";
    if (!isPaid) statusBadge = `<span class="badge badge-warning">Aguardando Pagamento</span>`;
    else if (doc.issuanceStatus === "paid") statusBadge = `<span class="badge badge-success">Pago</span>`;
    else if (doc.issuanceStatus === "approved") statusBadge = `<span class="badge badge-info">Aprovado</span>`;
    else if (doc.issuanceStatus === "production") statusBadge = `<span class="badge badge-info">Em Produção</span>`;
    else if (doc.issuanceStatus === "delivered") statusBadge = `<span class="badge badge-purple">Entregue</span>`;

    const stepsHtml = stageLabels.map((label, i) => {
      let cls = "";
      if (i < currentIdx) cls = "completed";
      else if (i === currentIdx && isPaid) cls = "active";
      return `<div class="pipeline-step ${cls}"><div class="step-dot">${i < currentIdx ? "✓" : i + 1}</div><div class="step-text">${label}</div></div>`;
    }).join("");

    let actionBtn = "";
    if (!isPaid) actionBtn = `<button class="btn btn-primary" onclick="markAsPaid(${doc.id})">Confirmar Pagamento</button>`;
    else if (doc.issuanceStatus === "paid") actionBtn = `<button class="btn btn-outline" style="border-color:var(--blue);color:var(--blue);" onclick="advanceIssuance(${doc.id},'approved')">Aprovar</button>`;
    else if (doc.issuanceStatus === "approved") actionBtn = `<button class="btn btn-outline" style="border-color:var(--blue);color:var(--blue);" onclick="advanceIssuance(${doc.id},'production')">Enviar p/ Produção</button>`;
    else if (doc.issuanceStatus === "production") actionBtn = `<button class="btn btn-outline" style="border-color:var(--purple);color:var(--purple);" onclick="advanceIssuance(${doc.id},'delivered')">Marcar Entregue</button>`;
    else actionBtn = `<span style="color:var(--green); font-weight:600; font-size:0.85rem;">✓ Carteira entregue</span>`;

    return `<div class="pipeline-card"><div class="pipeline-header"><div><strong style="font-size:0.95rem;">${doc.name}</strong> <span style="color:var(--text-muted); margin-left:8px;">${doc.cedula}</span></div>${statusBadge}</div><div class="pipeline-steps">${stepsHtml}</div><div style="display:flex; justify-content:flex-end; margin-top:8px;">${actionBtn}</div></div>`;
  }).join("");
}

window.advanceIssuance = function(id, next) {
  const doc = doctors.find(d => d.id === id);
  if (!doc) return;
  doc.issuanceStatus = next;
  renderPipeline();
  refreshAll();
  showToast(`${doc.name}: status avançado para "${next}".`);
};

// ===== Export =====
window.exportData = function(format) {
  showToast(`A compilar relatório...`);
  setTimeout(() => showToast(`Relatório ${format} exportado com sucesso!`), 1200);
};

// ===== Notification Settings =====
window.saveNotificationSettings = function(e) {
  e.preventDefault();
  const d1 = document.getElementById("expiryReminderDays").value;
  const d2 = document.getElementById("delayNoticeInterval").value;
  showToast(`Configurações salvas! Lembrete: ${d1}d, Atraso: ${d2}d.`);
};

// ===== Charts =====
function initCharts() {
  // Color config for Chart.js
  Chart.defaults.color = "#64748b";
  Chart.defaults.borderColor = "rgba(226,232,240,0.5)";

  // Revenue bar chart (main dashboard)
  const ctxRev = document.getElementById("revenueChart")?.getContext("2d");
  if (ctxRev) {
    revenueChartRef = new Chart(ctxRev, {
      type: "bar",
      data: {
        labels: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        datasets: [
          { label: "Receitas", data: [0,0,0,0,0,0,0,0,0,0,0,0], backgroundColor: "rgba(59,130,246,0.7)", borderRadius: 4 },
          { label: "Pagamentos", data: [0,0,0,0,0,0,0,0,0,0,0,0], backgroundColor: "rgba(16,185,129,0.5)", borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { callback: v => (v / 1e6) + "M" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Quota donut
  const ctxDonut = document.getElementById("quotaDonutChart")?.getContext("2d");
  if (ctxDonut) {
    quotaDonutRef = new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Em dia", "Em atraso"],
        datasets: [{ data: [0, 0], backgroundColor: ["#10b981", "#f59e0b"], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "75%",
        plugins: { legend: { display: false } }
      }
    });
  }

  // Revenue comparison (reports tab)
  const ctxComp = document.getElementById("revenueCompareChart")?.getContext("2d");
  if (ctxComp) {
    revenueCompareRef = new Chart(ctxComp, {
      type: "line",
      data: {
        labels: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        datasets: [
          { label: "2025", data: [0,0,0,0,0,0,0,0,0,0,0,0], borderColor: "#94a3b8", backgroundColor: "rgba(148,163,184,0.08)", tension: 0.3, fill: true },
          { label: "2026", data: [0,0,0,0,0,0,0,0,0,0,0,0], borderColor: "#f5c518", backgroundColor: "rgba(245,197,24,0.08)", tension: 0.3, fill: true },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { callback: v => (v / 1e6) + "M" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Delinquency (reports tab)
  const ctxDel = document.getElementById("delinquencyChart")?.getContext("2d");
  if (ctxDel) {
    delinquencyChartRef = new Chart(ctxDel, {
      type: "doughnut",
      data: {
        labels: ["Luanda","Benguela","Huambo","Cabinda"],
        datasets: [{ data: getDelinquencyData(), backgroundColor: ["#f87171","#facc15","#60a5fa","#34d399"], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "right", labels: { usePointStyle: true, padding: 14 } } }
      }
    });
  }
}

function getDelinquencyData() {
  return [
    doctors.filter(d => d.region === "Luanda" && d.status === "pending").length,
    doctors.filter(d => d.region === "Benguela" && d.status === "pending").length,
    doctors.filter(d => d.region === "Huambo" && d.status === "pending").length,
    doctors.filter(d => d.region === "Cabinda" && d.status === "pending").length,
  ];
}

function updateQuotaDonut() {
  if (!quotaDonutRef) return;
  const paid = doctors.filter(d => d.status === "paid").length;
  const pending = doctors.filter(d => d.status === "pending").length;
  const total = paid + pending;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  quotaDonutRef.data.datasets[0].data = [pct, 100 - pct];
  quotaDonutRef.update();
}

function updateDelinquencyChart() {
  if (!delinquencyChartRef) return;
  delinquencyChartRef.data.datasets[0].data = getDelinquencyData();
  delinquencyChartRef.update();
}

function resizeAllCharts() {
  [revenueChartRef, quotaDonutRef, revenueCompareRef, delinquencyChartRef].forEach(c => { if (c) c.resize(); });
}
