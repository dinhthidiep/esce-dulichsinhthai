const API_BASE_URL = 'http://localhost:7267/api/tour';

// Fetch all posts
export const getAllPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: postData.title || 'New Post',
        content: postData.text,
        authorId: postData.authorId || 3, // Default user ID
        image: postData.image
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Create a comment on a post
export const createComment = async (commentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: commentData.postId,
        authorId: commentData.authorId || 3, // Default user ID
        content: commentData.content
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Create or update a reaction
export const createReaction = async (reactionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: reactionData.userId || 3, // Default user ID
        targetType: reactionData.targetType,
        targetId: reactionData.targetId,
        reactionType: reactionData.reactionType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create reaction');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reaction:', error);
    throw error;
  }
};

// Get posts by user ID (if needed in future)
export const getPostsByUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user posts');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Delete a post (if needed in future)
export const deletePost = async (postId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-post/${postId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Update a post (if needed in future)
export const updatePost = async (postId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-post/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update post');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};