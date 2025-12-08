// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Create ServiceCombo API
export const createServiceCombo = async (serviceComboData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/ServiceCombo`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serviceComboData),
    });

    if (!response.ok) {
      let message = "Failed to create service combo";
      let errorDetails = null;
      
      try {
        const err = await response.json();
        console.error('Create service combo error response:', err);
        message = err.message || err.error || message;
        errorDetails = err;
      } catch (e) {
        console.error('Error parsing create service combo response:', e);
        try {
          const text = await response.text();
          message = text || message;
        } catch (textError) {
          console.error('Error getting text response:', textError);
        }
      }

      // Handle specific HTTP status codes
      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 400) {
        if (errorDetails && errorDetails.errors) {
          // Format validation errors
          const errorMessages = [];
          for (const [key, value] of Object.entries(errorDetails.errors)) {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${value}`);
            }
          }
          message = errorMessages.length > 0 
            ? `Validation errors: ${errorMessages.join('; ')}`
            : (errorDetails.message || message);
        } else if (errorDetails && errorDetails.message) {
          message = errorDetails.message;
        }
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("Create service combo failed:", error);
    throw error;
  }
};

// Get my service combos
export const getMyServiceCombos = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`${backend_url}/api/ServiceCombo/mine`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    let message = 'Failed to load service combos';
    try {
      const err = await response.json();
      message = err.message || message;
    } catch {}
    throw new Error(message);
  }
  return await response.json();
};

// Get services by combo ID
export const getServicesByComboId = async (comboId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/ServiceComboDetail/combo/${comboId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    // Read response body only once
    const responseText = await response.text();
    
    if (!response.ok) {
      let message = 'Failed to load services for combo';
      try {
        const err = JSON.parse(responseText);
        message = err.message || message;
      } catch {
        message = responseText || message;
      }
      throw new Error(message);
    }
    
    // Parse successful response
    try {
      return JSON.parse(responseText);
    } catch {
      return [];
    }
  } catch (error) {
    console.error("Get services by combo ID failed:", error);
    throw error;
  }
};
