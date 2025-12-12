-- ============================================
-- MIGRATION SCRIPT: Add IS_LOCKED columns
-- ============================================
-- Run this script in SQL Server Management Studio
-- or execute against your database
-- ============================================

USE ESCE1;
GO

-- ============================================
-- 1. Add IS_LOCKED to POSTS table
-- ============================================
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'POSTS' 
    AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[POSTS]
    ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    
    PRINT '✓ Column IS_LOCKED added successfully to POSTS table';
END
ELSE
BEGIN
    PRINT '✓ Column IS_LOCKED already exists in POSTS table';
END
GO

-- ============================================
-- 2. Add IS_LOCKED to COMMENTS table
-- ============================================
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'COMMENTS' 
    AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[COMMENTS]
    ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    
    PRINT '✓ Column IS_LOCKED added successfully to COMMENTS table';
END
ELSE
BEGIN
    PRINT '✓ Column IS_LOCKED already exists in COMMENTS table';
END
GO

-- ============================================
-- Verification
-- ============================================
SELECT 
    'POSTS' AS TableName,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'POSTS' AND COLUMN_NAME = 'IS_LOCKED'
        ) THEN '✓ EXISTS' 
        ELSE '✗ MISSING' 
    END AS IS_LOCKED_Status
UNION ALL
SELECT 
    'COMMENTS' AS TableName,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'COMMENTS' AND COLUMN_NAME = 'IS_LOCKED'
        ) THEN '✓ EXISTS' 
        ELSE '✗ MISSING' 
    END AS IS_LOCKED_Status;
GO

PRINT '============================================';
PRINT 'Migration completed!';
PRINT '============================================';
GO


