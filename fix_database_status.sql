-- Script sửa lỗi STATUS trong database
-- Chạy script này để sửa các vấn đề về STATUS

USE ESCE1; -- Thay đổi tên database nếu cần
GO

-- ============================================
-- 1. SỬA STATUS "string" THÀNH "open"
-- ============================================
PRINT '=== SỬA STATUS "string" THÀNH "open" ===';
UPDATE SERVICECOMBO 
SET STATUS = 'open' 
WHERE STATUS = 'string';

-- Kiểm tra kết quả
SELECT ID, NAME, STATUS 
FROM SERVICECOMBO 
WHERE STATUS = 'string';
-- Nếu không có kết quả → đã sửa thành công

-- ============================================
-- 2. APPROVE TẤT CẢ SERVICECOMBO CÓ STATUS = "open"
-- ============================================
-- ⚠️ QUAN TRỌNG: Backend chỉ trả về ServiceCombo nếu STATUS = "approved"
-- Nếu không approve, user sẽ không thể xem ServiceCombo (404 error)

PRINT '=== APPROVE TẤT CẢ SERVICECOMBO CÓ STATUS = "open" ===';
-- Chạy lệnh này để approve tất cả ServiceCombo:
UPDATE SERVICECOMBO 
SET STATUS = 'approved' 
WHERE STATUS = 'open';

PRINT 'Đã approve ' + CAST(@@ROWCOUNT AS VARCHAR) + ' ServiceCombo';

-- Hoặc approve từng cái cụ thể (nếu không muốn approve tất cả):
-- UPDATE SERVICECOMBO 
-- SET STATUS = 'approved' 
-- WHERE ID IN (1, 2, 3, 6, 7, 8, 9);

-- ============================================
-- 3. KIỂM TRA KẾT QUẢ
-- ============================================
PRINT '=== KIỂM TRA STATUS SAU KHI SỬA ===';
SELECT 
    ID,
    NAME,
    STATUS,
    HOST_ID
FROM SERVICECOMBO
ORDER BY ID;

-- Thống kê STATUS
SELECT 
    STATUS,
    COUNT(*) AS Count
FROM SERVICECOMBO
GROUP BY STATUS;

-- ============================================
-- 4. TẠO SERVICECOMBO ID 10 (NẾU CẦN)
-- ============================================
-- UNCOMMENT PHẦN NÀY NẾU MUỐN TẠO SERVICECOMBO ID 10:
/*
PRINT '=== TẠO SERVICECOMBO ID 10 ===';
-- Lưu ý: IDENTITY sẽ tự động tăng, nên không thể insert ID = 10 trực tiếp
-- Cần dùng IDENTITY_INSERT hoặc để database tự động tạo ID mới

SET IDENTITY_INSERT SERVICECOMBO ON;

INSERT INTO SERVICECOMBO (ID, NAME, ADDRESS, PRICE, AVAILABLE_SLOTS, STATUS, HOST_ID, CREATED_AT, UPDATED_AT)
VALUES (10, 'ServiceCombo Mẫu', 'Địa chỉ mẫu', 100000, 10, 'approved', 4, GETDATE(), GETDATE());

SET IDENTITY_INSERT SERVICECOMBO OFF;
*/

GO

