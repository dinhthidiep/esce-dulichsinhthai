# Hướng Dẫn Sửa Lỗi CORS

## Vấn Đề

Frontend gặp lỗi CORS khi gọi API:
```
Access to XMLHttpRequest at 'http://localhost:5002/api/ServiceCombo' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Nguyên Nhân

1. **Backend có `UseHttpsRedirection()`**: Backend tự động redirect tất cả HTTP requests sang HTTPS (307 redirect)
2. **CORS headers bị mất khi redirect**: Khi redirect xảy ra, CORS headers không được giữ lại
3. **Frontend đang dùng HTTP**: Frontend gọi `http://localhost:5002/api/...` nhưng bị redirect sang `https://localhost:7267/api/...`

## Giải Pháp

### Cách 1: Dùng HTTPS trực tiếp (Khuyến nghị)

Tạo file `.env` trong thư mục `fe_user` với nội dung:
```env
VITE_API_URL=https://localhost:7267/api
```

Sau đó khởi động lại frontend:
```bash
npm run dev
```

**Lưu ý**: Nếu gặp lỗi SSL certificate, bạn có thể:
- Chấp nhận certificate trong trình duyệt (không khuyến khích)
- Hoặc cấu hình backend để tắt HTTPS redirection trong development (cần sửa backend)

### Cách 2: Tắt HTTPS Redirection trong Backend (Cần sửa backend)

Nếu bạn có quyền sửa backend, sửa file `back_end/Program.cs`:

**Trước:**
```csharp
app.UseHttpsRedirection();
app.UseCors("AllowAll");
```

**Sau:**
```csharp
// Chỉ redirect HTTPS trong Production, không redirect trong Development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowAll");
```

Sau đó frontend có thể dùng HTTP:
```env
VITE_API_URL=http://localhost:5002/api
```

## Kiểm Tra

Sau khi sửa, mở Developer Tools (F12) → Network tab:
- Request không còn bị redirect (307)
- Response có header `Access-Control-Allow-Origin: *`
- API calls thành công

## Lưu Ý

- File `.env` phải nằm trong thư mục `fe_user` (cùng cấp với `package.json`)
- Sau khi sửa `.env`, **phải khởi động lại** dev server
- Nếu vẫn gặp lỗi, kiểm tra backend có đang chạy không
















