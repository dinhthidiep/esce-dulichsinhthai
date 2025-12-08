# 🔧 FIX LỖI DNS - KHÔNG RESOLVE ĐƯỢC api.payos.vn

## ❌ Lỗi:
```
The remote name could not be resolved: 'api.payos.vn'
```

## 🔍 Nguyên nhân:
DNS server không resolve được domain `api.payos.vn`

---

## ✅ Giải pháp:

### 1. Đổi DNS Server (Khuyến nghị)

**Đổi sang Google DNS hoặc Cloudflare DNS:**

#### Cách 1: Qua PowerShell (Admin)
```powershell
# Đổi sang Google DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses "8.8.8.8","8.8.4.4"

# Hoặc Cloudflare DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses "1.1.1.1","1.0.0.1"
```

#### Cách 2: Qua Network Settings
1. Mở **Network Settings**
2. Chọn **Change adapter options**
3. Right-click network adapter → **Properties**
4. Chọn **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Chọn **Use the following DNS server addresses:**
   - Preferred: `8.8.8.8`
   - Alternate: `8.8.4.4`
6. Click **OK**

**Sau khi đổi DNS, flush DNS cache:**
```powershell
ipconfig /flushdns
```

---

### 2. Test DNS Resolution

```powershell
# Test với Google DNS
nslookup api.payos.vn 8.8.8.8

# Test với Cloudflare DNS
nslookup api.payos.vn 1.1.1.1

# Nếu resolve được → Đổi DNS server
# Nếu vẫn không resolve → Có thể PayOS domain có vấn đề
```

---

### 3. Kiểm tra Hosts File

Kiểm tra xem có block PayOS trong hosts file không:

```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "payos"
```

Nếu có dòng block PayOS → Xóa hoặc comment lại

---

### 4. Kiểm tra Firewall DNS

Một số firewall có thể block DNS queries:

1. Tạm tắt Windows Firewall
2. Tạm tắt Antivirus
3. Test lại

---

### 5. Thử với VPN

Nếu network của bạn block PayOS domain:
- Thử dùng VPN
- Thử dùng mobile hotspot

---

### 6. Kiểm tra PayOS Domain

Có thể PayOS đang có vấn đề:
- Kiểm tra PayOS status page (nếu có)
- Liên hệ PayOS support
- Thử truy cập https://payos.vn xem có vào được không

---

## 🧪 Test sau khi fix:

```powershell
# 1. Flush DNS
ipconfig /flushdns

# 2. Test DNS
nslookup api.payos.vn

# 3. Test HTTPS
Invoke-WebRequest -Uri "https://api.payos.vn" -Method GET
```

---

## 📝 Checklist:

- [ ] Đã đổi DNS server (8.8.8.8 hoặc 1.1.1.1)
- [ ] Đã flush DNS cache (ipconfig /flushdns)
- [ ] Đã test nslookup api.payos.vn
- [ ] Đã kiểm tra hosts file
- [ ] Đã tắt firewall tạm thời để test
- [ ] Đã thử VPN/Network khác

---

## 💡 Lưu ý:

1. **DNS change cần restart** một số ứng dụng hoặc restart máy
2. **Sau khi đổi DNS**, đợi vài giây rồi test lại
3. **Nếu vẫn không được**, có thể là network của bạn block PayOS domain




