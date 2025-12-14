import axiosInstance from '~/utils/axiosInstance'

export interface ChatUserDto {
  UserId?: string
  userId?: string
  FullName?: string
  fullName?: string
  Role?: string
  role?: string
  RoleId?: number
  roleId?: number
  Email?: string
  email?: string
  Avatar?: string
  avatar?: string
}

export interface MessageDto {
  Id?: number
  id?: number
  SenderId?: number
  senderId?: number
  ReceiverId?: number
  receiverId?: number
  Content?: string
  content?: string
  CreatedAt?: string
  createdAt?: string
  IsRead?: boolean
  isRead?: boolean
}

// Lấy danh sách user có thể chat (tất cả user trừ Admin và chính mình)
export const getUsersForChat = async (): Promise<ChatUserDto[]> => {
  try {
    const response = await axiosInstance.get('/chat/GetUserForChat')
    return Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error('Error fetching users for chat:', error)
    return []
  }
}

// Lấy danh sách user đã chat
export const getChattedUsers = async (): Promise<ChatUserDto[]> => {
  try {
    const response = await axiosInstance.get('/chat/GetChattedUser')
    return Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error('Error fetching chatted users:', error)
    return []
  }
}

// Lấy lịch sử chat với user
export const getChatHistory = async (toUserId: string | number): Promise<MessageDto[]> => {
  try {
    const response = await axiosInstance.get(`/chat/GetHistory/${toUserId}`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error('Error fetching chat history:', error)
    return []
  }
}

// Xóa đoạn chat với user
export const deleteConversation = async (otherUserId: string | number): Promise<boolean> => {
  try {
    await axiosInstance.delete(`/chat/DeleteConversation/${otherUserId}`)
    return true
  } catch (error: any) {
    console.error('Error deleting conversation:', error)
    return false
  }
}


