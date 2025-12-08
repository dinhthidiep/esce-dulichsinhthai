# 🚀 HƯỚNG DẪN CHẠY BACKEND TRONG VISUAL STUDIO

## ❌ Lỗi: "ERR_CONNECTION_REFUSED" khi truy cập localhost:5002

### Nguyên nhân:
- Backend chưa được start hoặc đang chạy trên port khác
- Visual Studio có thể chạy backend trên port khác tùy vào profile được chọn

---

## ✅ Cách chạy backend trong Visual Studio:

### 1. **Chọn đúng Launch Profile:**

Trong Visual Studio:
1. Mở **Solution Explorer**
2. Click chuột phải vào project **ESCE_SYSTEM** (hoặc tên project của bạn)
3. Chọn **Properties**
4. Vào tab **Debug** → **General**
5. Chọn **Launch profile**: 
   - **http** → Chạy trên `http://localhost:5002`
   - **https** → Chạy trên `https://localhost:7267` và `http://localhost:5002`

### 2. **Start Backend:**

**Cách 1: Dùng Visual Studio**
- Nhấn **F5** hoặc click nút **▶ Start** (màu xanh)
- Hoặc menu: **Debug** → **Start Debugging**

**Cách 2: Dùng Terminal trong Visual Studio**
- Mở **Terminal** trong Visual Studio (View → Terminal)
- Chạy lệnh:
  ```bash
  dotnet run --launch-profile http
  ```
  hoặc
  ```bash
  dotnet run --launch-profile https
  ```

### 3. **Kiểm tra Backend đã chạy:**

Sau khi start, bạn sẽ thấy trong **Output** hoặc **Terminal**:
```
Now listening on: http://localhost:5002
Application started. Press Ctrl+C to shut down.
```

---

## 🔍 Kiểm tra Backend có đang chạy:

### 1. **Kiểm tra trong Visual Studio:**
- Xem **Output** window (View → Output)
- Tìm dòng "Now listening on: http://localhost:XXXX"

### 2. **Kiểm tra bằng PowerShell:**
```powershell
# Kiểm tra port 5002
Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue

# Kiểm tra tất cả port đang listen
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(5000,5001,5002,5003,7267,8080)} | Select-Object LocalPort, State
```

### 3. **Kiểm tra bằng Browser:**
- Mở browser và truy cập: `http://localhost:5002/swagger`
- Nếu thấy Swagger UI → Backend đang chạy ✅
- Nếu thấy "ERR_CONNECTION_REFUSED" → Backend chưa chạy ❌

---

## 🛠️ Troubleshooting:

### 1. **Backend không start được:**

**Lỗi: "Port already in use"**
```powershell
# Tìm process đang dùng port 5002
Get-NetTCPConnection -LocalPort 5002 | Select-Object OwningProcess

# Kill process đó
Stop-Process -Id <ProcessId> -Force
```

**Lỗi: "Cannot find project"**
- Đảm bảo bạn đang ở đúng thư mục: `back_end`
- Chạy: `dotnet restore` trước khi `dotnet run`

### 2. **Backend chạy nhưng không truy cập được:**

**Kiểm tra Firewall:**
- Windows Firewall có thể chặn port 5002
- Tạm thời tắt Firewall để test

**Kiểm tra URL:**
- Đúng: `http://localhost:5002/swagger`
- Sai: `https://localhost:5002/swagger` (nếu chạy profile http)

### 3. **Backend chạy trên port khác:**

Nếu backend chạy trên port khác (ví dụ: 5000, 5001, 7267):
- Kiểm tra trong **Output** window
- Hoặc kiểm tra trong **launchSettings.json**:
  ```json
  "applicationUrl": "http://localhost:XXXX"
  ```

---

## 📋 Checklist:

- [ ] Đã chọn đúng Launch Profile (http hoặc https)
- [ ] Đã start backend (F5 hoặc dotnet run)
- [ ] Thấy "Now listening on: http://localhost:5002" trong Output
- [ ] Có thể truy cập `http://localhost:5002/swagger`
- [ ] Swagger UI hiển thị đúng

---

## 🎯 Các URL sau khi backend chạy:

### Swagger UI:
```
http://localhost:5002/swagger
```

### API Endpoints:
```
http://localhost:5002/api/payment/create-intent
http://localhost:5002/api/payment/payos-webhook
http://localhost:5002/api/payment/status/{bookingId}
```

### Nếu chạy profile https:
```
https://localhost:7267/swagger
http://localhost:5002/swagger
```

---

## 💡 Tips:

1. **Luôn kiểm tra Output window** để xem backend đã start chưa
2. **Dùng Swagger UI** để test API dễ dàng
3. **Nếu port bị chiếm**, đổi port trong `launchSettings.json` hoặc kill process đang dùng port đó
4. **Nếu backend crash**, xem error trong Output window để debug

---

## 🔄 Restart Backend:

1. **Stop backend:**
   - Nhấn **Ctrl+C** trong Terminal
   - Hoặc click nút **Stop** (màu đỏ) trong Visual Studio

2. **Start lại:**
   - Nhấn **F5** hoặc `dotnet run`


