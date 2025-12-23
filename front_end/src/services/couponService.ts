import axiosInstance from '~/utils/axiosInstance'
import { API_ENDPOINTS } from '~/config/api'

/**
 * Validate coupon code
 */
export const validateCoupon = async (code: string, serviceComboId: number | null = null) => {
  try {
    const response = await axiosInstance.post(`${API_ENDPOINTS.COUPON}/validate`, {
      Code: code,
      ServiceComboId: serviceComboId,
    })
    return response.data
  } catch (error) {
    console.error('Error validating coupon:', error)
    throw error
  }
}

/**
 * Calculate discount amount
 */
export const calculateDiscount = async (code: string, originalAmount: number) => {
  try {
    const response = await axiosInstance.post(`${API_ENDPOINTS.COUPON}/calculate-discount`, {
      Code: code,
      OriginalAmount: originalAmount,
    })
    return response.data
  } catch (error) {
    console.error('Error calculating discount:', error)
    throw error
  }
}

/**
 * Apply coupon to booking
 */
export const applyCoupon = async (bookingId: number, couponCode: string) => {
  try {
    const response = await axiosInstance.post(`${API_ENDPOINTS.COUPON}/apply`, {
      BookingId: bookingId,
      CouponCode: couponCode,
    })
    return response.data
  } catch (error) {
    console.error('Error applying coupon:', error)
    throw error
  }
}

/**
 * Remove coupon from booking
 */
export const removeCoupon = async (bookingId: number, couponCode: string) => {
  try {
    const response = await axiosInstance.post(`${API_ENDPOINTS.COUPON}/remove`, {
      BookingId: bookingId,
      CouponCode: couponCode,
    })
    return response.data
  } catch (error) {
    console.error('Error removing coupon:', error)
    throw error
  }
}

/**
 * Get coupons for a service combo
 */
export const getCouponsForCombo = async (serviceComboId: number) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/combo/${serviceComboId}`)
    return response.data
  } catch (error) {
    console.error('Error getting coupons for combo:', error)
    throw error
  }
}

/**
 * Get coupon by code
 */
export const getCouponByCode = async (code: string) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/code/${code}`)
    return response.data
  } catch (error) {
    console.error('Error getting coupon by code:', error)
    throw error
  }
}

/**
 * Get active coupons
 */
export const getActiveCoupons = async () => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COUPON}/active`)
    return response.data
  } catch (error) {
    console.error('Error getting active coupons:', error)
    throw error
  }
}






















