-- ============================================
-- QUICK MIGRATION: Add IS_LOCKED columns
-- Copy and paste this entire script into SSMS
-- ============================================

USE ESCE1;
GO

-- Add IS_LOCKED to POSTS table
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'POSTS' AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[POSTS] ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    PRINT '✓ IS_LOCKED added to POSTS';
END
ELSE
    PRINT '✓ IS_LOCKED already exists in POSTS';
GO

-- Add IS_LOCKED to COMMENTS table
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'COMMENTS' AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[COMMENTS] ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    PRINT '✓ IS_LOCKED added to COMMENTS';
END
ELSE
    PRINT '✓ IS_LOCKED already exists in COMMENTS';
GO

PRINT 'Migration completed!';
GO


