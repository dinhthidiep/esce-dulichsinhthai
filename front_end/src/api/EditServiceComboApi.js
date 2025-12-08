// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Get ServiceCombo by ID
export const getServiceComboById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to load service combo';
      try {
        const err = await response.json();
        message = err.message || message;
      } catch {}
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    console.error("Get service combo failed:", error);
    throw error;
  }
};

// Update ServiceCombo
export const updateServiceCombo = async (id, updateData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let message = 'Failed to update service combo';
      let errorDetails = null;
      
      try {
        const err = await response.json();
        console.error('Update service combo error response:', err);
        message = err.message || err.error || message;
        errorDetails = err;
      } catch (e) {
        console.error('Error parsing update service combo response:', e);
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
      } else if (response.status === 404) {
        message = 'Không tìm thấy combo dịch vụ cần cập nhật.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("Update service combo failed:", error);
    throw error;
  }
};