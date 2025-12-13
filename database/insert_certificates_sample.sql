-- =============================================
-- Script: Insert Sample Data for Role Upgrade Certificates
-- Mục đích: Tạo dữ liệu mẫu để test chức năng Nâng cấp vai trò
-- Bao gồm: Agency Certificates và Host Certificates với các trạng thái khác nhau
-- =============================================

USE [ESCE]
GO

-- =============================================
-- 1. INSERT SAMPLE AGENCIE_CERTIFICATES
-- =============================================

SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] ON
GO

-- Xóa dữ liệu cũ nếu có (tùy chọn - bỏ comment nếu muốn reset)
-- DELETE FROM [dbo].[AGENCIE_CERTIFICATES] WHERE AGENCY_ID >= 10
-- GO

-- Certificate 1: Pending - Chờ phê duyệt
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(10, 6, N'Công ty TNHH Du lịch Miền Trung', N'Giấy phép kinh doanh số 0123456789-GPKD', N'0901234567', N'nguyenvana@example.com', N'www.dulichmientrung.vn', N'Pending', NULL, NULL, GETDATE() - 2, NULL)
GO

-- Certificate 2: Pending - Chờ phê duyệt (mới nhất)
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(11, 10, N'Công ty Cổ phần Du lịch Việt Nam', N'Giấy phép lữ hành quốc tế số 987654321-GPLH', N'0945678901', N'lehoangnam@example.com', N'www.dulichvietnam.com.vn', N'Pending', NULL, NULL, GETDATE() - 1, NULL)
GO

-- Certificate 3: Review - Yêu cầu bổ sung thông tin
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(12, 6, N'Công ty TNHH Du lịch Đà Nẵng 365', N'Giấy phép kinh doanh số 555666777-GPKD', N'0901234567', N'nguyenvana@example.com', N'www.danang365.vn', N'Review', NULL, N'Vui lòng bổ sung: 1. Giấy phép kinh doanh lữ hành quốc tế. 2. Hợp đồng bảo hiểm trách nhiệm nghề nghiệp. 3. Danh sách nhân viên có chứng chỉ hướng dẫn viên.', GETDATE() - 5, GETDATE() - 3)
GO

-- Certificate 4: Rejected - Đã từ chối
INSERT [dbo].[AGENCIE_CERTIFICATES] 
([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(13, 10, N'Công ty Du lịch ABC', N'Giấy phép kinh doanh số 111222333-GPKD', N'0945678901', N'lehoangnam@example.com', NULL, N'Rejected', N'Giấy phép kinh doanh đã hết hạn. Vui lòng gia hạn và nộp lại hồ sơ.', NULL, GETDATE() - 10, GETDATE() - 7)
GO

-- Certificate 5: Approved - Đã phê duyệt (đã có sẵn trong insert.sql)
-- AGENCY_ID = 2, 3 đã được phê duyệt

SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] OFF
GO

PRINT 'Đã insert 4 Agency Certificates mẫu (ID: 10-13)'
GO

-- =============================================
-- 2. INSERT SAMPLE HOST_CERTIFICATES
-- =============================================

SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] ON
GO

-- Xóa dữ liệu cũ nếu có (tùy chọn - bỏ comment nếu muốn reset)
-- DELETE FROM [dbo].[HOST_CERTIFICATES] WHERE CertificateId >= 10
-- GO

-- Certificate 1: Pending - Chờ phê duyệt
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(10, 6, N'Giấy phép kinh doanh lưu trú số 123456-GPLT', N'Homestay Đà Nẵng View Biển', N'0901234567', N'nguyenvana@example.com', N'Pending', NULL, NULL, GETDATE() - 3, NULL)
GO

-- Certificate 2: Pending - Chờ phê duyệt (mới nhất)
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(11, 10, N'Giấy phép kinh doanh du lịch sinh thái số 789012-GPDLST', N'Farm Sinh Thái Hội An', N'0945678901', N'lehoangnam@example.com', N'Pending', NULL, NULL, GETDATE() - 1, NULL)
GO

-- Certificate 3: Review - Yêu cầu bổ sung thông tin
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(12, 6, N'Giấy phép kinh doanh khách sạn số 345678-GPKS', N'Villa Sơn Trà Luxury', N'0901234567', N'nguyenvana@example.com', N'Review', NULL, N'Vui lòng bổ sung: 1. Giấy chứng nhận PCCC (Phòng cháy chữa cháy). 2. Giấy phép kinh doanh lưu trú. 3. Ảnh thực tế cơ sở vật chất.', GETDATE() - 6, GETDATE() - 4)
GO

-- Certificate 4: Rejected - Đã từ chối
INSERT [dbo].[HOST_CERTIFICATES] 
([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) 
VALUES
(13, 10, N'Giấy phép kinh doanh cắm trại số 901234-GPCT', N'Khu Cắm Trại Bà Nà', N'0945678901', N'lehoangnam@example.com', N'Rejected', N'Địa điểm không nằm trong khu vực được phép kinh doanh du lịch. Vui lòng liên hệ UBND địa phương để được hướng dẫn.', NULL, GETDATE() - 8, GETDATE() - 6)
GO

-- Certificate 5: Approved - Đã phê duyệt (đã có sẵn trong insert.sql)
-- CertificateId = 3 đã được phê duyệt

SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] OFF
GO

PRINT 'Đã insert 4 Host Certificates mẫu (ID: 10-13)'
GO

-- =============================================
-- 3. VERIFY DATA
-- =============================================

PRINT ''
PRINT '========================================='
PRINT 'KIỂM TRA DỮ LIỆU VỪA INSERT'
PRINT '========================================='
PRINT ''

-- Kiểm tra Agency Certificates
PRINT '--- AGENCIE_CERTIFICATES ---'
SELECT 
    AGENCY_ID,
    ACCOUNT_ID,
    COMPANYNAME,
    STATUS,
    CREATED_AT,
    CASE 
        WHEN STATUS = 'Pending' THEN 'Chờ phê duyệt'
        WHEN STATUS = 'Approved' THEN 'Đã phê duyệt'
        WHEN STATUS = 'Rejected' THEN 'Đã từ chối'
        WHEN STATUS = 'Review' THEN 'Yêu cầu bổ sung'
        ELSE 'Không xác định'
    END AS STATUS_VN
FROM [dbo].[AGENCIE_CERTIFICATES]
WHERE AGENCY_ID >= 10
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '--- HOST_CERTIFICATES ---'
SELECT 
    CertificateId,
    HOST_ID,
    BUSINESS_NAME,
    STATUS,
    CREATED_AT,
    CASE 
        WHEN STATUS = 'Pending' THEN 'Chờ phê duyệt'
        WHEN STATUS = 'Approved' THEN 'Đã phê duyệt'
        WHEN STATUS = 'Rejected' THEN 'Đã từ chối'
        WHEN STATUS = 'Review' THEN 'Yêu cầu bổ sung'
        ELSE 'Không xác định'
    END AS STATUS_VN
FROM [dbo].[HOST_CERTIFICATES]
WHERE CertificateId >= 10
ORDER BY CREATED_AT DESC
GO

PRINT ''
PRINT '========================================='
PRINT 'HOÀN TẤT! Dữ liệu mẫu đã được thêm vào.'
PRINT '========================================='
PRINT ''
PRINT 'Tổng kết:'
PRINT '- Agency Certificates: 4 records (Pending: 2, Review: 1, Rejected: 1)'
PRINT '- Host Certificates: 4 records (Pending: 2, Review: 1, Rejected: 1)'
PRINT ''
PRINT 'Bạn có thể test các chức năng sau trong Admin Panel:'
PRINT '1. Xem danh sách yêu cầu chờ phê duyệt (Pending)'
PRINT '2. Phê duyệt yêu cầu (Approve)'
PRINT '3. Từ chối yêu cầu (Reject)'
PRINT '4. Yêu cầu bổ sung thông tin (Review)'
PRINT '5. Filter theo trạng thái (All, Pending, Approved, Rejected)'
PRINT ''
GO
