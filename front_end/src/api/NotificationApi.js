// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/notification/Read/${notificationId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to mark notification as read';
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
      console.error('Error parsing mark as read response:', e);
    }
    throw new Error(message);
  }

  // Backend returns Ok() with no body, so handle empty response
  const text = await response.text();
  if (!text) {
    return { success: true };
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, message: text || 'Notification marked as read' };
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/notification/Delete/${notificationId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to delete notification';
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
      console.error('Error parsing delete notification response:', e);
    }
    throw new Error(message);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Notification deleted successfully' };
  }
};

