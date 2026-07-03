let data = window.CN8_DATA;
const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const drawer = document.getElementById("detailDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerTitle = document.getElementById("drawerTitle");
const drawerEyebrow = document.getElementById("drawerEyebrow");
const drawerBody = document.getElementById("drawerBody");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");
let currentView = "overview";

const viewTitles = {
  overview: "Tổng quan điều hành",
  progress: "Tiến độ thi công",
  actions: "Cam kết và đầu việc",
  monitoring: "Quan trắc công trình",
  lookahead: "Kế hoạch 3 tuần tiếp theo"
};

function statusPill(status) {
  const map = {
    overdue: ["Quá hạn", "pill-red"],
    due: ["Đến hạn", "pill-amber"],
    upcoming: ["Sắp đến hạn", "pill-blue"],
    completed: ["Hoàn thành", "pill-green"],
    highest: ["Cao nhất", "pill-red"],
    review: ["Cần theo dõi", "pill-amber"],
    normal: ["Ghi nhận", "pill-green"]
  };
  const [label, klass] = map[status] || [status, "pill-gray"];
  return `<span class="status-pill ${klass}">${label}</span>`;
}

function kpiCard(label, value, unit, status, foot, trendClass = "") {
  return `
    <article class="kpi">
      <div class="kpi-head"><span>${label}</span>${status || ""}</div>
      <div class="kpi-value">${value}<span class="kpi-unit">${unit || ""}</span></div>
      <div class="kpi-foot"><span>${foot}</span><span class="${trendClass}"></span></div>
    </article>`;
}

function pageIntro(title, description, controls = "") {
  return `
    <div class="page-intro">
      <div><h2>${title}</h2><p>${description}</p></div>
      ${controls ? `<div class="filter-row">${controls}</div>` : ""}
    </div>`;
}

function panel(title, subtitle, body, action = "") {
  return `
    <section class="panel">
      <div class="panel-head">
        <div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ""}</div>
        ${action}
      </div>
      <div class="panel-body">${body}</div>
    </section>`;
}

function zoneRows() {
  return data.zones.map(z => `
    <div class="zone-row">
      <div class="zone-name">${z.zone}</div>
      <div class="progress-stack">
        <div class="zone-caption"><span>Đào đất</span><span>${z.excavation}% / ${z.targetExcavation}%</span></div>
        <div class="progress-line"><span style="width:${z.excavation}%"></span></div>
        <div class="zone-caption"><span>Shoring</span><span>${z.shoring}% / ${z.targetShoring}%</span></div>
        <div class="progress-line shoring"><span style="width:${z.shoring}%"></span></div>
      </div>
      <div class="zone-value">${z.status === "critical" ? statusPill("overdue") : statusPill("due")}</div>
    </div>
  `).join("");
}

function actionRows(actions, limit) {
  const rows = typeof limit === "number" ? actions.slice(0, limit) : actions;
  return rows.map(a => `
    <tr class="click-row" data-action-id="${a.id}">
      <td><div class="cell-title">${a.title}</div><div class="cell-sub">${a.discipline} · ${a.source}</div></td>
      <td>${a.owner}</td><td>${a.due}</td><td>${statusPill(a.status)}</td>
    </tr>`).join("");
}

function actionTable(actions, limit) {
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Đầu việc</th><th>Chịu trách nhiệm</th><th>Hạn</th><th>Trạng thái</th></tr></thead>
    <tbody>${actionRows(actions, limit)}</tbody>
  </table></div>`;
}

function documentRows(documents) {
  return documents.map((d, index) => `
    <div class="doc-item click-row" data-document-index="${index}">
      <span class="file-type">${d.type}</span>
      <div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.owner}</div></div>
      <span class="doc-meta">${d.date}</span>
      <span class="status-pill pill-gray">${d.status}</span>
    </div>`).join("");
}

function monitoringCards(items) {
  return items.map((m, index) => `
    <article class="monitor-card ${m.status}" data-monitor-index="${index}">
      <div class="monitor-head"><span class="monitor-point">${m.point}</span>${statusPill(m.status)}</div>
      <div class="monitor-value">${m.value}<span> mm</span></div>
      <div class="cell-sub">${m.cycle} · ${m.date}</div>
      <canvas class="sparkline" data-values="${m.trend.join(",")}" aria-label="Xu hướng ${m.point}"></canvas>
    </article>`).join("");
}

function riskPill(risk) {
  const map = {
    critical: ["Rất cao", "pill-red"],
    high: ["Cao", "pill-red"],
    watch: ["Theo dõi", "pill-amber"],
    milestone: ["Mốc bắt buộc", "pill-blue"],
    normal: ["Theo kế hoạch", "pill-green"]
  };
  const [label, klass] = map[risk] || [risk, "pill-gray"];
  return `<span class="status-pill ${klass}">${label}</span>`;
}

function lookaheadWeekCards() {
  return data.lookahead.weeks.map((week, index) => `
    <article class="week-card ${index === 0 ? "active" : ""}" data-week-id="${week.id}">
      <div class="week-card-top">
        <div><span class="week-index">0${index + 1}</span><strong>${week.label}</strong></div>
        <span>${week.range}</span>
      </div>
      <p>${week.objective}</p>
      <div class="week-count">${week.tasks.length} nhóm công việc chính</div>
    </article>`).join("");
}

function lookaheadTaskTable(week) {
  return `<div class="table-wrap"><table class="data-table lookahead-table">
    <thead><tr><th>Khu vực</th><th>Công việc chính</th><th>Bắt đầu</th><th>Kết thúc</th><th>Target quản lý</th><th>Rủi ro</th></tr></thead>
    <tbody>${week.tasks.map(task => `
      <tr>
        <td><strong>${task.zone}</strong></td>
        <td><div class="cell-title">${task.task}</div></td>
        <td>${task.start}</td><td>${task.finish}</td>
        <td>${task.target}</td><td>${riskPill(task.risk)}</td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function milestoneTimeline() {
  return `<div class="milestone-list">${data.lookahead.milestones.map(m => `
    <div class="milestone-item">
      <div class="milestone-date">${m.date}</div>
      <div class="milestone-dot"></div>
      <div><strong>${m.name}</strong><span>${m.zone}</span></div>
    </div>`).join("")}</div>`;
}

function overviewView() {
  const urgent = data.actions.filter(a => ["overdue", "due"].includes(a.status));
  return `
    ${pageIntro("Trạng thái dự án", "Thông tin tổng hợp phục vụ quyết định, có thể truy vết về báo cáo và biên bản nguồn.")}
    <div class="kpi-grid">
      ${kpiCard("Tiến độ thực tế", data.headline.actual, "%", statusPill("review"), `Kế hoạch ${data.headline.plan}%`)}
      ${kpiCard("Chậm tiến độ", data.headline.delayDays, "ngày", statusPill("overdue"), "Theo WR-15 ngày 02/07")}
      ${kpiCard("Nhân lực", data.headline.manpower, "người", statusPill("normal"), `Báo cáo ngày ${data.meta.latestDaily}`)}
      ${kpiCard("Xe vận chuyển đất", data.headline.trucks, "xe", statusPill("overdue"), "Yêu cầu tối thiểu 6 xe")}
      ${kpiCard("Đầu việc khẩn", urgent.length, "việc", statusPill("due"), `${data.headline.openActions} việc đang mở`)}
    </div>
    <div class="grid grid-main">
      ${panel(
        "Đường cong tiến độ",
        "Lũy kế kế hoạch và thực tế theo tuần",
        `<div class="chart-wrap"><canvas id="progressChart" aria-label="Biểu đồ tiến độ"></canvas></div>`,
        `<div class="legend"><span><i></i>Kế hoạch</span><span class="actual"><i></i>Thực tế</span></div>`
      )}
      ${panel(
        "Vấn đề cần chỉ đạo",
        "Ưu tiên theo ảnh hưởng và hạn xử lý",
        `<div class="alert-list">
          <div class="alert-item critical"><strong>Tiến độ đang chậm ${data.headline.delayDays} ngày</strong><p>Khối lượng đất còn nhiều; báo cáo ${data.meta.latestDaily} ghi nhận ${data.headline.trucks} xe chở đất, cần bám yêu cầu tăng cường nguồn lực.</p><div class="alert-meta"><span>VICONS</span>${statusPill("overdue")}</div></div>
          <div class="alert-item critical"><strong>IN6 có mức chuyển dịch trích xuất cao nhất 39,5 mm</strong><p>Cần TVGS đối chiếu ngưỡng phê duyệt, hướng đo và cấp cảnh báo chính thức.</p><div class="alert-meta"><span>TVGS / Quan trắc</span>${statusPill("review")}</div></div>
          <div class="alert-item"><strong>Hồ sơ BF2 và MEP đang là ràng buộc chuyển bước</strong><p>WR-15 ghi một số bản vẽ/biện pháp bị trả về hoặc đang kiểm tra; hàng tiếp địa MEP cần xác nhận ngày 03/07.</p><div class="alert-meta"><span>VICONS / CSCEC</span>${statusPill("due")}</div></div>
        </div>`
      )}
    </div>
    <div class="grid grid-equal">
      ${panel("Tiến độ theo khu vực", `Báo cáo ngày ${data.meta.latestDaily} · khối lượng thực tế / target tuần`, `<div class="zone-list">${zoneRows()}</div>`, `<button class="panel-link" data-go-view="progress">Xem chi tiết</button>`)}
      ${panel("Quan trắc inclinometer", "Mức chuyển dịch tuyệt đối lớn nhất trích xuất trong từng mốc", `<div class="monitor-grid">${monitoringCards(data.monitoring.slice(0,4))}</div><div class="monitor-note">Các trạng thái đang là phân loại quản trị sơ bộ. Chưa thay thế ngưỡng cảnh báo đã được phê duyệt.</div>`, `<button class="panel-link" data-go-view="monitoring">Xem toàn bộ</button>`)}
    </div>
    ${panel("Cam kết cần theo dõi", "Tổng hợp từ WR-15, biên bản giao ban 26/06 và biên bản phối hợp 02/07", actionTable(data.actions, 6), `<button class="panel-link" data-go-view="actions">Mở Action Tracker</button>`)}
    <div style="height:14px"></div>
    ${panel("Mốc kế hoạch 3 tuần", "Theo tiến độ DS-13rev03 đã duyệt SPM", milestoneTimeline(), `<button class="panel-link" data-go-view="lookahead">Mở kế hoạch chi tiết</button>`)}
  `;
}

function progressView() {
  return `
    ${pageIntro("Tiến độ thi công", "Theo dõi lũy kế, hiệu suất thi công và tiến độ đào đất - shoring theo khu vực.",
      `<select class="filter-select"><option>Tuần 15</option><option>Tuần 14</option><option>Tuần 13</option></select>
       <select class="filter-select"><option>Tất cả khu vực</option><option>Zone A</option><option>Zone B</option><option>Zone C</option></select>`)}
    <div class="kpi-grid">
      ${kpiCard("Kế hoạch lũy kế", data.headline.plan, "%", "", "Theo WR-15")}
      ${kpiCard("Thực tế lũy kế", data.headline.actual, "%", statusPill("review"), "Chênh -0,54 điểm %")}
      ${kpiCard("Chậm tiến độ", data.headline.delayDays, "ngày", statusPill("overdue"), "Cần kế hoạch bù")}
      ${kpiCard("Kế hoạch tuần sau", 6.45, "%", statusPill("due"), "Target WR-15 cho 03/07-09/07")}
      ${kpiCard("Nhân lực hiện trường", data.headline.manpower, "người", statusPill("normal"), "Theo WR-15")}
    </div>
    <div class="grid grid-main">
      ${panel("S-curve lũy kế", "Kế hoạch so với thực tế", `<div class="chart-wrap"><canvas id="progressChart"></canvas></div>`, `<div class="legend"><span><i></i>Kế hoạch</span><span class="actual"><i></i>Thực tế</span></div>`)}
      ${panel("Cơ cấu nhân lực", `Báo cáo ngày ${data.meta.latestDaily}`, `<div class="bar-chart">${data.workforce.map((w,i)=>`<div class="bar-row"><span>${w.label}</span><div class="bar-track"><div class="bar-fill ${i===1?"teal":""}" style="width:${w.value/17*100}%"></div></div><strong>${w.value}</strong></div>`).join("")}</div>`)}
    </div>
    ${panel("Khối lượng theo Zone", `Mức hoàn thành đến ngày ${data.meta.latestDaily}`, `<div class="zone-list">${zoneRows()}</div>`)}
    <div style="height:14px"></div>
    ${panel("Đánh giá quản trị", "", `<div class="alert-list">
      <div class="alert-item critical"><strong>Zone A là điểm nghẽn lớn nhất</strong><p>WR-15 ghi đào đất lớp 3 đạt 70%, shoring lớp 3 đạt 0% và đào đáy móng đạt 0% tại ngày 02/07.</p></div>
      <div class="alert-item"><strong>Zone B còn thiếu shoring và đào đáy móng</strong><p>WR-15 ghi đào lớp 3 đạt 90%, shoring 55% và đào đến đáy móng 40%; baseline yêu cầu chuyển sang RC/MEP từ 04/07.</p></div>
      <div class="alert-item"><strong>Năng lực vận chuyển đất chưa đạt yêu cầu</strong><p>WR-15 ghi 3 xe tải chở đất; biên bản giao ban yêu cầu tăng thiết bị nếu đào đất chậm so với kế hoạch.</p></div>
    </div>`)}
  `;
}

function actionsView() {
  return `
    ${pageIntro("Action Tracker", "Theo dõi trách nhiệm, hạn hoàn thành và bằng chứng đóng việc từ các biên bản họp.",
      `<input class="search-input" id="actionSearch" placeholder="Tìm đầu việc, đơn vị...">
       <select class="filter-select" id="actionStatus"><option value="all">Tất cả trạng thái</option><option value="overdue">Quá hạn</option><option value="due">Đến hạn</option><option value="upcoming">Sắp đến hạn</option></select>`)}
    <div class="kpi-grid">
      ${kpiCard("Tổng đầu việc", data.actions.length, "việc", "", "Trong phạm vi dữ liệu đã đọc")}
      ${kpiCard("Quá hạn", data.actions.filter(a=>a.status==="overdue").length, "việc", statusPill("overdue"), "Cần bằng chứng đóng việc")}
      ${kpiCard("Đến hạn", data.actions.filter(a=>a.status==="due").length, "việc", statusPill("due"), "Tại kỳ cập nhật 03/07")}
      ${kpiCard("7 ngày tới", data.actions.filter(a=>a.status==="upcoming").length, "việc", statusPill("upcoming"), "Tập trung MEP và hồ sơ")}
      ${kpiCard("Tỷ lệ có owner", 100, "%", statusPill("normal"), "Theo đơn vị chịu trách nhiệm")}
    </div>
    ${panel("Danh sách cam kết", "Nhấn vào từng dòng để xem nguồn và ghi chú", `<div id="actionTable">${actionTable(data.actions)}</div>`)}
  `;
}

function monitoringView() {
  return `
    ${pageIntro("Quan trắc công trình", "Tổng hợp nhanh dữ liệu inclinometer chu kỳ gần nhất. Giá trị cần được TVGS xác nhận trước khi dùng làm cảnh báo chính thức.",
      `<select class="filter-select"><option>Inclinometer - CK14</option><option>Chuyển vị đỉnh tường - CK13</option><option>Ứng suất hệ giằng</option></select>`)}
    <div class="kpi-grid">
      ${kpiCard("Mốc theo dõi", 8, "mốc", "", "IN1 đến IN8")}
      ${kpiCard("Giá trị lớn nhất", 39.5, "mm", statusPill("review"), "IN6 · CK14")}
      ${kpiCard("Chu kỳ mới nhất", 14, "", statusPill("normal"), "Ngày đo 30/06")}
      ${kpiCard("Chưa ánh xạ ngưỡng", 8, "mốc", statusPill("due"), "Cần bảng ngưỡng phê duyệt")}
      ${kpiCard("Báo cáo quan trắc mới", 3, "tệp", statusPill("normal"), "Cập nhật ngày 30/06")}
    </div>
    ${panel("Inclinometer - chu kỳ gần nhất", "Mức chuyển dịch tuyệt đối lớn nhất trích xuất từ báo cáo", `<div class="monitor-grid">${monitoringCards(data.monitoring)}</div><div class="monitor-note"><strong>Lưu ý:</strong> “Cao nhất” và “Cần theo dõi” chỉ phản ánh xếp hạng tương đối trong bộ dữ liệu. Website chưa có bảng ngưỡng cảnh báo được phê duyệt.</div>`)}
    <div style="height:14px"></div>
    ${panel("Hành động quản trị đề xuất", "", `<div class="alert-list">
      <div class="alert-item critical"><strong>TVGS xác nhận ngưỡng và trạng thái IN6</strong><p>Giá trị trích xuất lớn nhất 39,5 mm; cần đối chiếu hướng đo, độ sâu và ngưỡng thiết kế.</p></div>
      <div class="alert-item"><strong>Đối chiếu báo cáo chuyển vị đỉnh tường CK13</strong><p>PDF đã có trong thư mục quan trắc nhưng chưa được ánh xạ vào KPI do cần bảng ngưỡng và quy tắc phân loại chính thức.</p></div>
      <div class="alert-item"><strong>Không phân loại an toàn khi thiếu ngưỡng</strong><p>Các nhãn trên dashboard chỉ là xếp hạng quản trị tương đối theo giá trị trích xuất.</p></div>
    </div>`)}
  `;
}

function lookaheadView() {
  const initialWeek = data.lookahead.weeks[0];
  return `
    ${pageIntro("Kế hoạch 3 tuần tiếp theo", "Các công việc chính và mốc target từ 03/07 đến 23/07/2026, đối chiếu tiến độ đã duyệt SPM.",
      `<button class="copy-button" id="scheduleSourceButton">Xem nguồn tiến độ</button>`)}
    <div class="kpi-grid">
      ${kpiCard("Thời gian lookahead", 21, "ngày", "", "03/07 - 23/07/2026")}
      ${kpiCard("Mốc bắt buộc", 6, "mốc", statusPill("upcoming"), "Đào đáy móng và khởi động RC/MEP")}
      ${kpiCard("Zone C", "03/07", "", statusPill("due"), "Khởi động RC/MEP")}
      ${kpiCard("Zone B", "04/07", "", statusPill("due"), "Khởi động RC/MEP")}
      ${kpiCard("Zone A", "06/07", "", statusPill("overdue"), "Đáy móng còn 0% theo WR-15")}
    </div>
    <div class="week-selector">${lookaheadWeekCards()}</div>
    <div class="grid grid-main">
      ${panel("Công việc và target", "Chọn từng tuần để xem kế hoạch chi tiết", `<div id="lookaheadTasks">${lookaheadTaskTable(initialWeek)}</div>`)}
      ${panel("Mốc kiểm soát", "Các mốc chuyển bước theo baseline", milestoneTimeline())}
    </div>
    <div class="grid grid-equal">
      ${panel("Điều kiện nghiệm thu chuyển bước", "", `<div class="gate-list" id="gateList">${initialWeek.gates.map(g=>`<div class="gate-item"><span>✓</span>${g}</div>`).join("")}</div>`)}
      ${panel("Đánh giá độ lệch hiện tại", `Đối chiếu báo cáo ngày ${data.meta.latestDaily} với baseline`, `<div class="alert-list">
        <div class="alert-item critical"><strong>Zone A đã vượt mốc shoring lớp 3 baseline</strong><p>Baseline yêu cầu hoàn tất shoring Zone A ngày 22/06; WR-15 ngày ${data.meta.latestDaily} vẫn ghi nhận 0%.</p></div>
        <div class="alert-item critical"><strong>Mốc đào đáy móng có nguy cơ trượt</strong><p>WR-15 ghi đào đáy móng Zone B 40%, Zone C 40%, Zone A 0% trong khi baseline yêu cầu khởi động RC/MEP từ 03-07/07.</p></div>
        <div class="alert-item"><strong>Yêu cầu kế hoạch phục hồi theo ngày</strong><p>VICONS cần xác nhận sản lượng, xe vận chuyển, ca thi công và mặt bằng bàn giao cho từng Zone, kèm bằng chứng nghiệm thu.</p></div>
      </div>`)}
    </div>
  `;
}

function renderView(view) {
  currentView = view;
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  pageTitle.textContent = viewTitles[view];
  const renderers = { overview: overviewView, progress: progressView, actions: actionsView, monitoring: monitoringView, lookahead: lookaheadView };
  content.innerHTML = renderers[view]();
  sidebar.classList.remove("open");
  bindDynamicEvents();
  requestAnimationFrame(drawAllCharts);
}

function updateSyncStatus() {
  const syncStrong = document.querySelector(".sync-status strong");
  const syncText = document.querySelector(".sync-status span:last-child");
  if (syncStrong) syncStrong.textContent = `Dữ liệu đến ${data.meta.latestDaily || "đang cập nhật"}`;
  if (syncText) syncText.textContent = `Báo cáo hiện trường đến ${data.meta.latestDaily || "đang cập nhật"}`;
}

function showToast(message, timeout = 1800) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), timeout);
}

function refreshDashboardData() {
  const button = document.getElementById("refreshButton");
  const appsScriptApi = window.google?.script?.run;
  if (!appsScriptApi) {
    showToast("Đã cập nhật dữ liệu hiển thị");
    drawAllCharts();
    return;
  }

  button.disabled = true;
  showToast("Đang lấy dữ liệu mới từ Google Drive...", 2200);
  appsScriptApi
    .withSuccessHandler(freshData => {
      data = freshData;
      window.CN8_DATA = freshData;
      updateSyncStatus();
      renderView(currentView);
      button.disabled = false;
      showToast("Đã cập nhật dữ liệu mới từ Google Drive");
    })
    .withFailureHandler(error => {
      button.disabled = false;
      showToast(`Không cập nhật được: ${error?.message || error}`, 2600);
    })
    .getDashboardData();
}

function drawLineChart(canvas, series, compact = false) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, rect.width * ratio);
  canvas.height = Math.max(1, rect.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  const pad = compact ? { l: 3, r: 3, t: 5, b: 3 } : { l: 38, r: 15, t: 16, b: 28 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const values = series.flatMap(s => s.values);
  const max = Math.max(...values) * 1.12 || 1;
  const min = compact ? Math.min(...values) * .9 : 0;

  if (!compact) {
    ctx.strokeStyle = "#e4e8eb";
    ctx.fillStyle = "#71808d";
    ctx.font = "10px Arial";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke();
      ctx.fillText((max - (max / 4) * i).toFixed(1) + "%", 2, y + 3);
    }
    const labels = data.progressTrend.map(d => d.label);
    labels.forEach((label, i) => {
      const x = pad.l + (plotW / (labels.length - 1)) * i;
      ctx.fillText(label, x - 10, height - 6);
    });
  }

  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = compact ? 2 : 2.5;
    ctx.beginPath();
    s.values.forEach((v, i) => {
      const x = pad.l + (plotW / Math.max(1, s.values.length - 1)) * i;
      const y = pad.t + plotH - ((v - min) / Math.max(.001, max - min)) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (!compact) {
      s.values.forEach((v, i) => {
        const x = pad.l + (plotW / Math.max(1, s.values.length - 1)) * i;
        const y = pad.t + plotH - ((v - min) / Math.max(.001, max - min)) * plotH;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      });
    }
  });
}

function drawAllCharts() {
  const progressCanvas = document.getElementById("progressChart");
  if (progressCanvas) {
    drawLineChart(progressCanvas, [
      { color: "#236aa2", values: data.progressTrend.map(d => d.plan) },
      { color: "#16736f", values: data.progressTrend.map(d => d.actual) }
    ]);
  }
  document.querySelectorAll(".sparkline").forEach(canvas => {
    const values = canvas.dataset.values.split(",").map(Number);
    drawLineChart(canvas, [{ color: "#236aa2", values }], true);
  });
}

function openDrawer(eyebrow, title, body) {
  drawerEyebrow.textContent = eyebrow;
  drawerTitle.textContent = title;
  drawerBody.innerHTML = body;
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
}

function openAction(id) {
  const a = data.actions.find(item => item.id === id);
  if (!a) return;
  openDrawer("CAM KẾT HỌP", a.title, `
    <div class="detail-section"><h3>Trạng thái</h3>${statusPill(a.status)}</div>
    <div class="detail-section"><h3>Thông tin quản lý</h3><div class="detail-grid">
      <span>Mã đầu việc</span><strong>${a.id}</strong>
      <span>Chuyên môn</span><strong>${a.discipline}</strong>
      <span>Đơn vị</span><strong>${a.owner}</strong>
      <span>Hạn hoàn thành</span><strong>${a.due}</strong>
      <span>Nguồn</span><strong>${a.source}</strong>
    </div></div>
    <div class="detail-section"><h3>Đánh giá</h3><p>${a.note}</p></div>
    <div class="detail-section"><h3>Bằng chứng hoàn thành</h3><p class="cell-sub">Chưa có tệp hoặc xác nhận được liên kết trong phiên bản MVP.</p></div>
  `);
}

function openDocument(index) {
  const d = data.documents[index];
  if (!d) return;
  openDrawer("TÀI LIỆU NGUỒN", d.name, `
    <div class="detail-section"><h3>Thông tin</h3><div class="detail-grid">
      <span>Loại hồ sơ</span><strong>${d.type}</strong>
      <span>Đơn vị</span><strong>${d.owner}</strong>
      <span>Ngày cập nhật</span><strong>${d.date}</strong>
      <span>Trạng thái</span><strong>${d.status}</strong>
    </div></div>
    <div class="detail-section"><h3>Đường dẫn đồng bộ</h3><div class="path-box" id="sourcePath">${d.path}</div></div>
    <button class="copy-button" data-copy-path="${encodeURIComponent(d.path)}">Sao chép đường dẫn</button>
  `);
}

function openMonitoring(index) {
  const m = data.monitoring[index];
  if (!m) return;
  openDrawer("QUAN TRẮC INCLINOMETER", `${m.point} · ${m.value} mm`, `
    <div class="detail-section"><h3>Dữ liệu chu kỳ</h3><div class="detail-grid">
      <span>Mốc đo</span><strong>${m.point}</strong>
      <span>Chu kỳ</span><strong>${m.cycle}</strong>
      <span>Ngày đo</span><strong>${m.date}</strong>
      <span>Giá trị lớn nhất</span><strong>${m.value} mm</strong>
      <span>Phân loại</span><strong>${statusPill(m.status)}</strong>
    </div></div>
    <div class="detail-section"><h3>Diễn giải</h3><p>Giá trị được trích xuất từ cột chuyển vị tuyệt đối trong báo cáo nhanh. Cần kiểm tra lại độ sâu, hướng đo và ngưỡng cảnh báo được phê duyệt.</p></div>
    <div class="monitor-note">Không sử dụng phân loại trên website thay cho kết luận của đơn vị quan trắc và TVGS.</div>
  `);
}

function filterActions() {
  const search = (document.getElementById("actionSearch")?.value || "").toLowerCase();
  const status = document.getElementById("actionStatus")?.value || "all";
  const filtered = data.actions.filter(a => {
    const matchesText = `${a.title} ${a.owner} ${a.discipline}`.toLowerCase().includes(search);
    return matchesText && (status === "all" || a.status === status);
  });
  document.getElementById("actionTable").innerHTML = actionTable(filtered);
  bindRowEvents();
}

function filterDocuments() {
  const search = (document.getElementById("documentSearch")?.value || "").toLowerCase();
  const type = document.getElementById("documentType")?.value || "all";
  const indexed = data.documents.map((d, index) => ({ d, index })).filter(({d}) => {
    const matchesText = `${d.name} ${d.type} ${d.owner}`.toLowerCase().includes(search);
    return matchesText && (type === "all" || d.type === type);
  });
  document.getElementById("documentList").innerHTML = indexed.map(({d,index}) => `
    <div class="doc-item click-row" data-document-index="${index}">
      <span class="file-type">${d.type}</span>
      <div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.owner}</div></div>
      <span class="doc-meta">${d.date}</span>
      <span class="status-pill pill-gray">${d.status}</span>
    </div>`).join("");
  bindRowEvents();
}

function bindRowEvents() {
  document.querySelectorAll("[data-action-id]").forEach(row => row.addEventListener("click", () => openAction(row.dataset.actionId)));
  document.querySelectorAll("[data-document-index]").forEach(row => row.addEventListener("click", () => openDocument(Number(row.dataset.documentIndex))));
  document.querySelectorAll("[data-monitor-index]").forEach(card => card.addEventListener("click", () => openMonitoring(Number(card.dataset.monitorIndex))));
}

function bindDynamicEvents() {
  bindRowEvents();
  document.querySelectorAll("[data-go-view]").forEach(button => button.addEventListener("click", () => renderView(button.dataset.goView)));
  document.getElementById("actionSearch")?.addEventListener("input", filterActions);
  document.getElementById("actionStatus")?.addEventListener("change", filterActions);
  document.querySelectorAll("[data-week-id]").forEach(card => card.addEventListener("click", () => {
    const week = data.lookahead.weeks.find(item => item.id === card.dataset.weekId);
    if (!week) return;
    document.querySelectorAll("[data-week-id]").forEach(item => item.classList.toggle("active", item === card));
    document.getElementById("lookaheadTasks").innerHTML = lookaheadTaskTable(week);
    document.getElementById("gateList").innerHTML = week.gates.map(g => `<div class="gate-item"><span>✓</span>${g}</div>`).join("");
  }));
  document.getElementById("scheduleSourceButton")?.addEventListener("click", () => {
    const source = data.lookahead.source;
    openDrawer("TIẾN ĐỘ ĐƯỢC DUYỆT", source.name, `
      <div class="detail-section"><h3>Thông tin phê duyệt</h3><div class="detail-grid">
        <span>Trạng thái</span><strong>${source.approval}</strong>
        <span>Ngày tiến độ</span><strong>${source.scheduleDate}</strong>
        <span>Phạm vi</span><strong>Overall Construction Schedule Rev01</strong>
      </div></div>
      <div class="detail-section"><h3>Đường dẫn nguồn</h3><div class="path-box">${source.path}</div></div>
      <button class="copy-button" data-copy-path="${encodeURIComponent(source.path)}">Sao chép đường dẫn</button>
    `);
  });
}

document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => renderView(item.dataset.view)));
document.getElementById("menuButton").addEventListener("click", () => sidebar.classList.toggle("open"));
document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);
document.getElementById("refreshButton").addEventListener("click", () => {
  refreshDashboardData();
});
document.addEventListener("click", event => {
  const button = event.target.closest("[data-copy-path]");
  if (!button) return;
  const path = decodeURIComponent(button.dataset.copyPath);
  navigator.clipboard?.writeText(path);
  toast.textContent = "Đã sao chép đường dẫn nguồn";
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); toast.textContent = "Đã cập nhật dữ liệu hiển thị"; }, 1800);
});
window.addEventListener("resize", () => requestAnimationFrame(drawAllCharts));
window.addEventListener("keydown", event => { if (event.key === "Escape") closeDrawer(); });

renderView("overview");
updateSyncStatus();
