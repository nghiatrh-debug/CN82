# Hướng Dẫn Đưa Dashboard CN8-2 Lên Google Sites

## Mục Tiêu

Đưa dashboard CN8-2 từ máy local lên internet bằng Google Apps Script Web App, sau đó nhúng vào Google Sites để cấp lãnh đạo truy cập mọi nơi.

## Bước 1. Tạo Google Apps Script Web App

1. Mở https://script.google.com.
2. Chọn New project.
3. Đặt tên: `CN8-2 Dashboard`.
4. Vào Project Settings, bật `Show appsscript.json manifest file in editor`.
5. Tạo/cập nhật các file trong Apps Script theo bộ này:
   - Copy nội dung `Code.gs` vào file `Code.gs`.
   - Tạo file HTML tên `Index`, copy nội dung `Index.html`.
   - Copy nội dung `appsscript.json` vào file manifest.
6. Bấm Save.

## Bước 2. Deploy Web App

1. Bấm Deploy > New deployment.
2. Chọn loại deployment: Web app.
3. Description: `CN8-2 dashboard MVP`.
4. Execute as: `Me`.
5. Who has access:
   - Nếu dùng nội bộ công ty: chọn domain Workspace/công ty nếu có.
   - Nếu cần demo nhanh: chọn quyền theo chính sách IT cho phép.
6. Bấm Deploy.
7. Cấp quyền Drive nếu Google yêu cầu.
8. Copy Web app URL, dạng `https://script.google.com/macros/s/.../exec`.

## Bước 3. Nhúng Vào Google Sites

1. Mở https://sites.google.com.
2. Tạo hoặc mở site `CN8-2 Project Control`.
3. Chọn Insert > Embed.
4. Chọn Embed URL.
5. Dán Web app URL.
6. Chỉnh khung nhúng cao khoảng 900-1100 px hoặc dùng full page embed.
7. Bấm Publish.
8. Cấu hình quyền xem site cho cấp lãnh đạo.

## Bước 4. Bật Cập Nhật Dữ Liệu Từ Google Drive

Bản nâng cấp này có thể đọc dữ liệu từ file JSON trên Google Drive. Khi cần cập nhật, chỉ cần thay nội dung file JSON rồi bấm nút làm mới trên dashboard.

1. Upload file `CN8-2_dashboard-data.json` lên Google Drive.
2. Không đổi tên file này.
3. Đảm bảo tài khoản deploy Apps Script có quyền đọc file.
4. Trong `Code.gs`, giữ:
   - `DASHBOARD_DATA_FILE_NAME = "CN8-2_dashboard-data.json"`
5. Nếu muốn chắc chắn chỉ đọc đúng một file, copy file ID trên Google Drive và dán vào:
   - `DASHBOARD_DATA_FILE_ID = "PASTE_FILE_ID_HERE"`
6. Deploy lại Web App một lần.

Sau bước này, các lần cập nhật sau không cần redeploy nếu chỉ đổi dữ liệu JSON.

## Bước 5. Dùng Nút Cập Nhật Trên Dashboard

1. Mở dashboard trên Google Sites.
2. Bấm nút biểu tượng `↻` ở góc phải trên.
3. Dashboard sẽ gọi Apps Script để đọc lại `CN8-2_dashboard-data.json` từ Google Drive.
4. Nếu Drive đã có dữ liệu mới, dashboard sẽ cập nhật ngay trên màn hình.

## Cách Cập Nhật File JSON Sau Này

Khi Codex hoặc máy local đã cập nhật `dashboard/data.js`, chạy:

```powershell
C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools\export-dashboard-data-json.mjs
```

Sau đó copy hoặc đồng bộ file:

```text
outputs\google-apps-script-cn8-2\CN8-2_dashboard-data.json
```

lên đúng file `CN8-2_dashboard-data.json` trên Google Drive.

## Lưu Ý Bảo Mật

Không nên để public nếu báo cáo có dữ liệu nội bộ. Nên giới hạn quyền xem theo tài khoản Google Workspace hoặc danh sách email lãnh đạo.
