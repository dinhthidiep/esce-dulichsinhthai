-- =============================================
-- Script: Insert 5 More Sample Certificates for Testing
-- Mục đích: Thêm dữ liệu mẫu để test chức năng phê duyệt
-- =============================================

USE [ESCE]
GO

-- =============================================
-- INSERT MORE AGENCIE_CERTIFICATES
-- =============================================

SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] ON
GO

-- Certificate 5: Pending - Mới nhất
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(20, 6, N'Công ty TNHH Du lịch Phương Nam', N'Giấy phép kinh doanh số 2024-GPKD-001', N'0901234567', N'nguyenvana@example.com', N'www.dulichphuongnam.vn', N'Pending', NULL, NULL, GETDATE(), NULL)
GO

-- Certificate 6: Pending
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(21, 10, N'Công ty Cổ phần Du lịch Miền Trung', N'Giấy phép lữ hành quốc tế số 2024-GPLH-002', N'0945678901', N'lehoangnam@example.com', N'www.mientrungtravel.com', N'Pending', NULL, NULL, GETDATE() - 1, NULL)
GO

-- Certificate 7: Pending
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(22, 6, N'Công ty Du lịch Biển Xanh', N'Giấy phép kinh doanh số 2024-GPKD-003', N'0901234567', N'nguyenvana@example.com', N'www.bienxanhtravel.vn', N'Pending', NULL, NULL, GETDATE() - 2, NULL)
GO

SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] OFF
GO

PRINT 'Đã insert 3 Agency Certificates mới (ID: 20-22)'
GO

-- =============================================
-- INSERT MORE HOST_CERTIFICATES
-- =============================================

SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] ON
GO

-- Certificate 8: Pending
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(20, 10, N'Giấy phép kinh doanh lưu trú số 2024-GPLT-001', N'Homestay Hội An Cổ Kính', N'0945678901', N'lehoangnam@example.com', N'Pending', NULL, NULL, GETDATE(), NULL)
GO

-- Certificate 9: Pending
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(21, 6, N'Giấy phép kinh doanh du lịch sinh thái số 2024-GPDLST-002', N'Khu Du lịch Sinh Thái Núi Thần Tài', N'0901234567', N'nguyenvana@example.com', N'Pending', NULL, NULL, GETDATE() - 1, NULL)
GO

SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] OFF
GO

PRINT 'Đã insert 2 Host Certificates mới (ID: 20-21)'
GO

-- =============================================
-- VERIFY NEW DATA
-- =============================================

PRINT ''
PRINT '========================================='
PRINT 'KIỂM TRA DỮ LIỆU MỚI VỪA INSERT'
PRINT '========================================='
PRINT ''

-- Kiểm tra Agency Certificates mới
PRINT '--- AGENCIE_CERTIFICATES MỚI ---'
SELECT 
    AGENCY_ID,
    ACCOUNT_ID,
    COMPANYNAME,
    STATUS,
    CREATED_AT
FROM [dbo].[AGENCIE_CERTIFICATES]
WHERE AGENCY_ID >= 20
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '--- HOST_CERTIFICATES MỚI ---'
SELECT 
    CertificateId,
    HOST_ID,
    BUSINESS_NAME,
    STATUS,
    CREATED_AT
FROM [dbo].[HOST_CERTIFICATES]
WHERE CertificateId >= 20
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '========================================='
PRINT 'HOÀN TẤT!'
PRINT '========================================='
PRINT ''
PRINT 'Tổng kết dữ liệu mới:'
PRINT '- Agency Certificates: 3 records (ID: 20-22) - Tất cả Pending'
PRINT '- Host Certificates: 2 records (ID: 20-21) - Tất cả Pending'
PRINT ''
PRINT 'Tổng cộng: 5 yêu cầu mới để test phê duyệt/từ chối'
PRINT ''
GO
