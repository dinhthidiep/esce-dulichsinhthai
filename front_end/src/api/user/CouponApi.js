import { API_BASE_URL, API_ENDPOINTS } from '~/config/api';

// Helper function to get token from either storage
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// Get all coupons
export const getAllCoupons = async () => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load coupons');
  return res.json();
};

// Get active coupons
export const getActiveCoupons = async () => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/active`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load active coupons');
  return res.json();
};

// Get coupon by code
export const getCouponByCode = async (code) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/code/${encodeURIComponent(code)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(await res.text() || 'Failed to load coupon');
  }
  return res.json();
};

// Get coupons by host ID
export const getCouponsByHostId = async (hostId) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/host/${hostId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load coupons');
  return res.json();
};

// Get coupons by service combo ID
export const getCouponsByComboId = async (comboId) => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/combo/${comboId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    // If backend throws a JsonException due to circular references (Role -> Accounts -> Role ...),
    // it returns 500. We are NOT allowed to change the backend, so treat 500 as "no coupons"
    // and let the UI keep working.
    if (response.status === 500) {
      try {
        const errorText = await response.text();
        console.warn(`Backend returned 500 for /api/Coupon/combo/${comboId}:`, errorText);
      } catch (e) {
        console.warn('Backend returned 500 for getCouponsByComboId and response body could not be read', e);
      }
      return [];
    }

    let message = 'Failed to load coupons';
    try {
      const errorText = await response.text();
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          message = err.message || message;
        } catch {
          message = errorText || message;
        }
      }
    } catch (e) {
      console.error('Error parsing get coupons response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Create coupon
export const createCoupon = async (couponData) => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    let message = 'Failed to create coupon';
    try {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          console.error('Parsed error:', err);
          // Handle validation errors
          if (err.errors) {
            const errorMessages = Object.entries(err.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            message = errorMessages || err.title || message;
          } else {
            message = err.message || err.title || errorText || message;
          }
        } catch {
          message = errorText || message;
        }
      }
    } catch (e) {
      console.error('Error parsing create coupon response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Delete coupon
export const deleteCoupon = async (couponId) => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/${couponId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    let message = 'Failed to delete coupon';
    try {
      const errorText = await response.text();
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          message = err.message || message;
        } catch {
          message = errorText || message;
        }
      }
    } catch (e) {
      console.error('Error parsing delete coupon response:', e);
    }
    throw new Error(message);
  }

  return true;
};

// Get coupon by ID
export const getCouponById = async (id) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    let message = 'Failed to load coupon';
    try { const txt = await res.text(); message = txt || message; } catch {}
    throw new Error(message);
  }
  return res.json();
};

// Update coupon
export const updateCoupon = async (id, updateData) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    let message = 'Failed to update coupon';
    try { const txt = await res.text(); message = txt || message; } catch {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

// Validate coupon
export const validateCoupon = async (code, serviceComboId = null) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Code: code,
      ServiceComboId: serviceComboId
    })
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to validate coupon');
  const result = await res.json();
  return result.IsValid || false;
};

// Calculate discount
export const calculateDiscount = async (code, originalAmount) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/calculate-discount`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Code: code,
      OriginalAmount: originalAmount
    })
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to calculate discount');
  const result = await res.json();
  return result.Discount || 0;
};

// Apply coupon to booking
export const applyCoupon = async (bookingId, couponCode) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BookingId: bookingId,
      CouponCode: couponCode
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to apply coupon');
  }
  return res.json();
};

// Remove coupon from booking
export const removeCoupon = async (bookingId, couponCode) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COUPON}/remove`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BookingId: bookingId,
      CouponCode: couponCode
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to remove coupon');
  }
  return res.json();
};


