// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

export const createService = async (formData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  // Resolve current user id to set HostId so the new service appears under "my services"
  let hostId = null;
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') || '{}');
    hostId = info.Id || info.id || null;
  } catch {}
  const body = {
    Name: formData.get('name') || '',
    Description: formData.get('description') || null,
    Price: parseFloat(formData.get('price') || '0'),
    HostId: hostId
  };
  const res = await fetch(`${backend_url}/api/Service`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to create service');
  return res.json();
};

export const getMyServices = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const userInfo = localStorage.getItem('userInfo');
  let userId = null;
  if (userInfo) {
    try { const u = JSON.parse(userInfo); userId = u.Id || u.id; } catch {}
  }
  const res = await fetch(`${backend_url}/api/Service`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load services');
  const all = await res.json();
  return userId ? (Array.isArray(all) ? all.filter(s => (s.HostId || s.hostId) === userId) : []) : (Array.isArray(all) ? all : []);
};

export const getAllServices = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/Service`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load services');
  const all = await res.json();
  return Array.isArray(all) ? all : [];
};

export const getServiceById = async (serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load service');
  return res.json();
};

export const updateService = async (formData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  const serviceId = formData instanceof FormData ? (formData.get('id') || formData.get('Id')) : (formData.id || formData.Id);
  if (!serviceId) throw new Error('Service ID is required');
  const body = formData instanceof FormData
    ? { Id: parseInt(serviceId), Name: formData.get('name') || '', Description: formData.get('description') || '', Price: parseFloat(formData.get('price') || 0) }
    : { Id: parseInt(serviceId), Name: formData.name || '', Description: formData.description || '', Price: parseFloat(formData.price || 0) };
  const res = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to update service');
  return res.json();
};

export const deleteService = async (serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${backend_url}/api/Service/${serviceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to delete service');
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { message: text || 'Service deleted successfully' }; }
};

export const addServiceToCombo = async (comboId, serviceId, quantity = 1) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ServiceComboId: comboId, ServiceId: serviceId, Quantity: quantity })
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to add service to combo');
  return res.json();
};

export const getServiceComboDetailByComboAndService = async (comboId, serviceId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail/combo/${comboId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load service combo details');
  const details = await res.json();
  // Find the detail for this specific service
  const detail = Array.isArray(details) ? details.find(d => (d.ServiceId || d.serviceId) === parseInt(serviceId)) : null;
  return detail;
};

export const updateServiceComboDetail = async (detailId, comboId, serviceId, quantity) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail/${detailId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ServiceComboId: comboId, ServiceId: serviceId, Quantity: quantity })
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to update service combo detail');
  return res.json();
};

export const deleteServiceComboDetail = async (detailId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail/${detailId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to delete service combo detail');
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { message: text || 'Service combo detail deleted successfully' }; }
};

export const getServiceComboDetailsByComboId = async (comboId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${backend_url}/api/ServiceComboDetail/combo/${comboId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load service combo details');
  return res.json();
};


