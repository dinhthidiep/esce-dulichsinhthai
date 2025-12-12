# HƯỚNG DẪN THÊM JWT TOKEN VÀO SWAGGER

## Cách thêm Bearer Token vào Swagger UI

### Bước 1: Mở Swagger UI
1. Chạy backend application
2. Mở trình duyệt và vào: `https://localhost:7267/swagger` hoặc `http://localhost:5002/swagger`

### Bước 2: Đăng nhập để lấy Token
1. Tìm endpoint **POST /api/Auth/login**
2. Click vào để mở rộng
3. Click **Try it out**
4. Nhập thông tin đăng nhập (Admin account):
   ```json
   {
     "userEmail": "admin@example.com",
     "password": "your_password"
   }
   ```
5. Click **Execute**
6. Copy **token** từ response (trong field `token`)

### Bước 3: Thêm Token vào Swagger
1. Ở phía trên cùng của Swagger UI, tìm nút **Authorize** (🔒 icon)
2. Click vào nút **Authorize**
3. Trong popup hiện ra:
   - Tìm field **Value**
   - Nhập: `Bearer {your_token}` (thay `{your_token}` bằng token bạn đã copy)
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Click **Authorize**
5. Click **Close**

### Bước 4: Test lại API (Chat, News, v.v.)
1. Tìm endpoint bạn muốn test (ví dụ: **GET /api/chat/GetUserForChat**)
2. Click **Try it out**
3. Click **Execute**
4. Bây giờ sẽ không còn lỗi 401 nữa!

**Lưu ý:** Đảm bảo tài khoản bạn đăng nhập có **Role = "Admin"** để có thể truy cập các endpoint yêu cầu Admin role.

## Lưu ý
- Token có thời hạn (thường là 120 phút theo cấu hình)
- Nếu token hết hạn, bạn sẽ gặp lại lỗi 401
- Cần đăng nhập lại để lấy token mới

## Kiểm tra Token có hợp lệ không
- Nếu token hợp lệ, bạn sẽ thấy **Authorized** ở góc trên bên phải Swagger UI
- Nếu token không hợp lệ hoặc hết hạn, bạn sẽ thấy **Not authorized**

