// Backend is running on HTTP port 5002
const backend_url = "http://localhost:5002";

// Helper function to get token from either storage
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
// Helper function to get userInfo from either storage
const getUserInfo = () => {
  const info = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
  if (!info) return null;
  try {
    return JSON.parse(info);
  } catch {
    return null;
  }
};

// Get payments by host ID
export const getPaymentsByHostId = async (hostId) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/payment/host/${hostId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load payments';
    try {
      const errorText = await response.text();
      console.error('Payment API error response:', errorText);
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          message = err.message || err.error || message;
        } catch {
          message = errorText || message;
        }
      }
    } catch (e) {
      console.error('Error parsing get payments response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get payment status by booking ID
export const getPaymentStatus = async (bookingId) => {
  const token = getToken();
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/payment/status/${bookingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load payment status';
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
      console.error('Error parsing get payment status response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};



