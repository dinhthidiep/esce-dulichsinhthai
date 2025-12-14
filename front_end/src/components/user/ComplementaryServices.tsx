import React, { useState, useEffect } from 'react'
import Badge from './ui/Badge'
import { 
  AlertCircleIcon
} from './icons/index'
import type { MembershipTier, ComplementaryService, TierComplementaryServices } from '~/types/membership'
import './ComplementaryServices.css'

// Dữ liệu ưu đãi sẽ được lấy từ API sau; hiện để map rỗng
const complementaryServicesByTier: Partial<Record<MembershipTier, TierComplementaryServices>> = {}

interface ComplementaryServicesProps {
  userTier: MembershipTier
  selectedServices: number[]
  onSelectionChange: (selectedIds: number[]) => void
  disabled?: boolean
}

const ComplementaryServices = ({
  userTier,
  selectedServices,
  onSelectionChange,
  disabled = false
}: ComplementaryServicesProps) => {
  const [tierData, setTierData] = useState<TierComplementaryServices | null>(null)

  useEffect(() => {
    // Nếu user chưa có hạng thành viên (level 0), không cần load data
    if (userTier === 'none') {
      setTierData(null)
      return
    }
    
    const data = complementaryServicesByTier[userTier] || null
    setTierData(data)
    
    // Reset selection nếu user tier thay đổi
    if (selectedServices.length > 0 && data) {
      const validServices = selectedServices.filter(id => 
        data.availableServices.some(s => s.id === id)
      )
      if (validServices.length !== selectedServices.length) {
        onSelectionChange(validServices)
      }
    }
  }, [userTier, selectedServices, onSelectionChange])

  // Nếu customer chưa có gói thành viên (level 0)
  if (userTier === 'none') {
    return (
      <div className="comp-complementary-services-wrapper">
        <div className="comp-complementary-services-empty">
          <p className="comp-empty-message">
            Bạn đang ở cấp 0. <a href="/services">Đặt ngay</a> để tích lũy và nhận ưu đãi đặc biệt!
          </p>
        </div>
      </div>
    )
  }

  // Nếu không có data hoặc không có dịch vụ nào
  if (!tierData || tierData.availableServices.length === 0) {
    return (
      <div className="comp-complementary-services-wrapper">
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






