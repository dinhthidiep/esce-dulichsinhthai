import { useEffect, useState } from 'react'
import { fetchDashboardData, type DashboardDto } from '~/api/instances/DashboardApi'

export interface AdminBadges {
  users: number
  chat: number
  supports: number
  supportApprovals: number
  roleUpgrade: number
}

export const useAdminBadges = (): AdminBadges => {
  const [badges, setBadges] = useState<AdminBadges>({
    users: 0,
    chat: 0,
    supports: 0,
    supportApprovals: 0,
    roleUpgrade: 0
  })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const data: DashboardDto = await fetchDashboardData()
        if (!mounted || !data) return

        setBadges({
          users: 0, // Có thể dùng cho số user mới đăng ký nếu backend hỗ trợ sau này
          chat: data.unreadMessages ?? 0,
          supports: data.pendingSupports ?? 0,
          supportApprovals: data.urgentSupports ?? data.pendingSupports ?? 0,
          roleUpgrade: data.pendingUpgradeRequests ?? 0
        })
      } catch (error) {
        console.warn('[useAdminBadges] Không thể tải dữ liệu badge, dùng giá trị mặc định 0.', error)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  return badges
}


