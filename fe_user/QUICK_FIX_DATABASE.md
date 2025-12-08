# Hướng Dẫn Nhanh Sửa Lỗi Database

## Vấn Đề Hiện Tại

API trả về **200 OK** nhưng dữ liệu **rỗng (Array(0))**, có nghĩa là:
- ✅ Backend kết nối được với database
- ✅ API hoạt động bình thường
- ❌ Database không có dữ liệu (bảng SERVICE_COMBO rỗng)

## Giải Pháp Nhanh

### Bước 1: Kiểm tra Database có dữ liệu không

Mở **SQL Server Management Studio (SSMS)** và chạy:

```sql
USE ESCE;
GO

-- Kiểm tra số lượng ServiceCombo
SELECT COUNT(*) as ServiceComboCount FROM SERVICE_COMBO;

-- Kiểm tra số lượng Service
SELECT COUNT(*) as ServiceCount FROM SERVICE;

-- Kiểm tra số lượng Accounts
SELECT COUNT(*) as AccountCount FROM ACCOUNTS;
```

**Nếu tất cả đều = 0** → Database rỗng, cần thêm dữ liệu

### Bước 2: Thêm Dữ Liệu Mẫu

#### Cách 1: Thêm qua Swagger (Khuyến nghị)

1. Truy cập: `https://localhost:7267/swagger`
2. Tìm API `POST /api/ServiceCombo`
3. Click **Try it out**
4. Thêm dữ liệu mẫu:

```json
{
  "name": "Tour Bà Nà Hills",
  "description": "Tour tham quan Bà Nà Hills với cáp treo",
  "price": 500000,
  "address": "Bà Nà Hills, Đà Nẵng",
  "image": "/img/banahills.jpg",
  "status": "open",
  "availableSlots": 50,
  "hostId": 1
}
```

5. Click **Execute**

#### Cách 2: Thêm trực tiếp qua SQL

Mở SSMS và chạy:

```sql
USE ESCE;
GO

-- Đảm bảo có Host account (RoleId = 2)
-- Nếu chưa có, tạo Host account trước:
-- (Cần có admin account với Id = 1 để tạo Host)

-- Thêm ServiceCombo mẫu
INSERT INTO SERVICE_COMBO (NAME, DESCRIPTION, PRICE, ADDRESS, IMAGE, STATUS, AVAILABLE_SLOTS, HOST_ID, CREATED_AT, UPDATED_AT)
VALUES 
('Tour Bà Nà Hills', 'Tour tham quan Bà Nà Hills với cáp treo và các điểm tham quan', 500000, 'Bà Nà Hills, Đà Nẵng', '/img/banahills.jpg', 'open', 50, 1, GETDATE(), GETDATE()),
('Tour Cù Lao Chàm', 'Tour tham quan đảo Cù Lao Chàm, tắm biển và lặn ngắm san hô', 800000, 'Cù Lao Chàm, Hội An', '/img/culaocham.jpg', 'open', 30, 1, GETDATE(), GETDATE()),
('Tour Làng Gốm Thanh Hà', 'Tour tham quan làng gốm truyền thống và trải nghiệm làm gốm', 200000, 'Làng Gốm Thanh Hà, Hội An', '/img/langgom.jpg', 'open', 40, 1, GETDATE(), GETDATE());
```

### Bước 3: Kiểm tra Connection String

Nếu vẫn không có dữ liệu, kiểm tra connection string trong `back_end/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=ADMIN-PC;Database=ESCE;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Lưu ý:**
- Thay `ADMIN-PC` bằng tên server thực tế của bạn
- Nếu dùng SQL Express: `Server=ADMIN-PC\SQLEXPRESS;...`
- Nếu không biết tên server: `Server=localhost;...` hoặc `Server=(local);...`

### Bước 4: Khởi động lại Backend

Sau khi thêm dữ liệu:
1. Dừng backend (Ctrl+C)
2. Khởi động lại backend
3. Kiểm tra logs xem có lỗi không

### Bước 5: Kiểm tra Frontend

1. Refresh trang frontend
2. Mở Developer Tools (F12) → Network tab
3. Xem request `/api/ServiceCombo` có trả về dữ liệu không

## Troubleshooting

### Lỗi: "Cannot open database 'ESCE'"
→ Database chưa tồn tại. Tạo database:
```sql
CREATE DATABASE ESCE;
```

### Lỗi: "Login failed for user"
→ Windows Authentication không hoạt động. Thử:
1. Dùng SQL Authentication trong connection string
2. Hoặc thêm Windows user vào SQL Server

### API vẫn trả về rỗng sau khi thêm dữ liệu
→ Kiểm tra:
1. Dữ liệu đã được lưu vào database chưa (chạy SELECT trong SSMS)
2. Backend có đang kết nối đúng database không
3. Có lỗi trong backend logs không

## Kiểm Tra Nhanh

Chạy query này để kiểm tra tất cả:
```sql
USE ESCE;
GO

-- Kiểm tra database
SELECT DB_NAME() as CurrentDatabase;

-- Kiểm tra các bảng
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Kiểm tra dữ liệu
SELECT 'SERVICE_COMBO' as TableName, COUNT(*) as RecordCount FROM SERVICE_COMBO
UNION ALL
SELECT 'SERVICE', COUNT(*) FROM SERVICE
UNION ALL
SELECT 'ACCOUNTS', COUNT(*) FROM ACCOUNTS
UNION ALL
SELECT 'ROLES', COUNT(*) FROM ROLES;
```

Nếu tất cả RecordCount = 0, database đang rỗng và cần seed data.
















