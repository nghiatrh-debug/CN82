/**
 * =====================================================================
 *  ĐỌC BÁO CÁO PDF BẰNG AI – XOAY VÒNG NHIỀU API  (v2.0)
 *  Google Apps Script gắn với Google Sheet (container-bound)
 *
 *  - Bảng điều khiển (sidebar) có nút: nhập API key, thứ tự ưu tiên API,
 *    xác nhận thư mục quét, bắt đầu quét, nhật ký gọi API, lịch tự động.
 *  - Chỉ số cần lọc do người dùng tự khai báo ở sheet "Chỉ số cần lọc",
 *    áp dụng cho mọi loại báo cáo (không cần khuôn mẫu). Chỉ số nào
 *    không có trong báo cáo được ghi "❌ Không tìm thấy".
 *  - Quét TẤT CẢ file PDF chưa đọc (chống trùng theo File ID + ngày cập nhật).
 *  - Tự động quét mỗi tuần 1 lần lúc 5:00 (giờ Việt Nam), đổi được thứ/giờ.
 *  - API key lưu trong User Properties, KHÔNG nằm trong code.
 * =====================================================================
 */

// ==================== HẰNG SỐ ====================
const APP_VERSION = '2.0';
const APP_TZ = 'Asia/Ho_Chi_Minh';

const SH = {
  INDICATORS: 'Chỉ số cần lọc',
  RESULTS: 'Kết quả chỉ số',
  ITEMS: 'Hạng mục - Vấn đề',
  PIVOT: 'Bảng so sánh',
  LOG: 'Nhật ký API',
  REGISTRY: '_DaXuLy'
};

const HEADERS = {
  INDICATORS: ['STT', 'Tên chỉ số', 'Mô tả / gợi ý nhận diện (AI dựa vào đây để tìm)', 'Đơn vị mong muốn', 'Áp dụng'],
  RESULTS: ['Thời gian quét', 'Tên file', 'Kỳ / Ngày báo cáo', 'Chỉ số', 'Giá trị', 'Đơn vị', 'Trạng thái', 'Trích dẫn nguồn', 'Trang', 'AI đã dùng', 'File ID'],
  ITEMS: ['Thời gian quét', 'Tên file', 'Kỳ / Ngày báo cáo', 'Hạng mục / Vấn đề', 'Đơn vị phụ trách', 'Nội dung & Đánh giá', 'Giải pháp / Tiến độ', 'Ghi chú / Vướng mắc', 'AI đã dùng'],
  LOG: ['Thời gian', 'Mã lần chạy', 'Nguồn kích hoạt', 'File', 'API', 'Model', 'Kết quả', 'Thời gian (giây)', 'Chi tiết'],
  REGISTRY: ['File ID', 'Tên file', 'Ngày cập nhật file (ms)', 'Lần xử lý cuối', 'API', 'Trạng thái', 'Số lần lỗi', 'Chỉ số tìm thấy']
};

const LIMITS = {
  RUN_BUDGET_MS: 4 * 60 * 1000,   // Không bắt đầu file mới sau 4 phút (Apps Script giới hạn 6 phút/lần chạy)
  CONTINUE_AFTER_MS: 2 * 60 * 1000, // Còn file chưa quét -> tự chạy tiếp sau 2 phút
  MAX_FAILS: 3,                     // File lỗi quá 3 lần thì bỏ qua (bấm "Đặt lại" để quét lại)
  MAX_INLINE_PDF_MB: 20,            // PDF lớn hơn mức này không gửi trực tiếp (Claude/Gemini), chỉ dùng API đọc text
  MIN_TEXT_CHARS: 200               // Text trích được ít hơn mức này => PDF scan/ảnh, bỏ qua API đọc text
};

const STATUS = {
  FOUND: '✅ Tìm thấy',
  NOT_FOUND: '❌ Không tìm thấy',
  CHECK: '⚠️ Cần kiểm tra'
};

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Danh mục nhà cung cấp AI.
 * input = 'pdf'  : gửi nguyên file PDF (đọc được bảng, hình, PDF scan)
 * input = 'text' : chỉ gửi văn bản trích từ PDF (textLimit = số ký tự tối đa gửi đi)
 */
const PROVIDERS = {
  CLAUDE: {
    label: 'Claude (Anthropic)', input: 'pdf', textLimit: 0,
    defaultModel: 'claude-sonnet-5-5',
    keys: [{ prop: 'KEY_CLAUDE', label: 'API key', hint: 'console.anthropic.com' }],
    call: callClaude_
  },
  GEMINI: {
    label: 'Gemini (Google AI Studio)', input: 'pdf', textLimit: 0,
    defaultModel: 'gemini-2.5-flash',
    keys: [{ prop: 'KEY_GEMINI', label: 'API key', hint: 'aistudio.google.com' }],
    call: callGemini_
  },
  OPENROUTER: {
    label: 'OpenRouter', input: 'text', textLimit: 300000,
    defaultModel: 'google/gemini-2.5-flash',
    keys: [{ prop: 'KEY_OPENROUTER', label: 'API key', hint: 'openrouter.ai/keys' }],
    call: callOpenRouter_
  },
  GROQ: {
    label: 'Groq', input: 'text', textLimit: 25000,
    defaultModel: 'llama-3.3-70b-versatile',
    keys: [{ prop: 'KEY_GROQ', label: 'API key', hint: 'console.groq.com/keys' }],
    call: callGroq_
  },
  CLOUDFLARE: {
    label: 'Cloudflare Workers AI', input: 'text', textLimit: 30000,
    defaultModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    keys: [
      { prop: 'KEY_CLOUDFLARE_ACCOUNT', label: 'Account ID', hint: 'dash.cloudflare.com → Workers & Pages' },
      { prop: 'KEY_CLOUDFLARE_TOKEN', label: 'API token', hint: 'dash.cloudflare.com/profile/api-tokens' }
    ],
    call: callCloudflare_
  }
};
const DEFAULT_ORDER = ['CLAUDE', 'GEMINI', 'OPENROUTER', 'GROQ', 'CLOUDFLARE'];

// Chỉ số mẫu – người dùng sửa/xóa/thêm tùy ý trong sheet "Chỉ số cần lọc"
const DEFAULT_INDICATORS = [
  ['Tên dự án / gói thầu', 'Tên dự án, gói thầu hoặc công trình được báo cáo', ''],
  ['Tiến độ kế hoạch lũy kế', '% khối lượng/tiến độ theo kế hoạch (baseline) đến kỳ báo cáo', '%'],
  ['Tiến độ thực tế lũy kế', '% hoàn thành thực tế đến kỳ báo cáo', '%'],
  ['Chênh lệch tiến độ', 'Số ngày chậm/vượt so với kế hoạch, hoặc chênh lệch % thực tế – kế hoạch', 'ngày hoặc %'],
  ['Mốc tiến độ sắp tới', 'Milestone gần nhất và ngày dự kiến hoàn thành', ''],
  ['Nhân lực trên công trường', 'Số công nhân/kỹ sư trung bình hoặc cao nhất trong kỳ', 'người'],
  ['Thiết bị chính', 'Số lượng, loại thiết bị chính đang huy động (cẩu tháp, máy đào, cọc khoan...)', ''],
  ['Khối lượng thực hiện trong kỳ', 'Khối lượng chính trong kỳ: bê tông (m3), cốt thép (tấn), đào đất (m3)...', ''],
  ['An toàn lao động', 'Số sự cố, tai nạn, vi phạm an toàn, số giờ làm việc an toàn', ''],
  ['Chất lượng – NCR', 'Số phiếu không phù hợp (NCR) phát hành / đã đóng / còn mở', ''],
  ['Giá trị thanh toán / giải ngân', 'Giá trị đã thanh toán, đề nghị thanh toán, lũy kế so với giá trị hợp đồng', 'VNĐ'],
  ['Phát sinh – thay đổi', 'Các hạng mục phát sinh, VO, thay đổi thiết kế và giá trị', ''],
  ['Vướng mắc cần Chủ đầu tư xử lý', 'Các vấn đề cần CĐT quyết định, phê duyệt, cung cấp thông tin', ''],
  ['Thời tiết ảnh hưởng', 'Số ngày mưa/ngừng thi công do thời tiết', 'ngày']
];

// ==================== MENU & BẢNG ĐIỀU KHIỂN ====================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 AI Báo Cáo')
    .addItem('🎛️ Mở bảng điều khiển', 'moBangDieuKhien')
    .addSeparator()
    .addItem('▶️ Bắt đầu quét PDF ngay', 'quetNgay')
    .addItem('📋 Mở sheet Chỉ số cần lọc', 'moSheetChiSo')
    .addItem('📝 Mở Nhật ký API', 'moSheetNhatKy')
    .addItem('📊 Cập nhật Bảng so sánh', 'capNhatBangSoSanh')
    .addSeparator()
    .addItem('🛠️ Khởi tạo / sửa cấu trúc sheet', 'khoiTao')
    .addToUi();
}

/** Mở sidebar. Có thể gán hàm này cho một hình vẽ (Insert → Drawing → Assign script) để làm nút bấm trên sheet. */
function moBangDieuKhien() {
  ensureSheets_();
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('AI Báo Cáo – Bảng điều khiển');
  SpreadsheetApp.getUi().showSidebar(html);
}

function quetNgay() {
  const r = runScan_('Thủ công (menu)');
  SpreadsheetApp.getActive().toast(r.message, 'AI Báo Cáo', 10);
}

function moSheetChiSo() { activateSheet_(SH.INDICATORS); }
function moSheetNhatKy() { activateSheet_(SH.LOG); }
function capNhatBangSoSanh() { rebuildPivot_(); activateSheet_(SH.PIVOT); }
function khoiTao() {
  ensureSheets_();
  SpreadsheetApp.getActive().toast('Đã kiểm tra/tạo đủ các sheet.', 'AI Báo Cáo', 5);
}

// ==================== TRIGGER HANDLERS (phải là hàm public) ====================

/** Chạy theo lịch hằng tuần. */
function scheduledWeeklyScan() {
  runScan_('Lịch tự động hằng tuần');
}

/** Chạy tiếp khi lần trước hết thời gian mà còn file chưa quét. */
function continueScan() {
  deleteTriggersFor_('continueScan');
  runScan_('Chạy tiếp tự động');
}

// ==================== HÀM GỌI TỪ SIDEBAR (google.script.run) ====================

function ui_getState() {
  ensureSheets_();
  const cfg = getConfig_();
  const userProps = PropertiesService.getUserProperties();
  const providers = getProviderOrder_().map(p => {
    const def = PROVIDERS[p.id];
    return {
      id: p.id, label: def.label, input: def.input, enabled: p.enabled,
      model: p.model, defaultModel: def.defaultModel,
      keys: def.keys.map(k => ({ prop: k.prop, label: k.label, hint: k.hint, masked: maskKey_(userProps.getProperty(k.prop)) })),
      ready: def.keys.every(k => !!userProps.getProperty(k.prop))
    };
  });
  const sched = getSchedule_();
  return {
    version: APP_VERSION,
    providers: providers,
    folder: { id: cfg.folderId, name: cfg.folderName, includeSubfolders: cfg.includeSubfolders },
    options: { extractItems: cfg.extractItems, notifyEmail: cfg.notifyEmail },
    schedule: {
      enabled: sched.enabled, weekday: sched.weekday, hour: sched.hour,
      triggerActive: ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'scheduledWeeklyScan'),
      owner: sched.owner || ''
    },
    indicatorsCount: readIndicators_().length,
    me: Session.getEffectiveUser().getEmail()
  };
}

function ui_saveKey(prop, value) {
  if (!isKnownKeyProp_(prop)) throw new Error('Khóa không hợp lệ: ' + prop);
  const v = String(value || '').trim();
  if (!v) throw new Error('Giá trị trống.');
  PropertiesService.getUserProperties().setProperty(prop, v);
  return maskKey_(v);
}

function ui_deleteKey(prop) {
  if (!isKnownKeyProp_(prop)) throw new Error('Khóa không hợp lệ: ' + prop);
  PropertiesService.getUserProperties().deleteProperty(prop);
  return true;
}

/** Lưu thứ tự ưu tiên, bật/tắt và model của từng API. list = [{id, enabled, model}] */
function ui_saveProviders(list) {
  const clean = [];
  (list || []).forEach(p => {
    if (PROVIDERS[p.id] && !clean.some(c => c.id === p.id)) {
      clean.push({ id: p.id, enabled: !!p.enabled, model: String(p.model || '').trim() || PROVIDERS[p.id].defaultModel });
    }
  });
  DEFAULT_ORDER.forEach(id => { if (!clean.some(c => c.id === id)) clean.push({ id: id, enabled: false, model: PROVIDERS[id].defaultModel }); });
  PropertiesService.getDocumentProperties().setProperty('PROVIDERS', JSON.stringify(clean));
  return true;
}

/** Gửi 1 câu hỏi ngắn để kiểm tra key + model có hoạt động không. */
function ui_testProvider(id) {
  const def = PROVIDERS[id];
  if (!def) throw new Error('API không tồn tại');
  const p = getProviderOrder_().find(x => x.id === id);
  const keys = getKeys_(id);
  if (!keys) return { ok: false, msg: 'Chưa nhập đủ key.' };
  const t0 = Date.now();
  try {
    const out = def.call(p.model, keys, 'Chỉ trả lời đúng một từ: OK', null);
    const sec = (Date.now() - t0) / 1000;
    writeLog_({ runId: 'TEST', source: 'Kiểm tra key', file: '-', provider: def.label, model: p.model, result: 'OK', sec: sec, detail: String(out).slice(0, 100) });
    return { ok: true, msg: 'Kết nối OK (' + sec.toFixed(1) + 's) – model ' + p.model };
  } catch (e) {
    const sec = (Date.now() - t0) / 1000;
    writeLog_({ runId: 'TEST', source: 'Kiểm tra key', file: '-', provider: def.label, model: p.model, result: 'LỖI', sec: sec, detail: e.message });
    return { ok: false, msg: e.message };
  }
}

/** Xác nhận thư mục: nhận link hoặc ID, trả về tên thư mục và số PDF đang chờ quét. */
function ui_setFolder(input, includeSubfolders) {
  const id = parseFolderId_(input);
  if (!id) throw new Error('Không nhận diện được ID thư mục. Dán link dạng https://drive.google.com/drive/folders/... hoặc ID.');
  let folder;
  try { folder = DriveApp.getFolderById(id); folder.getName(); }
  catch (e) { throw new Error('Không truy cập được thư mục (sai ID hoặc tài khoản không có quyền xem).'); }

  const props = PropertiesService.getDocumentProperties();
  props.setProperties({ FOLDER_ID: id, FOLDER_NAME: folder.getName(), INCLUDE_SUBFOLDERS: includeSubfolders ? '1' : '0' });

  const files = listPdfFiles_(folder, !!includeSubfolders);
  const pending = filterPending_(files, readRegistry_());
  return {
    id: id, name: folder.getName(), url: folder.getUrl(),
    total: files.length, pending: pending.length,
    pendingNames: pending.slice(0, 15).map(f => f.getName())
  };
}

function ui_saveOptions(opts) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('EXTRACT_ITEMS', opts && opts.extractItems ? '1' : '0');
  props.setProperty('NOTIFY_EMAIL', String((opts && opts.notifyEmail) || '').trim());
  return true;
}

/** Bật/tắt lịch hằng tuần. s = {enabled, weekday:'FRIDAY', hour:5} */
function ui_saveSchedule(s) {
  const weekday = WEEKDAYS.indexOf(s.weekday) >= 0 ? s.weekday : 'FRIDAY';
  const hour = Math.min(23, Math.max(0, parseInt(s.hour, 10) || 5));
  deleteTriggersFor_('scheduledWeeklyScan');
  if (s.enabled) {
    ScriptApp.newTrigger('scheduledWeeklyScan')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay[weekday])
      .atHour(hour)
      .nearMinute(0)
      .everyWeeks(1)
      .inTimezone(APP_TZ)
      .create();
  }
  const sched = { enabled: !!s.enabled, weekday: weekday, hour: hour, owner: Session.getEffectiveUser().getEmail() };
  PropertiesService.getDocumentProperties().setProperty('SCHEDULE', JSON.stringify(sched));
  return sched;
}

function ui_runScan() {
  return runScan_('Thủ công (bảng điều khiển)');
}

function ui_getLog(n) {
  const sh = getSheet_(SH.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const count = Math.min(n || 40, last - 1);
  return sh.getRange(last - count + 1, 1, count, HEADERS.LOG.length).getDisplayValues().reverse();
}

function ui_clearLog() {
  const sh = getSheet_(SH.LOG);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

/** Xóa dấu "đã xử lý" để quét lại toàn bộ thư mục (không xóa dữ liệu kết quả). */
function ui_resetRegistry() {
  const sh = getSheet_(SH.REGISTRY);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

function ui_openSheet(name) {
  if (Object.keys(SH).map(k => SH[k]).indexOf(name) < 0) throw new Error('Sheet không hợp lệ');
  if (name === SH.PIVOT) rebuildPivot_();
  activateSheet_(name);
  return true;
}

// ==================== LUỒNG QUÉT CHÍNH ====================

function runScan_(source) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, message: 'Đang có một lần quét khác chạy. Thử lại sau vài phút.' };
  }
  const started = Date.now();
  const runId = Utilities.formatDate(new Date(), APP_TZ, 'yyyyMMdd-HHmmss');
  try {
    ensureSheets_();
    const cfg = getConfig_();
    if (!cfg.folderId) return { ok: false, message: 'Chưa xác nhận thư mục cần quét (tab Thư mục).' };

    let folder;
    try { folder = DriveApp.getFolderById(cfg.folderId); folder.getName(); }
    catch (e) { return { ok: false, message: 'Không truy cập được thư mục Drive. Kiểm tra lại ở tab Thư mục.' }; }

    const indicators = readIndicators_();
    if (!indicators.length && !cfg.extractItems) {
      return { ok: false, message: 'Chưa có chỉ số nào được "Áp dụng" và đang tắt bóc tách hạng mục. Không có gì để đọc.' };
    }
    const providers = getProviderOrder_().filter(p => p.enabled);
    if (!providers.length) return { ok: false, message: 'Chưa bật API nào (tab API).' };

    const registry = readRegistry_();
    const pending = filterPending_(listPdfFiles_(folder, cfg.includeSubfolders), registry)
      .sort((a, b) => a.getLastUpdated() - b.getLastUpdated()); // cũ trước, mới sau

    if (!pending.length) {
      deleteTriggersFor_('continueScan');
      writeLog_({ runId: runId, source: source, file: '-', provider: '-', model: '-', result: 'KHÔNG CÓ FILE MỚI', sec: 0, detail: 'Thư mục: ' + cfg.folderName });
      return { ok: true, processed: 0, message: 'Không có file PDF mới cần đọc.' };
    }

    const prompt = buildPrompt_(indicators, cfg.extractItems);
    const done = [];
    let remaining = 0;

    for (let i = 0; i < pending.length; i++) {
      if (Date.now() - started > LIMITS.RUN_BUDGET_MS) { remaining = pending.length - i; break; }
      const file = pending[i];
      const res = processFile_(file, { runId: runId, source: source, prompt: prompt, indicators: indicators, providers: providers, extractItems: cfg.extractItems });
      updateRegistry_(file, res, registry);
      done.push({ name: file.getName(), ok: res.ok, provider: res.providerLabel || '', found: res.found, total: indicators.length, error: res.error || '' });
    }

    if (remaining > 0) {
      deleteTriggersFor_('continueScan');
      ScriptApp.newTrigger('continueScan').timeBased().after(LIMITS.CONTINUE_AFTER_MS).create();
    } else {
      deleteTriggersFor_('continueScan');
    }

    if (done.some(d => d.ok)) rebuildPivot_();
    if (cfg.notifyEmail && done.length) sendSummaryEmail_(cfg.notifyEmail, source, done, remaining);

    const okCount = done.filter(d => d.ok).length;
    let msg = 'Đã đọc ' + okCount + '/' + done.length + ' file.';
    if (done.length - okCount) msg += ' ' + (done.length - okCount) + ' file lỗi (xem Nhật ký API).';
    if (remaining) msg += ' Còn ' + remaining + ' file, sẽ tự chạy tiếp sau ' + (LIMITS.CONTINUE_AFTER_MS / 60000) + ' phút.';
    return { ok: true, processed: done.length, remaining: remaining, details: done, message: msg };
  } catch (e) {
    writeLog_({ runId: runId, source: source, file: '-', provider: '-', model: '-', result: 'LỖI HỆ THỐNG', sec: (Date.now() - started) / 1000, detail: e.message });
    return { ok: false, message: 'Lỗi: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/** Đọc 1 file: thử lần lượt các API theo thứ tự ưu tiên tới khi có kết quả hợp lệ. */
function processFile_(file, ctx) {
  const fileName = file.getName();
  const blob = file.getBlob();
  const sizeMB = file.getSize() / 1048576;
  let base64 = null;
  let text = null;
  let textError = null;
  let chosen = null;
  let fallback = null;
  let lastError = '';

  for (const p of ctx.providers) {
    const def = PROVIDERS[p.id];
    const keys = getKeys_(p.id);
    const logBase = { runId: ctx.runId, source: ctx.source, file: fileName, provider: def.label, model: p.model };

    if (!keys) {
      writeLog_(Object.assign({}, logBase, { result: 'BỎ QUA', sec: 0, detail: 'Chưa nhập API key' }));
      continue;
    }

    // Chuẩn bị dữ liệu đầu vào theo loại API
    let doc;
    let readNote = '';
    if (def.input === 'pdf') {
      if (sizeMB > LIMITS.MAX_INLINE_PDF_MB) {
        writeLog_(Object.assign({}, logBase, { result: 'BỎ QUA', sec: 0, detail: 'PDF ' + sizeMB.toFixed(1) + ' MB vượt ' + LIMITS.MAX_INLINE_PDF_MB + ' MB' }));
        continue;
      }
      if (!base64) base64 = Utilities.base64Encode(blob.getBytes());
      doc = { base64: base64 };
    } else {
      if (text === null && !textError) {
        try { text = extractTextFromPdf_(blob, fileName); }
        catch (e) { textError = 'Không trích được văn bản: ' + e.message; }
      }
      if (textError) { writeLog_(Object.assign({}, logBase, { result: 'BỎ QUA', sec: 0, detail: textError })); continue; }
      if (text.length < LIMITS.MIN_TEXT_CHARS) {
        writeLog_(Object.assign({}, logBase, { result: 'BỎ QUA', sec: 0, detail: 'PDF gần như không có chữ (' + text.length + ' ký tự) – có thể là bản scan' }));
        continue;
      }
      const sent = text.slice(0, def.textLimit);
      if (sent.length < text.length) readNote = ' – chỉ đọc ' + Math.round(sent.length / text.length * 100) + '% văn bản';
      doc = { text: sent };
    }

    const t0 = Date.now();
    try {
      const raw = def.call(p.model, keys, ctx.prompt, doc);
      const parsed = parseAiJson_(raw);
      const norm = normalizeResult_(parsed, ctx.indicators, ctx.extractItems);
      const sec = (Date.now() - t0) / 1000;
      const summary = 'Tìm thấy ' + norm.found + '/' + ctx.indicators.length + ' chỉ số' +
        (ctx.extractItems ? ', ' + norm.items.length + ' hạng mục' : '') + readNote;

      if (norm.found > 0 || norm.items.length > 0) {
        writeLog_(Object.assign({}, logBase, { result: 'THÀNH CÔNG', sec: sec, detail: summary }));
        chosen = { norm: norm, providerLabel: def.label + ' · ' + p.model + readNote };
        break;
      }
      writeLog_(Object.assign({}, logBase, { result: 'KHÔNG CÓ DỮ LIỆU', sec: sec, detail: summary + ' → thử API tiếp theo' }));
      if (!fallback) fallback = { norm: norm, providerLabel: def.label + ' · ' + p.model + readNote };
    } catch (e) {
      lastError = def.label + ': ' + e.message;
      writeLog_(Object.assign({}, logBase, { result: 'LỖI', sec: (Date.now() - t0) / 1000, detail: e.message }));
    }
  }

  // Không API nào tìm thấy chỉ số -> chấp nhận kết quả "không tìm thấy" (báo cáo thật sự không có)
  if (!chosen && fallback) chosen = fallback;
  if (!chosen) return { ok: false, found: 0, error: lastError || 'Không có API nào khả dụng' };

  writeResults_(file, chosen.norm, chosen.providerLabel, ctx.extractItems);
  return { ok: true, found: chosen.norm.found, providerLabel: chosen.providerLabel };
}

// ==================== PROMPT & XỬ LÝ KẾT QUẢ ====================

function buildPrompt_(indicators, extractItems) {
  const list = indicators.map(ind => ({ id: ind.id, ten: ind.name, moTa: ind.desc, donVi: ind.unit }));
  const lines = [
    'Bạn là Kỹ sư Quản lý dự án xây dựng, đại diện Chủ đầu tư. Tài liệu đính kèm là một báo cáo bất kỳ',
    '(báo cáo tuần/tháng của nhà thầu, tư vấn giám sát, biên bản họp, báo cáo tài chính, ...).',
    'Báo cáo KHÔNG theo khuôn mẫu cố định: hãy đọc toàn bộ nội dung, bảng biểu, biểu đồ, phụ lục để tìm thông tin.',
    '',
    'THÔNG TIN CHUNG: xác định tên báo cáo, kỳ báo cáo (từ ngày – đến ngày, hoặc tuần/tháng số mấy), ngày lập, đơn vị lập.'
  ];

  if (list.length) {
    lines.push(
      '',
      'NHIỆM VỤ 1 – TÌM CÁC CHỈ SỐ SAU (JSON):',
      JSON.stringify(list),
      '',
      'Quy tắc cho từng chỉ số:',
      '- Chỉ lấy thông tin CÓ TRONG TÀI LIỆU. Tuyệt đối không bịa, không suy đoán. Được phép nhận diện chỉ số dù tài liệu dùng tên gọi khác, tiếng Anh hoặc viết tắt (vd: "Actual progress", "Plan", "Manpower", "NCR").',
      '- Nếu tìm thấy: trangThai = "TIM_THAY", giaTri = số liệu/nội dung ngắn gọn, đầy đủ (nếu có nhiều giá trị như kế hoạch/thực tế, theo từng block/hạng mục thì ghi gộp, ngăn cách bằng "; ").',
      '- Nếu tài liệu có thông tin liên quan nhưng không rõ ràng, mâu thuẫn hoặc phải tự tính: trangThai = "CAN_KIEM_TRA", ghi giá trị và lý do trong giaTri.',
      '- Nếu KHÔNG có trong tài liệu: trangThai = "KHONG_TIM_THAY", giaTri = "".',
      '- donVi: đơn vị thực tế của giá trị tìm được. trichDan: câu/dòng nguyên văn làm căn cứ (tối đa 200 ký tự). trang: số trang nếu xác định được, không thì "".',
      '- Phải trả về ĐỦ tất cả chỉ số trong danh sách, giữ nguyên "id".'
    );
  }

  if (extractItems) {
    lines.push(
      '',
      'NHIỆM VỤ 2 – BÓC TÁCH CÁC HẠNG MỤC CÔNG VIỆC / VẤN ĐỀ CHÍNH trong báo cáo, mỗi phần tử gồm:',
      'hangMuc (tên hạng mục/vấn đề), donVi (nhà thầu/tư vấn chịu trách nhiệm), noiDung (nội dung chi tiết & đánh giá, kèm số liệu),',
      'giaiPhap (đề xuất giải pháp/tiến độ thực hiện), ghiChu (ghi chú quan trọng/vướng mắc). Không có thông tin thì để "".'
    );
  }

  lines.push(
    '',
    'ĐỊNH DẠNG TRẢ VỀ: CHỈ MỘT đối tượng JSON hợp lệ, không markdown, không giải thích:',
    '{',
    '  "thongTinBaoCao": {"tenBaoCao": "", "kyBaoCao": "", "ngayLap": "", "donViLap": ""},',
    '  "chiSo": [{"id": 1, "ten": "", "giaTri": "", "donVi": "", "trangThai": "TIM_THAY|CAN_KIEM_TRA|KHONG_TIM_THAY", "trichDan": "", "trang": ""}],',
    '  "hangMuc": [{"hangMuc": "", "donVi": "", "noiDung": "", "giaiPhap": "", "ghiChu": ""}]',
    '}'
  );
  if (!list.length) lines.push('("chiSo" để mảng rỗng.)');
  if (!extractItems) lines.push('("hangMuc" để mảng rỗng.)');
  return lines.join('\n');
}

/** Bóc JSON từ câu trả lời của AI (chịu được ```json ... ``` hoặc lời dẫn). */
function parseAiJson_(raw) {
  if (raw === null || raw === undefined) throw new Error('AI trả về rỗng');
  if (typeof raw === 'object') return raw;
  let s = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try { return JSON.parse(s.substring(first, last + 1)); } catch (e) { /* thử dạng mảng bên dưới */ }
  }
  const a = s.indexOf('[');
  const b = s.lastIndexOf(']');
  if (a !== -1 && b > a) {
    const arr = JSON.parse(s.substring(a, b + 1));
    return { chiSo: [], hangMuc: arr };
  }
  throw new Error('Không đọc được JSON (có thể kết quả bị cắt): ' + s.slice(0, 120));
}

/** Chuẩn hóa: đảm bảo MỌI chỉ số đều có dòng; chỉ số AI bỏ sót => "Không tìm thấy". */
function normalizeResult_(parsed, indicators, extractItems) {
  const info = parsed.thongTinBaoCao || {};
  const period = [info.kyBaoCao, info.ngayLap ? 'lập ' + info.ngayLap : ''].filter(Boolean).join(' – ') || '';
  const aiList = Array.isArray(parsed.chiSo) ? parsed.chiSo : [];

  const byId = {};
  const byName = {};
  aiList.forEach(x => {
    if (!x || typeof x !== 'object') return;
    if (x.id !== undefined && x.id !== null) byId[String(x.id)] = x;
    if (x.ten) byName[normText_(x.ten)] = x;
  });

  let found = 0;
  const rows = indicators.map(ind => {
    const x = byId[String(ind.id)] || byName[normText_(ind.name)];
    if (!x) return { ind: ind, value: '', unit: ind.unit, status: STATUS.NOT_FOUND, quote: 'AI không trả về chỉ số này', page: '' };
    const value = toText_(x.giaTri);
    const st = String(x.trangThai || '').toUpperCase();
    let status;
    if (st.indexOf('KHONG') >= 0 || st.indexOf('NOT') >= 0 || !value) status = STATUS.NOT_FOUND;
    else if (st.indexOf('KIEM') >= 0 || st.indexOf('CHECK') >= 0) status = STATUS.CHECK;
    else status = STATUS.FOUND;
    if (status !== STATUS.NOT_FOUND) found++;
    return {
      ind: ind,
      value: status === STATUS.NOT_FOUND ? '' : value,
      unit: toText_(x.donVi) || ind.unit,
      status: status,
      quote: status === STATUS.NOT_FOUND ? '' : toText_(x.trichDan).slice(0, 300),
      page: toText_(x.trang)
    };
  });

  const items = !extractItems ? [] : (Array.isArray(parsed.hangMuc) ? parsed.hangMuc : [])
    .filter(it => it && typeof it === 'object' && (it.hangMuc || it.noiDung))
    .map(it => ({
      hangMuc: toText_(it.hangMuc), donVi: toText_(it.donVi), noiDung: toText_(it.noiDung),
      giaiPhap: toText_(it.giaiPhap), ghiChu: toText_(it.ghiChu)
    }));

  return { period: period, reportName: toText_(info.tenBaoCao), rows: rows, items: items, found: found };
}

function writeResults_(file, norm, providerLabel, extractItems) {
  const now = new Date();
  const link = '=HYPERLINK("' + file.getUrl() + '","' + file.getName().replace(/"/g, '""') + '")';
  const period = norm.period || '(không xác định)';

  if (norm.rows.length) {
    const rows = norm.rows.map(r => [
      now, link, period, r.ind.name,
      r.status === STATUS.NOT_FOUND ? 'Không có' : r.value,
      r.unit, r.status, r.quote, r.page, providerLabel, file.getId()
    ]);
    const sh = getSheet_(SH.RESULTS);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.RESULTS.length).setValues(rows);
  }

  if (extractItems) {
    const items = norm.items.length ? norm.items : [{ hangMuc: 'Không tìm thấy hạng mục/vấn đề nào', donVi: '', noiDung: '', giaiPhap: '', ghiChu: '' }];
    const rows = items.map(it => [now, link, period, it.hangMuc || 'N/A', it.donVi || 'Không có', it.noiDung || 'Không có', it.giaiPhap || 'Không có', it.ghiChu || '', providerLabel]);
    const sh = getSheet_(SH.ITEMS);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.ITEMS.length).setValues(rows);
  }
}

/** Bảng so sánh: mỗi dòng = 1 báo cáo (lần đọc mới nhất), mỗi cột = 1 chỉ số → theo dõi xu hướng qua các tuần. */
function rebuildPivot_() {
  const res = getSheet_(SH.RESULTS);
  const pivot = getSheet_(SH.PIVOT);
  pivot.clear();
  if (res.getLastRow() < 2) {
    pivot.getRange(1, 1).setValue('Chưa có dữ liệu. Hãy quét PDF trước.');
    return;
  }
  const data = res.getRange(2, 1, res.getLastRow() - 1, HEADERS.RESULTS.length).getValues();
  const display = res.getRange(2, 2, res.getLastRow() - 1, 1).getDisplayValues();

  const colNames = readIndicators_().map(i => i.name);
  const reports = {}; // fileId -> {time, name, period, values{}}
  data.forEach((r, i) => {
    const fileId = r[10];
    const time = r[0] instanceof Date ? r[0].getTime() : 0;
    let rep = reports[fileId];
    if (!rep || time > rep.time) {
      rep = reports[fileId] = { time: time, timeObj: r[0], name: display[i][0], period: r[2], values: {} };
    }
    if (time === rep.time) {
      const name = r[3];
      if (colNames.indexOf(name) < 0) colNames.push(name);
      rep.values[name] = r[6] === STATUS.NOT_FOUND ? 'Không tìm thấy' : [r[4], r[5]].filter(Boolean).join(' ') + (r[6] === STATUS.CHECK ? ' (⚠️ cần kiểm tra)' : '');
    }
  });

  const header = ['Tên file', 'Kỳ / Ngày báo cáo', 'Thời gian quét'].concat(colNames);
  const rows = Object.keys(reports)
    .map(k => reports[k])
    .sort((a, b) => a.time - b.time)
    .map(rep => [rep.name, rep.period, rep.timeObj].concat(colNames.map(c => rep.values[c] !== undefined ? rep.values[c] : '—')));

  pivot.getRange(1, 1, 1, header.length).setValues([header]);
  if (rows.length) pivot.getRange(2, 1, rows.length, header.length).setValues(rows);
  styleHeader_(pivot, header.length);
  pivot.setFrozenColumns(2);
  pivot.getRange(1, 1, rows.length + 1, header.length).setWrap(true).setVerticalAlignment('top');
  pivot.setColumnWidths(1, header.length, 180);
  if (rows.length) {
    const rule = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Không tìm thấy')
      .setFontColor('#9aa0a6').setItalic(true).setRanges([pivot.getRange(2, 4, rows.length, Math.max(1, colNames.length))]).build();
    pivot.setConditionalFormatRules([rule]);
  }
}

// ==================== CÁC HÀM GỌI API ====================
// Chữ ký chung: call(model, keys, prompt, doc) ; doc = {base64} | {text} | null

function callClaude_(model, keys, prompt, doc) {
  const content = [];
  if (doc && doc.base64) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.base64 } });
  content.push({ type: 'text', text: withText_(prompt, doc) });
  const r = postJson_('https://api.anthropic.com/v1/messages',
    { 'x-api-key': keys.KEY_CLAUDE, 'anthropic-version': '2023-06-01' },
    { model: model, max_tokens: 16000, messages: [{ role: 'user', content: content }] });
  if (r.code !== 200) throw new Error(apiError_(r));
  if (r.json.stop_reason === 'max_tokens') throw new Error('Kết quả bị cắt do vượt max_tokens');
  return (r.json.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
}

function callGemini_(model, keys, prompt, doc) {
  const parts = [{ text: withText_(prompt, doc) }];
  if (doc && doc.base64) parts.push({ inline_data: { mime_type: 'application/pdf', data: doc.base64 } });
  const r = postJson_('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    { 'x-goog-api-key': keys.KEY_GEMINI },
    { contents: [{ parts: parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 32768, responseMimeType: doc ? 'application/json' : 'text/plain' } });
  if (r.code !== 200 || !r.json.candidates || !r.json.candidates.length) throw new Error(apiError_(r));
  const cand = r.json.candidates[0];
  if (cand.finishReason === 'MAX_TOKENS') throw new Error('Kết quả bị cắt do vượt maxOutputTokens');
  return ((cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
}

function callOpenRouter_(model, keys, prompt, doc) {
  const r = postJson_('https://openrouter.ai/api/v1/chat/completions',
    { Authorization: 'Bearer ' + keys.KEY_OPENROUTER, 'X-Title': 'AI Bao Cao PDF' },
    { model: model, temperature: 0.1, max_tokens: 16000, messages: [{ role: 'user', content: withText_(prompt, doc) }] });
  return chatCompletionText_(r);
}

function callGroq_(model, keys, prompt, doc) {
  const payload = { model: model, temperature: 0.1, max_tokens: 8000, messages: [{ role: 'user', content: withText_(prompt, doc) }] };
  if (doc) payload.response_format = { type: 'json_object' };
  const r = postJson_('https://api.groq.com/openai/v1/chat/completions', { Authorization: 'Bearer ' + keys.KEY_GROQ }, payload);
  return chatCompletionText_(r);
}

function callCloudflare_(model, keys, prompt, doc) {
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(keys.KEY_CLOUDFLARE_ACCOUNT) + '/ai/run/' + model;
  const r = postJson_(url, { Authorization: 'Bearer ' + keys.KEY_CLOUDFLARE_TOKEN }, {
    messages: [
      { role: 'system', content: 'Bạn là trợ lý bóc tách dữ liệu báo cáo dự án, chỉ trả về JSON thuần túy.' },
      { role: 'user', content: withText_(prompt, doc) }
    ],
    max_tokens: 4096, temperature: 0.1
  });
  if (r.code !== 200 || !r.json.success) throw new Error(apiError_(r));
  const out = r.json.result && r.json.result.response;
  return typeof out === 'string' ? out : JSON.stringify(out);
}

function chatCompletionText_(r) {
  if (r.code !== 200 || !r.json.choices || !r.json.choices.length) throw new Error(apiError_(r));
  const ch = r.json.choices[0];
  if (ch.finish_reason === 'length') throw new Error('Kết quả bị cắt do vượt max_tokens');
  return (ch.message && ch.message.content) || '';
}

function withText_(prompt, doc) {
  return doc && doc.text ? prompt + '\n\n=== NỘI DUNG BÁO CÁO (văn bản trích từ PDF) ===\n' + doc.text : prompt;
}

function postJson_(url, headers, payload) {
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', headers: headers,
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  const text = res.getContentText();
  let json = {};
  try { json = JSON.parse(text); } catch (e) { json = {}; }
  return { code: res.getResponseCode(), json: json, text: text };
}

function apiError_(r) {
  const j = r.json || {};
  let msg = (j.error && (j.error.message || (typeof j.error === 'string' ? j.error : ''))) ||
    (Array.isArray(j.errors) && j.errors.length ? j.errors.map(e => e.message || JSON.stringify(e)).join('; ') : '') ||
    (j.promptFeedback && j.promptFeedback.blockReason ? 'Bị chặn: ' + j.promptFeedback.blockReason : '') ||
    String(r.text || '').slice(0, 300);
  return 'HTTP ' + r.code + ' – ' + msg;
}

// ==================== TRÍCH VĂN BẢN TỪ PDF (cho API dạng text) ====================

/** Upload PDF thành Google Docs tạm (Drive tự OCR), đọc chữ rồi xóa file tạm. */
function extractTextFromPdf_(pdfBlob, fileName) {
  const boundary = '-------pdfai' + Date.now();
  const metadata = { name: 'temp_ocr_' + Date.now() + '_' + fileName, mimeType: 'application/vnd.google-apps.document' };
  const body = Utilities.newBlob(
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
    '\r\n--' + boundary + '\r\nContent-Type: application/pdf\r\n\r\n'
  ).getBytes().concat(pdfBlob.getBytes()).concat(Utilities.newBlob('\r\n--' + boundary + '--').getBytes());

  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=vi&fields=id', {
    method: 'post',
    contentType: 'multipart/related; boundary=' + boundary,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: body,
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Drive HTTP ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200));
  const tempId = JSON.parse(res.getContentText()).id;
  try {
    return DocumentApp.openById(tempId).getBody().getText();
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (e) { /* bỏ qua */ }
  }
}

// ==================== DRIVE & DANH SÁCH ĐÃ XỬ LÝ ====================

function listPdfFiles_(folder, recursive) {
  const out = [];
  const it = folder.getFilesByType(MimeType.PDF);
  while (it.hasNext()) out.push(it.next());
  if (recursive) {
    const subs = folder.getFolders();
    while (subs.hasNext()) Array.prototype.push.apply(out, listPdfFiles_(subs.next(), true));
  }
  return out;
}

function readRegistry_() {
  const sh = getSheet_(SH.REGISTRY);
  const map = {};
  if (sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.REGISTRY.length).getValues().forEach((r, i) => {
    map[String(r[0])] = { row: i + 2, updated: Number(r[2]) || 0, status: r[5], fails: Number(r[6]) || 0 };
  });
  return map;
}

/** File cần quét: chưa từng quét, hoặc đã được cập nhật phiên bản mới, hoặc lỗi chưa quá MAX_FAILS lần. */
function filterPending_(files, registry) {
  return files.filter(f => {
    const reg = registry[f.getId()];
    if (!reg) return true;
    if (reg.updated !== f.getLastUpdated().getTime()) return true;
    if (reg.status === 'OK') return false;
    return reg.fails < LIMITS.MAX_FAILS;
  });
}

function updateRegistry_(file, res, registry) {
  const sh = getSheet_(SH.REGISTRY);
  const id = file.getId();
  const updated = file.getLastUpdated().getTime(); // lưu dạng số (ms) để Sheets không tự đổi sang ngày
  const prev = registry[id];
  const sameVersion = prev && prev.updated === updated;
  const fails = res.ok ? 0 : (sameVersion ? prev.fails : 0) + 1;
  const row = [id, file.getName(), updated, new Date(), res.providerLabel || '', res.ok ? 'OK' : 'LỖI', fails, res.ok ? res.found : ''];
  let rowIndex;
  if (prev) {
    rowIndex = prev.row;
    sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
    rowIndex = sh.getLastRow();
  }
  registry[id] = { row: rowIndex, updated: updated, status: row[5], fails: fails };
}

// ==================== CẤU HÌNH ====================

function getConfig_() {
  const p = PropertiesService.getDocumentProperties().getProperties();
  return {
    folderId: p.FOLDER_ID || '',
    folderName: p.FOLDER_NAME || '',
    includeSubfolders: p.INCLUDE_SUBFOLDERS === '1',
    extractItems: p.EXTRACT_ITEMS !== '0', // mặc định bật
    notifyEmail: p.NOTIFY_EMAIL || ''
  };
}

function getProviderOrder_() {
  let saved = [];
  try { saved = JSON.parse(PropertiesService.getDocumentProperties().getProperty('PROVIDERS') || '[]'); } catch (e) { saved = []; }
  const out = [];
  saved.forEach(s => { if (PROVIDERS[s.id] && !out.some(o => o.id === s.id)) out.push({ id: s.id, enabled: s.enabled !== false, model: s.model || PROVIDERS[s.id].defaultModel }); });
  DEFAULT_ORDER.forEach(id => { if (!out.some(o => o.id === id)) out.push({ id: id, enabled: true, model: PROVIDERS[id].defaultModel }); });
  return out;
}

function getSchedule_() {
  try {
    const s = JSON.parse(PropertiesService.getDocumentProperties().getProperty('SCHEDULE') || 'null');
    if (s) return s;
  } catch (e) { /* mặc định */ }
  return { enabled: false, weekday: 'FRIDAY', hour: 5 };
}

/** Trả về object key của provider, hoặc null nếu thiếu key. */
function getKeys_(providerId) {
  const up = PropertiesService.getUserProperties();
  const out = {};
  for (const k of PROVIDERS[providerId].keys) {
    const v = up.getProperty(k.prop);
    if (!v) return null;
    out[k.prop] = v;
  }
  return out;
}

function isKnownKeyProp_(prop) {
  return Object.keys(PROVIDERS).some(id => PROVIDERS[id].keys.some(k => k.prop === prop));
}

function readIndicators_() {
  const sh = getSheet_(SH.INDICATORS);
  if (sh.getLastRow() < 2) return [];
  const out = [];
  sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.INDICATORS.length).getValues().forEach((r, i) => {
    const name = String(r[1] || '').trim();
    if (!name || r[4] !== true) return;
    out.push({ id: i + 1, name: name, desc: String(r[2] || '').trim(), unit: String(r[3] || '').trim() });
  });
  return out;
}

// ==================== SHEET HELPERS ====================

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const make = (name, headers, widths) => {
    let sh = ss.getSheetByName(name);
    const isNew = !sh;
    if (isNew) sh = ss.insertSheet(name);
    if (isNew || sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeader_(sh, headers.length);
      (widths || []).forEach((w, i) => sh.setColumnWidth(i + 1, w));
    }
    return { sh: sh, isNew: isNew };
  };

  const ind = make(SH.INDICATORS, HEADERS.INDICATORS, [50, 240, 420, 120, 80]);
  if (ind.isNew) {
    const rows = DEFAULT_INDICATORS.map((r, i) => [i + 1, r[0], r[1], r[2], true]);
    ind.sh.getRange(2, 1, rows.length, 5).setValues(rows);
    ind.sh.getRange(2, 5, 200, 1).insertCheckboxes();
    ind.sh.getRange(2, 3, 200, 1).setWrap(true);
    ind.sh.setFrozenRows(1);
  }
  make(SH.RESULTS, HEADERS.RESULTS, [140, 220, 160, 200, 260, 90, 130, 300, 60, 220, 120]);
  make(SH.ITEMS, HEADERS.ITEMS, [140, 220, 160, 220, 160, 360, 260, 220, 200]);
  make(SH.PIVOT, ['Tên file', 'Kỳ / Ngày báo cáo', 'Thời gian quét']);
  make(SH.LOG, HEADERS.LOG, [140, 120, 170, 220, 160, 200, 130, 90, 420]);
  const reg = make(SH.REGISTRY, HEADERS.REGISTRY);
  if (reg.isNew) reg.sh.hideSheet();

  const res = ss.getSheetByName(SH.RESULTS);
  if (res.getConditionalFormatRules().length === 0) {
    const r = res.getRange('G2:G');
    res.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.FOUND).setBackground('#e6f4ea').setRanges([r]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.NOT_FOUND).setBackground('#fce8e6').setRanges([r]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.CHECK).setBackground('#fef7e0').setRanges([r]).build()
    ]);
  }
  const log = ss.getSheetByName(SH.LOG);
  if (log.getConditionalFormatRules().length === 0) {
    const r = log.getRange('G2:G');
    log.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('THÀNH CÔNG').setBackground('#e6f4ea').setRanges([r]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('LỖI').setBackground('#fce8e6').setRanges([r]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('BỎ QUA').setFontColor('#9aa0a6').setRanges([r]).build()
    ]);
  }
}

function styleHeader_(sh, n) {
  sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#1f3b57').setFontColor('#ffffff').setWrap(true).setVerticalAlignment('middle');
  sh.setFrozenRows(1);
}

function getSheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (sh) return sh;
  ensureSheets_();
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function activateSheet_(name) {
  const sh = getSheet_(name);
  if (sh.isSheetHidden()) sh.showSheet();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sh);
}

function writeLog_(e) {
  try {
    getSheet_(SH.LOG).appendRow([new Date(), e.runId, e.source, e.file, e.provider, e.model, e.result, Math.round((e.sec || 0) * 10) / 10, String(e.detail || '').slice(0, 1000)]);
  } catch (err) {
    console.error('Không ghi được nhật ký: ' + err.message);
  }
}

// ==================== TIỆN ÍCH ====================

function deleteTriggersFor_(handler) {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t); });
}

function parseFolderId_(input) {
  const s = String(input || '').trim();
  let m = s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{10,}$/.test(s) ? s : '';
}

function maskKey_(v) {
  if (!v) return '';
  return v.length <= 8 ? '••••' : '••••' + v.slice(-4);
}

function normText_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
}

function toText_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).trim();
}

function sendSummaryEmail_(to, source, done, remaining) {
  try {
    const rows = done.map(d => '<tr><td>' + escHtml_(d.name) + '</td><td>' + (d.ok ? '✅' : '❌') + '</td><td>' +
      (d.ok ? d.found + '/' + d.total : escHtml_(d.error)) + '</td><td>' + escHtml_(d.provider) + '</td></tr>').join('');
    const html = '<p>Kết quả quét báo cáo PDF (' + escHtml_(source) + '):</p>' +
      '<table border="1" cellpadding="4" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
      '<tr><th>File</th><th>Kết quả</th><th>Chỉ số tìm thấy</th><th>AI</th></tr>' + rows + '</table>' +
      (remaining ? '<p>Còn ' + remaining + ' file, hệ thống sẽ tự chạy tiếp.</p>' : '') +
      '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Mở Google Sheet</a></p>';
    MailApp.sendEmail({ to: to, subject: '[AI Báo Cáo] Đã đọc ' + done.filter(d => d.ok).length + '/' + done.length + ' file PDF', htmlBody: html });
  } catch (e) {
    console.error('Không gửi được email: ' + e.message);
  }
}

function escHtml_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
