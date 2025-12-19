import React, { useState, useEffect } from 'react'
import { 
  AlertCircleIcon
} from './icons/index'
import type { MembershipTier, ComplementaryService, TierComplementaryServices } from '~/types/membership'
import { getBonusServicesByHost } from '~/api/user/BonusServiceApi'
import './ComplementaryServices.css'

// Map tier name to level key trong TargetAudience JSON
const tierToLevelKey: Record<MembershipTier, string> = {
  none: '',
  silver: 'level1',
  gold: 'level2', 
  diamond: 'level3'
}

// Max selectable theo tier
const maxSelectableByTier: Record<MembershipTier, number> = {
  none: 0,
  silver: 1,
  gold: 2,
  diamond: 3
}

interface ComplementaryServicesProps {
  userTier: MembershipTier
  selectedServices: number[]
  onSelectionChange: (selectedIds: number[]) => void
  disabled?: boolean
  hostId?: number // Thêm hostId để fetch bonus services
}

const ComplementaryServices = ({
  userTier,
  selectedServices,
  onSelectionChange,
  disabled = false,
  hostId
}: ComplementaryServicesProps) => {
  const [tierData, setTierData] = useState<TierComplementaryServices | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBonusServices = async () => {
      // Nếu user chưa có hạng thành viên (level 0) hoặc không có hostId, không cần load data
      if (userTier === 'none' || !hostId) {
        setTierData(null)
        return
      }

      try {
        setLoading(true)
        const bonusServices = await getBonusServicesByHost(hostId)
        
        // Filter bonus services theo TargetAudience phù hợp với userTier
        const levelKey = tierToLevelKey[userTier]
        const filteredServices = bonusServices.filter(bs => {
          if (!bs.TargetAudience) return false
          try {
            const target = JSON.parse(bs.TargetAudience)
            // Kiểm tra forTourist và touristLevels
            if (target.forTourist && target.touristLevels && target.touristLevels[levelKey]) {
              return true
            }
            return false
          } catch {
            return false
          }
        })

        // Convert sang format ComplementaryService
        const availableServices: ComplementaryService[] = filteredServices.map(bs => ({
          id: bs.Id,
          name: bs.Name,
          description: bs.Description || '',
          value: bs.Price
        }))

        if (availableServices.length > 0) {
          setTierData({
            maxSelectable: maxSelectableByTier[userTier],
            availableServices
          })
        } else {
          setTierData(null)
        }
      } catch (error) {
        console.error('Error fetching bonus services:', error)
        setTierData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBonusServices()
  }, [userTier, hostId])

  // Reset selection nếu tierData thay đổi
  useEffect(() => {
    if (selectedServices.length > 0 && tierData) {
      const validServices = selectedServices.filter(id => 
        tierData.availableServices.some(s => s.id === id)
      )
      if (validServices.length !== selectedServices.length) {
        onSelectionChange(validServices)
      }
    }
  }, [tierData, selectedServices, onSelectionChange])

  // Nếu customer chưa có gói thành viên (level 0)
  if (userTier === 'none') {
    return (
      <div className="comp-complementary-services-wrapper">
        <h3 className="comp-services-title">Ưu đãi của bạn</h3>
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">
            Bạn đang ở cấp 0. <a href="/services">Đặt ngay</a> để tích lũy và nhận ưu đãi đặc biệt!
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="comp-complementary-services-wrapper">
        <h3 className="comp-services-title">Ưu đãi của bạn</h3>
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">Đang tải ưu đãi...</p>
        </div>
      </div>
    )
  }

  // Nếu không có data hoặc không có dịch vụ nào
  if (!tierData || tierData.availableServices.length === 0) {
    return (
      <div className="comp-complementary-services-wrapper">
        <h3 className="comp-services-title">Ưu đãi của bạn</h3>
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">
            Hiện tại không có ưu đãi nào dành cho bạn.
          </p>
        </div>
      </div>
    )
  }

  const handleToggleService = (serviceId: number) => {
    if (disabled) return

    const isSelected = selectedServices.includes(serviceId)
    
    if (isSelected) {
      // Bỏ chọn
      onSelectionChange(selectedServices.filter(id => id !== serviceId))
    } else {
      // Chọn thêm - kiểm tra giới hạn
      if (selectedServices.length >= tierData.maxSelectable) {
        return // Đã đạt giới hạn
      }
      onSelectionChange([...selectedServices, serviceId])
    }
  }

  const getTierColor = (tier: MembershipTier) => {
    switch (tier) {
      case 'silver':
        return '#94a3b8'
      case 'gold':
        return '#fbbf24'
      case 'diamond':
        return '#a78bfa'
      default:
        return '#64748b'
    }
  }

  const selectedCount = selectedServices.length
  const remaining = tierData.maxSelectable - selectedCount
  const totalValue = tierData.availableServices
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="comp-complementary-services-wrapper">
      <div className="comp-services-header">
        <h3 className="comp-services-title">Ưu đãi dành cho bạn</h3>
        <p className="comp-services-subtitle">
          Chọn tối đa <strong>{tierData.maxSelectable}</strong> trong số <strong>{tierData.availableServices.length}</strong> ưu đãi
        </p>
      </div>

      {selectedCount >= tierData.maxSelectable && (
        <div className="comp-limit-reached-alert">
          <AlertCircleIcon className="comp-alert-icon" />
          <span>Bạn đã chọn đủ {tierData.maxSelectable} dịch vụ. Bỏ chọn một dịch vụ để chọn dịch vụ khác.</span>
        </div>
      )}

      <div className="comp-vouchers-list">
        {tierData.availableServices.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          const canSelect = !isSelected && selectedCount < tierData.maxSelectable

          return (
            <div
              key={service.id}
              className={`comp-voucher-card ${isSelected ? 'comp-selected' : ''} ${!canSelect && !isSelected ? 'comp-disabled' : ''}`}
              onClick={() => handleToggleService(service.id)}
            >
              <div className="comp-voucher-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleService(service.id)}
                  disabled={disabled || (!canSelect && !isSelected)}
                  className="comp-checkbox-input"
                />
                <div className={`comp-checkbox-custom ${isSelected ? 'comp-checked' : ''}`}>
                  {isSelected && <span className="comp-check-mark">✓</span>}
                </div>
              </div>
              <div className="comp-voucher-content">
                <h4 className="comp-voucher-name">{service.name}</h4>
                <p className="comp-voucher-description">{service.description}</p>
                <div className="comp-voucher-value">
                  {new Intl.NumberFormat('vi-VN').format(service.value)} <span className="comp-value-currency">VNĐ</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="comp-selection-summary">
          <div className="comp-summary-info">
            <span>Đã chọn: <strong>{selectedCount}/{tierData.maxSelectable}</strong></span>
            {totalValue > 0 && (
              <span className="comp-total-value">
                Tổng giá trị: <strong>{new Intl.NumberFormat('vi-VN').format(totalValue)} VNĐ</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplementaryServices






