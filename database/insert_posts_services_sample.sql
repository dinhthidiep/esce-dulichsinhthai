-- =============================================
-- Script: Insert Sample Data for Post & ServiceCombo Approvals
-- Mục đích: Tạo dữ liệu mẫu để test chức năng phê duyệt Bài viết và Dịch vụ
-- =============================================

USE [ESCE]
GO

-- =============================================
-- 0. XÓA DỮ LIỆU CŨ (nếu có)
-- =============================================
DELETE FROM [dbo].[POSTS] WHERE ID >= 200 AND ID <= 210
DELETE FROM [dbo].[SERVICECOMBO] WHERE ID >= 200 AND ID <= 210
GO

PRINT 'Đã xóa dữ liệu cũ (nếu có)'
GO

-- =============================================
-- 1. INSERT SAMPLE POSTS (Bài viết chờ duyệt)
-- =============================================

SET IDENTITY_INSERT [dbo].[POSTS] ON
GO

-- Post 1: Pending - Bài viết về du lịch Đà Nẵng
INSERT [dbo].[POSTS] 
([ID], [TITLE], [CONTENT], [AUTHOR_ID], [IMAGE], [CREATED_AT], [UPDATED_AT], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [IS_DELETED], [COMMENTS_COUNT], [REACTIONS_COUNT], [SAVES_COUNT]) 
VALUES
(201, N'Khám phá vẻ đẹp Đà Nẵng - Thành phố đáng sống', 
N'Đà Nẵng là một trong những thành phố du lịch hấp dẫn nhất Việt Nam. Với bãi biển Mỹ Khê tuyệt đẹp, cầu Rồng độc đáo và núi Bà Nà hùng vĩ, Đà Nẵng xứng đáng là điểm đến không thể bỏ qua trong hành trình khám phá miền Trung.

Những điểm đến nổi bật:
1. Bãi biển Mỹ Khê - Top 6 bãi biển đẹp nhất hành tinh
2. Cầu Rồng - Biểu tượng của thành phố
3. Bà Nà Hills - Thiên đường nghỉ dưỡng trên cao
4. Ngũ Hành Sơn - Di tích lịch sử văn hóa

Hãy đến Đà Nẵng để trải nghiệm!', 
6, NULL, GETDATE(), NULL, N'Pending', NULL, NULL, 0, 0, 0, 0)
GO

-- Post 2: Pending - Bài viết về ẩm thực
INSERT [dbo].[POSTS] 
([ID], [TITLE], [CONTENT], [AUTHOR_ID], [IMAGE], [CREATED_AT], [UPDATED_AT], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [IS_DELETED], [COMMENTS_COUNT], [REACTIONS_COUNT], [SAVES_COUNT]) 
VALUES
(202, N'Top 10 món ăn đặc sản Đà Nẵng không thể bỏ qua', 
N'Đà Nẵng không chỉ nổi tiếng với cảnh đẹp mà còn có nền ẩm thực phong phú. Dưới đây là 10 món ăn bạn nhất định phải thử:

1. Mì Quảng - Món ăn đặc trưng xứ Quảng
2. Bánh tráng cuốn thịt heo - Đặc sản nổi tiếng
3. Bún chả cá - Hương vị biển cả
4. Bánh xèo - Giòn tan hấp dẫn
5. Nem lụi - Thơm ngon khó cưỡng

Mỗi món ăn đều mang đậm hương vị miền Trung!', 
10, NULL, GETDATE(), NULL, N'Pending', NULL, NULL, 0, 0, 0, 0)
GO

-- Post 3: Pending - Bài viết về trải nghiệm
INSERT [dbo].[POSTS] 
([ID], [TITLE], [CONTENT], [AUTHOR_ID], [IMAGE], [CREATED_AT], [UPDATED_AT], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [IS_DELETED], [COMMENTS_COUNT], [REACTIONS_COUNT], [SAVES_COUNT]) 
VALUES
(203, N'Review chuyến đi Bà Nà Hills 2 ngày 1 đêm', 
N'Mình vừa có chuyến đi Bà Nà Hills tuyệt vời và muốn chia sẻ với mọi người!

Ngày 1:
- Sáng: Lên cáp treo, check-in Cầu Vàng
- Trưa: Ăn buffet tại nhà hàng
- Chiều: Tham quan làng Pháp, chơi game

Ngày 2:
- Sáng: Ngắm bình minh trên đỉnh núi
- Trưa: Xuống núi, về Đà Nẵng

Chi phí: Khoảng 2 triệu/người (bao gồm vé, ăn uống, khách sạn)

Highly recommend cho ai chưa đi!', 
6, NULL, GETDATE(), NULL, N'Pending', NULL, NULL, 0, 0, 0, 0)
GO

-- Post 4: Pending - Bài viết tips du lịch
INSERT [dbo].[POSTS] 
([ID], [TITLE], [CONTENT], [AUTHOR_ID], [IMAGE], [CREATED_AT], [UPDATED_AT], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [IS_DELETED], [COMMENTS_COUNT], [REACTIONS_COUNT], [SAVES_COUNT]) 
VALUES
(204, N'Tips tiết kiệm chi phí khi du lịch Đà Nẵng', 
N'Bạn muốn du lịch Đà Nẵng nhưng ngân sách hạn hẹp? Đây là những tips giúp bạn tiết kiệm:

1. Đặt phòng sớm - Giá rẻ hơn 30-50%
2. Ăn quán địa phương - Ngon và rẻ
3. Thuê xe máy - Tiện lợi và tiết kiệm
4. Đi vào mùa thấp điểm - Tháng 9-11
5. Mua combo tour - Giảm giá đáng kể

Với 3 triệu đồng, bạn hoàn toàn có thể có chuyến đi 3 ngày 2 đêm tuyệt vời!', 
10, NULL, GETDATE(), NULL, N'Pending', NULL, NULL, 0, 0, 0, 0)
GO

-- Post 5: Pending - Bài viết về homestay
INSERT [dbo].[POSTS] 
([ID], [TITLE], [CONTENT], [AUTHOR_ID], [IMAGE], [CREATED_AT], [UPDATED_AT], [STATUS], [REJECT_COMMENT], [REVIEW_COMMENTS], [IS_DELETED], [COMMENTS_COUNT], [REACTIONS_COUNT], [SAVES_COUNT]) 
VALUES
(205, N'Top 5 Homestay view biển đẹp nhất Đà Nẵng 2024', 
N'Nếu bạn đang tìm kiếm homestay có view biển đẹp tại Đà Nẵng, đây là gợi ý cho bạn:

1. Sunrise Homestay - View biển Mỹ Khê
2. Ocean View House - Gần bãi biển Non Nước
3. Beach Paradise - Thiết kế hiện đại
4. Sea Breeze Villa - Không gian yên tĩnh
5. Coastal Retreat - Phù hợp gia đình

Giá dao động từ 500k - 1.5 triệu/đêm. Đặt sớm để có giá tốt nhé!', 
6, NULL, GETDATE(), NULL, N'Pending', NULL, NULL, 0, 0, 0, 0)
GO

SET IDENTITY_INSERT [dbo].[POSTS] OFF
GO

PRINT 'Đã insert 5 Posts mẫu (ID: 201-205) với STATUS = Pending'
GO

-- =============================================
-- 2. INSERT SAMPLE SERVICECOMBO (Dịch vụ chờ duyệt)
-- =============================================

SET IDENTITY_INSERT [dbo].[SERVICECOMBO] ON
GO

-- ServiceCombo 1: Pending - Tour Sơn Trà
INSERT [dbo].[SERVICECOMBO] 
([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) 
VALUES
(201, N'Tour Khám Phá Bán Đảo Sơn Trà 1 Ngày', 
N'Bán đảo Sơn Trà, Đà Nẵng', 
N'Khám phá vẻ đẹp hoang sơ của bán đảo Sơn Trà với tour 1 ngày đầy thú vị. Bao gồm: Ngắm bình minh, trekking rừng nguyên sinh, tham quan chùa Linh Ứng, ngắm voọc chà vá chân nâu.', 
CAST(450000.00 AS Decimal(18, 2)), 15, 
NULL, 
N'pending', 
N'Hủy trước 24h được hoàn 100%', 
GETDATE(), NULL, 8)
GO

-- ServiceCombo 2: Pending - Tour Hội An
INSERT [dbo].[SERVICECOMBO] 
([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) 
VALUES
(202, N'Tour Đà Nẵng - Hội An 1 Ngày', 
N'Phố cổ Hội An, Quảng Nam', 
N'Trải nghiệm phố cổ Hội An về đêm với tour trọn gói. Bao gồm: Xe đưa đón, hướng dẫn viên, vé tham quan phố cổ, thả đèn hoa đăng trên sông Hoài.', 
CAST(650000.00 AS Decimal(18, 2)), 20, 
NULL, 
N'pending', 
N'Hủy trước 48h được hoàn 80%', 
GETDATE(), NULL, 8)
GO

-- ServiceCombo 3: Pending - Combo nghỉ dưỡng
INSERT [dbo].[SERVICECOMBO] 
([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) 
VALUES
(203, N'Combo Nghỉ Dưỡng Biển Mỹ Khê 2N1Đ', 
N'Bãi biển Mỹ Khê, Đà Nẵng', 
N'Combo nghỉ dưỡng hoàn hảo tại bãi biển đẹp nhất Đà Nẵng. Bao gồm: 1 đêm khách sạn 4 sao, buffet sáng, spa 60 phút, đưa đón sân bay.', 
CAST(1800000.00 AS Decimal(18, 2)), 10, 
NULL, 
N'pending', 
N'Hủy trước 7 ngày được hoàn 50%', 
GETDATE(), NULL, 8)
GO

-- ServiceCombo 4: Pending - Tour ẩm thực
INSERT [dbo].[SERVICECOMBO] 
([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) 
VALUES
(204, N'Food Tour Đà Nẵng - Khám Phá Ẩm Thực Địa Phương', 
N'Trung tâm Đà Nẵng', 
N'Khám phá nền ẩm thực đặc sắc của Đà Nẵng với food tour 4 tiếng. Bao gồm: 5 điểm dừng chân, thưởng thức 8 món đặc sản, hướng dẫn viên địa phương.', 
CAST(350000.00 AS Decimal(18, 2)), 12, 
NULL, 
N'pending', 
N'Hủy trước 12h được hoàn 100%', 
GETDATE(), NULL, 8)
GO

-- ServiceCombo 5: Pending - Tour mạo hiểm
INSERT [dbo].[SERVICECOMBO] 
([ID], [NAME], [ADDRESS], [DESCRIPTION], [PRICE], [AVAILABLE_SLOTS], [IMAGE], [STATUS], [CANCELLATION_POLICY], [CREATED_AT], [UPDATED_AT], [HOST_ID]) 
VALUES
(205, N'Tour Mạo Hiểm - Chèo SUP Sông Hàn', 
N'Sông Hàn, Đà Nẵng', 
N'Trải nghiệm chèo SUP (Stand Up Paddle) trên sông Hàn vào buổi chiều hoàng hôn. Bao gồm: Thuê SUP, hướng dẫn viên, áo phao, nước uống.', 
CAST(280000.00 AS Decimal(18, 2)), 8, 
NULL, 
N'pending', 
N'Hủy trước 6h được hoàn 100%', 
GETDATE(), NULL, 8)
GO

SET IDENTITY_INSERT [dbo].[SERVICECOMBO] OFF
GO

PRINT 'Đã insert 5 ServiceCombo mẫu (ID: 201-205) với STATUS = pending'
GO

-- =============================================
-- 3. VERIFY DATA
-- =============================================

PRINT ''
PRINT '========================================='
PRINT 'KIỂM TRA DỮ LIỆU VỪA INSERT'
PRINT '========================================='
PRINT ''

-- Kiểm tra Posts
PRINT '--- POSTS PENDING ---'
SELECT 
    ID,
    TITLE,
    AUTHOR_ID,
    STATUS,
    IS_DELETED,
    CREATED_AT
FROM [dbo].[POSTS]
WHERE STATUS = 'Pending' AND IS_DELETED = 0
ORDER BY ID DESC
GO

PRINT ''
PRINT '--- SERVICECOMBO PENDING ---'
SELECT 
    ID,
    NAME,
    HOST_ID,
    PRICE,
    STATUS,
    CREATED_AT
FROM [dbo].[SERVICECOMBO]
WHERE STATUS = 'pending'
ORDER BY ID DESC
GO

PRINT ''
PRINT '========================================='
PRINT 'HOÀN TẤT!'
PRINT '========================================='
GO
