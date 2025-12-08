# 🧪 HƯỚNG DẪN TEST THANH TOÁN PAYOS

## 📋 Bước 1: Khởi động Backend

```powershell
cd back_end
dotnet run
```

Backend sẽ chạy tại: **http://localhost:5002**

---

## 🧪 Bước 2: Test Thanh Toán

### Cách 1: Dùng PowerShell Script (Khuyến nghị)

```powershell
cd back_end
.\test-payment.ps1
```

Script sẽ tự động:
- ✅ Test tạo payment intent cho booking
- ✅ Kiểm tra payment status
- ✅ Test tạo payment cho upgrade Agency
- ✅ Mở checkout URL trong browser (nếu bạn chọn)

---

### Cách 2: Dùng File .http (VS Code REST Client)

1. Mở file `TEST_PAYMENT.http` trong VS Code
2. Cài extension **REST Client** nếu chưa có
3. Click vào nút **Send Request** phía trên mỗi request

---

### Cách 3: Dùng Postman

#### Test 1: Tạo Payment Intent cho Booking

```
POST http://localhost:5002/api/payment/create-intent
Content-Type: application/json

{
  "BookingId": 3,
  "Amount": 100000,
  "Description": "Thanh toán cho đặt dịch vụ #3"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://pay.payos.vn/web/...",
  "orderCode": "3000000"
}
```

👉 **Copy `checkoutUrl` và mở trong browser để test thanh toán!**

---

#### Test 2: Kiểm tra Payment Status

```
GET http://localhost:5002/api/payment/status/3
```

**Response:**
```json
{
  "id": 1,
  "bookingId": 3,
  "amount": 100000,
  "status": "pending",
  "method": "PAYOS",
  ...
}
```

---

#### Test 3: Tạo Payment cho Upgrade Agency

```
POST http://localhost:5002/api/payment/create-upgrade-payment
Content-Type: application/json

{
  "UserId": 5,
  "UpgradeType": "Agency",
  "Amount": 1000000,
  "Description": "Thanh toán phí nâng cấp tài khoản lên Agency"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://pay.payos.vn/web/...",
  "orderCode": "5500000"
}
```

---

#### Test 4: Kiểm tra Upgrade Payment Status

```
GET http://localhost:5002/api/payment/upgrade-status/5?upgradeType=Agency
```

---

## 🔍 Kiểm tra Database

Sau khi test, kiểm tra payment đã được lưu chưa:

```sql
SELECT TOP 5 * FROM PAYMENTS ORDER BY ID DESC
```

---

## ⚠️ Lưu ý

1. **Backend phải đang chạy** trước khi test
2. **Ngrok phải đang chạy** để PayOS có thể gọi webhook
3. **Webhook URL** trong `appsettings.json` phải trỏ đúng ngrok URL
4. Khi test thanh toán thật, dùng **thẻ test** của PayOS:
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày hết hạn: Bất kỳ (tương lai)
   - CVV: `123`

---

## 🎯 Kết quả mong đợi

1. ✅ Tạo payment intent thành công → Nhận được `checkoutUrl`
2. ✅ Mở `checkoutUrl` → Chuyển đến trang PayOS
3. ✅ Thanh toán thành công → Webhook được gọi → Payment status = "success"
4. ✅ Kiểm tra database → Payment đã được lưu với status = "success"

---

## 🐛 Troubleshooting

### Lỗi: "Connection refused"
→ Backend chưa chạy, chạy `dotnet run`

### Lỗi: "PayOS API Error"
→ Kiểm tra ClientId, ApiKey trong `appsettings.json`

### Webhook không được gọi
→ Kiểm tra ngrok đang chạy và WebhookUrl đúng

### Payment status vẫn "pending"
→ Webhook chưa được gọi hoặc checksum không hợp lệ




