import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuthToken, fetchWithFallback } from '~/api/instances/httpClient'

export interface AdminBadges {
  pendingPosts: number
  pendingServices: number
  pendingUpgradeRequests: number
  unreadMessages: number
}

interface RawBadges {
  pendingPosts: number
  pendingServices: number
  pendingUpgradeRequests: number
  unreadMessages: number
}

const defaultBadges: AdminBadges = {
  pendingPosts: 0,
  pendingServices: 0,
  pendingUpgradeRequests: 0,
  unreadMessages: 0
}

// Keys để lưu số lượng đã xem vào localStorage
const STORAGE_KEYS = {
  viewedPosts: 'admin_viewed_posts_count',
  viewedServices: 'admin_viewed_services_count',
  viewedUpgrades: 'admin_viewed_upgrades_count',
  viewedMessages: 'admin_viewed_messages_count'
}

// Lấy số đã xem từ localStorage
const getViewedCount = (key: string): number => {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10)
  } catch {
    return 0
  }
}

// Lưu số đã xem vào localStorage
const setViewedCount = (key: string, count: number) => {
  try {
    localStorage.setItem(key, String(count))
  } catch {
    // Silent fail
  }
}

export const useAdminBadges = (): AdminBadges => {
  const [badges, setBadges] = useState<AdminBadges>(defaultBadges)
  const [rawBadges, setRawBadges] = useState<RawBadges>(defaultBadges)
  const location = useLocation()

  const fetchBadges = useCallback(async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        return
      }

      const response = await fetchWithFallback('/api/statistics/admin-badges', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const newRawBadges: RawBadges = {
        pendingPosts: data.PendingPosts ?? data.pendingPosts ?? 0,
        pendingServices: data.PendingServices ?? data.pendingServices ?? 0,
        pendingUpgradeRequests: data.PendingUpgradeRequests ?? data.pendingUpgradeRequests ?? 0,
        unreadMessages: data.UnreadMessages ?? data.unreadMessages ?? 0
      }
      setRawBadges(newRawBadges)
    } catch (error) {
      console.warn('[useAdminBadges] Failed to fetch badges:', error)
    }
  }, [])

  // Tính toán badges dựa trên số đã xem
  const calculateBadges = useCallback(() => {
    const viewedPosts = getViewedCount(STORAGE_KEYS.viewedPosts)
    const viewedServices = getViewedCount(STORAGE_KEYS.viewedServices)
    const viewedUpgrades = getViewedCount(STORAGE_KEYS.viewedUpgrades)
    const viewedMessages = getViewedCount(STORAGE_KEYS.viewedMessages)

    setBadges({
      pendingPosts: Math.max(0, rawBadges.pendingPosts - viewedPosts),
      pendingServices: Math.max(0, rawBadges.pendingServices - viewedServices),
      pendingUpgradeRequests: Math.max(0, rawBadges.pendingUpgradeRequests - viewedUpgrades),
      unreadMessages: Math.max(0, rawBadges.unreadMessages - viewedMessages)
    })
  }, [rawBadges])

  // Khi Admin vào trang tương ứng, đánh dấu đã xem
  useEffect(() => {
    const path = location.pathname

    if (path === '/admin/post-approvals') {
      // Admin đang xem trang duyệt bài viết -> đánh dấu đã xem tất cả
      setViewedCount(STORAGE_KEYS.viewedPosts, rawBadges.pendingPosts)
    } else if (path === '/admin/service-approvals') {
      setViewedCount(STORAGE_KEYS.viewedServices, rawBadges.pendingServices)
    } else if (path === '/admin/role-upgrade') {
      setViewedCount(STORAGE_KEYS.viewedUpgrades, rawBadges.pendingUpgradeRequests)
    } else if (path === '/admin/chat') {
      setViewedCount(STORAGE_KEYS.viewedMessages, rawBadges.unreadMessages)
    }

    // Recalculate badges sau khi đánh dấu đã xem
    calculateBadges()
  }, [location.pathname, rawBadges, calculateBadges])

  // Fetch badges on mount và định kỳ
  useEffect(() => {
    let mounted = true

    const loadTimeout = setTimeout(() => {
      if (mounted) {
        void fetchBadges()
      }
    }, 300)

    const refreshInterval = setInterval(() => {
      if (mounted) {
        void fetchBadges()
      }
    }, 30000)

    return () => {
      mounted = false
      clearTimeout(loadTimeout)
      clearInterval(refreshInterval)
    }
  }, [fetchBadges])

  // Recalculate khi rawBadges thay đổi
  useEffect(() => {
    calculateBadges()
  }, [rawBadges, calculateBadges])

  return badges
}

// Export function để reset viewed count (khi có item mới được thêm)
export const resetViewedCount = (type: 'posts' | 'services' | 'upgrades' | 'messages') => {
  const keyMap = {
    posts: STORAGE_KEYS.viewedPosts,
    services: STORAGE_KEYS.viewedServices,
    upgrades: STORAGE_KEYS.viewedUpgrades,
    messages: STORAGE_KEYS.viewedMessages
  }
  setViewedCount(keyMap[type], 0)
}
