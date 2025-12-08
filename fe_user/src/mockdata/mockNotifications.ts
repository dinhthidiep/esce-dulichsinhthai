// Mock Notifications - Thông báo cho user
// Format phù hợp với NotificationDto interface

export interface MockNotification {
  Id: number
  UserId: number
  Message: string
  IsRead: boolean
  CreatedAt: string
  Title: string
}

// Mock notifications cho các users
export const mockNotifications: MockNotification[] = [
  // Notifications cho User ID 4 (Trần Thị Tourist)
  {
    Id: 1,
    UserId: 4,
    Title: 'Đặt tour thành công',
    Message: 'Bạn đã đặt tour Bà Nà Hills thành công. Mã đặt tour: #BK001',
    IsRead: false,
    CreatedAt: '2024-11-25T10:00:00',
  },
  {
    Id: 2,
    UserId: 4,
    Title: 'Thanh toán thành công',
    Message: 'Thanh toán cho đặt tour Bà Nà Hills đã được xác nhận. Cảm ơn bạn!',
    IsRead: false,
    CreatedAt: '2024-11-25T10:05:00',
  },
  {
    Id: 3,
    UserId: 4,
    Title: 'Có bình luận mới',
    Message: 'Nguyễn Văn Host đã bình luận trên bài viết của bạn: "Rất hữu ích! Mình sẽ note lại những tips này."',
    IsRead: false,
    CreatedAt: '2024-11-20T12:00:00',
  },
  {
    Id: 4,
    UserId: 4,
    Title: 'Có người thích bài viết',
    Message: 'Công ty Du lịch ABC đã thích bài viết "Kinh nghiệm du lịch Bà Nà Hills" của bạn',
    IsRead: true,
    CreatedAt: '2024-11-20T11:30:00',
  },
  {
    Id: 5,
    UserId: 4,
    Title: 'Tour sắp diễn ra',
    Message: 'Tour Bà Nà Hills của bạn sẽ diễn ra vào ngày mai. Vui lòng chuẩn bị sẵn sàng!',
    IsRead: false,
    CreatedAt: '2024-11-26T08:00:00',
  },
  {
    Id: 6,
    UserId: 4,
    Title: 'Có phản hồi mới',
    Message: 'Nguyễn Văn Host đã phản hồi bình luận của bạn: "@Trần Thị Tourist Đúng rồi! Bạn nên đi vào buổi sáng để tránh đông."',
    IsRead: false,
    CreatedAt: '2024-11-20T11:30:00',
  },
  {
    Id: 7,
    UserId: 4,
    Title: 'Đánh giá tour',
    Message: 'Tour Bà Nà Hills đã kết thúc. Hãy chia sẻ đánh giá của bạn để giúp cộng đồng!',
    IsRead: true,
    CreatedAt: '2024-11-27T18:00:00',
  },
  {
    Id: 8,
    UserId: 4,
    Title: 'Có người thích bình luận',
    Message: 'Quản trị viên đã thích bình luận của bạn',
    IsRead: false,
    CreatedAt: '2024-11-20T16:30:00',
  },
  {
    Id: 9,
    UserId: 4,
    Title: 'Khuyến mãi mới',
    Message: 'Chương trình khuyến mãi đặc biệt: Giảm 20% cho tour Cù Lao Chàm trong tháng này!',
    IsRead: false,
    CreatedAt: '2024-11-28T09:00:00',
  },
  {
    Id: 10,
    UserId: 4,
    Title: 'Nhắc nhở thanh toán',
    Message: 'Bạn có đặt tour Cù Lao Chàm chưa thanh toán. Vui lòng thanh toán trước ngày 30/11.',
    IsRead: false,
    CreatedAt: '2024-11-26T14:00:00',
  },
  
  // Notifications cho User ID 2 (Nguyễn Văn Host)
  {
    Id: 11,
    UserId: 2,
    Title: 'Dịch vụ được duyệt',
    Message: 'Dịch vụ "Hướng dẫn viên Bà Nà Hills" của bạn đã được duyệt và hiển thị trên hệ thống.',
    IsRead: false,
    CreatedAt: '2024-11-20T09:00:00',
  },
  {
    Id: 12,
    UserId: 2,
    Title: 'Có đặt tour mới',
    Message: 'Bạn có đặt tour mới cho dịch vụ "Hướng dẫn viên Bà Nà Hills". Mã đặt: #BK002',
    IsRead: false,
    CreatedAt: '2024-11-25T11:00:00',
  },
  {
    Id: 13,
    UserId: 2,
    Title: 'Có bình luận mới',
    Message: 'Trần Thị Tourist đã bình luận trên bài viết của bạn',
    IsRead: true,
    CreatedAt: '2024-11-21T15:00:00',
  },
  
  // Notifications cho User ID 3 (Công ty Du lịch ABC)
  {
    Id: 14,
    UserId: 3,
    Title: 'Tour combo được đặt',
    Message: 'Bạn có đặt tour combo mới. Mã đặt: #BK003',
    IsRead: false,
    CreatedAt: '2024-11-24T10:00:00',
  },
  {
    Id: 15,
    UserId: 3,
    Title: 'Có phản hồi mới',
    Message: 'Trần Thị Tourist đã phản hồi bình luận của bạn',
    IsRead: false,
    CreatedAt: '2024-11-21T15:30:00',
  },
  
  // Notifications cho User ID 1 (Quản trị viên)
  {
    Id: 16,
    UserId: 1,
    Title: 'Dịch vụ mới cần duyệt',
    Message: 'Có dịch vụ mới "Hướng dẫn viên tiếng Anh" cần được duyệt.',
    IsRead: false,
    CreatedAt: '2024-11-25T08:00:00',
  },
  {
    Id: 17,
    UserId: 1,
    Title: 'Bài viết mới cần duyệt',
    Message: 'Có bài viết mới cần được duyệt trước khi hiển thị.',
    IsRead: false,
    CreatedAt: '2024-11-27T10:00:00',
  },
]

// Helper để lấy notifications theo UserId
export const getNotificationsByUserId = (userId: number): MockNotification[] => {
  return mockNotifications.filter(n => n.UserId === userId)
}

// Helper để lấy notifications chưa đọc theo UserId
export const getUnreadNotificationsByUserId = (userId: number): MockNotification[] => {
  return mockNotifications.filter(n => n.UserId === userId && !n.IsRead)
}













