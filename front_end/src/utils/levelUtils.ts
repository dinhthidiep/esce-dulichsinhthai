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
    maxAmount: 0,
    color: '#94a3b8', // Gray
    icon: '⭐',
  },
  bronze: {
    level: 'bronze',
    name: 'Đồng',
    minAmount: 1,
    maxAmount: 999999,
    color: '#cd7f32', // Bronze
    icon: '🥉',
  },
  silver: {
    level: 'silver',
    name: 'Bạc',
    minAmount: 1000000,
    maxAmount: 2999999,
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
 * Level 0 (default): < 1 triệu
 * Level 1 (bronze): 0 - 999,999
 * Level 2 (silver): 1,000,000 - 2,999,999
 * Level 3 (gold): >= 3 triệu trở lên
 */
export const calculateLevel = (totalSpent: number): UserLevel => {
  if (totalSpent >= 3000000) {
    return 'gold'
  } else if (totalSpent >= 1000000) {
    return 'silver'
  } else if (totalSpent > 0) {
    return 'bronze'
  }
  return 'default'
}

/**
 * Convert level number (từ database) sang UserLevel string
 */
export const levelNumberToUserLevel = (levelNum: number): UserLevel => {
  switch (levelNum) {
    case 3: return 'gold'
    case 2: return 'silver'
    case 1: return 'bronze'
    default: return 'default'
  }
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
  if (level === 'gold') {
    // Level vàng không có max, luôn 100%
    return 100
  }
  
  if (level === 'default') {
    // Chưa chi tiêu, progress = 0
    return 0
  }
  
  if (level === 'bronze') {
    // Đồng: 1 - 999,999 → tiến tới 1,000,000
    const progress = (totalSpent / 1000000) * 100
    return Math.max(0, Math.min(100, progress))
  }
  
  if (level === 'silver') {
    // Bạc: 1,000,000 - 2,999,999 → tiến tới 3,000,000
    const progressAmount = totalSpent - 1000000
    const range = 3000000 - 1000000 // 2,000,000
    const progress = (progressAmount / range) * 100
    return Math.max(0, Math.min(100, progress))
  }
  
  return 0
}

/**
 * Lấy số tiền cần để lên level tiếp theo
 */
export const getNextLevelAmount = (currentLevel: UserLevel): number | null => {
  switch (currentLevel) {
    case 'default': return 1 // Cần chi tiêu > 0 để lên Đồng
    case 'bronze': return 1000000 // Cần 1 triệu để lên Bạc
    case 'silver': return 3000000 // Cần 3 triệu để lên Vàng
    case 'gold': return null // Đã đạt level cao nhất
    default: return 1
  }
}

