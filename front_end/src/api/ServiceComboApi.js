// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

export const createServiceCombo = async (serviceComboData, imageFile = null) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  
  // Upload image to Firebase Storage first if provided
  let imageUrl = null;
  if (imageFile instanceof File) {
    const { uploadImageToFirebase } = await import('../services/firebaseStorage');
    imageUrl = await uploadImageToFirebase(imageFile, 'service-combos');
  }
  
  // Use JSON instead of FormData since we're sending URL, not file
  const requestBody = {
    ...serviceComboData,
    ImageUrl: imageUrl // Send Firebase Storage URL instead of file
  };
  
  const res = await fetch(`${backend_url}/api/ServiceCombo`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to create service combo');
  return res.json();
};

export const getMyServiceCombos = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const userInfo = localStorage.getItem('userInfo');
  let userId = null;
  if (userInfo) { try { const u = JSON.parse(userInfo); userId = u.Id || u.id; } catch {} }
  const res = await fetch(`${backend_url}/api/ServiceCombo`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load service combos');
  const all = await res.json();
  return userId ? (Array.isArray(all) ? all.filter(sc => (sc.HostId || sc.hostId) === userId) : []) : (Array.isArray(all) ? all : []);
};

export const getServiceComboById = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load service combo');
  return res.json();
};

export const updateServiceCombo = async (id, updateData, imageFile = null) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  
  console.log('Updating service combo:', { id, updateData, hasImageFile: imageFile instanceof File });
  
  // Upload image to Firebase Storage first if a new file is provided
  let imageUrl = null;
  if (imageFile instanceof File) {
    const { uploadImageToFirebase } = await import('../services/firebaseStorage');
    imageUrl = await uploadImageToFirebase(imageFile, 'service-combos');
  }
  
  // Use JSON instead of FormData since we're sending URL, not file
  const requestBody = {
    ...updateData,
    ImageUrl: imageUrl // Send Firebase Storage URL (null if no new image, backend preserves existing)
  };
  
  console.log(`Sending PUT request to ${backend_url}/api/ServiceCombo/${id}`);
  
  try {
    const res = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update failed with error:', errorText);
      throw new Error(errorText || 'Failed to update service combo');
    }
    
    const result = await res.json();
    console.log('Update successful, response:', result);
    return result;
  } catch (error) {
    console.error('Error in updateServiceCombo:', error);
    throw error;
  }
};

export const deleteServiceCombo = async (serviceComboId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  
  const res = await fetch(`${backend_url}/api/ServiceCombo/${serviceComboId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    let errorMessage = 'Failed to delete service combo';
    try {
      const errorText = await res.text();
      if (errorText) {
        try {
          const err = JSON.parse(errorText);
          errorMessage = err.message || err.error || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }
    } catch (e) {
      console.error('Error parsing delete response:', e);
    }
    
    // Handle specific HTTP status codes
    if (res.status === 401) {
      errorMessage = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
    } else if (res.status === 403) {
      errorMessage = 'Bạn không có quyền xóa combo dịch vụ này.';
    } else if (res.status === 404) {
      errorMessage = 'Không tìm thấy combo dịch vụ cần xóa.';
    }
    
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }
  
  // Handle both JSON and plain text responses
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // If it's not JSON, return a success object
    return { message: text || 'Service combo deleted successfully' };
  }
};

export const getServicesByComboId = async (comboId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail/combo/${comboId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  if (!res.ok) { throw new Error(text || 'Failed to load services for combo'); }
  try {
    const details = JSON.parse(text);
    console.log('Raw ServiceComboDetail response:', details);
    
    // Extract Service objects from ServiceComboDetail array
    // Each detail has a nested Service property (case-insensitive check)
    if (Array.isArray(details)) {
      const services = details
        .filter(d => {
          // Check for Service property (case-insensitive)
          const service = d.Service || d.service || null;
          return service != null;
        })
        .map(d => {
          // Get Service object (case-insensitive)
          const service = d.Service || d.service || {};
          return {
            ...service, // Spread the Service properties
            Quantity: d.Quantity || d.quantity || 1, // Include quantity from the detail
            ServiceComboDetailId: d.Id || d.id // Include the detail ID for updates
          };
        });
      console.log('Extracted services:', services);
      return services;
    }
    console.warn('Response is not an array:', details);
    return [];
  } catch (e) {
    console.error('Error parsing ServiceComboDetail response:', e);
    return [];
  }
};


