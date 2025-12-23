-- Script approve ServiceCombo để user có thể xem
-- Backend chỉ trả về ServiceCombo nếu STATUS = "approved" (trừ khi user là host)

USE ESCE1; -- Thay đổi tên database nếu cần
GO

PRINT '=== APPROVE TẤT CẢ SERVICECOMBO ===';
PRINT 'Backend chỉ trả về ServiceCombo nếu STATUS = "approved"';
PRINT 'Nếu không approve, user sẽ gặp 404 error khi xem ServiceCombo';
PRINT '';

-- Kiểm tra trước khi approve
PRINT '=== TRẠNG THÁI TRƯỚC KHI APPROVE ===';
SELECT 
    STATUS,
    COUNT(*) AS Count
FROM SERVICECOMBO
GROUP BY STATUS;

-- Approve tất cả ServiceCombo có STATUS = "open"
PRINT '';
PRINT '=== ĐANG APPROVE SERVICECOMBO... ===';
UPDATE SERVICECOMBO 
SET STATUS = 'approved',
    UPDATED_AT = GETDATE()
WHERE STATUS = 'open';

DECLARE @RowCount INT = @@ROWCOUNT;
PRINT 'Đã approve ' + CAST(@RowCount AS VARCHAR) + ' ServiceCombo';

-- Kiểm tra sau khi approve
PRINT '';
PRINT '=== TRẠNG THÁI SAU KHI APPROVE ===';
SELECT 
    STATUS,
    COUNT(*) AS Count
FROM SERVICECOMBO
GROUP BY STATUS;

-- Hiển thị danh sách ServiceCombo đã approve
PRINT '';
PRINT '=== DANH SÁCH SERVICECOMBO ĐÃ APPROVE ===';
SELECT 
    ID,
    NAME,
    STATUS,
    HOST_ID,
    CREATED_AT,
    UPDATED_AT
FROM SERVICECOMBO
ORDER BY ID;

GO





