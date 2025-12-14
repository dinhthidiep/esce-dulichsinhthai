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

// Lấy userId từ localStorage/sessionStorage
const getUserId = (): number | null => {
  try {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      const userId = userInfo.Id || userInfo.id
      if (userId) {
        const parsedId = parseInt(userId)
        if (!isNaN(parsedId) && parsedId > 0) {
          return parsedId
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

// Lấy tất cả thông báo chưa đọc của user hiện tại
export const getNotifications = async (): Promise<NotificationDto[]> => {
  try {
    const userId = getUserId()
    if (!userId) {
      return []
    }
    
    const response = await axiosInstance.get(`/notification/user/${userId}`)
    const data = response.data
    return Array.isArray(data) ? data : []
  } catch (error: any) {
    // 404 có nghĩa là user chưa có thông báo nào
    if (error?.response?.status === 404) {
      return []
    }
    console.error('Error fetching notifications:', error)
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

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }
    await axiosInstance.put(`/notification/ReadAll/${userId}`)
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

// Xóa thông báo
export const deleteNotification = async (notificationId: number | string): Promise<void> => {
  try {
    await axiosInstance.delete(`/notification/${notificationId}`)
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    throw error
  }
}





