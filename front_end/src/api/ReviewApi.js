// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Get all reviews
export const getAllReviews = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load reviews';
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
      console.error('Error parsing get reviews response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get review by ID
export const getReviewById = async (reviewId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/${reviewId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load review';
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
      console.error('Error parsing get review response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Get reviews by booking ID
export const getReviewsByBookingId = async (bookingId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/booking/${bookingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to load reviews';
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
      console.error('Error parsing get reviews by booking response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Update review
export const updateReview = async (reviewId, reviewData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/${reviewId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewData)
  });

  if (!response.ok) {
    let message = 'Failed to update review';
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
      console.error('Error parsing update review response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Update review status
export const updateReviewStatus = async (reviewId, status) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/${reviewId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Status: status })
  });

  if (!response.ok) {
    let message = 'Failed to update review status';
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
      console.error('Error parsing update review status response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Create reply to a review
export const createReply = async (parentReviewId, authorId, content) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/${parentReviewId}/reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ AuthorId: authorId, Content: content })
  });

  if (!response.ok) {
    let message = 'Failed to create reply';
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
      console.error('Error parsing create reply response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Update reply
export const updateReply = async (replyId, content) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/reply/${replyId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Content: content })
  });

  if (!response.ok) {
    let message = 'Failed to update reply';
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
      console.error('Error parsing update reply response:', e);
    }
    throw new Error(message);
  }

  return await response.json();
};

// Delete reply
export const deleteReply = async (replyId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`${backend_url}/api/Review/reply/${replyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Failed to delete reply';
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
      console.error('Error parsing delete reply response:', e);
    }
    throw new Error(message);
  }

  // DELETE operations may return empty body or plain text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  }
  
  // If not JSON, just return success
  return { success: true };
};
