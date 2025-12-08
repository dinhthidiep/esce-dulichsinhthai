// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Get comments by post ID API
export const getCommentsByPostId = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/Comment/post/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to load comments';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Get comments error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 404) {
        // 404 means no comments found, return empty array instead of throwing
        return [];
      } else if (response.status === 500) {
        message = 'Lỗi server. Vui lòng thử lại sau.';
      }

      // Only throw error for non-404 status codes
      if (response.status !== 404) {
        const error = new Error(message);
        error.status = response.status;
        error.details = errorDetails;
        throw error;
      }
      
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful response:', parseError);
          return [];
        }
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error("Get comments failed:", error);
    throw error;
  }
};

// Get current user profile API
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Return null instead of throwing - component will use localStorage
      return null;
    }

    // Get user ID from token or localStorage
    const userInfo = localStorage.getItem('userInfo');
    let userId = null;
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        userId = user.Id || user.id;
      } catch (e) {
        console.error('Error parsing userInfo:', e);
      }
    }

    if (!userId) {
      // Return null instead of throwing - component will use localStorage
      return null;
    }

    // Use AbortController with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${backend_url}/api/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If not OK, return null - component will use localStorage
        return null;
      }

      // Try to read response - if it fails due to size, return null
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text && text.trim()) {
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error('Error parsing get current user response:', parseError);
              return null;
            }
          }
          return null;
        }
        return null;
      } catch (readError) {
        // If reading fails (e.g., Content-Length mismatch), return null
        console.error('Error reading user response (likely too large):', readError);
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Silently handle network errors - component will use localStorage
      // Only log if it's not a network/CORS error (which are expected in some scenarios)
      if (fetchError.name === 'AbortError') {
        // Timeout is expected in some cases, don't log as error
        return null;
      } else if (fetchError.name === 'TypeError' && fetchError.message && (fetchError.message.includes('NetworkError') || fetchError.message.includes('Failed to fetch'))) {
        // Network errors (CORS, connection refused, etc.) are expected, don't log
        return null;
      } else {
        // Only log unexpected errors
        console.warn('Get current user fetch error:', fetchError);
      }
      // Return null instead of throwing - component will use localStorage
      return null;
    }
  } catch (error) {
    console.error("Get current user failed:", error);
    // Return null instead of throwing - component will use localStorage
    return null;
  }
};

// Get all posts API
export const getAllPosts = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Use AbortController with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    let response;
    try {
      response = await fetch(`${backend_url}/api/Post/GetAllPost`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout. Vui lòng thử lại sau.');
      }
      throw fetchError;
    }

    if (!response.ok) {
      let message = 'Failed to load posts';
      let errorDetails = null;

      // Read response body only once
      const contentType = response.headers.get('content-type');
      let responseText = '';
      
      try {
        responseText = await response.text();
        
        // Try to parse as JSON if content-type indicates JSON
        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Get posts error response (full):', JSON.stringify(err, null, 2));
            console.error('Get posts error message:', err.message);
            console.error('Get posts error stackTrace:', err.stackTrace);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            // If JSON parsing fails, use the text as message
            console.error('Get posts error (raw text):', responseText);
            message = responseText || message;
          }
        } else if (responseText) {
          console.error('Get posts error (non-JSON):', responseText);
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading response:', e);
        // Use default message if we can't read the response
      }

      // Handle specific HTTP status codes
      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy bài đăng.';
      } else if (response.status === 500) {
        // For 500 errors, try to show the actual error message from backend
        if (errorDetails && errorDetails.message) {
          message = `Lỗi server: ${errorDetails.message}`;
        } else if (responseText) {
          message = `Lỗi server: ${responseText}`;
        } else {
          message = 'Lỗi server. Vui lòng thử lại sau.';
        }
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    // Handle successful response - check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful response:', parseError);
          return [];
        }
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error("Get posts failed:", error);
    throw error;
  }
};

// Create post API
export const createPost = async (postData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Get user info for PosterName
    let posterName = 'User';
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      posterName = userInfo.Name || userInfo.name || 'User';
    } catch (e) {
      console.error('Error parsing userInfo:', e);
    }

    // Upload image to Firebase Storage first if provided
    let imageUrl = null;
    if (postData.image instanceof File) {
      const { uploadImageToFirebase } = await import('../services/firebaseStorage');
      imageUrl = await uploadImageToFirebase(postData.image, 'posts');
    }

    // DỮ LIỆU PHÙ HỢP VỚI PostDto TRONG BACKEND
    // PostDto: PostContent (string), Images (List<string>), PosterName (string), Hashtags (List<string>), ArticleTitle (string?)
    const text = (postData.text || '').trim();
    const postContent = text || (imageUrl ? ' ' : ' ');
    const title = (postData.title || '').trim();
    
    const requestBody = {
      PostContent: postContent,
      Images: imageUrl ? [imageUrl] : [],
      PosterName: posterName,
      Hashtags: [],
      ArticleTitle: title || null
    };

    const response = await fetch(`${backend_url}/api/Post/CreatePost`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let message = 'Failed to create post';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Create post error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading create post response:', e);
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful create post response:', parseError);
          return null;
        }
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error("Create post failed:", error);
    throw error;
  }
};

// Create comment API
export const createComment = async (commentData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Upload image to Firebase Storage first if provided
    let imageUrl = null;
    if (commentData.image instanceof File) {
      const { uploadImageToFirebase } = await import('../services/firebaseStorage');
      imageUrl = await uploadImageToFirebase(commentData.image, 'comments');
    }

    // Use JSON instead of FormData since we're sending URL, not file
    const requestBody = {
      PostId: String(commentData.postId || ''),
      Content: commentData.content || '',
      ImageUrl: imageUrl // Send Firebase Storage URL instead of file
    };
    
    // PostCommentId is optional (for replies)
    if (commentData.parentCommentId) {
      requestBody.PostCommentId = String(commentData.parentCommentId);
    }

    const response = await fetch(`${backend_url}/api/Comment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let message = 'Failed to create comment';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Create comment error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading create comment response:', e);
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful create comment response:', parseError);
          return null;
        }
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error("Create comment failed:", error);
    throw error;
  }
};

// Delete post API
export const deletePost = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Backend: [HttpDelete("DeletePost")] DeletePost(int id)
    const response = await fetch(`${backend_url}/api/Post/DeletePost?id=${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to delete post';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Delete post error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = 'Bạn không có quyền xóa bài đăng này.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy bài đăng.';
      } else if (response.status === 500) {
        message = 'Lỗi server. Vui lòng thử lại sau.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Delete post failed:", error);
    throw error;
  }
};

// Delete comment API
export const deleteComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Ensure commentId is a number
    const numericId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
    if (isNaN(numericId)) {
      throw new Error('Invalid comment ID');
    }

    console.log(`Deleting comment with ID: ${numericId} (type: ${typeof numericId})`);

    const response = await fetch(`${backend_url}/api/Comment/${numericId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to delete comment';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Delete comment error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = 'Bạn không có quyền xóa bình luận này.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy bình luận.';
      } else if (response.status === 500) {
        message = 'Lỗi server. Vui lòng thử lại sau.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Delete comment failed:", error);
    throw error;
  }
};

// Delete reaction API
export const deleteReaction = async (targetType, targetId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/Reaction/${targetType}/${targetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to delete reaction';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Delete reaction error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading delete reaction response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy reaction để xóa.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Delete reaction failed:", error);
    throw error;
  }
};

// Create or update reaction API
export const createReaction = async (reactionData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Validate và chuẩn hóa dữ liệu
    if (!reactionData.targetType || !reactionData.targetId || !reactionData.reactionType) {
      throw new Error('Thiếu thông tin reaction. Vui lòng thử lại.');
    }

    // Đảm bảo TargetId là số nguyên hợp lệ
    const targetId = parseInt(String(reactionData.targetId), 10);
    if (!targetId || isNaN(targetId) || targetId <= 0) {
      throw new Error('ID không hợp lệ. Vui lòng thử lại.');
    }

    // Prepare reaction data according to database schema
    // Schema: USER_ID, TARGET_TYPE, TARGET_ID, REACTION_TYPE
    // CREATED_AT is set by backend
    // USER_ID is set by backend from JWT token
    const reactionPayload = {
      TargetType: String(reactionData.targetType).toUpperCase(), // 'POST' or 'COMMENT'
      TargetId: targetId, // Đảm bảo là số nguyên
      ReactionType: String(reactionData.reactionType).toLowerCase() // 'like', 'love', 'haha', 'wow', 'dislike', etc.
    };

    const response = await fetch(`${backend_url}/api/Reaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reactionPayload),
    });

    if (!response.ok) {
      let message = 'Failed to create reaction';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();
        console.error('Create reaction failed - Status:', response.status);
        console.error('Create reaction failed - Response text:', responseText);
        console.error('Create reaction failed - Payload sent:', JSON.stringify(reactionPayload));

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Create reaction error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading create reaction response:', e);
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

      // Xử lý lỗi Entity Framework
      if (message.includes('saving the entity changes') || 
          message.includes('inner exception') ||
          message.includes('database') ||
          message.includes('constraint') ||
          message.includes('foreign key')) {
        message = 'Không thể lưu thay đổi. Vui lòng thử lại sau.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful create reaction response:', parseError);
          return null;
        }
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error("Create reaction failed:", error);
    throw error;
  }
};

// Save post API
export const savePost = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/PostSave/save/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to save post';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Save post error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading save post response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 400) {
        if (errorDetails && errorDetails.message) {
          message = errorDetails.message;
        } else if (responseText) {
          message = responseText;
        }
      } else if (response.status === 404) {
        message = 'Không tìm thấy bài viết.';
      } else if (response.status === 500) {
        // Try to get the actual error message from the response
        if (errorDetails && errorDetails.message) {
          message = errorDetails.message;
        } else if (responseText) {
          message = responseText;
        } else {
          message = 'Lỗi server. Vui lòng thử lại sau.';
        }
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful save post response:', parseError);
          return { success: true, message: 'Đã lưu bài viết' };
        }
      }
      return { success: true, message: 'Đã lưu bài viết' };
    }
    return { success: true, message: 'Đã lưu bài viết' };
  } catch (error) {
    console.error("Save post failed:", error);
    throw error;
  }
};

// Unsave post API
export const unsavePost = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/PostSave/unsave/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to unsave post';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Unsave post error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading unsave post response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 400) {
        if (errorDetails && errorDetails.message) {
          message = errorDetails.message;
        }
      } else if (response.status === 404) {
        message = 'Không tìm thấy bài viết hoặc bài viết chưa được lưu.';
      } else if (response.status === 500) {
        message = 'Lỗi server. Vui lòng thử lại sau.';
      }

      const error = new Error(message);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful unsave post response:', parseError);
          return { success: true, message: 'Đã bỏ lưu bài viết' };
        }
      }
      return { success: true, message: 'Đã bỏ lưu bài viết' };
    }
    return { success: true, message: 'Đã bỏ lưu bài viết' };
  } catch (error) {
    console.error("Unsave post failed:", error);
    throw error;
  }
};

// Update post API
export const updatePost = async (postId, postData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Get user info for PosterName
    let posterName = 'User';
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      posterName = userInfo.Name || userInfo.name || 'User';
    } catch (e) {
      console.error('Error parsing userInfo:', e);
    }

    // Upload image to Firebase Storage first if a new file is provided
    let imageUrl = null;
    if (postData.image instanceof File) {
      const { uploadImageToFirebase } = await import('../services/firebaseStorage');
      imageUrl = await uploadImageToFirebase(postData.image, 'posts');
    }

    // DỮ LIỆU PHÙ HỢP VỚI PostDto TRONG BACKEND KHI UPDATE
    const text = (postData.text || '').trim();
    const postContent = text || (imageUrl ? ' ' : ' ');
    const title = (postData.title || '').trim();
    
    const requestBody = {
      PostContent: postContent,
      Images: imageUrl ? [imageUrl] : (Array.isArray(postData.images) ? postData.images : []),
      PosterName: posterName,
      Hashtags: [],
      ArticleTitle: title || null
    };

    const response = await fetch(`${backend_url}/api/Post/UpdatePost?id=${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let message = 'Failed to update post';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Update post error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading update post response:', e);
      }

      // Handle specific HTTP status codes
      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = errorDetails && errorDetails.message 
          ? errorDetails.message 
          : 'Bạn không có quyền cập nhật bài viết này.';
      } else if (response.status === 400) {
        if (errorDetails && errorDetails.errors) {
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful update post response:', parseError);
          return { success: true, message: 'Đã cập nhật bài viết' };
        }
      }
      return { success: true, message: 'Đã cập nhật bài viết' };
    }
    return { success: true, message: 'Đã cập nhật bài viết' };
  } catch (error) {
    console.error("Update post failed:", error);
    throw error;
  }
};

// Get post by ID API (for editing)
export const getPostById = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/Post/GetPostById?id=${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to get post';
      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();
        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            message = err.message || err.error || message;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading get post response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy bài viết.';
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing get post response:', parseError);
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Get post by ID failed:", error);
    throw error;
  }
};

// Update comment API
export const updateComment = async (commentId, commentData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Upload image to Firebase Storage first if provided
    let imageUrl = null;
    if (commentData.image instanceof File) {
      const { uploadImageToFirebase } = await import('../services/firebaseStorage');
      imageUrl = await uploadImageToFirebase(commentData.image, 'comments');
    }
    
    // UpdatePostCommentDto expects: ReplyPostCommentId (optional), Content (optional), ImageUrl (optional)
    const updateDto = {
      Content: commentData.content || '',
      ImageUrl: imageUrl || commentData.imageUrl || null // Firebase Storage URL or existing URL
    };

    // If this is a reply, include ReplyPostCommentId
    if (commentData.parentCommentId) {
      updateDto.ReplyPostCommentId = String(commentData.parentCommentId);
    }

    const response = await fetch(`${backend_url}/api/Comment/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateDto),
    });

    if (!response.ok) {
      let message = 'Failed to update comment';
      let errorDetails = null;

      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();

        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            console.error('Update comment error response:', err);
            message = err.message || err.error || message;
            errorDetails = err;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading update comment response:', e);
      }

      // Handle specific HTTP status codes
      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = errorDetails && errorDetails.message 
          ? errorDetails.message 
          : 'Bạn không có quyền cập nhật bình luận này.';
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing successful update comment response:', parseError);
          return { success: true, message: 'Đã cập nhật bình luận' };
        }
      }
      return { success: true, message: 'Đã cập nhật bình luận' };
    }
    return { success: true, message: 'Đã cập nhật bình luận' };
  } catch (error) {
    console.error("Update comment failed:", error);
    throw error;
  }
};

// Get saved post IDs API
export const getSavedPostIds = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${backend_url}/api/PostSave/saved-ids`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      let message = 'Failed to get saved post IDs';
      const contentType = response.headers.get('content-type');
      let responseText = '';

      try {
        responseText = await response.text();
        if (contentType && contentType.includes('application/json') && responseText) {
          try {
            const err = JSON.parse(responseText);
            message = err.message || err.error || message;
          } catch (parseError) {
            message = responseText || message;
          }
        } else if (responseText) {
          message = responseText || message;
        }
      } catch (e) {
        console.error('Error reading get saved post IDs response:', e);
      }

      if (response.status === 401) {
        message = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = 'Bạn không có quyền xem bài viết đã lưu.';
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing get saved post IDs response:', parseError);
          return [];
        }
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error("Get saved post IDs failed:", error);
    throw error;
  }
};

