-- Script để thêm cột TARGET_AUDIENCE vào bảng COUPONS
-- Cột này lưu JSON string chứa thông tin đối tượng áp dụng coupon

-- Kiểm tra và thêm cột TARGET_AUDIENCE nếu chưa tồn tại
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'COUPONS' AND COLUMN_NAME = 'TARGET_AUDIENCE'
)
BEGIN
    ALTER TABLE COUPONS ADD TARGET_AUDIENCE NVARCHAR(MAX) NULL;
    PRINT 'Đã thêm cột TARGET_AUDIENCE vào bảng COUPONS';
END
ELSE
BEGIN
    PRINT 'Cột TARGET_AUDIENCE đã tồn tại trong bảng COUPONS';
END
GO

-- Cập nhật giá trị mặc định cho các coupon hiện có (cho phép tất cả Tourist)
UPDATE COUPONS 
SET TARGET_AUDIENCE = '{"forAgency":false,"agencyLevels":null,"forTourist":true,"touristLevels":{"level0":true,"level1":false,"level2":false,"level3":false}}'
WHERE TARGET_AUDIENCE IS NULL;

PRINT 'Đã cập nhật giá trị mặc định cho các coupon hiện có';
