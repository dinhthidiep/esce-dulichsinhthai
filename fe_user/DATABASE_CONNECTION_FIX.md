# Hướng Dẫn Sửa Lỗi Kết Nối Database

## Vấn Đề

API trả về 200 OK nhưng dữ liệu rỗng (Array(0)), có thể do:
1. Database không kết nối được
2. Database không có dữ liệu
3. Connection string không đúng

## Kiểm Tra Connection String

Connection string hiện tại trong `back_end/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=ADMIN-PC;Database=ESCE;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

## Các Bước Kiểm Tra

### Bước 1: Kiểm tra SQL Server có đang chạy không

1. Mở **SQL Server Configuration Manager**
2. Kiểm tra **SQL Server Services** → **SQL Server (MSSQLSERVER)** đang **Running**
3. Nếu không chạy, click **Start**

### Bước 2: Kiểm tra tên Server đúng chưa

1. Mở **SQL Server Management Studio (SSMS)**
2. Khi kết nối, xem tên server hiển thị (ví dụ: `ADMIN-PC`, `ADMIN-PC\SQLEXPRESS`, `localhost`, `(local)`)
3. Cập nhật connection string trong `appsettings.json` cho đúng

**Các trường hợp thường gặp:**
- Nếu dùng SQL Server Express: `Server=ADMIN-PC\SQLEXPRESS;...`
- Nếu dùng localhost: `Server=localhost;...` hoặc `Server=(local);...`
- Nếu dùng tên instance khác: `Server=ADMIN-PC\INSTANCENAME;...`

### Bước 3: Kiểm tra Database có tồn tại không

1. Mở **SSMS**
2. Kết nối đến SQL Server
3. Kiểm tra trong **Databases** có database tên **ESCE** không
4. Nếu không có, tạo database mới:
   ```sql
   CREATE DATABASE ESCE;
   ```

### Bước 4: Kiểm tra quyền truy cập

1. Nếu dùng **Windows Authentication** (Trusted_Connection=True):
   - Đảm bảo Windows user hiện tại có quyền truy cập SQL Server
   - Hoặc thêm user vào SQL Server:
     ```sql
     CREATE LOGIN [DOMAIN\Username] FROM WINDOWS;
     ALTER SERVER ROLE sysadmin ADD MEMBER [DOMAIN\Username];
     ```

2. Nếu dùng **SQL Server Authentication**:
   - Sửa connection string:
     ```json
     "DefaultConnection": "Server=ADMIN-PC;Database=ESCE;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
     ```

### Bước 5: Kiểm tra dữ liệu trong Database

1. Mở **SSMS**
2. Kết nối đến database **ESCE**
3. Kiểm tra các bảng có dữ liệu không:
   ```sql
   SELECT COUNT(*) FROM SERVICE_COMBO;
   SELECT COUNT(*) FROM SERVICE;
   SELECT COUNT(*) FROM ACCOUNTS;
   ```

4. Nếu không có dữ liệu:
   - Chạy migration: Backend sẽ tự động chạy migration khi khởi động
   - Seed data: Kiểm tra `appsettings.json` có `"Demo:SeedDemoAccounts": true` không

## Sửa Connection String

### Cách 1: Dùng Windows Authentication (Khuyến nghị)

Sửa file `back_end/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=ADMIN-PC;Database=ESCE;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Lưu ý:** Thay `ADMIN-PC` bằng tên server thực tế của bạn.

### Cách 2: Dùng SQL Server Authentication

Nếu Windows Authentication không hoạt động:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=ADMIN-PC;Database=ESCE;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  }
}
```

### Cách 3: Dùng localhost

Nếu không biết tên server:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ESCE;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

## Kiểm Tra Backend Logs

Sau khi sửa connection string, khởi động lại backend và kiểm tra logs:

1. **Nếu kết nối thành công:**
   ```
   Starting database migration...
   Database migration completed.
   ```

2. **Nếu kết nối thất bại:**
   ```
   FATAL ERROR: DbContext (ESCEContext) could not be resolved.
   ```
   hoặc
   ```
   A network-related or instance-specific error occurred...
   ```

## Tạo Dữ Liệu Mẫu

Nếu database rỗng, bạn có thể:

1. **Chạy migration tự động** (đã có trong Program.cs):
   - Backend sẽ tự động chạy migration khi khởi động
   - Kiểm tra `appsettings.json` có `"Demo:SeedDemoAccounts": true` để seed data

2. **Import dữ liệu từ file SQL:**
   - Mở file `database/0_esce.sql` hoặc `database/2_esce.sql`
   - Chạy trong SSMS

3. **Thêm dữ liệu thủ công qua Swagger:**
   - Truy cập `https://localhost:7267/swagger`
   - Dùng các API POST để tạo dữ liệu

## Troubleshooting

### Lỗi: "Cannot open database 'ESCE'"
- Database chưa tồn tại → Tạo database mới
- Tên database sai → Kiểm tra lại connection string

### Lỗi: "Login failed for user"
- Windows Authentication không hoạt động → Dùng SQL Authentication
- User không có quyền → Thêm user vào SQL Server

### Lỗi: "A network-related or instance-specific error"
- SQL Server chưa chạy → Khởi động SQL Server
- Tên server sai → Kiểm tra lại tên server
- Firewall chặn → Mở port 1433

### API trả về 200 nhưng dữ liệu rỗng
- Database kết nối được nhưng không có dữ liệu
- Kiểm tra các bảng có dữ liệu không
- Seed data hoặc import dữ liệu

## Kiểm Tra Nhanh

Chạy lệnh này trong SSMS để kiểm tra:
```sql
-- Kiểm tra database có tồn tại
SELECT name FROM sys.databases WHERE name = 'ESCE';

-- Kiểm tra số lượng service combo
SELECT COUNT(*) as ServiceComboCount FROM SERVICE_COMBO;

-- Kiểm tra số lượng service
SELECT COUNT(*) as ServiceCount FROM SERVICE;

-- Kiểm tra số lượng accounts
SELECT COUNT(*) as AccountCount FROM ACCOUNTS;
```

Nếu tất cả đều trả về 0, database đang rỗng và cần seed data.















