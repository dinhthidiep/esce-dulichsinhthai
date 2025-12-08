// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Get all bookings
export const getAllBookings = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load bookings';
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
      console.error('Error parsing get bookings response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/${bookingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load booking';
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
      console.error('Error parsing get booking response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get bookings by user ID
export const getBookingsByUserId = async (userId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load user bookings';
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
      console.error('Error parsing get user bookings response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get bookings by service combo ID
export const getBookingsByServiceComboId = async (serviceComboId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/combo/${serviceComboId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load service combo bookings';
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
      console.error('Error parsing get service combo bookings response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get bookings by service ID (Note: This endpoint may not work due to database schema limitations)
export const getBookingsByServiceId = async (serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/service/${serviceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load service bookings';
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
      console.error('Error parsing get service bookings response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Create booking
export const createBooking = async (bookingData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  // Get current user ID if not provided
  let userId = bookingData.UserId || bookingData.userId;
  if (!userId) {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userId = userInfo.Id || userInfo.id;
    } catch {}
  }

  const body = {
    UserId: userId,
    ServiceComboId: bookingData.ServiceComboId || bookingData.serviceComboId || null,
    ServiceId: bookingData.ServiceId || bookingData.serviceId || null,
    Quantity: bookingData.Quantity || bookingData.quantity || 1,
    ItemType: bookingData.ItemType || bookingData.itemType || 'combo',
    Status: bookingData.Status || bookingData.status || 'pending',
    Notes: bookingData.Notes || bookingData.notes || null,
    BookingDate: bookingData.BookingDate || bookingData.bookingDate || new Date().toISOString()
  };

  const response = await fetch(`${backend_url}/api/booking`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let message = 'Failed to create booking';
    try {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          console.error('Parsed error:', err);
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
      console.error('Error parsing create booking response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Update booking
export const updateBooking = async (bookingId, bookingData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const body = {
    Quantity: bookingData.Quantity || bookingData.quantity,
    Notes: bookingData.Notes || bookingData.notes || null,
    Status: bookingData.Status || bookingData.status
  };

  const response = await fetch(`${backend_url}/api/booking/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let message = 'Failed to update booking';
    try {
      const errorText = await response.text();
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
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
      console.error('Error parsing update booking response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Delete booking
export const deleteBooking = async (bookingId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to delete booking';
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
      console.error('Error parsing delete booking response:', e);
    }
    throw new Error(message);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Booking deleted successfully' };
  }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/${bookingId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(status) // Backend expects string in body
  });

  if (!response.ok) {
    let message = 'Failed to update booking status';
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
      console.error('Error parsing update booking status response:', e);
    }
    throw new Error(message);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || `Status updated to ${status}` };
  }
};

// Calculate total amount for a booking
export const calculateTotalAmount = async (serviceComboId, serviceId, quantity, itemType) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const body = {
    ServiceComboId: serviceComboId || 0,
    ServiceId: serviceId || 0,
    Quantity: quantity || 1,
    ItemType: itemType || 'combo'
  };

  const response = await fetch(`${backend_url}/api/booking/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let message = 'Failed to calculate total amount';
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
      console.error('Error parsing calculate total amount response:', e);
    }
    throw new Error(message);
  }

  const result = await response.json();
  return result.TotalAmount || result.totalAmount || 0;
};

// Calculate total amount with coupons for a booking
export const calculateTotalAmountWithCoupons = async (bookingId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/booking/${bookingId}/total-with-coupons`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to calculate total amount with coupons';
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
      console.error('Error parsing calculate total with coupons response:', e);
    }
    throw new Error(message);
  }

  const result = await response.json();
  return result.TotalAmount || result.totalAmount || 0;
};

