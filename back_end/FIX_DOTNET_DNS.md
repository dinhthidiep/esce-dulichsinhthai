# 🔧 FIX LỖI .NET DNS KHÔNG RESOLVE ĐƯỢC api.payos.vn

## ❌ Vấn đề:
- `nslookup api.payos.vn` → ✅ Resolve được
- `.NET Dns.GetHostAddresses("api.payos.vn")` → ❌ Fail
- `Invoke-WebRequest` → ❌ Fail

## 🔍 Nguyên nhân:
**.NET có DNS cache riêng** và có thể không dùng cùng DNS server với Windows

---

## ✅ Giải pháp:

### 1. Restart Máy (Khuyến nghị nhất)
Restart máy để flush toàn bộ DNS cache, bao gồm .NET DNS cache.

---

### 2. Thêm vào Hosts File (Giải pháp tạm thời)

**Bước 1: Lấy IP của api.payos.vn**
```powershell
nslookup api.payos.vn 8.8.8.8
```

**Bước 2: Thêm vào hosts file (Cần chạy PowerShell as Administrator)**
```powershell
# Lấy IP (ví dụ: 103.xxx.xxx.xxx)
$ip = "103.xxx.xxx.xxx"  # Thay bằng IP thực tế
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
Add-Content -Path $hostsPath -Value "`n$ip`tapi.payos.vn" -Force
```

**Bước 3: Flush DNS**
```powershell
ipconfig /flushdns
```

**Bước 4: Restart backend và test lại**

---

### 3. Đã thêm trong Code

Đã thêm trong `Program.cs`:
```csharp
System.Net.ServicePointManager.DnsRefreshTimeout = 0; // Disable DNS cache
```

---

### 4. Kiểm tra Firewall

Tạm thời tắt Firewall để test:
```powershell
netsh advfirewall set allprofiles state off
```

Sau khi test xong, bật lại:
```powershell
netsh advfirewall set allprofiles state on
```

---

### 5. Test với IP trực tiếp (Nếu có)

Nếu biết IP của PayOS API, có thể test với IP:
```csharp
// Tạm thời test với IP
client.BaseAddress = new Uri("https://103.xxx.xxx.xxx/");
```

**⚠️ Lưu ý:** IP có thể thay đổi, chỉ dùng để test!

---

## 🧪 Test sau khi fix:

```powershell
# Test 1: .NET DNS
[System.Net.Dns]::GetHostAddresses("api.payos.vn")

# Test 2: PowerShell
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET

# Test 3: Backend
# Restart backend và test payment endpoint
```

---

## 📝 Checklist:

- [ ] Đã restart máy (hoặc thử restart)
- [ ] Đã thêm vào hosts file (nếu cần)
- [ ] Đã flush DNS cache
- [ ] Đã tắt Firewall tạm thời để test
- [ ] Đã restart backend
- [ ] Đã test lại payment endpoint

---

## 💡 Lưu ý:

1. **Hosts file** chỉ là giải pháp tạm thời
2. **Restart máy** là cách tốt nhất để flush .NET DNS cache
3. Nếu vẫn không được sau khi restart → Có thể là network/firewall issue




