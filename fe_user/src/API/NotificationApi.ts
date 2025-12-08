import axiosInstance from '~/utils/axiosInstance'

export interface NotificationDto {
  Id?: number
  id?: number
  UserId?: number
  userId?: number
  Message?: string
  message?: string
  IsRead?: boolean
  isRead?: boolean
  CreatedAt?: string
  createdAt?: string
  Title?: string
  title?: string
}

// Lấy tất cả thông báo chưa đọc của user hiện tại
export const getNotifications = async (): Promise<NotificationDto[]> => {
  try {
    const response = await axiosInstance.get('/notification/GetAll')
    const data = response.data
    return Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    // Trả về mảng rỗng thay vì throw error để tránh crash app
    return []
  }
}

// Đánh dấu thông báo là đã đọc
export const markNotificationAsRead = async (notificationId: number | string): Promise<void> => {
  try {
    await axiosInstance.put(`/notification/Read/${notificationId}`)
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

// Xóa thông báo
export const deleteNotification = async (notificationId: number | string): Promise<void> => {
  try {
    await axiosInstance.put(`/notification/Delete/${notificationId}`)
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    throw error
  }
}



