-- Script thêm cột TARGET_AUDIENCE vào bảng BONUS_SERVICES
-- Cột này lưu JSON string chứa thông tin hạng người dùng được sử dụng dịch vụ tặng kèm

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BONUS_SERVICES' AND COLUMN_NAME = 'TARGET_AUDIENCE')
BEGIN
    ALTER TABLE BONUS_SERVICES ADD TARGET_AUDIENCE NVARCHAR(MAX) NULL;
    PRINT N'Đã thêm cột TARGET_AUDIENCE vào bảng BONUS_SERVICES';
END
ELSE
BEGIN
    PRINT N'Cột TARGET_AUDIENCE đã tồn tại trong bảng BONUS_SERVICES';
END
GO

-- Cập nhật giá trị mặc định cho các bonus service hiện có (cho phép tất cả)
UPDATE BONUS_SERVICES 
SET TARGET_AUDIENCE = '{"forAgency":true,"agencyLevels":{"level1":true,"level2":true,"level3":true},"forTourist":true,"touristLevels":{"level1":true,"level2":true,"level3":true}}'
WHERE TARGET_AUDIENCE IS NULL;

PRINT N'Đã cập nhật giá trị mặc định cho các bonus service hiện có';
