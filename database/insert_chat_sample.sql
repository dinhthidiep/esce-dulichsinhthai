-- Mock data đoạn chat để chụp ảnh demo
-- Giả sử Admin (ID=1) chat với các user khác

-- Xóa dữ liệu chat cũ (nếu cần)
-- DELETE FROM MESSAGES;

-- Chat giữa Admin (ID=1) và User king123 (giả sử ID=2)
-- Cuộc trò chuyện về du lịch sinh thái

INSERT INTO MESSAGES (SENDER_ID, RECEIVER_ID, CONTENT, CREATED_AT, IS_READ) VALUES
-- Ngày hôm nay - cuộc trò chuyện mới
(2, 1, N'Xin chào Admin! Tôi muốn hỏi về tour du lịch sinh thái ạ.', DATEADD(MINUTE, -30, GETDATE()), 1),
(1, 2, N'Chào bạn! Rất vui được hỗ trợ. Bạn quan tâm đến tour nào ạ?', DATEADD(MINUTE, -28, GETDATE()), 1),
(2, 1, N'Tôi muốn đặt tour tham quan vườn trái cây ở miền Tây', DATEADD(MINUTE, -25, GETDATE()), 1),
(2, 1, N'Có tour nào phù hợp cho gia đình 4 người không ạ?', DATEADD(MINUTE, -24, GETDATE()), 1),
(1, 2, N'Dạ có ạ! Chúng tôi có tour "Khám phá miệt vườn Cần Thơ" rất phù hợp cho gia đình.', DATEADD(MINUTE, -20, GETDATE()), 1),
(1, 2, N'Tour bao gồm: tham quan vườn trái cây, chèo xuồng trên kênh rạch, thưởng thức đặc sản địa phương.', DATEADD(MINUTE, -19, GETDATE()), 1),
(1, 2, N'Giá tour: 1.500.000đ/người lớn, 800.000đ/trẻ em dưới 12 tuổi.', DATEADD(MINUTE, -18, GETDATE()), 1),
(2, 1, N'Nghe hay quá! Tour kéo dài bao lâu vậy ạ?', DATEADD(MINUTE, -15, GETDATE()), 1),
(1, 2, N'Tour kéo dài 2 ngày 1 đêm ạ. Khởi hành từ TP.HCM vào sáng thứ 7 hàng tuần.', DATEADD(MINUTE, -12, GETDATE()), 1),
(2, 1, N'Tuyệt vời! Tôi muốn đặt cho tuần sau được không?', DATEADD(MINUTE, -10, GETDATE()), 1),
(1, 2, N'Được ạ! Bạn vui lòng cung cấp thông tin: họ tên, số điện thoại, số lượng người lớn và trẻ em.', DATEADD(MINUTE, -8, GETDATE()), 1),
(2, 1, N'Nguyễn Văn A - 0901234567 - 2 người lớn, 2 trẻ em (8 tuổi và 10 tuổi)', DATEADD(MINUTE, -5, GETDATE()), 1),
(1, 2, N'Cảm ơn bạn! Tôi đã ghi nhận thông tin. Tổng chi phí: 4.600.000đ', DATEADD(MINUTE, -3, GETDATE()), 1),
(1, 2, N'Bạn có thể thanh toán qua chuyển khoản hoặc thanh toán trực tiếp khi khởi hành.', DATEADD(MINUTE, -2, GETDATE()), 1),
(2, 1, N'Cảm ơn Admin nhiều! Tôi sẽ chuyển khoản ngay ạ 😊', DATEADD(MINUTE, -1, GETDATE()), 0);

-- Chat giữa Admin (ID=1) và User fptking (giả sử ID=3)
INSERT INTO MESSAGES (SENDER_ID, RECEIVER_ID, CONTENT, CREATED_AT, IS_READ) VALUES
(3, 1, N'Admin ơi, tôi gặp vấn đề khi đăng ký làm Host', DATEADD(HOUR, -2, GETDATE()), 1),
(1, 3, N'Chào bạn! Bạn gặp vấn đề gì vậy ạ?', DATEADD(HOUR, -2, DATEADD(MINUTE, 5, GETDATE())), 1),
(3, 1, N'Tôi đã upload giấy phép kinh doanh nhưng hệ thống báo lỗi', DATEADD(HOUR, -2, DATEADD(MINUTE, 10, GETDATE())), 1),
(1, 3, N'Bạn thử upload lại file với định dạng PDF hoặc JPG, dung lượng dưới 5MB nhé!', DATEADD(HOUR, -2, DATEADD(MINUTE, 15, GETDATE())), 1),
(3, 1, N'Ok, để tôi thử lại. Cảm ơn Admin!', DATEADD(HOUR, -2, DATEADD(MINUTE, 20, GETDATE())), 1),
(3, 1, N'Đã upload thành công rồi ạ! 🎉', DATEADD(HOUR, -1, GETDATE()), 0);

-- Chat giữa Admin (ID=1) và User thuyen (giả sử ID=4)
INSERT INTO MESSAGES (SENDER_ID, RECEIVER_ID, CONTENT, CREATED_AT, IS_READ) VALUES
(4, 1, N'Xin chào! Tôi có thể giúp gì được cho bạn?', DATEADD(DAY, -1, GETDATE()), 1),
(1, 4, N'Chào bạn! Tôi là Admin hệ thống. Cảm ơn bạn đã đăng ký!', DATEADD(DAY, -1, DATEADD(MINUTE, 5, GETDATE())), 1),
(4, 1, N'Dạ, tôi muốn tìm hiểu về việc trở thành đối tác Agency', DATEADD(DAY, -1, DATEADD(MINUTE, 10, GETDATE())), 1),
(1, 4, N'Để trở thành Agency, bạn cần cung cấp giấy phép kinh doanh lữ hành và một số giấy tờ liên quan.', DATEADD(DAY, -1, DATEADD(MINUTE, 15, GETDATE())), 1),
(4, 1, N'Vâng, tôi đã chuẩn bị đầy đủ rồi ạ', DATEADD(DAY, -1, DATEADD(MINUTE, 20, GETDATE())), 1),
(1, 4, N'Tuyệt vời! Bạn vào mục "Nâng cấp tài khoản" và làm theo hướng dẫn nhé!', DATEADD(DAY, -1, DATEADD(MINUTE, 25, GETDATE())), 1),
(4, 1, N'Cảm ơn Admin rất nhiều! 👍', DATEADD(DAY, -1, DATEADD(MINUTE, 30, GETDATE())), 1);

SELECT 'Đã thêm mock data chat thành công!' AS Result;
