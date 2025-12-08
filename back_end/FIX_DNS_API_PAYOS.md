# 🔧 FIX: DNS Không Resolve Được api.payos.vn

## ❌ Lỗi:
```
The requested name is valid, but no data of the requested type was found. (api.payos.vn:443)
```

## 🔍 Phân tích:
- ✅ `payos.vn` → Resolve được
- ❌ `api.payos.vn` → **KHÔNG resolve được**
- ❌ PowerShell `Invoke-WebRequest` → Fail
- ❌ .NET HttpClient → Fail

**Nguyên nhân:** DNS server của bạn không thể resolve subdomain `api.payos.vn`

---

## ✅ Giải pháp (theo thứ tự ưu tiên):

### 1. 🔄 **RESTART MÁY** (Khuyến nghị nhất)

Restart máy để:
- Flush toàn bộ DNS cache (Windows + .NET)
- Reset network stack
- Reload DNS configuration

**Sau khi restart:**
1. Chạy lại backend
2. Test lại payment

---

### 2. 📝 **Thêm vào Hosts File** (Giải pháp tạm thời)

**Bước 1: Lấy IP của api.payos.vn**

Thử với các DNS server khác:
```powershell
# Với Google DNS
Resolve-DnsName -Name "api.payos.vn" -Type A -Server "8.8.8.8"

# Với Cloudflare DNS
Resolve-DnsName -Name "api.payos.vn" -Type A -Server "1.1.1.1"

# Hoặc dùng nslookup
nslookup api.payos.vn 8.8.8.8
```

**Bước 2: Thêm vào hosts file** (Cần chạy PowerShell as Administrator)

```powershell
# Lấy IP (ví dụ: 103.xxx.xxx.xxx)
$ip = "103.xxx.xxx.xxx"  # Thay bằng IP thực tế từ bước 1
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"

# Kiểm tra xem đã có chưa
$content = Get-Content $hostsPath
if ($content -notmatch "api.payos.vn") {
    # Thêm vào hosts file
    Add-Content -Path $hostsPath -Value "`n$ip`tapi.payos.vn" -Force
    Write-Host "✅ Đã thêm api.payos.vn vào hosts file" -ForegroundColor Green
} else {
    Write-Host "⚠️ api.payos.vn đã có trong hosts file" -ForegroundColor Yellow
}

# Flush DNS
ipconfig /flushdns
```

**Bước 3: Restart backend và test lại**

---

### 3. 🔥 **Tắt Firewall/Antivirus tạm thời** (Để test)

**Tắt Windows Firewall:**
```powershell
# Tắt firewall (CHỈ ĐỂ TEST!)
netsh advfirewall set allprofiles state off

# Test lại payment

# Sau khi test xong, bật lại:
netsh advfirewall set allprofiles state on
```

**Tắt Antivirus:**
- Tạm thời disable Antivirus
- Hoặc thêm exception cho `ESCESYSTEM.exe`

---

### 4. 🌐 **Thử dùng VPN hoặc Network khác**

- Thử dùng VPN (nếu có)
- Thử dùng mobile hotspot
- Thử dùng network khác (cafe, nhà bạn, ...)

Nếu VPN/network khác hoạt động → Vấn đề ở DNS server của network hiện tại

---

### 5. 🔧 **Đổi DNS Server** (Nếu có quyền)

**Đổi DNS server sang Google DNS hoặc Cloudflare:**

1. Mở **Network Settings**
2. Chọn network adapter đang dùng
3. Properties → IPv4 Properties
4. Chọn "Use the following DNS server addresses":
   - **Preferred:** `8.8.8.8` (Google)
   - **Alternate:** `8.8.4.4` (Google)
   - Hoặc:
   - **Preferred:** `1.1.1.1` (Cloudflare)
   - **Alternate:** `1.0.0.1` (Cloudflare)

5. **OK** và **Apply**
6. Flush DNS: `ipconfig /flushdns`
7. Restart máy (khuyến nghị)

---

### 6. 🧪 **Test với Postman/curl**

Test xem có phải vấn đề ở HttpClient không:

```powershell
# Test với PowerShell
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET -TimeoutSec 10

# Test với curl (nếu có)
curl https://api.payos.vn
```

Nếu Postman/curl thành công → Vấn đề ở HttpClient configuration
Nếu Postman/curl cũng fail → Vấn đề ở DNS/network

---

## 🧪 Test sau khi fix:

### 1. Test DNS Resolution:
```powershell
# Test 1: PowerShell DNS
Resolve-DnsName -Name "api.payos.vn" -Type A

# Test 2: .NET DNS
[System.Net.Dns]::GetHostAddresses("api.payos.vn")
```

### 2. Test HTTP Connection:
```powershell
# Test kết nối
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET -TimeoutSec 10
```

### 3. Test Payment API:
- Chạy backend
- Tạo payment intent
- Kiểm tra xem có lỗi DNS không

---

## 📋 Checklist:

- [ ] Đã thử restart máy
- [ ] Đã thử thêm vào hosts file
- [ ] Đã thử tắt Firewall/Antivirus
- [ ] Đã thử dùng VPN/network khác
- [ ] Đã thử đổi DNS server
- [ ] Đã test với Postman/curl
- [ ] Đã flush DNS cache (`ipconfig /flushdns`)

---

## 💡 Lưu ý:

1. **Hosts file chỉ là giải pháp tạm thời:**
   - IP có thể thay đổi
   - Cần cập nhật lại nếu IP thay đổi

2. **Restart máy là tốt nhất:**
   - Flush toàn bộ cache
   - Reset network stack
   - Reload DNS configuration

3. **Nếu vẫn không được:**
   - Kiểm tra PayOS Dashboard xem API có đang hoạt động không
   - Liên hệ PayOS Support: support@payos.vn
   - Kiểm tra network có block domain không

---

## 🔄 Sau khi fix:

1. **Restart backend**
2. **Test tạo payment intent**
3. **Kiểm tra logs** xem còn lỗi DNS không
4. **Test thanh toán thật** (nếu có thể)

---

## 📞 Liên hệ:

Nếu tất cả đều fail:
- **PayOS Support:** support@payos.vn
- **Website:** https://payos.vn
- **Dashboard:** https://pay.payos.vn/web/dashboard


