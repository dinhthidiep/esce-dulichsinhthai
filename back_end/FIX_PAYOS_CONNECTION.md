# 🔧 HƯỚNG DẪN FIX LỖI KẾT NỐI PAYOS API

## ❌ Lỗi hiện tại:
```
The requested name is valid, but no data of the requested type was found. (api.payos.vn:443)
```

## 🔍 Nguyên nhân có thể:

1. **Firewall/Antivirus block kết nối HTTPS**
2. **Proxy/Network configuration issue**
3. **IPv6 vs IPv4 conflict**
4. **DNS resolution issue**
5. **PayOS API đang maintenance**

---

## ✅ Giải pháp:

### 1. Kiểm tra Firewall

**Tạm thời tắt Windows Firewall để test:**
```powershell
# Tắt firewall tạm thời (CHỈ ĐỂ TEST!)
netsh advfirewall set allprofiles state off

# Sau khi test xong, bật lại:
netsh advfirewall set allprofiles state on
```

**Hoặc thêm exception:**
1. Mở Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Chọn Program → Browse → Chọn `ESCESYSTEM.exe`
5. Allow connection

---

### 2. Kiểm tra Antivirus

- Tạm thời tắt Antivirus để test
- Thêm exception cho `ESCESYSTEM.exe`
- Kiểm tra có Web Protection/Network Protection block không

---

### 3. Kiểm tra Proxy Settings

Nếu bạn đang dùng proxy:

**Kiểm tra proxy settings:**
```powershell
netsh winhttp show proxy
```

**Nếu có proxy, cấu hình HttpClient:**
```csharp
// Trong Program.cs
builder.Services.AddHttpClient<IPaymentService, PayOSPaymentService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    Proxy = new WebProxy("http://your-proxy:port"),
    UseProxy = true
});
```

---

### 4. Test kết nối bằng PowerShell

```powershell
# Test 1: DNS Resolution
nslookup api.payos.vn

# Test 2: Ping (có thể fail nhưng không sao)
ping api.payos.vn

# Test 3: HTTPS Connection
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET -TimeoutSec 10

# Test 4: Với curl (nếu có)
curl https://api.payos.vn
```

---

### 5. Thử với VPN/Network khác

- Thử dùng VPN
- Thử dùng mobile hotspot
- Thử dùng network khác

---

### 6. Kiểm tra PayOS Dashboard

1. Đăng nhập: https://pay.payos.vn/web/dashboard
2. Kiểm tra:
   - API có đang hoạt động không?
   - Có thông báo maintenance không?
   - Client ID và API Key có đúng không?

---

### 7. Test với Postman/curl

**Test tạo payment request:**
```bash
curl -X POST https://api.payos.vn/v2/payment-requests \
  -H "x-client-id: 70b012ce-2bdb-4bbf-ba90-4eaed076d47c" \
  -H "x-api-key: eed178a8-65d6-4f7f-8181-7b7156f10cf6" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": 123456,
    "amount": 100000,
    "description": "Test payment",
    "returnUrl": "https://ross-sectional-donnell.ngrok-free.dev/payment/success",
    "cancelUrl": "https://ross-sectional-donnell.ngrok-free.dev/payment/cancel"
  }'
```

Nếu Postman/curl thành công → Vấn đề ở HttpClient configuration
Nếu Postman/curl cũng fail → Vấn đề ở network/firewall

---

### 8. Thêm Retry Logic (Tùy chọn)

Nếu muốn thêm retry khi fail:

```csharp
// Cài package: Microsoft.Extensions.Http.Polly
// Trong Program.cs:
builder.Services.AddHttpClient<IPaymentService, PayOSPaymentService>()
    .AddPolicyHandler(GetRetryPolicy());

private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}
```

---

## 🧪 Test nhanh:

1. **Tắt Firewall tạm thời** → Test lại
2. **Tắt Antivirus tạm thời** → Test lại  
3. **Test với Postman** → Xem có kết nối được không
4. **Thử VPN/Network khác** → Xem có phải network issue không

---

## 📞 Liên hệ PayOS Support

Nếu tất cả đều fail:
- Email: support@payos.vn
- Website: https://payos.vn
- Kiểm tra status page (nếu có)

---

## ✅ Checklist:

- [ ] Đã tắt Firewall tạm thời để test
- [ ] Đã tắt Antivirus tạm thời để test
- [ ] Đã test với Postman/curl
- [ ] Đã thử VPN/Network khác
- [ ] Đã kiểm tra PayOS Dashboard
- [ ] Đã kiểm tra proxy settings
- [ ] Đã test DNS resolution




