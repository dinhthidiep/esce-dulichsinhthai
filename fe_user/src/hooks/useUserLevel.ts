import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import { calculateLevel, getLevelInfo, calculateProgress, type UserLevel } from '~/utils/levelUtils'

interface Booking {
  Id?: number
  id?: number
  TotalAmount?: number
  totalAmount?: number
  Status?: string
  status?: string
  [key: string]: unknown
}

interface UserLevelData {
  totalSpent: number
  level: UserLevel
  levelInfo: ReturnType<typeof getLevelInfo>
  progress: number
  nextLevelAmount: number | null
  loading: boolean
  error: string | null
}

export const useUserLevel = (userId: number | null): UserLevelData => {
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(false) // Bắt đầu với false để tránh loading khi chưa có userId
  const [error, setError] = useState<string | null>(null)

  const fetchTotalSpent = useCallback(async () => {
    if (!userId) {
      setTotalSpent(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Lấy tất cả bookings của user
      const response = await axiosInstance.get<Booking[]>(`${API_ENDPOINTS.BOOKING}/user/${userId}`)
      
      if (response.data && Array.isArray(response.data)) {
        // Tính tổng tiền từ các booking đã thanh toán (status = 'paid' hoặc 'completed')
        const paidBookings = response.data.filter(
          (booking) => {
            const status = (booking.Status || booking.status || '').toLowerCase()
            return status === 'paid' || status === 'completed' || status === 'success'
          }
        )

        const total = paidBookings.reduce((sum, booking) => {
          const amount = booking.TotalAmount || booking.totalAmount || 0
          return sum + (typeof amount === 'number' ? amount : 0)
        }, 0)

        setTotalSpent(total)
      } else {
        setTotalSpent(0)
      }
    } catch (err) {
      console.error('Error fetching user spending:', err)
      // Không hiển thị lỗi nếu là 404 (user chưa có booking)
      if ((err as { response?: { status?: number } })?.response?.status !== 404) {
        setError('Không thể tải thông tin level. Vui lòng thử lại sau.')
      }
      setTotalSpent(0)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTotalSpent()
  }, [fetchTotalSpent])

  // Tính toán level info - đảm bảo luôn có giá trị
  const level = calculateLevel(totalSpent)
  const levelInfo = getLevelInfo(level)
  const progress = calculateProgress(totalSpent, level)
  const nextLevelAmount = level === 'gold' ? null : 
    (level === 'default' ? 1000000 : 
     level === 'bronze' ? 5000000 : 10000000)

  // Đảm bảo levelInfo luôn có giá trị hợp lệ
  if (!levelInfo || !levelInfo.icon || !levelInfo.name) {
    console.warn('⚠️ [useUserLevel] levelInfo không hợp lệ, sử dụng default')
    const defaultLevelInfo = getLevelInfo('default')
    return {
      totalSpent,
      level: 'default',
      levelInfo: defaultLevelInfo,
      progress: 0,
      nextLevelAmount: 1000000,
      loading,
      error,
    }
  }

  return {
    totalSpent,
    level,
    levelInfo,
    progress,
    nextLevelAmount,
    loading,
    error,
  }
}

