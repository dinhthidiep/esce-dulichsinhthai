# 🔧 FIX: PayOS Webhook URL Không Hoạt Động

## ❌ Lỗi:
```
Webhook url của bạn hiện đang không hoạt động. mã lỗi: null
```

---

## 🔍 Nguyên nhân:

### 1. **Ngrok Warning Page** (Nguyên nhân chính)
- Ngrok free hiển thị warning page khi có request
- PayOS không thể gọi webhook qua warning page
- PayOS test webhook và nhận về HTML warning thay vì JSON response

### 2. **URL có thể bị cắt/typo**
- Kiểm tra URL có đầy đủ không: `https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook`
- Không được thiếu `ros` ở đầu
- Không được viết sai `webhook` thành `webhool`

---

## ✅ Giải pháp đã áp dụng:

### 1. **Thêm header bypass ngrok warning**
Đã thêm vào `PaymentController.cs`:
```csharp
Response.Headers.Add("ngrok-skip-browser-warning", "true");
```

### 2. **Cấu hình ngrok để skip warning** (Tùy chọn)

**Cách 1: Dùng ngrok config file**

Tạo file `ngrok.yml` trong thư mục ngrok:
```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  backend:
    addr: 5002
    proto: http
    inspect: true
    bind_tls: true
    request_header:
      add:
        - "ngrok-skip-browser-warning: true"
```

Sau đó chạy:
```bash
ngrok start backend
```

**Cách 2: Dùng command line**
```bash
ngrok http 5002 --request-header-add "ngrok-skip-browser-warning: true"
```

---

## 🧪 Test Webhook:

### 1. **Test thủ công:**
```powershell
# Test webhook endpoint
Invoke-WebRequest -Uri "https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{"ngrok-skip-browser-warning"="true"} `
    -Body '{"code":0,"desc":"Success","data":{"orderCode":123456,"amount":100000,"description":"Test","accountNumber":"","reference":"","transactionDateTime":"2024-01-01T00:00:00Z","currency":"VND","paymentLinkId":"","code":"00","desc":"Success","counterAccountBankId":"","counterAccountBankName":"","counterAccountName":"","counterAccountNumber":"","virtualAccountName":"","virtualAccountNumber":""}}'
```

### 2. **Test trong PayOS Dashboard:**
- Vào PayOS Dashboard
- Tìm mục "Test Webhook" hoặc "Kiểm tra Webhook"
- Click test → Nếu thành công sẽ hiện "Webhook hoạt động"

---

## 📋 Checklist:

- [x] Đã thêm header bypass ngrok warning trong webhook handler
- [ ] Đã restart backend sau khi sửa code
- [ ] Đã kiểm tra URL đúng: `https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook`
- [ ] Đã dán URL đúng vào PayOS Dashboard (không bị cắt, không typo)
- [ ] Đã test webhook trong PayOS Dashboard
- [ ] Đã kiểm tra ngrok web interface: http://127.0.0.1:4040

---

## 🔄 Nếu vẫn không hoạt động:

### 1. **Kiểm tra URL đúng:**
```
✅ ĐÚNG: https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook
❌ SAI:  s-sectional-donnell.ngrok-free.dev/api/payment/payos-webhool
```

### 2. **Kiểm tra backend đang chạy:**
```powershell
Get-NetTCPConnection -LocalPort 5002
```

### 3. **Kiểm tra ngrok đang chạy:**
- Xem terminal ngrok
- Status phải là "online"
- Forwarding phải đúng: `ngrok -> localhost:5002`

### 4. **Test webhook endpoint:**
```powershell
# Test GET (sẽ trả về 405 Method Not Allowed - bình thường)
Invoke-WebRequest -Uri "https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook" -Method GET

# Test POST với header bypass
Invoke-WebRequest -Uri "https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{"ngrok-skip-browser-warning"="true"} `
    -Body '{"test":"data"}'
```

### 5. **Xem logs trong ngrok:**
- Truy cập: http://127.0.0.1:4040
- Xem requests đến webhook endpoint
- Kiểm tra request/response details

---

## 💡 Lưu ý:

1. **Ngrok URL thay đổi:**
   - Mỗi lần restart ngrok, URL sẽ thay đổi
   - Cần cập nhật lại trong PayOS Dashboard

2. **Ngrok free limitations:**
   - Có thể có rate limit
   - Warning page có thể vẫn xuất hiện
   - Nên dùng ngrok paid để có static domain

3. **PayOS test webhook:**
   - PayOS sẽ test webhook khi bạn lưu cấu hình
   - Nếu test fail, sẽ hiện lỗi như bạn thấy
   - Sau khi fix, cần test lại trong PayOS Dashboard

---

## ✅ Sau khi fix:

1. **Restart backend:**
   ```powershell
   # Stop backend (Ctrl+C)
   # Start lại backend
   dotnet run
   ```

2. **Test webhook trong PayOS Dashboard:**
   - Vào PayOS Dashboard
   - Tìm mục "Test Webhook"
   - Click test → Nếu thành công sẽ hiện "Webhook hoạt động"

3. **Kiểm tra ngrok:**
   - Xem requests trong ngrok web interface
   - Sẽ thấy request từ PayOS khi test



