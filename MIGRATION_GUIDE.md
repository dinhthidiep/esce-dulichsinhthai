# HƯỚNG DẪN CHẠY MIGRATION - THÊM CỘT IS_LOCKED

## Bước 1: Mở SQL Server Management Studio (SSMS)

1. Tìm và mở **SQL Server Management Studio** từ Start Menu
2. Hoặc tìm "SSMS" trong Windows Search

## Bước 2: Kết nối đến Database

1. Trong cửa sổ **Connect to Server**:
   - **Server name**: `DESKTOP-68M1JL8\SQLEXPRESS`
   - **Authentication**: Windows Authentication (hoặc SQL Server Authentication nếu bạn dùng)
   - Click **Connect**

## Bước 3: Mở Query Window

1. Sau khi kết nối thành công, click vào database **ESCE1** trong Object Explorer (bên trái)
2. Click nút **New Query** ở thanh toolbar phía trên (hoặc nhấn `Ctrl + N`)
3. Một cửa sổ query mới sẽ mở ra

## Bước 4: Copy và Paste Script

1. Mở file `back_end/Scripts/QUICK_MIGRATION.sql` trong Notepad hoặc editor
2. **Copy toàn bộ nội dung** của file (Ctrl + A, rồi Ctrl + C)
3. **Paste vào cửa sổ Query** trong SSMS (Ctrl + V)

## Bước 5: Chạy Script

1. Click nút **Execute** (hoặc nhấn `F5`)
2. Đợi script chạy xong (thường chỉ mất vài giây)

## Bước 6: Kiểm tra Kết quả

1. Xem tab **Messages** ở dưới cửa sổ Query
2. Bạn sẽ thấy:
   - `✓ IS_LOCKED added to POSTS` (hoặc `already exists`)
   - `✓ IS_LOCKED added to COMMENTS` (hoặc `already exists`)
   - `Migration completed!`

## Bước 7: Xác nhận Migration thành công

Chạy query sau để kiểm tra:

```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('POSTS', 'COMMENTS')
    AND COLUMN_NAME = 'IS_LOCKED';
```

Nếu thấy 2 rows (POSTS và COMMENTS) → **Migration thành công!**

## Nếu gặp lỗi

- **Lỗi "Cannot connect"**: Kiểm tra SQL Server đã chạy chưa
- **Lỗi "Database does not exist"**: Kiểm tra tên database là `ESCE1`
- **Lỗi "Permission denied"**: Đảm bảo bạn có quyền ALTER TABLE

## Sau khi Migration xong

1. **Restart backend application**
2. Test lại API `GET /api/Post/GetAllPost`
3. Lỗi 400 sẽ biến mất!

---

**Lưu ý**: Script này an toàn, nó sẽ kiểm tra xem cột đã tồn tại chưa trước khi thêm.


