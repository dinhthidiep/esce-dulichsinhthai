import React, { useState, useEffect } from 'react'
import Badge from './ui/Badge'
import { 
  AlertCircleIcon
} from './icons/index'
import type { MembershipTier, ComplementaryService, TierComplementaryServices } from '~/mockdata/index'
import { mockComplementaryServices } from '~/mockdata/index'
import './ComplementaryServices.css'

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
    
    const data = mockComplementaryServices[userTier]
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
      <div className="complementary-services-wrapper">
        <div className="complementary-services-empty">
          <p className="empty-message">
            Bạn đang ở cấp 0. <a href="/services">Đặt ngay</a> để tích lũy và nhận ưu đãi đặc biệt!
          </p>
        </div>
      </div>
    )
  }

  // Nếu không có data hoặc không có dịch vụ nào
  if (!tierData || tierData.availableServices.length === 0) {
    return (
      <div className="complementary-services-wrapper">
        <div className="complementary-services-empty">
          <p className="empty-message">
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
    <div className="complementary-services-wrapper">
      <div className="services-header">
        <h3 className="services-title">Ưu đãi dành cho bạn</h3>
        <p className="services-subtitle">
          Chọn tối đa <strong>{tierData.maxSelectable}</strong> trong số <strong>{tierData.availableServices.length}</strong> ưu đãi
        </p>
      </div>

      {selectedCount >= tierData.maxSelectable && (
        <div className="limit-reached-alert">
          <AlertCircleIcon className="alert-icon" />
          <span>Bạn đã chọn đủ {tierData.maxSelectable} dịch vụ. Bỏ chọn một dịch vụ để chọn dịch vụ khác.</span>
        </div>
      )}

      <div className="vouchers-list">
        {tierData.availableServices.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          const canSelect = !isSelected && selectedCount < tierData.maxSelectable

          return (
            <div
              key={service.id}
              className={`voucher-card ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`}
              onClick={() => handleToggleService(service.id)}
            >
              <div className="voucher-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleService(service.id)}
                  disabled={disabled || (!canSelect && !isSelected)}
                  className="checkbox-input"
                />
                <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <span className="check-mark">✓</span>}
                </div>
              </div>
              <div className="voucher-content">
                <h4 className="voucher-name">{service.name}</h4>
                <p className="voucher-description">{service.description}</p>
                <div className="voucher-value">
                  {new Intl.NumberFormat('vi-VN').format(service.value)} <span className="value-currency">VNĐ</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="selection-summary">
          <div className="summary-info">
            <span>Đã chọn: <strong>{selectedCount}/{tierData.maxSelectable}</strong></span>
            {totalValue > 0 && (
              <span className="total-value">
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

