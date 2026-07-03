# CN8-2 Project Control Dashboard

Dashboard điều hành dự án CN8-2 cho vai trò chủ đầu tư: theo dõi tiến độ, cam kết họp, quan trắc và kế hoạch 3 tuần.

## Cấu Trúc Chính

- `dashboard/`: website dashboard chạy local.
- `tools/`: script xuất dữ liệu và build bộ Google Apps Script.
- `outputs/google-apps-script-cn8-2/`: gói triển khai Google Apps Script Web App để nhúng vào Google Sites.

## Chạy Local

```powershell
cd dashboard
.\start-dashboard.ps1
```

Mở:

```text
http://localhost:4173
```

## Build Google Apps Script

```powershell
C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools\build-google-apps-script.mjs
```

Sau đó dùng các file trong `outputs/google-apps-script-cn8-2/` để deploy lên Google Apps Script và nhúng vào Google Sites.

## Cập Nhật Dữ Liệu JSON

```powershell
C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools\export-dashboard-data-json.mjs
```

File xuất ra:

```text
outputs/google-apps-script-cn8-2/CN8-2_dashboard-data.json
```

Upload hoặc thay thế file JSON này trên Google Drive để dashboard Google Sites đọc dữ liệu mới khi bấm nút cập nhật.
