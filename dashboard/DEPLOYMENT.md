# Triển khai CN8-2 Dashboard

## 1. Trình diễn ngay trong mạng nội bộ

Máy đang chạy website cần duy trì hoạt động và kết nối cùng mạng với người xem.

```powershell
.\start-dashboard.ps1
```

Người dùng truy cập:

```text
http://<IP-may-chu>:4173
```

IT cần kiểm tra Windows Firewall cho TCP 4173 nếu thiết bị khác không truy cập được.

## 2. Triển khai trên IIS hoặc web server nội bộ

Website hiện tại là ứng dụng tĩnh. Có thể sao chép các tệp sau vào thư mục website:

- `index.html`
- `styles.css`
- `data.js`
- `app.js`

Không cần chạy `server.mjs` khi IIS/Nginx/Apache đã phục vụ thư mục này.

Khuyến nghị:

- Chỉ cho phép truy cập qua HTTPS.
- Bật đăng nhập doanh nghiệp hoặc reverse proxy có xác thực.
- Không công khai trực tiếp website ra Internet khi chưa có phân quyền.
- Dùng tên miền nội bộ, ví dụ `https://cn8-2.company.local`.

## 3. Môi trường chính thức

Phiên bản production cần bổ sung:

1. Backend đọc Google Drive API theo tài khoản dịch vụ được phê duyệt.
2. PostgreSQL lưu snapshot, action tracker và lịch sử xác nhận.
3. Đăng nhập SSO hoặc Google Workspace của công ty.
4. Màn hình xác nhận dữ liệu trước khi công bố cho lãnh đạo.
5. Job đồng bộ theo lịch và cảnh báo khi nguồn dữ liệu chậm cập nhật.
6. Sao lưu, audit log và phân quyền theo dự án.

## 4. Dữ liệu tài chính

Chỉ mở module chi phí sau khi ánh xạ được:

- Giá trị hợp đồng và phụ lục.
- BOQ hoặc ngân sách được duyệt.
- Hồ sơ thanh toán và số đã chi.
- Variation/change order.
- Dự báo chi phí hoàn thành.
