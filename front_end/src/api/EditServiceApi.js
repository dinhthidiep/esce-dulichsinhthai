// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

export const getServiceById = async (serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    let message = 'Failed to load service';
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
      console.error('Error parsing get service response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

export const updateService = async (formData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  // Extract service ID from formData (handle both FormData and plain object)
  let serviceId;
  if (formData instanceof FormData) {
    serviceId = formData.get('id') || formData.get('Id');
  } else {
    serviceId = formData.id || formData.Id;
  }

  if (!serviceId) {
    throw new Error('Service ID is required');
  }

  // Convert FormData to JSON object
  let serviceData;
  if (formData instanceof FormData) {
    serviceData = {
      Id: parseInt(serviceId),
      Name: formData.get('name') || '',
      Description: formData.get('description') || '',
      Price: parseFloat(formData.get('price') || 0),
    };
  } else {
    serviceData = {
      Id: parseInt(serviceId),
      Name: formData.name || '',
      Description: formData.description || '',
      Price: parseFloat(formData.price || 0),
    };
  }

  const response = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData),
  });

  if (!response.ok) {
    let message = "Failed to update service";
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
      console.error('Error parsing update service response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};
