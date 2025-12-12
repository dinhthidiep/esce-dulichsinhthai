-- Migration: Add IS_LOCKED column to COMMENTS table
-- Date: 2024-12-XX
-- Description: Add IsLocked field to allow Admin to lock/unlock comments

-- Check if column already exists before adding
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'COMMENTS' 
    AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[COMMENTS]
    ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    
    PRINT 'Column IS_LOCKED added successfully to COMMENTS table';
END
ELSE
BEGIN
    PRINT 'Column IS_LOCKED already exists in COMMENTS table';
END
GO


