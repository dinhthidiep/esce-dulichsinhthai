// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Create Service API
export const createService = async (formData, comboId = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Convert FormData to JSON object
    const serviceData = {
      Name: formData.get('name') || '',
      Description: formData.get('description') || null,
      Price: parseFloat(formData.get('price') || '0'),
    };

    // Handle image if present (for now, we'll skip image upload as it requires file handling)
    // Image upload can be added later with proper file handling endpoint

    const response = await fetch(`${backend_url}/api/Service`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      let message = "Failed to create service";
      let errorDetails = null;
      
      try {
        const err = await response.json();
        console.error('Create service error response:', err);
        message = err.message || err.error || message;
        errorDetails = err;
      } catch (e) {
        console.error('Error parsing create service response:', e);
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
        if (errorDetails && errorDetails.message) {
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
    console.error("Create service failed:", error);
    throw error;
  }
};

export const getMyServices = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`${backend_url}/api/Service/mine`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    let message = 'Failed to load services';
    try {
      const err = await response.json();
      message = err.message || message;
    } catch {}
    throw new Error(message);
  }
  return await response.json();
};

// Add service to combo (create SERVICECOMBO_DETAIL entry)
export const addServiceToCombo = async (comboId, serviceId, quantity = 1) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const requestBody = {
      ServiceComboId: comboId,
      ServiceId: serviceId,
      Quantity: quantity
    };

    console.log('Adding service to combo - Request:', {
      url: `${backend_url}/api/ServiceComboDetail`,
      method: 'POST',
      body: requestBody
    });

    const response = await fetch(`${backend_url}/api/ServiceComboDetail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Add service to combo - Response status:', response.status);

    if (!response.ok) {
      let message = 'Failed to add service to combo';
      let errorDetails = null;
      
      try {
        const err = await response.json();
        console.error('Add service to combo error response:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        
        // Handle validation errors
        if (err.errors && typeof err.errors === 'object') {
          const validationErrors = Object.entries(err.errors)
            .map(([key, errors]) => {
              const errorList = Array.isArray(errors) ? errors.join(', ') : errors;
              return `${key}: ${errorList}`;
            })
            .join('; ');
          message = `Validation errors: ${validationErrors}`;
        } else {
          message = err.message || err.title || err.error || message;
        }
        errorDetails = err;
      } catch (e) {
        console.error('Error parsing add service to combo response:', e);
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
          // Already handled above
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
    console.error("Add service to combo failed:", error);
    throw error;
  }
};
