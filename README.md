# 🦫 Capy Chiến Binh

Ứng dụng máy tính (Windows) để theo dõi **thói quen** và **kế hoạch công việc** trong cùng một chỗ, với chú capybara chiến binh lên cấp theo mỗi ngày bạn làm.

> _English:_ a Windows desktop habit & task tracker. Habits and a Gantt-style task plan live in one app, progress is counted in ticks (sessions), and all data stays on your own computer. The UI has a Vietnamese / English switch.

## Tính năng

**🏠 Tổng quan**: một trang gom cả thói quen lẫn công việc của hôm nay.

**🔁 Thói quen**
- **Hôm nay**: bấm để đánh dấu đã làm; thói quen có thể làm mỗi ngày, theo thứ trong tuần, hoặc linh hoạt "N lần/tuần".
- **Danh sách** và **Thống kê**: chuỗi ngày liên tiếp (streak), chuỗi dài nhất, tỉ lệ hoàn thành.
- **Ngày nghỉ** 🏖️: đặt ngày nghỉ mà không làm đứt chuỗi.
- Gợi ý tối đa 6 thói quen/ngày; vượt thì app hỏi lại hoặc gợi ý bớt.

**📋 Công việc**
- **Việc hôm nay**: tích ✓ mỗi ngày đã làm việc đó.
- **Kế hoạch (Gantt)**: bảng lớn theo ngày, chia theo lĩnh vực và nhóm; nhóm bấm để thu gọn/thả xuống, nhóm đã xong hết tự thu gọn.
- **Lịch sử đã làm**: xem lại các ngày đã tích (chỉ xem).
- **Thống kê**: so số buổi đã làm với kế hoạch theo từng lĩnh vực.
- Tiến độ tính bằng **số buổi đã tích**, không dùng giờ.
- Trạng thái tự đổi: tích buổi đầu → _Đang làm_, đủ số buổi → _Hoàn thành_ (vẫn đổi tay được). Việc đã hoàn thành bị khoá, không tích thêm.
- Tối đa 4 ngày ôn tập (Active Recall) cho mỗi việc.
- Giới hạn 6 việc/ngày và 3 việc/lĩnh vực/ngày, kèm gợi ý ngày dời sang.
- Chuyển một công việc lặp lại thành thói quen.

**Khác**
- Giao diện tiếng Việt, có nút chuyển sang English.
- Cấp bậc theo XP (mỗi ngày thói quen hoặc buổi công việc = 1 XP): Tân binh → Chiến binh → Hiệp sĩ → … → Capy Huyền Thoại.

## Dữ liệu nằm ở đâu

Không có tài khoản, không có máy chủ ngoài, không gửi dữ liệu đi đâu.

- App chạy một máy chủ nhỏ ngay bên trong, chỉ nghe trên `127.0.0.1`, để trang đọc/ghi file.
- Dữ liệu là file `du-lieu.json`, cài đặt là `cai-dat.json`. Thư mục chứa chúng được chọn theo thứ tự:
  1. biến môi trường `CAPY_DATA_DIR` nếu có;
  2. thư mục dự án của tác giả (đường dẫn ghi sẵn trong `electron/main.cjs`) nếu nó tồn tại;
  3. còn lại: `Documents\Capy Chien Binh`.
- Mỗi ngày tự sao lưu một bản vào `sao-luu/` (giữ 60 bản gần nhất), và có nút khôi phục trong app.
- Một lần ghi làm mất phần lớn dữ liệu sẽ bị chặn cho tới khi bạn xác nhận.
- Gỡ hay cài lại app không đụng tới dữ liệu.

Các file dữ liệu này nằm trong `.gitignore`, không có trong repo.

## Cài và chạy

Cần [Node.js](https://nodejs.org) (bản LTS).

```bash
npm install
npm start          # chạy thử
npm run dist       # đóng gói file cài: ban-dong-goi/Capy-Chien-Binh-Setup-<version>.exe
```

File cài cho phép chọn thư mục cài và tạo icon trên Desktop. File cài chưa được ký số, nên Windows có thể cảnh báo khi cài; chọn _More info → Run anyway_.

## Cấu trúc

| File | Vai trò |
|---|---|
| `ThoiQuen.html` | Toàn bộ giao diện và logic (HTML + JavaScript thuần, không framework) |
| `electron/main.cjs` | Cửa sổ app, máy chủ nội bộ, đọc/ghi và sao lưu dữ liệu |
| `electron/preload.cjs` | Hộp thoại thông báo/xác nhận của Windows cho trang |
| `app-icon.ico` | Icon app |
| `package.json` | Lệnh chạy và cấu hình đóng gói (Electron, electron-builder) |

Mở app khi nào cũng chỉ có một cửa sổ, để hai bản không ghi đè dữ liệu của nhau.

## Tác giả

[DucNguyen7606](https://github.com/DucNguyen7606)
