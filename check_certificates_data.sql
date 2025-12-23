-- Kiểm tra dữ liệu trong bảng AGENCIE_CERTIFICATES
USE [ESCE]
GO

PRINT '========================================='
PRINT 'KIỂM TRA DỮ LIỆU AGENCIE_CERTIFICATES'
PRINT '========================================='

SELECT 
    AGENCY_ID,
    ACCOUNT_ID,
    COMPANYNAME,
    STATUS,
    PHONE,
    EMAIL,
    CREATED_AT
FROM [dbo].[AGENCIE_CERTIFICATES]
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '========================================='
PRINT 'KIỂM TRA DỮ LIỆU HOST_CERTIFICATES'
PRINT '========================================='

SELECT 
    CertificateId,
    HOST_ID,
    BUSINESS_NAME,
    STATUS,
    PHONE,
    EMAIL,
    CREATED_AT
FROM [dbo].[HOST_CERTIFICATES]
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '========================================='
PRINT 'TỔNG KẾT'
PRINT '========================================='

SELECT 
    'AGENCIE_CERTIFICATES' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN STATUS = 'Pending' THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN STATUS = 'Approved' THEN 1 ELSE 0 END) AS Approved,
    SUM(CASE WHEN STATUS = 'Rejected' THEN 1 ELSE 0 END) AS Rejected,
    SUM(CASE WHEN STATUS = 'Review' THEN 1 ELSE 0 END) AS Review
FROM [dbo].[AGENCIE_CERTIFICATES]

UNION ALL

SELECT 
    'HOST_CERTIFICATES' AS TableName,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN STATUS = 'Pending' THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN STATUS = 'Approved' THEN 1 ELSE 0 END) AS Approved,
    SUM(CASE WHEN STATUS = 'Rejected' THEN 1 ELSE 0 END) AS Rejected,
    SUM(CASE WHEN STATUS = 'Review' THEN 1 ELSE 0 END) AS Review
FROM [dbo].[HOST_CERTIFICATES]
GO
