import React from 'react'
import { formatPrice } from '~/lib/utils'
import { getLevelInfo, type UserLevel } from '~/utils/levelUtils'
import './LevelProgressBar.css'

interface LevelProgressBarProps {
  totalSpent: number
  level: UserLevel
  progress: number
  nextLevelAmount: number | null
  showDetails?: boolean
  size?: 'small' | 'medium' | 'large'
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  totalSpent,
  level,
  progress,
  nextLevelAmount,
  showDetails = true,
  size = 'medium',
}) => {
  const levelInfo = getLevelInfo(level)

  return (
    <div className={`level-progress-container level-progress-${size}`}>
      <div className="level-header">
        <div className="level-badge">
          <span className="level-icon">{levelInfo.icon}</span>
          <span className="level-name">{levelInfo.name}</span>
        </div>
        {showDetails && (
          <div className="level-spent">
            Đã tiêu: <strong>{formatPrice(totalSpent)}</strong>
          </div>
        )}
      </div>

      <div className="level-progress-wrapper">
        <div className="level-progress-bar">
          <div
            className="level-progress-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: levelInfo.color,
            }}
          />
        </div>
        <div className="level-progress-text">
          {nextLevelAmount ? (
            <span>
              Còn <strong>{formatPrice(nextLevelAmount - totalSpent)}</strong> để lên {getLevelInfo(level === 'default' ? 'bronze' : level === 'bronze' ? 'silver' : 'gold').name}
            </span>
          ) : (
            <span>Đã đạt level cao nhất! 🎉</span>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="level-milestones">
          <div className={`milestone ${level === 'default' ? 'active' : 'completed'}`}>
            <span className="milestone-icon">⭐</span>
            <span className="milestone-label">Mới bắt đầu</span>
          </div>
          <div className={`milestone ${level === 'bronze' ? 'active' : ['silver', 'gold'].includes(level) ? 'completed' : ''}`}>
            <span className="milestone-icon">🥉</span>
            <span className="milestone-label">Đồng</span>
          </div>
          <div className={`milestone ${level === 'silver' ? 'active' : level === 'gold' ? 'completed' : ''}`}>
            <span className="milestone-icon">🥈</span>
            <span className="milestone-label">Bạc</span>
          </div>
          <div className={`milestone ${level === 'gold' ? 'active' : ''}`}>
            <span className="milestone-icon">🥇</span>
            <span className="milestone-label">Vàng</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LevelProgressBar


















