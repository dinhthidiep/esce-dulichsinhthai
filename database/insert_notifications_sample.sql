-- Mock data cho NOTIFICATIONS
-- Chạy script này để test chức năng thông báo

-- Xem danh sách users để biết USER_ID
-- SELECT Id, Name, Email FROM Accounts WHERE RoleId IN (2, 3, 4);

-- Thay đổi @UserId theo user đang test
DECLARE @UserId INT = 18;

-- Xóa notifications cũ của user (nếu muốn reset)
-- DELETE FROM NOTIFICATIONS WHERE USER_ID = @UserId;

-- Insert mock notifications
INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, IS_READ, CREATED_AT) VALUES
(@UserId, N'Chào mừng bạn đến với ESCE!', N'Cảm ơn bạn đã đăng ký tài khoản. Khám phá các dịch vụ du lịch sinh thái tuyệt vời ngay hôm nay!', 0, DATEADD(MINUTE, -5, GETDATE())),
(@UserId, N'Đặt dịch vụ thành công', N'Bạn đã đặt thành công tour "Khám phá Bà Nà Hills". Vui lòng kiểm tra email để xem chi tiết.', 0, DATEADD(HOUR, -1, GETDATE())),
(@UserId, N'Khuyến mãi đặc biệt', N'Giảm 20% cho tất cả các tour du lịch sinh thái trong tháng 12. Đặt ngay!', 0, DATEADD(HOUR, -3, GETDATE())),
(@UserId, N'Nhắc nhở thanh toán', N'Đơn đặt dịch vụ #BK202312001 của bạn đang chờ thanh toán. Vui lòng hoàn tất trong 24 giờ.', 0, DATEADD(DAY, -1, GETDATE())),
(@UserId, N'Đánh giá dịch vụ', N'Bạn đã hoàn thành tour "Sơn Trà Discovery". Hãy chia sẻ trải nghiệm của bạn!', 1, DATEADD(DAY, -2, GETDATE())),
(@UserId, N'Cập nhật hệ thống', N'Hệ thống sẽ bảo trì vào 2:00 AM ngày 15/12. Xin lỗi vì sự bất tiện này.', 1, DATEADD(DAY, -3, GETDATE())),
(@UserId, N'Tin tức mới', N'Bài viết mới: "Top 10 điểm du lịch sinh thái Đà Nẵng không thể bỏ qua"', 0, DATEADD(HOUR, -6, GETDATE())),
(@UserId, N'Hoàn tiền thành công', N'Yêu cầu hoàn tiền cho đơn #BK202311050 đã được xử lý. Số tiền sẽ về tài khoản trong 3-5 ngày.', 1, DATEADD(DAY, -5, GETDATE()));

-- Kiểm tra kết quả
SELECT * FROM NOTIFICATIONS WHERE USER_ID = @UserId ORDER BY CREATED_AT DESC;

-- Đếm số thông báo chưa đọc
SELECT COUNT(*) AS UnreadCount FROM NOTIFICATIONS WHERE USER_ID = @UserId AND IS_READ = 0;
