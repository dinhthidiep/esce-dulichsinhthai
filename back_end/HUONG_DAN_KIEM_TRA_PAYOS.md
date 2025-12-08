# 🔍 HƯỚNG DẪN KIỂM TRA PAYOS DASHBOARD

## 📋 Bước 1: Đăng nhập PayOS Dashboard

### URL Dashboard:
```
https://pay.payos.vn/web/dashboard
```
hoặc
```
https://payos.vn/dashboard
```

### Cách đăng nhập:
1. Truy cập: https://pay.payos.vn/web/dashboard
2. Đăng nhập bằng tài khoản PayOS của bạn
3. Nếu chưa có tài khoản, đăng ký tại: https://payos.vn

---

## 🔑 Bước 2: Kiểm tra Thông Tin API

Sau khi đăng nhập, vào mục **"Kênh thanh toán"** hoặc **"Payment Channels"**:

### Thông tin cần kiểm tra:

1. **Client ID**: `70b012ce-2bdb-4bbf-ba90-4eaed076d47c`
2. **API Key**: `eed178a8-65d6-4f7f-8181-7b7156f10cf6`
3. **Checksum Key**: `38957bd222b72738b905f4226d03d46d350cd81c2a231a83169bb39898219216`

### So sánh với appsettings.json:
```json
"PayOS": {
    "ClientId": "70b012ce-2bdb-4bbf-ba90-4eaed076d47c",
    "ApiKey": "eed178a8-65d6-4f7f-8181-7b7156f10cf6",
    "ChecksumKey": "38957bd222b72738b905f4226d03d46d350cd81c2a231a83169bb39898219216"
}
```

✅ **Nếu khác nhau** → Cập nhật lại trong `appsettings.json`

---

## 🌐 Bước 3: Kiểm tra Webhook URL

Trong PayOS Dashboard, vào mục **"Webhook"** hoặc **"Cài đặt"**:

### Webhook URL hiện tại:
```
https://ross-sectional-donnell.ngrok-free.dev/api/payment/payos-webhook
```

### Kiểm tra:
1. ✅ Webhook URL có đúng không?
2. ✅ Ngrok có đang chạy không?
3. ✅ PayOS có thể gọi được webhook không? (Test webhook trong dashboard)

---

## 🧪 Bước 4: Test API trong Dashboard

PayOS Dashboard thường có chức năng **"Test Payment"** hoặc **"API Testing"**:

1. Vào mục **"API Testing"** hoặc **"Thử nghiệm"**
2. Test tạo payment request
3. Kiểm tra response có thành công không

---

## 📊 Bước 5: Kiểm tra Trạng thái Kênh Thanh Toán

Trong Dashboard, kiểm tra:

1. **Trạng thái kênh**: Có đang **"Active"** không?
2. **Giới hạn**: Có vượt quá giới hạn giao dịch không?
3. **Lịch sử giao dịch**: Xem có giao dịch nào đã được tạo chưa?

---

## 🔧 Bước 6: Kiểm tra API Endpoint

### PayOS API Endpoint:
```
https://api.payos.vn/v2/payment-requests
```

### Test bằng PowerShell:
```powershell
# Test kết nối
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET

# Hoặc test với curl
curl https://api.payos.vn
```

---

## ⚠️ Các Vấn Đề Thường Gặp

### 1. Không kết nối được đến api.payos.vn
**Nguyên nhân:**
- Firewall/Antivirus block
- DNS issue
- Internet connection

**Giải pháp:**
- Tạm tắt Windows Firewall
- Thử dùng VPN
- Kiểm tra DNS server (thử đổi sang 8.8.8.8)

### 2. Webhook không được gọi
**Nguyên nhân:**
- Ngrok không chạy
- Webhook URL sai
- PayOS không thể truy cập ngrok URL

**Giải pháp:**
- Kiểm tra ngrok đang chạy: `ngrok http 5002`
- Test webhook URL trong PayOS dashboard
- Kiểm tra ngrok URL có đúng không

### 3. API Key không hợp lệ
**Nguyên nhân:**
- API Key đã bị thay đổi
- API Key không đúng

**Giải pháp:**
- Lấy lại API Key từ PayOS dashboard
- Cập nhật vào `appsettings.json`
- Restart backend

---

## 📝 Checklist

- [ ] Đăng nhập được PayOS Dashboard
- [ ] Client ID, API Key, Checksum Key đúng
- [ ] Webhook URL đúng và ngrok đang chạy
- [ ] Kênh thanh toán đang Active
- [ ] Test API trong dashboard thành công
- [ ] Có thể kết nối đến api.payos.vn

---

## 🔗 Links Hữu Ích

- **PayOS Dashboard**: https://pay.payos.vn/web/dashboard
- **PayOS Documentation**: https://payos.vn/docs
- **PayOS API Docs**: https://payos.vn/docs/api

---

## 💡 Lưu Ý

1. **Ngrok URL thay đổi**: Mỗi lần restart ngrok, URL sẽ thay đổi. Cần cập nhật lại trong:
   - `appsettings.json` (WebhookUrl, ReturnUrl, CancelUrl)
   - PayOS Dashboard (Webhook URL)

2. **Test Mode vs Production**: Đảm bảo bạn đang dùng đúng môi trường (Test/Production)

3. **Rate Limit**: PayOS có giới hạn số request. Kiểm tra trong dashboard xem có vượt quá không.




