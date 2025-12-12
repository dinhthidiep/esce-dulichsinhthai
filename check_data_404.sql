-- Script kiểm tra dữ liệu cho các lỗi 404
-- Chạy script này trong SQL Server Management Studio để kiểm tra

USE ESCE1; -- Thay đổi tên database nếu cần
GO

-- ============================================
-- 1. KIỂM TRA BOOKING CỦA USER 11
-- ============================================
PRINT '=== KIỂM TRA BOOKING CỦA USER 11 ===';
SELECT 
    ID,
    USER_ID,
    BOOKING_NUMBER,
    COMBO_ID,
    SERVICE_ID,
    QUANTITY,
    TOTAL_AMOUNT,
    STATUS,
    BOOKING_DATE,
    CREATED_AT
FROM BOOKINGS
WHERE USER_ID = 11
ORDER BY CREATED_AT DESC;

-- Đếm số booking của user 11
SELECT COUNT(*) AS TotalBookings
FROM BOOKINGS
WHERE USER_ID = 11;

-- Kiểm tra user 11 có tồn tại không
PRINT '=== KIỂM TRA USER 11 CÓ TỒN TẠI KHÔNG ===';
SELECT 
    ID,
    NAME,
    EMAIL,
    ROLE_ID,
    IS_BANNED
FROM ACCOUNTS
WHERE ID = 11;

-- ============================================
-- 2. KIỂM TRA SERVICECOMBO ID 10
-- ============================================
PRINT '=== KIỂM TRA SERVICECOMBO ID 10 ===';
SELECT 
    ID,
    NAME,
    ADDRESS,
    PRICE,
    AVAILABLE_SLOTS,
    STATUS,
    HOST_ID,
    CREATED_AT,
    UPDATED_AT
FROM SERVICECOMBO
WHERE ID = 10;

-- Kiểm tra tất cả ServiceCombo và status của chúng
PRINT '=== DANH SÁCH TẤT CẢ SERVICECOMBO ===';
SELECT 
    ID,
    NAME,
    STATUS,
    HOST_ID,
    CREATED_AT
FROM SERVICECOMBO
ORDER BY ID;

-- Đếm ServiceCombo theo status
PRINT '=== THỐNG KÊ SERVICECOMBO THEO STATUS ===';
SELECT 
    STATUS,
    COUNT(*) AS Count
FROM SERVICECOMBO
GROUP BY STATUS;

-- ============================================
-- 3. KIỂM TRA MAPPING GIỮA DATABASE VÀ MODEL
-- ============================================
PRINT '=== KIỂM TRA TÊN CỘT TRONG DATABASE ===';

-- Kiểm tra cột trong bảng BOOKINGS
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BOOKINGS'
ORDER BY ORDINAL_POSITION;

-- Kiểm tra cột trong bảng SERVICECOMBO
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SERVICECOMBO'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 4. KIỂM TRA FOREIGN KEY RELATIONSHIPS
-- ============================================
PRINT '=== KIỂM TRA FOREIGN KEY ===';

-- Kiểm tra foreign key từ BOOKINGS đến ACCOUNTS
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS ParentTable,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ParentColumn,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'BOOKINGS';

-- ============================================
-- 5. KIỂM TRA DỮ LIỆU MẪU
-- ============================================
PRINT '=== DỮ LIỆU MẪU ===';

-- Lấy 5 booking đầu tiên
SELECT TOP 5
    ID,
    USER_ID,
    BOOKING_NUMBER,
    COMBO_ID,
    STATUS
FROM BOOKINGS
ORDER BY CREATED_AT DESC;

-- Lấy 5 ServiceCombo đầu tiên
SELECT TOP 5
    ID,
    NAME,
    STATUS,
    HOST_ID
FROM SERVICECOMBO
ORDER BY CREATED_AT DESC;

GO





