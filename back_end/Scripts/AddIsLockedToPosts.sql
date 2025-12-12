-- Migration: Add IS_LOCKED column to POSTS table
-- Date: 2024-12-XX
-- Description: Add IsLocked field to allow Admin to lock/unlock posts

-- Check if column already exists before adding
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'POSTS' 
    AND COLUMN_NAME = 'IS_LOCKED'
)
BEGIN
    ALTER TABLE [dbo].[POSTS]
    ADD [IS_LOCKED] [bit] NOT NULL DEFAULT 0;
    
    PRINT 'Column IS_LOCKED added successfully to POSTS table';
END
ELSE
BEGIN
    PRINT 'Column IS_LOCKED already exists in POSTS table';
END
GO


