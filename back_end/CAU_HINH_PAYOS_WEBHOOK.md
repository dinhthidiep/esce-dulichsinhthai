# 🔗 CẤU HÌNH WEBHOOK URL TRONG PAYOS DASHBOARD

## 📋 Các URL cần cấu hình trong PayOS Dashboard:

### 1. **Webhook URL** (Quan trọng nhất!)
```
https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook
```

**Đây là URL PayOS sẽ gọi để thông báo kết quả thanh toán**

---

### 2. **Return URL** (Sau khi thanh toán thành công)
```
https://ross-sectional-donnell.ngrok-free.dev/payment/success
```

**URL user sẽ được redirect đến sau khi thanh toán thành công**

---

### 3. **Cancel URL** (Khi hủy thanh toán)
```
https://ross-sectional-donnell.ngrok-free.dev/payment/cancel
```

**URL user sẽ được redirect đến khi hủy thanh toán**

---

## 🎯 Cách cấu hình trong PayOS Dashboard:

### Bước 1: Đăng nhập PayOS Dashboard
```
https://pay.payos.vn/web/dashboard
```

### Bước 2: Vào mục "Kênh thanh toán" hoặc "Payment Channels"

### Bước 3: Tìm mục "Webhook" hoặc "Cài đặt Webhook"

### Bước 4: Dán Webhook URL:
```
https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook
```

### Bước 5: Lưu cấu hình

---

## ⚠️ Lưu ý quan trọng:

### 1. **Ngrok URL thay đổi**
- Mỗi lần restart ngrok, URL sẽ thay đổi
- Cần cập nhật lại trong:
  - ✅ `appsettings.json` (đã có)
  - ✅ PayOS Dashboard (cần cập nhật thủ công)

### 2. **Ngrok Free có Warning Page**
- PayOS có thể không gọi được nếu ngrok hiện warning page
- Giải pháp: Cấu hình ngrok để bypass warning

### 3. **Test Webhook**
Sau khi cấu hình, có thể test webhook trong PayOS Dashboard:
- PayOS có chức năng "Test Webhook"
- Hoặc đợi có giao dịch thật

---

## 🧪 Test Webhook thủ công:

Bạn có thể test webhook endpoint:

```powershell
# Test webhook endpoint
Invoke-WebRequest -Uri "https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"test":"data"}'
```

Nếu trả về 400 → Endpoint hoạt động (400 là bình thường vì test data không hợp lệ)

---

## 📊 Xem Webhook Requests trong ngrok:

Truy cập: **http://127.0.0.1:4040**

Tại đây bạn có thể:
- ✅ Xem tất cả requests đến ngrok
- ✅ Xem webhook từ PayOS
- ✅ Xem request/response details
- ✅ Replay requests để test

---

## ✅ Checklist:

- [ ] Đã đăng nhập PayOS Dashboard
- [ ] Đã vào mục "Webhook Settings"
- [ ] Đã dán Webhook URL: `https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook`
- [ ] Đã lưu cấu hình
- [ ] Đã test webhook (nếu có chức năng)
- [ ] Đã kiểm tra ngrok web interface: http://127.0.0.1:4040

---

## 🔄 Khi ngrok URL thay đổi:

1. **Lấy URL mới từ ngrok**
2. **Cập nhật appsettings.json:**
   ```json
   "WebhookUrl": "https://NEW-NGROK-URL/api/payment/payos-webhook",
   "ReturnUrl": "https://NEW-NGROK-URL/payment/success",
   "CancelUrl": "https://NEW-NGROK-URL/payment/cancel"
   ```
3. **Cập nhật PayOS Dashboard** với URL mới
4. **Restart backend**

---

## 💡 Tip:

Để tránh phải cập nhật URL mỗi lần restart ngrok:
- Có thể dùng ngrok với **static domain** (trả phí)
- Hoặc dùng **ngrok config file** để set domain cố định



