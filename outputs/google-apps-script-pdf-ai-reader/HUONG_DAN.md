# AI Báo Cáo PDF – Hướng dẫn cài đặt (v2.0)

Google Sheet tự đọc các báo cáo PDF trong một thư mục Drive, lọc ra các **chỉ số do bạn tự khai báo** (áp dụng cho mọi loại báo cáo) và bóc tách hạng mục/vấn đề. Hệ thống thử lần lượt 5 API AI theo thứ tự ưu tiên và tự quét mỗi tuần.

## 1. Cài đặt (khoảng 5 phút)

1. Tạo một Google Sheet mới, chọn **Extensions → Apps Script**.
2. Dán toàn bộ `Code.gs` vào file `Code.gs`.
3. Bấm **+ → HTML**, đặt tên đúng là `Sidebar`, rồi dán nội dung `Sidebar.html`.
4. Vào **Project Settings** (bánh răng): đặt Time zone là `(GMT+07:00) Ho Chi Minh`. Nếu muốn, bật "Show appsscript.json" rồi dán file `appsscript.json`.
5. Lưu lại, quay về Sheet và tải lại trang (F5). Trên thanh menu sẽ xuất hiện **🚀 AI Báo Cáo**.
6. Chọn **🚀 AI Báo Cáo → 🎛️ Mở bảng điều khiển**. Lần đầu Google sẽ hỏi cấp quyền (Drive, Sheets, Docs, gọi API ngoài, trigger, gửi mail). Bấm **Allow**.

> Muốn có nút bấm ngay trên sheet: **Insert → Drawing**, vẽ một nút, bấm ⋮ trên hình → **Assign script** → nhập `moBangDieuKhien` (hoặc `quetNgay` để quét luôn).

## 2. Bảng điều khiển (sidebar)

| Tab | Nút / chức năng |
|---|---|
| ▶️ Quét | Checklist trạng thái · **BẮT ĐẦU QUÉT PDF** · mở sheet Chỉ số / Kết quả / So sánh · bật/tắt bóc tách hạng mục · email nhận tóm tắt |
| 🔑 API | Nhập/xóa key cho từng API · ▲▼ sắp **thứ tự ưu tiên** · bật/tắt từng API · đổi model · **Kiểm tra kết nối** |
| 📁 Thư mục | Dán link thư mục → **Xác nhận** (hiện tên thư mục, tổng PDF, số file chờ đọc) · tùy chọn quét thư mục con · đặt lại danh sách đã xử lý |
| ⏰ Lịch | Bật quét **hằng tuần**, chọn thứ + giờ (mặc định Thứ Sáu 05:00, giờ VN) |
| 📝 Nhật ký | 40 lần gọi API gần nhất: API nào, thành công/lỗi/bỏ qua, mất bao nhiêu giây, lý do |

## 3. Khai báo chỉ số cần lọc

Sheet **"Chỉ số cần lọc"** đã có sẵn 14 chỉ số mẫu. Bạn được sửa, xóa hoặc thêm dòng tùy ý:

| Cột | Ý nghĩa |
|---|---|
| Tên chỉ số | Tên hiển thị trong kết quả |
| Mô tả / gợi ý | Mô tả càng rõ, AI tìm càng chính xác. Có thể ghi cả tên tiếng Anh/viết tắt hay gặp, ví dụ "Manpower, nhân lực, số công nhân" |
| Đơn vị mong muốn | Ví dụ %, ngày, m3, VNĐ |
| Áp dụng | Bỏ tick để tạm không lọc chỉ số đó |

Mỗi chỉ số nhận một trong ba trạng thái:
- **✅ Tìm thấy**: kèm giá trị, đơn vị, trích dẫn nguyên văn và số trang.
- **⚠️ Cần kiểm tra**: báo cáo có thông tin nhưng không rõ ràng, mâu thuẫn hoặc phải tự tính.
- **❌ Không tìm thấy**: giá trị ghi "Không có".

## 4. Các sheet kết quả

- **Kết quả chỉ số**: mỗi dòng = 1 chỉ số của 1 báo cáo (dạng dài, dễ lọc/pivot).
- **Bảng so sánh**: mỗi dòng = 1 báo cáo, mỗi cột = 1 chỉ số, để so sánh các tuần.
- **Hạng mục - Vấn đề**: danh sách hạng mục/vấn đề, gồm 5 trường như bản cũ.
- **Nhật ký API**: toàn bộ lịch sử gọi API.
- `_DaXuLy` (ẩn): danh sách file đã đọc, dùng để chống trùng.

## 5. Cách hệ thống chống trùng và xoay vòng

- Mỗi lần chạy đọc **tất cả PDF chưa xử lý**, theo thứ tự cũ trước mới sau.
- Chống trùng theo **File ID + ngày cập nhật**. File được thay bằng bản mới (cùng tên) sẽ được đọc lại; đổi tên file không làm đọc lại.
- File lỗi sẽ được thử lại ở các lần chạy sau, tối đa 3 lần.
- Apps Script giới hạn 6 phút mỗi lần chạy. Nếu còn file chưa đọc, hệ thống tự chạy tiếp sau 2 phút.
- Xoay vòng API: API thiếu key thì **bỏ qua**. API lỗi hoặc không tìm thấy chỉ số nào thì **chuyển sang API kế tiếp**. Nếu mọi API đều không tìm thấy, kết quả được ghi "Không tìm thấy" (vì báo cáo thật sự không có các chỉ số đó).
- Claude và Gemini đọc **nguyên file PDF**, kể cả bảng, hình và bản scan. OpenRouter, Groq và Cloudflare chỉ đọc **văn bản** do Drive trích từ PDF, có giới hạn độ dài: khi văn bản bị cắt, cột "AI đã dùng" ghi rõ "chỉ đọc X% văn bản".

## 6. Lưu ý

- **API key** được lưu trong User Properties của tài khoản Google đang nhập. Người khác dù có quyền sửa Sheet cũng không thấy key.
- **Lịch tự động** chạy bằng tài khoản của người bật lịch, nên người bật lịch phải là người đã nhập key.
- **Bảo mật dữ liệu**: báo cáo sẽ được gửi tới các nhà cung cấp AI đang bật. Với tài liệu nhạy cảm (chi phí, công nợ, tranh chấp), chỉ nên bật API có cam kết không dùng dữ liệu để huấn luyện, và tắt các API còn lại ở tab API.
- **Model mặc định** (sửa được ở tab API): Claude `claude-sonnet-5-5`, Gemini `gemini-2.5-flash`, OpenRouter `google/gemini-2.5-flash`, Groq `llama-3.3-70b-versatile`, Cloudflare `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Nếu nhà cung cấp ngừng hỗ trợ model nào, nút "Kiểm tra kết nối" sẽ báo lỗi; khi đó đổi sang model mới.
- PDF lớn hơn 20 MB không gửi trực tiếp cho Claude/Gemini mà chỉ dùng các API đọc text.
