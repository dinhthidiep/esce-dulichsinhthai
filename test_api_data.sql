-- Test xem dữ liệu có trong database không
USE [ESCE]
GO

-- Kiểm tra Agency Certificates với status Pending
SELECT 
    AGENCY_ID,
    ACCOUNT_ID,
    COMPANYNAME,
    STATUS,
    CREATED_AT
FROM [dbo].[AGENCIE_CERTIFICATES]
WHERE STATUS = 'Pending'
ORDER BY CREATED_AT DESC
GO

-- Kiểm tra Host Certificates với status Pending
SELECT 
    CertificateId,
    HOST_ID,
    BUSINESS_NAME,
    STATUS,
    CREATED_AT
FROM [dbo].[HOST_CERTIFICATES]
WHERE STATUS = 'Pending'
ORDER BY CREATED_AT DESC
GO
