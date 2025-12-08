# Cấu Hình Backend URL

## Vấn Đề
Nếu frontend không kết nối được với backend, có thể do:
1. Backend chưa chạy
2. URL backend không đúng
3. Lỗi SSL certificate (nếu dùng HTTPS)

## Giải Pháp

### Bước 1: Kiểm tra Backend có đang chạy không

Backend có thể chạy trên:
- **HTTP**: `http://localhost:5002`
- **HTTPS**: `https://localhost:7267`

Mở trình duyệt và truy cập:
- `http://localhost:5002/swagger` (nếu backend chạy HTTP)
- `https://localhost:7267/swagger` (nếu backend chạy HTTPS)

Nếu không truy cập được, backend chưa chạy. Hãy khởi động backend trước.

### Bước 2: Tạo file .env

Tạo file `.env` trong thư mục `fe_user` với nội dung:

**Nếu backend chạy HTTP (port 5002):**
```env
VITE_API_URL=http://localhost:5002/api
```

**Nếu backend chạy HTTPS (port 7267):**
```env
VITE_API_URL=https://localhost:7267/api
```

### Bước 3: Khởi động lại Frontend

Sau khi tạo/sửa file `.env`, khởi động lại frontend:
```bash
npm run dev
```

### Bước 4: Kiểm tra Console

Mở Developer Tools (F12) và xem tab Console. Bạn sẽ thấy log:
```
🔧 [api.ts] Environment check:
  - VITE_API_URL: http://localhost:5002/api (hoặc giá trị bạn đã set)
  - API_BASE_URL: http://localhost:5002/api
  - Backend URL: http://localhost:5002
```

Nếu URL không đúng, kiểm tra lại file `.env`.

## Lưu Ý

1. **File .env phải nằm trong thư mục `fe_user`** (cùng cấp với `package.json`)
2. **Không commit file .env vào git** (đã có trong .gitignore)
3. **Nếu gặp lỗi SSL với HTTPS**, dùng HTTP thay thế
4. **Sau khi sửa .env, phải khởi động lại dev server**

## Troubleshooting

### Lỗi: "Failed to fetch" hoặc "NetworkError"
- Kiểm tra backend có đang chạy không
- Kiểm tra URL trong file .env có đúng không
- Thử dùng HTTP thay vì HTTPS

### Lỗi: "CERT_HAS_EXPIRED" hoặc SSL error
- Đổi sang HTTP: `VITE_API_URL=http://localhost:5002/api`
- Hoặc chấp nhận certificate trong trình duyệt (không khuyến khích)

### Lỗi: "Connection refused"
- Backend chưa chạy hoặc chạy trên port khác
- Kiểm tra backend đang chạy trên port nào
- Cập nhật URL trong file .env cho đúng
















