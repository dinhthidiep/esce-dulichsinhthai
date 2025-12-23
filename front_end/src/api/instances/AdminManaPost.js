import {
  fetchWithFallback,
  extractErrorMessage,
  getAuthToken
} from "./httpClient";

const POST_BASE_URL = "/api/Post";

// =======================================================================================
// GET ALL POSTS - Lấy tất cả bài viết (AllowAnonymous)
// =======================================================================================
export const getAllPosts = async () => {
  try {
    const response = await fetchWithFallback(`${POST_BASE_URL}/GetAllPost`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get all posts failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get all posts failed:", error);
    if (
      typeof error?.message === "string" &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError"))
    ) {
      throw new Error(
        "Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. URL backend có đúng không?\n3. Có vấn đề về CORS không?"
      );
    }
    throw error;
  }
};

// =======================================================================================
// GET APPROVED POSTS - Lấy bài viết đã duyệt (AllowAnonymous)
// =======================================================================================
export const getApprovedPosts = async () => {
  try {
    const response = await fetchWithFallback(`${POST_BASE_URL}/approved`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get approved posts failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get approved posts failed:", error);
    throw error;
  }
};

// =======================================================================================
// GET PENDING POSTS - Lấy bài viết chờ duyệt (Admin only)
// =======================================================================================
export const getPendingPosts = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetchWithFallback(`${POST_BASE_URL}/pending`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get pending posts failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get pending posts failed:", error);
    throw error;
  }
};

// =======================================================================================
// GET POST BY ID - Lấy bài viết theo ID (AllowAnonymous)
// =======================================================================================
export const getPostById = async (id) => {
  try {
    const response = await fetchWithFallback(`${POST_BASE_URL}/GetPostById?id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get post by ID failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId: id
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get post by ID failed:", error);
    throw error;
  }
};

// =======================================================================================
// GET POST DETAIL - Lấy chi tiết bài viết (AllowAnonymous)
// =======================================================================================
export const getPostDetail = async (postId) => {
  try {
    const response = await fetchWithFallback(`${POST_BASE_URL}/detail/${postId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get post detail failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get post detail failed:", error);
    throw error;
  }
};

// =======================================================================================
// CREATE POST - Tạo bài viết mới (Admin,Host,Agency,Customer)
// =======================================================================================
export const createPost = async (postDto) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate required fields
    if (!postDto.PostContent || !postDto.PostContent.trim()) {
      throw new Error("Nội dung bài viết không được để trống");
    }

    if (!postDto.PosterName || !postDto.PosterName.trim()) {
      throw new Error("Tên người đăng không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/CreatePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostContent: postDto.PostContent?.trim() || "",
          Images: postDto.Images || [],
          PosterName: postDto.PosterName?.trim() || "",
          Hashtags: postDto.Hashtags || [],
          ArticleTitle: postDto.ArticleTitle || null,
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Create post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postDto
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Create post success:', data);
    return data;
  } catch (error) {
    console.error("Create post failed:", error);
    throw error;
  }
};

// =======================================================================================
// UPDATE POST - Cập nhật bài viết (Admin,Host,Agency,Customer)
// =======================================================================================
export const updatePost = async (id, postDto) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate required fields
    if (!postDto.PostContent || !postDto.PostContent.trim()) {
      throw new Error("Nội dung bài viết không được để trống");
    }

    if (!postDto.PosterName || !postDto.PosterName.trim()) {
      throw new Error("Tên người đăng không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/UpdatePost?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostContent: postDto.PostContent?.trim() || "",
          Images: postDto.Images || [],
          PosterName: postDto.PosterName?.trim() || "",
          Hashtags: postDto.Hashtags || [],
          ArticleTitle: postDto.ArticleTitle || null,
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền cập nhật bài viết này");
      }
      
      console.error('Update post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId: id,
        postDto
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Update post success:', data);
    return data;
  } catch (error) {
    console.error("Update post failed:", error);
    throw error;
  }
};

// =======================================================================================
// DELETE POST - Xóa bài viết (Admin,Host,Agency,Customer)
// =======================================================================================
export const deletePost = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/DeletePost?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền xóa bài viết này");
      }
      
      console.error('Delete post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId: id
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Delete post success:', data);
    return data;
  } catch (error) {
    console.error("Delete post failed:", error);
    throw error;
  }
};

// =======================================================================================
// APPROVE POST - Duyệt bài viết (Admin only)
// =======================================================================================
export const approvePost = async (postId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postId
    if (!postId || postId === "") {
      throw new Error("Post ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostId: postId.toString(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Approve post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Approve post success:', { postId, response: data });
    return data;
  } catch (error) {
    console.error("Approve post failed:", error);
    throw error;
  }
};

// =======================================================================================
// REJECT POST - Từ chối bài viết (Admin only)
// =======================================================================================
export const rejectPost = async (postId, comment) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postId
    if (!postId || postId === "") {
      throw new Error("Post ID is required");
    }

    // Validate comment
    if (!comment || !comment.trim()) {
      throw new Error("Lý do từ chối không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostId: postId.toString(),
          Comment: comment.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Reject post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId,
        comment
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Reject post success:', { postId, comment, response: data });
    return data;
  } catch (error) {
    console.error("Reject post failed:", error);
    throw error;
  }
};

// =======================================================================================
// REVIEW POST - Yêu cầu chỉnh sửa bài viết (Admin only)
// =======================================================================================
export const reviewPost = async (postId, comment) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postId
    if (!postId || postId === "") {
      throw new Error("Post ID is required");
    }

    // Validate comment
    if (!comment || !comment.trim()) {
      throw new Error("Nhận xét không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${POST_BASE_URL}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostId: postId.toString(),
          Comment: comment.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Review post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId,
        comment
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Review post success:', { postId, comment, response: data });
    return data;
  } catch (error) {
    console.error("Review post failed:", error);
    throw error;
  }
};

// =======================================================================================
// POST REACTION - Thả reaction cho bài viết
// =======================================================================================

// Like post (Admin,Host,Agency,Customer)
export const likePost = async (postId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postId
    if (!postId || postId === "") {
      throw new Error("Post ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/PostReaction/like/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Like post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Like post success:', { postId, response: data });
    return data;
  } catch (error) {
    console.error("Like post failed:", error);
    throw error;
  }
};

// Unlike post (Admin,Host,Agency,Customer)
export const unlikePost = async (postReactionId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postReactionId
    if (!postReactionId || postReactionId === "") {
      throw new Error("Post Reaction ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/PostReaction/unlike/${postReactionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền bỏ lượt thích này");
      }
      
      console.error('Unlike post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postReactionId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Unlike post success:', { postReactionId, response: data });
    return data;
  } catch (error) {
    console.error("Unlike post failed:", error);
    throw error;
  }
};

// Get like count for post (AllowAnonymous)
export const getPostLikeCount = async (postId) => {
  try {
    const response = await fetchWithFallback(`/api/PostReaction/count/${postId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get post like count failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get post like count failed:", error);
    throw error;
  }
};

// =======================================================================================
// COMMENT - Bình luận bài viết
// =======================================================================================

// Create comment (Admin,Host,Agency,Customer)
export const createComment = async (commentDto) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate required fields
    if (!commentDto.PostId || commentDto.PostId === "") {
      throw new Error("Post ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/Comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostId: commentDto.PostId.toString(),
          PostCommentId: commentDto.PostCommentId || null, // For reply to comment
          Content: commentDto.Content || "",
          Images: commentDto.Images || [],
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Create comment failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentDto
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Create comment success:', data);
    return data;
  } catch (error) {
    console.error("Create comment failed:", error);
    throw error;
  }
};

// Get comments by post (AllowAnonymous)
export const getCommentsByPost = async (postId) => {
  try {
    const response = await fetchWithFallback(`/api/Comment/post/${postId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get comments by post failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get comments by post failed:", error);
    throw error;
  }
};

// Get comment by ID (AllowAnonymous)
export const getCommentById = async (id) => {
  try {
    const response = await fetchWithFallback(`/api/Comment/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get comment by ID failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentId: id
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get comment by ID failed:", error);
    throw error;
  }
};

// Update comment (Admin,Host,Agency,Customer)
export const updateComment = async (id, commentDto) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/Comment/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ReplyPostCommentId: commentDto.ReplyPostCommentId || null,
          Content: commentDto.Content || "",
          Images: commentDto.Images || [],
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền cập nhật bình luận này");
      }
      
      console.error('Update comment failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentId: id,
        commentDto
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Update comment success:', data);
    return data;
  } catch (error) {
    console.error("Update comment failed:", error);
    throw error;
  }
};

// Delete comment (Admin,Host,Agency,Customer)
export const deleteComment = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/Comment/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền xóa bình luận này");
      }
      
      console.error('Delete comment failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentId: id
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Delete comment success:', data);
    return data;
  } catch (error) {
    console.error("Delete comment failed:", error);
    throw error;
  }
};

// =======================================================================================
// COMMENT REACTION - Thả reaction cho bình luận
// =======================================================================================

// Like comment (Admin,Host,Agency,Customer)
export const likeComment = async (postCommentId, replyPostCommentId = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate postCommentId
    if (!postCommentId || postCommentId === "") {
      throw new Error("Post Comment ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/CommentReaction/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          PostCommentId: postCommentId.toString(),
          ReplyPostCommentId: replyPostCommentId ? replyPostCommentId.toString() : null,
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Like comment failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        postCommentId,
        replyPostCommentId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Like comment success:', { postCommentId, replyPostCommentId, response: data });
    return data;
  } catch (error) {
    console.error("Like comment failed:", error);
    throw error;
  }
};

// Unlike comment (Admin,Host,Agency,Customer)
export const unlikeComment = async (commentReactionId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate commentReactionId
    if (!commentReactionId || commentReactionId === "") {
      throw new Error("Comment Reaction ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`/api/CommentReaction/unlike/${commentReactionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 403 Forbid (unauthorized)
      if (response.status === 403) {
        throw new Error("Bạn không có quyền bỏ lượt thích này");
      }
      
      console.error('Unlike comment failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentReactionId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Unlike comment success:', { commentReactionId, response: data });
    return data;
  } catch (error) {
    console.error("Unlike comment failed:", error);
    throw error;
  }
};

// Get like count for comment (AllowAnonymous)
export const getCommentLikeCount = async (commentId) => {
  try {
    const response = await fetchWithFallback(`/api/CommentReaction/count/${commentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Get comment like count failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        commentId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get comment like count failed:", error);
    throw error;
  }
};

