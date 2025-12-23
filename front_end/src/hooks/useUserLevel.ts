import { useState, useEffect } from 'react'
import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'
import { getLevelInfo, calculateProgress, calculateLevel, type UserLevel } from '~/utils/levelUtils'

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
  const [level, setLevel] = useState<UserLevel>('default')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!userId) {
        setTotalSpent(0)
        setLevel('default')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Gọi API để lấy thông tin user mới nhất (bao gồm TotalSpent và Level)
        const response = await axiosInstance.get(`${API_ENDPOINTS.USER}/${userId}`)
        const userData = response.data

        console.log('🔍 [useUserLevel] Raw API Response:', userData)

        if (userData) {
          // Lấy TotalSpent từ API response - check tất cả các casing có thể
          const dbTotalSpent = userData.TotalSpent ?? userData.totalSpent ?? userData.totalspent ?? 0
          const spent = Number(dbTotalSpent) || 0

          // QUAN TRỌNG: Luôn tính level từ totalSpent để đảm bảo chính xác
          // Không dựa vào database level vì có thể chưa được sync
          const calculatedLevel = calculateLevel(spent)

          console.log(`✅ [useUserLevel] API Response: TotalSpent=${spent}, Calculated Level=${calculatedLevel}`)

          setTotalSpent(spent)
          setLevel(calculatedLevel)

          // Cập nhật localStorage để sync với các component khác (Header)
          const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
          if (userInfoStr) {
            try {
              const userInfo = JSON.parse(userInfoStr)
              const updatedUserInfo = {
                ...userInfo,
                TotalSpent: spent,
                totalSpent: spent
              }
              if (localStorage.getItem('userInfo')) {
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
              }
              if (sessionStorage.getItem('userInfo')) {
                sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
              }
              // Dispatch event để Header cập nhật
              window.dispatchEvent(new Event('userStorageChange'))
            } catch (parseErr) {
              console.warn('⚠️ [useUserLevel] Could not update localStorage:', parseErr)
            }
          }
        } else {
          console.log('⚠️ [useUserLevel] No user data from API')
          setTotalSpent(0)
          setLevel('default')
        }
      } catch (err: any) {
        console.error('❌ [useUserLevel] Error fetching user data:', err)
        
        // Fallback: đọc từ localStorage nếu API fail
        try {
          const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr)
            const dbTotalSpent = userInfo.TotalSpent ?? userInfo.totalSpent ?? 0
            const spent = Number(dbTotalSpent) || 0
            const calculatedLevel = calculateLevel(spent)
            
            console.log(`⚠️ [useUserLevel] Fallback to localStorage: TotalSpent=${spent}, Level=${calculatedLevel}`)
            
            setTotalSpent(spent)
            setLevel(calculatedLevel)
            setError(null) // Clear error since we have fallback data
          } else {
            setError('Không thể tải thông tin level')
            setTotalSpent(0)
            setLevel('default')
          }
        } catch (fallbackErr) {
          setError('Không thể tải thông tin level')
          setTotalSpent(0)
          setLevel('default')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserLevel()
  }, [userId])

  // Tính toán level info
  const levelInfo = getLevelInfo(level)
  const progress = calculateProgress(totalSpent, level)

  // Tính nextLevelAmount dựa trên level hiện tại
  const getNextLevelAmount = (): number | null => {
    switch (level) {
      case 'default':
        return 1 // Cần chi tiêu > 0 để lên Đồng
      case 'bronze':
        return 1000000 // Cần 1 triệu để lên Bạc
      case 'silver':
        return 3000000 // Cần 3 triệu để lên Vàng
      case 'gold':
        return null
      default:
        return 1
    }
  }

  return {
    totalSpent,
    level,
    levelInfo,
    progress,
    nextLevelAmount: getNextLevelAmount(),
    loading,
    error
  }
}
