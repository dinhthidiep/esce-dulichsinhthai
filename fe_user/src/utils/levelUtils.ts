// Utility functions for user level system

export type UserLevel = 'default' | 'bronze' | 'silver' | 'gold'

export interface LevelInfo {
  level: UserLevel
  name: string
  minAmount: number
  maxAmount: number
  color: string
  icon: string
}

export const LEVEL_CONFIG: Record<UserLevel, LevelInfo> = {
  default: {
    level: 'default',
    name: 'Mới bắt đầu',
    minAmount: 0,
    maxAmount: 1000000,
    color: '#94a3b8', // Gray
    icon: '⭐',
  },
  bronze: {
    level: 'bronze',
    name: 'Đồng',
    minAmount: 0,
    maxAmount: 1000000,
    color: '#cd7f32', // Bronze
    icon: '🥉',
  },
  silver: {
    level: 'silver',
    name: 'Bạc',
    minAmount: 1000000,
    maxAmount: 3000000,
    color: '#c0c0c0', // Silver
    icon: '🥈',
  },
  gold: {
    level: 'gold',
    name: 'Vàng',
    minAmount: 3000000,
    maxAmount: Infinity,
    color: '#ffd700', // Gold
    icon: '🥇',
  },
}

/**
 * Tính level của user dựa trên tổng tiền đã tiêu
 * Level 0 (default): 0 VNĐ (chưa chi tiêu)
 * Level 1 (bronze): > 0 và < 1 triệu
 * Level 2 (silver): >= 1 triệu và < 3 triệu
 * Level 3 (gold): >= 3 triệu trở lên
 */
export const calculateLevel = (totalSpent: number): UserLevel => {
  if (totalSpent >= LEVEL_CONFIG.gold.minAmount) {
    return 'gold'
  } else if (totalSpent >= LEVEL_CONFIG.silver.minAmount) {
    return 'silver'
  } else if (totalSpent > 0 && totalSpent < LEVEL_CONFIG.silver.minAmount) {
    return 'bronze'
  }
  return 'default'
}

/**
 * Lấy thông tin level
 */
export const getLevelInfo = (level: UserLevel): LevelInfo => {
  const info = LEVEL_CONFIG[level]
  if (!info) {
    console.warn(`⚠️ [levelUtils] Level "${level}" không hợp lệ, sử dụng default`)
    return LEVEL_CONFIG.default
  }
  return info
}

/**
 * Tính progress trong level hiện tại (0-100)
 */
export const calculateProgress = (totalSpent: number, level: UserLevel): number => {
  const levelInfo = LEVEL_CONFIG[level]
  
  if (level === 'gold') {
    // Level vàng không có max, progress dựa trên mốc 3M
    const baseAmount = levelInfo.minAmount
    const progressAmount = totalSpent - baseAmount
    // Mỗi 2M thêm = 10% progress, tối đa 100%
    const progress = Math.min((progressAmount / 2000000) * 10, 100)
    return Math.max(0, Math.min(100, progress))
  }
  
  if (level === 'default') {
    // Level 0: 0 - 1 triệu
    const nextAmount = 1000000
    return Math.min(100, (totalSpent / nextAmount) * 100)
  }
  
  if (level === 'bronze') {
    // Level 1: 0 - 1 triệu (tính từ 0)
    const nextAmount = 1000000
    return Math.min(100, (totalSpent / nextAmount) * 100)
  }
  
  // Level 2 (silver): 1 triệu - 3 triệu
  const range = levelInfo.maxAmount - levelInfo.minAmount
  const progressAmount = totalSpent - levelInfo.minAmount
  const progress = (progressAmount / range) * 100
  
  return Math.max(0, Math.min(100, progress))
}

/**
 * Lấy số tiền cần để lên level tiếp theo
 */
export const getNextLevelAmount = (currentLevel: UserLevel): number | null => {
  if (currentLevel === 'gold') {
    return null // Đã đạt level cao nhất
  }
  
  const levels: UserLevel[] = ['default', 'bronze', 'silver', 'gold']
  const currentIndex = levels.indexOf(currentLevel)
  if (currentIndex < levels.length - 1) {
    return LEVEL_CONFIG[levels[currentIndex + 1]].minAmount
  }
  return null
}

