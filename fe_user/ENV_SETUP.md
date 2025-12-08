# Hướng Dẫn Cấu Hình Backend URL

## Tạo File .env

Tạo file `.env` trong thư mục `fe_user` (cùng cấp với `package.json`) với nội dung sau:

### Nếu Backend chạy HTTP (port 5002):
```env
VITE_API_URL=http://localhost:5002/api
```

### Nếu Backend chạy HTTPS (port 7267):
```env
VITE_API_URL=https://localhost:7267/api
```

## Các Bước

1. Tạo file `.env` trong thư mục `fe_user`
2. Copy một trong hai dòng trên vào file (tùy theo backend đang chạy)
3. Lưu file
4. Khởi động lại dev server: `npm run dev`

## Kiểm Tra

Mở Developer Tools (F12) → Console, bạn sẽ thấy:
```
🔧 [api.ts] Environment check:
  - VITE_API_URL: http://localhost:5002/api
  - API_BASE_URL: http://localhost:5002/api
  - Backend URL: http://localhost:5002
```

Nếu URL hiển thị đúng, cấu hình đã thành công!

## Lưu Ý

- File `.env` đã được thêm vào `.gitignore`, không cần lo về việc commit
- Sau khi sửa `.env`, **phải khởi động lại** dev server
- Nếu gặp lỗi SSL, dùng HTTP thay vì HTTPS















