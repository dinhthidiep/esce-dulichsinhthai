-- Add StartDate column to COUPONS table
-- Run this script to add the StartDate field for coupon validity period

-- Check if column exists before adding
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'COUPONS' AND COLUMN_NAME = 'START_DATE'
)
BEGIN
    ALTER TABLE COUPONS ADD START_DATE DATETIME NULL;
    PRINT 'Column START_DATE added to COUPONS table';
END
ELSE
BEGIN
    PRINT 'Column START_DATE already exists in COUPONS table';
END
GO
