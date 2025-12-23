-- Script xóa dữ liệu cũ và tạo dữ liệu mới từ insert.sql
-- LƯU Ý: Script này sẽ XÓA TẤT CẢ dữ liệu hiện tại và tạo lại từ đầu
-- Chạy cẩn thận!

USE ESCE1; -- Thay đổi tên database nếu cần
GO

PRINT '=== BẮT ĐẦU RESET DATABASE ===';
PRINT '';

-- ============================================
-- 1. XÓA DỮ LIỆU CŨ (theo thứ tự foreign key)
-- ============================================
PRINT '=== XÓA DỮ LIỆU CŨ ===';

-- Xóa dữ liệu từ các bảng có foreign key trước
DELETE FROM BOOKING_COUPONS;
PRINT 'Đã xóa BOOKING_COUPONS';

DELETE FROM PAYMENTS;
PRINT 'Đã xóa PAYMENTS';

DELETE FROM REVIEWS;
PRINT 'Đã xóa REVIEWS';

DELETE FROM BOOKINGS;
PRINT 'Đã xóa BOOKINGS';

DELETE FROM SERVICECOMBO_DETAIL;
PRINT 'Đã xóa SERVICECOMBO_DETAIL';

DELETE FROM COUPONS;
PRINT 'Đã xóa COUPONS';

DELETE FROM SERVICECOMBO;
PRINT 'Đã xóa SERVICECOMBO';

DELETE FROM SERVICE;
PRINT 'Đã xóa SERVICE';

DELETE FROM MESSAGES;
PRINT 'Đã xóa MESSAGES';

DELETE FROM NOTIFICATIONS;
PRINT 'Đã xóa NOTIFICATIONS';

DELETE FROM COMMENTS;
PRINT 'Đã xóa COMMENTS';

DELETE FROM POSTS;
PRINT 'Đã xóa POSTS';

DELETE FROM SYSTEM_LOGS;
PRINT 'Đã xóa SYSTEM_LOGS';

DELETE FROM AGENCIE_CERTIFICATES;
PRINT 'Đã xóa AGENCIE_CERTIFICATES';

DELETE FROM HOST_CERTIFICATES;
PRINT 'Đã xóa HOST_CERTIFICATES';

-- KHÔNG xóa ACCOUNTS vì có thể có dữ liệu quan trọng
-- Nếu muốn xóa, uncomment dòng dưới:
-- DELETE FROM ACCOUNTS WHERE ID > 5; -- Giữ lại admin accounts
-- PRINT 'Đã xóa ACCOUNTS (trừ admin)';

PRINT '';
PRINT '=== ĐÃ XÓA XONG DỮ LIỆU CŨ ===';
PRINT '';

-- ============================================
-- 2. TẠO DỮ LIỆU MỚI (từ insert.sql)
-- ============================================
PRINT '=== TẠO DỮ LIỆU MỚI ===';

-- Insert Accounts (nếu chưa có)
SET IDENTITY_INSERT [dbo].[ACCOUNTS] ON;

IF NOT EXISTS (SELECT 1 FROM ACCOUNTS WHERE ID = 6)
BEGIN
    INSERT [dbo].[ACCOUNTS] ([ID], [NAME], [EMAIL], [PASSWORD_HASH], [AVATAR], [PHONE], [DOB], [GENDER], [ADDRESS], [IS_ACTIVE], [CREATED_AT], [UPDATED_AT], [ROLE_ID], [IS_BANNED], [Level], [TotalSpent]) VALUES
    (6, N'Nguyễn Văn An', N'nguyenvana@example.com', N'$2a$11$xyz123', N'avatar6.jpg', N'0901234567', CAST('1990-05-15' AS Date), N'Nam', N'123 Hải Châu, Đà Nẵng', 1, CAST('2024-01-10T08:00:00' AS DateTime), CAST('2024-01-10T08:00:00' AS DateTime), 4, 0, 1, CAST(5000000.00 AS Decimal(18, 2)));
END

IF NOT EXISTS (SELECT 1 FROM ACCOUNTS WHERE ID = 7)
BEGIN
    INSERT [dbo].[ACCOUNTS] ([ID], [NAME], [EMAIL], [PASSWORD_HASH], [AVATAR], [PHONE], [DOB], [GENDER], [ADDRESS], [IS_ACTIVE], [CREATED_AT], [UPDATED_AT], [ROLE_ID], [IS_BANNED], [Level], [TotalSpent]) VALUES
    (7, N'Trần Thị Bình', N'tranthib@example.com', N'$2a$11$abc456', N'avatar7.jpg', N'0912345678', CAST('1985-08-20' AS Date), N'Nữ', N'456 Sơn Trà, Đà Nẵng', 1, CAST('2024-01-15T09:30:00' AS DateTime), CAST('2024-01-15T09:30:00' AS DateTime), 3, 0, 0, CAST(20000000.00 AS Decimal(18, 2)));
END

IF NOT EXISTS (SELECT 1 FROM ACCOUNTS WHERE ID = 8)
BEGIN
    INSERT [dbo].[ACCOUNTS] ([ID], [NAME], [EMAIL], [PASSWORD_HASH], [AVATAR], [PHONE], [DOB], [GENDER], [ADDRESS], [IS_ACTIVE], [CREATED_AT], [UPDATED_AT], [ROLE_ID], [IS_BANNED], [Level], [TotalSpent]) VALUES
    (8, N'Farm Sinh Thái Bà Nà', N'farmbanahill@example.com', N'$2a$11$def789', N'avatar8.jpg', N'0923456789', CAST('2015-03-10' AS Date), NULL, N'Khu du lịch Bà Nà, Đà Nẵng', 1, CAST('2020-06-01T10:00:00' AS DateTime), CAST('2024-02-01T10:00:00' AS DateTime), 2, 0, 0, CAST(0.00 AS Decimal(18, 2)));
END

IF NOT EXISTS (SELECT 1 FROM ACCOUNTS WHERE ID = 9)
BEGIN
    INSERT [dbo].[ACCOUNTS] ([ID], [NAME], [EMAIL], [PASSWORD_HASH], [AVATAR], [PHONE], [DOB], [GENDER], [ADDRESS], [IS_ACTIVE], [CREATED_AT], [UPDATED_AT], [ROLE_ID], [IS_BANNED], [Level], [TotalSpent]) VALUES
    (9, N'Công ty Du lịch Xanh', N'dulichxanh@example.com', N'$2a$11$ghi012', N'avatar9.jpg', N'0934567890', CAST('2010-11-25' AS Date), NULL, N'789 Nguyễn Văn Linh, Đà Nẵng', 1, CAST('2018-04-12T14:20:00' AS DateTime), CAST('2024-01-20T14:20:00' AS DateTime), 3, 0, 0, CAST(0.00 AS Decimal(18, 2)));
END

IF NOT EXISTS (SELECT 1 FROM ACCOUNTS WHERE ID = 10)
BEGIN
    INSERT [dbo].[ACCOUNTS] ([ID], [NAME], [EMAIL], [PASSWORD_HASH], [AVATAR], [PHONE], [DOB], [GENDER], [ADDRESS], [IS_ACTIVE], [CREATED_AT], [UPDATED_AT], [ROLE_ID], [IS_BANNED], [Level], [TotalSpent]) VALUES
    (10, N'Lê Hoàng Nam', N'lehoangnam@example.com', N'$2a$11$jkl345', N'avatar10.jpg', N'0945678901', CAST('1995-12-05' AS Date), N'Nam', N'101 Hòa Xuân, Đà Nẵng', 1, CAST('2023-11-05T11:15:00' AS DateTime), CAST('2023-11-05T11:15:00' AS DateTime), 4, 0, 2, CAST(12000000.00 AS Decimal(18, 2)));
END

SET IDENTITY_INSERT [dbo].[ACCOUNTS] OFF;
PRINT 'Đã insert ACCOUNTS';

-- Insert Certificates
SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] ON;
INSERT [dbo].[AGENCIE_CERTIFICATES] ([AGENCY_ID], [ACCOUNT_ID], [COMPANYNAME], [LICENSE_FILE], [PHONE], [EMAIL], [WEBSITE], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) VALUES
(2, 7, N'Công ty TNHH Du lịch Bình An', N'license_binhan.pdf', N'0912345678', N'tranthib@example.com', N'www.dulichbinhan.com', N'Approved', NULL, N'Giấy phép hợp lệ, đã xác minh', CAST('2024-01-20T10:00:00' AS DateTime), CAST('2024-01-25T15:30:00' AS DateTime)),
(3, 9, N'Công ty Cổ phần Du lịch Xanh', N'license_dulichxanh.pdf', N'0934567890', N'dulichxanh@example.com', N'www.dulichxanh.vn', N'Approved', NULL, N'Công ty uy tín, có nhiều năm kinh nghiệm', CAST('2018-05-01T09:00:00' AS DateTime), CAST('2023-12-01T11:00:00' AS DateTime));
SET IDENTITY_INSERT [dbo].[AGENCIE_CERTIFICATES] OFF;
PRINT 'Đã insert AGENCIE_CERTIFICATES';

SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] ON;
INSERT [dbo].[HOST_CERTIFICATES] ([CertificateId], [HOST_ID], [BUSINESS_LICENSE_FILE], [BUSINESS_NAME], [PHONE], [EMAIL], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [CREATED_AT], [UPDATED_AT]) VALUES
(3, 8, N'license_farmbanahill.pdf', N'Farm Sinh Thái Bà Nà Hill', N'0923456789', N'farmbanahill@example.com', N'Approved', NULL, N'Farm đạt chuẩn sinh thái, môi trường tốt', CAST('2020-06-15T08:30:00' AS DateTime), CAST('2023-11-10T16:45:00' AS DateTime));
SET IDENTITY_INSERT [dbo].[HOST_CERTIFICATES] OFF;
PRINT 'Đã insert HOST_CERTIFICATES';

-- Insert Services
SET IDENTITY_INSERT [dbo].[SERVICE] ON;
INSERT [dbo].[SERVICE] ([ID], [NAME], [DESCRIPTION], [PRICE], [HOST_ID], [CREATED_AT], [UPDATED_AT], [Images], [Status], [RejectComment], [ReviewComments]) VALUES
(5, N'Trekking rừng nguyên sinh Bà Nà', N'Khám phá rừng nguyên sinh, ngắm thác nước, tận hưởng không khí trong lành', CAST(350000.00 AS Decimal(18, 2)), 8, CAST('2023-12-01T09:00:00' AS DateTime), CAST('2024-01-15T10:00:00' AS DateTime), N'trekking_banahill.jpg', N'Approved', NULL, N'An toàn, hướng dẫn viên chuyên nghiệp'),
(6, N'Trải nghiệm làm nông dân', N'Học cách trồng rau hữu cơ, thu hoạch nông sản, cho động vật ăn', CAST(200000.00 AS Decimal(18, 2)), 8, CAST('2023-12-05T14:30:00' AS DateTime), CAST('2024-01-10T14:30:00' AS DateTime), N'farm_experience.jpg', N'Approved', NULL, N'Phù hợp gia đình có trẻ nhỏ'),
(7, N'Ngắm bình minh tại đỉnh Sơn Trà', N'Đi bộ lên đỉnh Sơn Trà, ngắm bình minh, quan sát khỉ đuôi dài', CAST(180000.00 AS Decimal(18, 2)), 8, CAST('2024-01-20T07:00:00' AS DateTime), CAST('2024-02-01T07:00:00' AS DateTime), N'sontra_sunrise.jpg', N'Approved', NULL, N'Cảnh đẹp, hướng dẫn viên nhiệt tình'),
(8, N'Chèo thuyền kayak sinh thái', N'Chèo thuyền kayak khám phá hệ sinh thái ven sông, ngắm chim', CAST(250000.00 AS Decimal(18, 2)), 8, CAST('2024-02-10T08:00:00' AS DateTime), CAST('2024-02-10T08:00:00' AS DateTime), N'kayak_ecotour.jpg', N'Approved', NULL, NULL),
(9, N'Lớp học nấu ăn từ nông sản địa phương', N'Học nấu các món đặc sản Đà Nẵng từ nguyên liệu sạch tại farm', CAST(300000.00 AS Decimal(18, 2)), 8, CAST('2024-02-15T10:00:00' AS DateTime), CAST('2024-02-15T10:00:00' AS DateTime), N'cooking_class.jpg', N'Approved', NULL, N'Đầu bếp chuyên nghiệp, nguyên liệu tươi ngon');
SET IDENTITY_INSERT [dbo].[SERVICE] OFF;
PRINT 'Đã insert SERVICE';

-- Insert ServiceCombo (QUAN TRỌNG: STATUS = "approved" thay vì "open")
SET IDENTITY_INSERT [dbo].[SERVICECOMBO] ON;
INSERT [dbo].[SERVICECOMBO] ([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) VALUES
(4, N'Combo Trải nghiệm Sinh thái Bà Nà 2 ngày 1 đêm', N'Farm Sinh Thái Bà Nà, Đà Nẵng', N'Bao gồm trekking, trải nghiệm nông trại, ăn uống và nghỉ đêm tại farm', CAST(1500000.00 AS Decimal(18, 2)), 20, N'combo_banahill.jpg', N'approved', N'Hủy trước 7 ngày được hoàn 80%', CAST('2024-01-25T09:00:00' AS DateTime), CAST('2024-02-01T09:00:00' AS DateTime), 8),
(5, N'Combo Khám phá Sơn Trà 1 ngày', N'Khu bảo tồn thiên nhiên Sơn Trà, Đà Nẵng', N'Ngắm bình minh, trekking rừng, ăn trưa và chèo kayak', CAST(800000.00 AS Decimal(18, 2)), 15, N'combo_sontra.jpg', N'approved', N'Hủy trước 3 ngày được hoàn 50%', CAST('2024-02-05T10:30:00' AS DateTime), CAST('2024-02-05T10:30:00' AS DateTime), 8);
SET IDENTITY_INSERT [dbo].[SERVICECOMBO] OFF;
PRINT 'Đã insert SERVICECOMBO (với STATUS = approved)';

-- Insert ServiceComboDetail
SET IDENTITY_INSERT [dbo].[SERVICECOMBO_DETAIL] ON;
INSERT [dbo].[SERVICECOMBO_DETAIL] ([ID], [SERVICECOMBO_ID], [SERVICE_ID], [QUANTITY]) VALUES
(3, 4, 5, 1),
(4, 4, 6, 1),
(5, 4, 9, 1),
(6, 5, 7, 1),
(7, 5, 8, 1);
SET IDENTITY_INSERT [dbo].[SERVICECOMBO_DETAIL] OFF;
PRINT 'Đã insert SERVICECOMBO_DETAIL';

-- Insert Coupons
SET IDENTITY_INSERT [dbo].[COUPONS] ON;
INSERT [dbo].[COUPONS] ([ID], [CODE], [DESCRIPTION], [DISCOUNT_PERCENT], [DISCOUNT_AMOUNT], [USAGE_LIMIT], [USAGE_COUNT], [HOST_ID], [SERVICECOMBO_ID], [IS_ACTIVE], [EXPIRY_DATE], [CREATED_AT], [UPDATED_AT], [RequiredLevel]) VALUES
(1, N'BANAHILL20', N'Giảm 20% cho Combo Bà Nà', CAST(20.00 AS Decimal(5, 2)), NULL, 50, 12, 8, 4, 1, CAST('2024-06-30T23:59:59' AS DateTime), CAST('2024-01-01T00:00:00' AS DateTime), CAST('2024-01-01T00:00:00' AS DateTime), 0),
(2, N'SONTRA15', N'Giảm 15% cho Combo Sơn Trà', CAST(15.00 AS Decimal(5, 2)), NULL, 30, 8, 8, 5, 1, CAST('2024-05-31T23:59:59' AS DateTime), CAST('2024-01-15T00:00:00' AS DateTime), CAST('2024-01-15T00:00:00' AS DateTime), 1),
(3, N'FARMTOUR50K', N'Giảm 50.000đ cho dịch vụ farm', NULL, CAST(50000.00 AS Decimal(18, 2)), 100, 45, 8, NULL, 1, CAST('2024-12-31T23:59:59' AS DateTime), CAST('2024-01-10T00:00:00' AS DateTime), CAST('2024-01-10T00:00:00' AS DateTime), 0);
SET IDENTITY_INSERT [dbo].[COUPONS] OFF;
PRINT 'Đã insert COUPONS';

-- Insert Bookings
SET IDENTITY_INSERT [dbo].[BOOKINGS] ON;
INSERT [dbo].[BOOKINGS] ([ID], [USER_ID], [BOOKING_NUMBER], [COMBO_ID], [SERVICE_ID], [QUANTITY], [UNIT_PRICE], [TOTAL_AMOUNT], [ITEM_TYPE], [STATUS], [NOTES], [BOOKING_DATE], [CONFIRMED_DATE], [COMPLETED_DATE], [CREATED_AT], [UPDATED_AT]) VALUES
(4, 6, N'BK202402151200001', 4, NULL, 2, CAST(1500000.00 AS Decimal(18, 2)), CAST(3000000.00 AS Decimal(18, 2)), N'combo', N'completed', N'2 người lớn, yêu cầu phòng đôi', CAST('2024-02-15T12:00:00' AS DateTime), CAST('2024-02-15T12:30:00' AS DateTime), CAST('2024-02-17T17:00:00' AS DateTime), CAST('2024-02-15T12:00:00' AS DateTime), CAST('2024-02-17T17:00:00' AS DateTime)),
(5, 7, N'BK202402161430002', NULL, 5, 10, CAST(350000.00 AS Decimal(18, 2)), CAST(3500000.00 AS Decimal(18, 2)), N'service', N'confirmed', N'Đoàn công ty 10 người', CAST('2024-02-16T14:30:00' AS DateTime), CAST('2024-02-16T15:00:00' AS DateTime), NULL, CAST('2024-02-16T14:30:00' AS DateTime), CAST('2024-02-16T15:00:00' AS DateTime)),
(6, 10, N'BK202402181000003', 5, NULL, 1, CAST(800000.00 AS Decimal(18, 2)), CAST(800000.00 AS Decimal(18, 2)), N'combo', N'pending', N'Cần hướng dẫn viên tiếng Anh', CAST('2024-02-18T10:00:00' AS DateTime), NULL, NULL, CAST('2024-02-18T10:00:00' AS DateTime), CAST('2024-02-18T10:00:00' AS DateTime)),
(7, 9, N'BK202402201100004', NULL, 6, 15, CAST(200000.00 AS Decimal(18, 2)), CAST(3000000.00 AS Decimal(18, 2)), N'service', N'completed', N'Team building công ty', CAST('2024-02-20T11:00:00' AS DateTime), CAST('2024-02-20T11:30:00' AS DateTime), CAST('2024-02-20T17:00:00' AS DateTime), CAST('2024-02-20T11:00:00' AS DateTime), CAST('2024-02-20T17:00:00' AS DateTime)),
(8, 6, N'BK202402221400005', NULL, 9, 4, CAST(300000.00 AS Decimal(18, 2)), CAST(1200000.00 AS Decimal(18, 2)), N'service', N'confirmed', N'Gia đình 4 người', CAST('2024-02-22T14:00:00' AS DateTime), CAST('2024-02-22T14:15:00' AS DateTime), NULL, CAST('2024-02-22T14:00:00' AS DateTime), CAST('2024-02-22T14:15:00' AS DateTime));
SET IDENTITY_INSERT [dbo].[BOOKINGS] OFF;
PRINT 'Đã insert BOOKINGS';

-- Insert Payments
SET IDENTITY_INSERT [dbo].[PAYMENTS] ON;
INSERT [dbo].[PAYMENTS] ([ID], [BOOKING_ID], [AMOUNT], [PAYMENT_DATE], [METHOD], [STATUS], [TransactionId], [PAYMENT_TYPE], [UPGRADE_TYPE], [USER_ID]) VALUES
(1, 4, CAST(3000000.00 AS Decimal(18, 2)), CAST('2024-02-15T12:20:00' AS DateTime), N'Credit Card', N'success', N'TXN00123456', N'booking', NULL, 6),
(2, 5, CAST(3500000.00 AS Decimal(18, 2)), CAST('2024-02-16T15:10:00' AS DateTime), N'Bank Transfer', N'success', N'TXN00123457', N'booking', NULL, 7),
(3, 7, CAST(3000000.00 AS Decimal(18, 2)), CAST('2024-02-20T11:40:00' AS DateTime), N'MoMo', N'success', N'TXN00123458', N'booking', NULL, 9);
SET IDENTITY_INSERT [dbo].[PAYMENTS] OFF;
PRINT 'Đã insert PAYMENTS';

-- Insert Reviews
SET IDENTITY_INSERT [dbo].[REVIEWS] ON;
INSERT [dbo].[REVIEWS] ([ID], [BOOKING_ID], [USER_ID], [RATING], [COMMENT], [CREATED_DATE], [STATUS]) VALUES
(1, 4, 6, 5, N'Trải nghiệm tuyệt vời! Cảnh đẹp, dịch vụ chuyên nghiệp, thức ăn ngon.', CAST('2024-02-18T10:00:00' AS DateTime), N'approved'),
(2, 7, 9, 4, N'Nhân viên nhiệt tình, hoạt động thú vị. Chỉ hơi đông vào cuối tuần.', CAST('2024-02-21T14:30:00' AS DateTime), N'approved');
SET IDENTITY_INSERT [dbo].[REVIEWS] OFF;
PRINT 'Đã insert REVIEWS';

PRINT '';
PRINT '=== HOÀN THÀNH RESET DATABASE ===';
PRINT '';

-- ============================================
-- 3. KIỂM TRA KẾT QUẢ
-- ============================================
PRINT '=== KIỂM TRA KẾT QUẢ ===';

SELECT 'SERVICECOMBO' AS TableName, COUNT(*) AS Count FROM SERVICECOMBO
UNION ALL
SELECT 'SERVICE', COUNT(*) FROM SERVICE
UNION ALL
SELECT 'BOOKINGS', COUNT(*) FROM BOOKINGS
UNION ALL
SELECT 'ACCOUNTS', COUNT(*) FROM ACCOUNTS;

PRINT '';
PRINT '=== DANH SÁCH SERVICECOMBO (STATUS = approved) ===';
SELECT ID, NAME, STATUS, HOST_ID FROM SERVICECOMBO ORDER BY ID;

GO





