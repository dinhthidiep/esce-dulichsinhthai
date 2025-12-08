// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

export const deleteService = async (serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    let message = 'Failed to delete service';
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
      console.error('Error parsing delete service response:', e);
    }
    throw new Error(message);
  }

  // Read response body only once
  const responseText = await response.text();
  if (!responseText) {
    return { message: 'Service deleted successfully' };
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { message: responseText || 'Service deleted successfully' };
  }
};

