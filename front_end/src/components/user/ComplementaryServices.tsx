import { useState, useEffect } from 'react'
import { AlertCircleIcon } from './icons/index'
import type { MembershipTier, ComplementaryService } from '~/types/membership'
import { getBonusServicesByHost } from '~/api/user/BonusServiceApi'
import './ComplementaryServices.css'

// Level number mapping
const tierToLevelNumber: Record<MembershipTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3
}

// Max selectable theo tier
const maxSelectableByTier: Record<MembershipTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3
}

// Level names for display
const levelNames: Record<string, string> = {
  level1: 'Đồng',
  level2: 'Bạc',
  level3: 'Vàng'
}

// Level icons for display
const levelIcons: Record<string, string> = {
  level1: '🥉',
  level2: '🥈',
  level3: '🥇'
}

// Role names for display
const roleNames: Record<string, string> = {
  tourist: 'Du khách',
  agency: 'Đại lý'
}

interface TargetAudienceInfo {
  forTourist: boolean
  touristLevels: string[]
  forAgency: boolean
  agencyLevels: string[]
}

interface ExtendedComplementaryService extends ComplementaryService {
  isEligible: boolean
  requiredLevel?: string
  requiredUserType?: string
  targetAudienceInfo?: TargetAudienceInfo
}

interface ComplementaryServicesProps {
  userTier: MembershipTier
  selectedServices: number[]
  onSelectionChange: (selectedIds: number[]) => void
  disabled?: boolean
  hostId?: number
  onServicesLoaded?: (services: ExtendedComplementaryService[]) => void
  maxSelectable?: number // Số lượng tối đa được chọn (theo số lượng gói đã đặt)
}

const ComplementaryServices = ({
  userTier,
  selectedServices,
  onSelectionChange,
  disabled = false,
  hostId,
  onServicesLoaded,
  maxSelectable: maxSelectableProp
}: ComplementaryServicesProps) => {
  const [allServices, setAllServices] = useState<ExtendedComplementaryService[]>([])
  const [eligibleCount, setEligibleCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBonusServices = async () => {
      if (!hostId) {
        setAllServices([])
        return
      }

      try {
        setLoading(true)
        const bonusServices = await getBonusServicesByHost(hostId)
        const userLevelNum = tierToLevelNumber[userTier]

        // Process all bonus services
        const processedServices: ExtendedComplementaryService[] = bonusServices.map(bs => {
          let isEligible = false
          let requiredLevel: string | undefined
          let requiredUserType: string | undefined
          const targetAudienceInfo: TargetAudienceInfo = {
            forTourist: false,
            touristLevels: [],
            forAgency: false,
            agencyLevels: []
          }

          // Get user info to check roleId
          const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
          let userRoleId: number | string = 4 // Default to Tourist
          if (userInfoStr) {
            try {
              const userInfo = JSON.parse(userInfoStr)
              userRoleId = userInfo.RoleId || userInfo.roleId || 4
            } catch {}
          }
          const roleIdNum = typeof userRoleId === 'string' ? parseInt(userRoleId) : userRoleId
          const isUserTourist = roleIdNum === 4
          const isUserAgency = roleIdNum === 3

          if (bs.TargetAudience) {
            try {
              const target = JSON.parse(bs.TargetAudience)

              // Check if service is for tourists
              if (target.forTourist && target.touristLevels) {
                targetAudienceInfo.forTourist = true
                // Collect all tourist levels
                const levels = ['level1', 'level2', 'level3']
                for (const lvl of levels) {
                  if (target.touristLevels[lvl]) {
                    targetAudienceInfo.touristLevels.push(lvl)
                  }
                }
                
                // Find minimum required level for this service
                for (const lvl of levels) {
                  if (target.touristLevels[lvl]) {
                    requiredLevel = lvl
                    break
                  }
                }

                // User is eligible if:
                // 1. User is Tourist AND user's level >= required level
                // 2. User is Agency AND user's level >= required level (Agency can also use Tourist benefits)
                if (isUserTourist || isUserAgency) {
                  // Check if user's level is >= required level
                  // level1=bronze, level2=silver, level3=gold
                  const requiredLevelNum = requiredLevel ? parseInt(requiredLevel.replace('level', '')) : 0
                  if (userLevelNum >= requiredLevelNum) {
                    isEligible = true
                  }
                }
              }
              
              // Check if service is for agency
              if (target.forAgency && target.agencyLevels) {
                targetAudienceInfo.forAgency = true
                // Collect all agency levels
                const levels = ['level1', 'level2', 'level3']
                for (const lvl of levels) {
                  if (target.agencyLevels[lvl]) {
                    targetAudienceInfo.agencyLevels.push(lvl)
                  }
                }
                
                // Find minimum required level for agency
                for (const lvl of levels) {
                  if (target.agencyLevels[lvl]) {
                    if (!requiredLevel) requiredLevel = lvl
                    requiredUserType = 'Agency'
                    break
                  }
                }

                // Only Agency users can select agency-specific services
                if (isUserAgency) {
                  const requiredLevelNum = requiredLevel ? parseInt(requiredLevel.replace('level', '')) : 0
                  if (userLevelNum >= requiredLevelNum) {
                    isEligible = true
                  }
                }
              } else if (target.forAgency && !target.agencyLevels) {
                // Agency service without level requirement
                targetAudienceInfo.forAgency = true
                requiredUserType = 'Agency'
                if (isUserAgency) {
                  isEligible = true
                }
              }
            } catch {
              // Invalid JSON, not eligible
            }
          }

          return {
            id: bs.Id,
            name: bs.Name,
            description: bs.Description || '',
            value: bs.Price,
            isEligible,
            requiredLevel,
            requiredUserType,
            targetAudienceInfo
          }
        })

        // Sort: eligible first, then by required level
        processedServices.sort((a, b) => {
          if (a.isEligible && !b.isEligible) return -1
          if (!a.isEligible && b.isEligible) return 1
          return 0
        })

        setAllServices(processedServices)
        setEligibleCount(processedServices.filter(s => s.isEligible).length)
        
        // Notify parent about loaded services
        if (onServicesLoaded) {
          onServicesLoaded(processedServices)
        }
      } catch (error) {
        console.error('Error fetching bonus services:', error)
        setAllServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchBonusServices()
  }, [userTier, hostId])

  // Reset selection if services change
  useEffect(() => {
    if (selectedServices.length > 0 && allServices.length > 0) {
      const validServices = selectedServices.filter(id =>
        allServices.some(s => s.id === id && s.isEligible)
      )
      if (validServices.length !== selectedServices.length) {
        onSelectionChange(validServices)
      }
    }
  }, [allServices, selectedServices, onSelectionChange])

  // Auto-select eligible services when services are loaded
  useEffect(() => {
    if (allServices.length > 0 && selectedServices.length === 0) {
      // Sử dụng maxSelectableProp nếu có, nếu không thì dùng maxSelectableByTier
      const maxSelectable = maxSelectableProp ?? maxSelectableByTier[userTier]
      const eligibleServices = allServices
        .filter(s => s.isEligible)
        .slice(0, maxSelectable)
        .map(s => s.id)
      
      if (eligibleServices.length > 0) {
        onSelectionChange(eligibleServices)
      }
    }
  }, [allServices, userTier, maxSelectableProp]) // Only run when services load, not on every selection change

  // Helper function to format target audience display with icons
  const formatTargetAudience = (service: ExtendedComplementaryService): JSX.Element | null => {
    if (!service.targetAudienceInfo) return null
    
    const { forTourist, touristLevels, forAgency, agencyLevels } = service.targetAudienceInfo
    
    const renderLevelBadges = (levels: string[]) => {
      return levels.map(lvl => (
        <span key={lvl} className="comp-level-badge" data-level={lvl}>
          <span className="comp-level-icon">{levelIcons[lvl]}</span>
          <span className="comp-level-name">{levelNames[lvl]}</span>
        </span>
      ))
    }
    
    return (
      <div className="comp-target-badges">
        {forTourist && touristLevels.length > 0 && (
          <div className="comp-target-group">
            <span className="comp-target-role">{roleNames.tourist}:</span>
            {renderLevelBadges(touristLevels)}
          </div>
        )}
        {forAgency && agencyLevels.length > 0 && (
          <div className="comp-target-group">
            <span className="comp-target-role">{roleNames.agency}:</span>
            {renderLevelBadges(agencyLevels)}
          </div>
        )}
      </div>
    )
  }

  const handleToggleService = (serviceId: number, isEligible: boolean) => {
    if (disabled || !isEligible) return

    const isSelected = selectedServices.includes(serviceId)
    // Sử dụng maxSelectableProp nếu có, nếu không thì dùng maxSelectableByTier
    const maxSelectable = maxSelectableProp ?? maxSelectableByTier[userTier]

    if (isSelected) {
      onSelectionChange(selectedServices.filter(id => id !== serviceId))
    } else {
      if (selectedServices.length >= maxSelectable) {
        return
      }
      onSelectionChange([...selectedServices, serviceId])
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="comp-complementary-services-wrapper">
        <h3 className="comp-services-title">Ưu đãi dành cho bạn</h3>
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">Đang tải ưu đãi...</p>
        </div>
      </div>
    )
  }

  // No services available
  if (allServices.length === 0) {
    return (
      <div className="comp-complementary-services-wrapper">
        <h3 className="comp-services-title">Ưu đãi dành cho bạn</h3>
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">
            Hiện tại không có ưu đãi nào từ host này.
          </p>
        </div>
      </div>
    )
  }

  // Sử dụng maxSelectableProp nếu có, nếu không thì dùng maxSelectableByTier
  const maxSelectable = maxSelectableProp ?? maxSelectableByTier[userTier]
  const selectedCount = selectedServices.length

  return (
    <div className="comp-complementary-services-wrapper">
      <div className="comp-services-header">
        <h3 className="comp-services-title">Ưu đãi dành cho bạn</h3>
        {userTier === 'none' ? (
          <p className="comp-services-subtitle">
            Bạn đang ở cấp 0. <a href="/subscription-packages">Nâng cấp</a> để nhận ưu đãi!
          </p>
        ) : (
          <p className="comp-services-subtitle comp-services-instruction">
            Vui lòng chọn loại dịch vụ tặng kèm mà bạn muốn được trải nghiệm theo số lượng gói dịch vụ bạn đã đặt 
            <span className="comp-services-note">
              (Lưu ý: nếu bạn chỉ chọn 1 loại dịch vụ tặng kèm thì Host sẽ chuẩn bị dịch vụ tặng kèm đó theo số lượng gói dịch vụ đã đặt. Nếu chọn nhiều loại, hãy ghi rõ số lượng của mỗi loại dịch vụ ưu đãi cho Host nhé)
            </span>
            <br />
            <span className="comp-services-thanks">Cảm ơn bạn rất nhiều! 💚</span>
          </p>
        )}
      </div>

      {userTier !== 'none' && selectedCount >= maxSelectable && (
        <div className="comp-limit-reached-alert">
          <AlertCircleIcon className="comp-alert-icon" />
          <span>Bạn đã chọn đủ {maxSelectable} dịch vụ (theo số lượng gói dịch vụ đã đặt). Bỏ chọn một dịch vụ để chọn dịch vụ khác.</span>
        </div>
      )}

      <div className="comp-vouchers-list">
        {allServices.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          const canSelect = service.isEligible && !isSelected && selectedCount < maxSelectable
          const isLocked = !service.isEligible

          return (
            <div
              key={service.id}
              className={`comp-voucher-card ${isSelected ? 'comp-selected' : ''} ${isLocked ? 'comp-locked' : ''} ${!canSelect && !isSelected && !isLocked ? 'comp-disabled' : ''}`}
              onClick={() => handleToggleService(service.id, service.isEligible)}
              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
            >
              <div className="comp-voucher-checkbox">
                {isLocked ? (
                  <div className="comp-checkbox-locked">
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>🔒</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleService(service.id, service.isEligible)}
                      disabled={disabled || !canSelect && !isSelected}
                      className="comp-checkbox-input"
                    />
                    <div className={`comp-checkbox-custom ${isSelected ? 'comp-checked' : ''}`}>
                      {isSelected && <span className="comp-check-mark">✓</span>}
                    </div>
                  </>
                )}
              </div>
              <div className="comp-voucher-content">
                <h4 className="comp-voucher-name">{service.name}</h4>
                <p className="comp-voucher-description">{service.description}</p>
                {/* Display target audience info */}
                {service.targetAudienceInfo && (service.targetAudienceInfo.forTourist || service.targetAudienceInfo.forAgency) && (
                  <div className="comp-voucher-target-audience">
                    <span className="comp-target-label">Dành cho: </span>
                    {formatTargetAudience(service)}
                  </div>
                )}
                {isLocked ? (
                  <div className="comp-voucher-locked-reason">
                    {service.requiredUserType && !service.requiredLevel ? (
                      <span>Dành cho {service.requiredUserType}</span>
                    ) : service.requiredUserType && service.requiredLevel ? (
                      <span>Dành cho {service.requiredUserType} cấp {levelIcons[service.requiredLevel]} {levelNames[service.requiredLevel] || service.requiredLevel} trở lên</span>
                    ) : service.requiredLevel ? (
                      <span>Yêu cầu cấp {levelIcons[service.requiredLevel]} {levelNames[service.requiredLevel] || service.requiredLevel} trở lên</span>
                    ) : (
                      <span>Không khả dụng</span>
                    )}
                  </div>
                ) : (
                  <div className="comp-voucher-value comp-free-tag">Miễn phí</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="comp-selection-summary">
          <div className="comp-summary-info">
            <span>Đã chọn: <strong>{selectedCount}/{eligibleCount}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplementaryServices
