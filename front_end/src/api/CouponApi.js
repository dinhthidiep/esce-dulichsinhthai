// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Get coupons by service combo ID
export const getCouponsByComboId = async (comboId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${backend_url}/api/Coupon/combo/${comboId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
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
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${backend_url}/api/Coupon`, {
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
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${backend_url}/api/Coupon/${couponId}`, {
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
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${backend_url}/api/Coupon/${id}`, {
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
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${backend_url}/api/Coupon/${id}`, {
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



