window.CN8_DATA = {
  meta: {
    project: "CN8-2",
    location: "Khu A - Đô thị mới Nam Thành phố, P. Tân Hưng, TP.HCM",
    client: "Công ty TNHH Phát triển Phú Mỹ Hưng",
    consultant: "DSPCONS Việt Nam",
    contractor: "VICONS",
    latestDaily: "24/06/2026",
    latestMeeting: "25/06/2026",
    latestMonitoring: "23/06/2026",
    documentCount: 761
  },
  headline: {
    plan: 5.41,
    actual: 5.05,
    delayDays: 14,
    manpower: 56,
    trucks: 4,
    openActions: 12,
    urgentActions: 4,
    latestReportCompliance: 83
  },
  progressTrend: [
    { label: "W08", plan: 1.2, actual: 1.15 },
    { label: "W09", plan: 1.8, actual: 1.72 },
    { label: "W10", plan: 2.5, actual: 2.38 },
    { label: "W11", plan: 3.3, actual: 3.12 },
    { label: "W12", plan: 4.2, actual: 3.94 },
    { label: "W13", plan: 5.41, actual: 5.05 }
  ],
  zones: [
    { zone: "Zone A", excavation: 10, shoring: 0, targetExcavation: 14, targetShoring: 0, status: "critical" },
    { zone: "Zone B", excavation: 75, shoring: 30, targetExcavation: 77, targetShoring: 35, status: "watch" },
    { zone: "Zone C", excavation: 98, shoring: 57, targetExcavation: 99, targetShoring: 65, status: "watch" }
  ],
  workforce: [
    { label: "BCH Vicons", value: 14 },
    { label: "Shoring", value: 9 },
    { label: "Công nhân", value: 15 },
    { label: "Đào đất", value: 13 },
    { label: "Khác", value: 5 }
  ],
  actions: [
    {
      id: "A-01", discipline: "Tiến độ", title: "Trình biện pháp thi công đào đất lớp 3",
      owner: "VICONS", due: "23/06/2026", status: "overdue", source: "Biên bản giao ban 19/06",
      note: "Chưa có bằng chứng hoàn thành trong bộ dữ liệu dashboard."
    },
    {
      id: "A-02", discipline: "HSE", title: "Thi công mặt bằng chứa rác thải",
      owner: "VICONS", due: "25/06/2026", status: "due", source: "Biên bản giao ban 19/06",
      note: "Đến hạn hôm nay, cần xác nhận hiện trường."
    },
    {
      id: "A-03", discipline: "Chất lượng", title: "Trình lại kế hoạch quản lý chất lượng và HSNL",
      owner: "VICONS", due: "26/06/2026", status: "upcoming", source: "Biên bản giao ban 19/06",
      note: "TVGS yêu cầu trình lại."
    },
    {
      id: "A-04", discipline: "MEP", title: "Trình shop hệ âm sàn, âm cột, tường hầm B2",
      owner: "CSCEC / VICONS", due: "26/06/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Mốc gần, cần kiểm soát chất lượng hồ sơ trước khi trình."
    },
    {
      id: "A-05", discipline: "MEP", title: "Trình lại tiến độ vật tư sau khi TVGS trả về",
      owner: "CSCEC / VICONS", due: "26/06/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Hồ sơ đã bị trả về, cần chỉ rõ nội dung khắc phục."
    },
    {
      id: "A-06", discipline: "Nhân lực", title: "Trình biểu đồ nhân lực thi công MEP",
      owner: "CSCEC / VICONS", due: "27/06/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Cần đối chiếu với tiến độ tích hợp."
    },
    {
      id: "A-07", discipline: "MEP", title: "Combine bản vẽ phối hợp 2D hầm B2 và tải lên nhóm",
      owner: "CSCEC", due: "29/06/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Đầu vào quan trọng cho triển khai hầm."
    },
    {
      id: "A-08", discipline: "Báo cáo", title: "Cập nhật form mẫu mới và trình lại TVGS",
      owner: "VICONS", due: "01/07/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Áp dụng cho báo cáo ngày, tuần và tháng."
    },
    {
      id: "A-09", discipline: "Vật tư", title: "Nhập vật tư chống sét, tiếp địa, ống thoát và ống PVC",
      owner: "CSCEC / VICONS", due: "03/07/2026", status: "upcoming", source: "Biên bản MEP 25/06",
      note: "Cần liên kết trạng thái phê duyệt vật tư."
    },
    {
      id: "A-10", discipline: "Quan trắc", title: "Xác nhận dời xe và giảm tải khu vực Tôn Dật Tiên",
      owner: "VICONS / TVGS", due: "19/06/2026", status: "overdue", source: "Biên bản giao ban 19/06",
      note: "Vị trí từng ghi nhận chuyển vị tường vây 23,4 mm."
    }
  ],
  monitoring: [
    { point: "IN6", value: 37.5, cycle: "CK12", date: "23/06/2026", status: "highest", trend: [19, 24, 29, 33, 36, 37.5] },
    { point: "IN5", value: 22.9, cycle: "CK12", date: "23/06/2026", status: "review", trend: [14, 17, 19, 21, 22.4, 22.9] },
    { point: "IN4", value: 21.3, cycle: "CK12", date: "23/06/2026", status: "review", trend: [13, 16, 18, 20, 21.1, 21.3] },
    { point: "IN3", value: 19.6, cycle: "CK10", date: "23/06/2026", status: "normal", trend: [8, 11, 14, 17, 19.2, 19.6] },
    { point: "IN8", value: 17.0, cycle: "CK12", date: "23/06/2026", status: "normal", trend: [9, 12, 14, 16, 16.8, 17.0] },
    { point: "IN7", value: 15.9, cycle: "CK12", date: "23/06/2026", status: "normal", trend: [8, 10, 12, 14, 15.7, 15.9] },
    { point: "IN2", value: 14.7, cycle: "CK12", date: "23/06/2026", status: "normal", trend: [7, 9, 11, 13, 14.4, 14.7] },
    { point: "IN1", value: 9.9, cycle: "CK12", date: "23/06/2026", status: "normal", trend: [4, 6, 7, 8, 9.8, 9.9] }
  ],
  lookahead: {
    source: {
      name: "CN8-2-VC-Civil-DS-13rev03 - Overall Construction Schedule Rev01",
      approval: "Đã duyệt SPM ngày 11/05/2026",
      scheduleDate: "23/04/2026",
      path: "G:\\My Drive\\06. Main construction\\01. Contract - Schedule\\CN8-2-VC-Civil-DS-13rev03-Tiến độ thi công rev01 (đã duyệt SPM).pdf"
    },
    weeks: [
      {
        id: "W1", label: "Tuần 1", range: "25/06 - 01/07", status: "recovery",
        objective: "Khôi phục trình tự đào đất - shoring và tạo mặt bằng chuyển sang đáy móng.",
        tasks: [
          { zone: "Zone C", task: "Hoàn tất shoring lớp 3 và đào đến đáy móng", start: "19/06", finish: "02/07", target: "Sẵn sàng bàn giao đáy móng", risk: "high" },
          { zone: "Zone B", task: "Hoàn tất shoring lớp 3 và đào đến đáy móng", start: "22/06", finish: "03/07", target: "Đào đáy móng đạt khối lượng chính", risk: "high" },
          { zone: "Zone A", task: "Hoàn tất shoring lớp 3, triển khai đào đáy móng", start: "23/06", finish: "06/07", target: "Bảo đảm đường tiếp cận và tăng tốc đào", risk: "critical" },
          { zone: "Chung", task: "Chuẩn bị hồ sơ, nhân lực, vật tư cho kết cấu móng và MEP", start: "25/06", finish: "01/07", target: "Không để chờ hồ sơ khi bàn giao mặt bằng", risk: "watch" }
        ],
        gates: ["Shoring lớp 3 được nghiệm thu", "Cao độ đáy đào được xác nhận", "Shopdrawing/BPTC móng và MEP sẵn sàng"]
      },
      {
        id: "W2", label: "Tuần 2", range: "02/07 - 08/07", status: "milestone",
        objective: "Đóng các mốc đào đáy móng và khởi động kết cấu móng, MEP tại cả ba Zone.",
        tasks: [
          { zone: "Zone C", task: "Hoàn tất đào đáy móng; bắt đầu RC móng và MEP", start: "02/07", finish: "31/07", target: "Mốc đào: 02/07 · RC/MEP bắt đầu: 03/07", risk: "milestone" },
          { zone: "Zone B", task: "Hoàn tất đào đáy móng; bắt đầu RC móng và MEP", start: "03/07", finish: "28/07", target: "Mốc đào: 03/07 · RC/MEP bắt đầu: 04/07", risk: "milestone" },
          { zone: "Zone A", task: "Hoàn tất đào đáy móng; bắt đầu RC móng và MEP", start: "06/07", finish: "04/08", target: "Mốc đào: 06/07 · RC/MEP bắt đầu: 07/07", risk: "milestone" },
          { zone: "Chung", task: "Tổ chức nghiệm thu chuyển bước và bàn giao mặt bằng cuốn chiếu", start: "02/07", finish: "08/07", target: "Không gián đoạn giữa đào đất và kết cấu", risk: "watch" }
        ],
        gates: ["Zone C đóng mốc 02/07", "Zone B đóng mốc 03/07", "Zone A đóng mốc 06/07", "RC/MEP khởi động theo baseline"]
      },
      {
        id: "W3", label: "Tuần 3", range: "09/07 - 15/07", status: "production",
        objective: "Ổn định dây chuyền thi công kết cấu móng và MEP, kiểm soát sản lượng theo Zone.",
        tasks: [
          { zone: "Zone C", task: "RC pile caps - beams - slab và MEP", start: "03/07", finish: "31/07", target: "Duy trì thi công đồng thời RC/MEP, ưu tiên Zone mở sớm", risk: "normal" },
          { zone: "Zone B", task: "RC pile caps - beams - slab và MEP", start: "04/07", finish: "28/07", target: "Bám đường găng đổ bê tông Zone B ngày 28/07", risk: "normal" },
          { zone: "Zone A", task: "RC pile caps - beams - slab và MEP", start: "07/07", finish: "04/08", target: "Ổn định nhân lực và mặt bằng thi công cuốn chiếu", risk: "watch" },
          { zone: "Chung", task: "Kiểm soát hồ sơ nghiệm thu, vật tư và phối hợp MEP âm móng", start: "09/07", finish: "15/07", target: "Không phát sinh chờ việc hoặc đục sửa", risk: "watch" }
        ],
        gates: ["Sản lượng RC theo ngày được theo dõi", "MEP âm móng nghiệm thu trước bê tông", "Không phát sinh xung đột shopdrawing"]
      }
    ],
    milestones: [
      { date: "02/07", zone: "Zone C", name: "Hoàn tất đào đến đáy móng" },
      { date: "03/07", zone: "Zone C", name: "Khởi động RC móng và MEP" },
      { date: "03/07", zone: "Zone B", name: "Hoàn tất đào đến đáy móng" },
      { date: "04/07", zone: "Zone B", name: "Khởi động RC móng và MEP" },
      { date: "06/07", zone: "Zone A", name: "Hoàn tất đào đến đáy móng" },
      { date: "07/07", zone: "Zone A", name: "Khởi động RC móng và MEP" }
    ]
  },
  documents: [
    {
      type: "Biên bản họp", name: "260625-CN8-2-Biên bản họp MEP.pdf", date: "25/06/2026",
      owner: "DSPCONS", status: "Đã đọc", path: "G:\\My Drive\\06. Main construction\\10. Meeting minutes\\Họp khác\\HỌP MEP\\260625-CN8-2-Biên bản họp MEP.pdf"
    },
    {
      type: "Quan trắc", name: "INCLINOMETER - CK12.pdf", date: "25/06/2026",
      owner: "Quan trắc", status: "Cần xác nhận ngưỡng", path: "G:\\My Drive\\06. Main construction\\16. Quan trắc\\KẾT QUẢ QUAN TRẮC\\KẾT QUẢ QUAN TRẮC INCLINOMETER\\BÁO CÁO NHANH ICLINOMETER\\INCLINOMETER - CK12.pdf"
    },
    {
      type: "Quan trắc", name: "QT-lún nghiêng lân cận, lún nền đường, chuyển vị đỉnh tường - CK11.pdf", date: "25/06/2026",
      owner: "Quan trắc", status: "Mới", path: "G:\\My Drive\\06. Main construction\\16. Quan trắc\\KẾT QUẢ QUAN TRẮC\\KẾT QUẢ QUAN TRẮC LÚN NGHIÊNG LÂN CẬN, LÚN NỀN ĐƯỜNG, CHUYỂN VỊ ĐỈNH TƯỜNG\\QT-lún nghiêng lân cận, lún nền đường, chuyển vị đỉnh tường - CK11.pdf"
    },
    {
      type: "Báo cáo ngày", name: "20260624-CN8-2-Daily report.pdf", date: "24/06/2026",
      owner: "VICONS", status: "Đã trích xuất", path: "G:\\My Drive\\06. Main construction\\05. Report\\1. XÂY DỰNG\\01. Báo cáo ngày\\20260624-CN8-2-Daily report.pdf"
    },
    {
      type: "Hồ sơ kỹ thuật", name: "CN8-2-VC-Civil-DS-42rev01-Đề cương thí nghiệm kiểm tra chất lượng.pdf", date: "25/06/2026",
      owner: "VICONS", status: "Mới", path: "G:\\My Drive\\06. Main construction\\07. Document Submit"
    },
    {
      type: "Biện pháp", name: "CN8-2-VC-Civil-MOS-17rev02-Xử lý khuyết tật bê tông.pdf", date: "25/06/2026",
      owner: "VICONS", status: "Mới", path: "G:\\My Drive\\06. Main construction\\11. Method Statement"
    }
  ]
};
