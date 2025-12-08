import {
  fetchWithFallback,
  extractErrorMessage,
  getAuthToken,
} from "./httpClient";

const POST_BASE_URL = "/api/Post";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const handleJsonResponse = async (response, fallbackMessage) => {
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, fallbackMessage));
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
};

const buildHeaders = (tokenRequired = false) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (tokenRequired) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để thực hiện thao tác này.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getAllPosts = async (params = {}) => {
  const queryString = buildQueryString(params);
  const response = await fetchWithFallback(`${POST_BASE_URL}/GetAllPost${queryString}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  return handleJsonResponse(response, "Không thể tải danh sách bài viết.");
};

export const getApprovedPosts = async () => {
  const response = await fetchWithFallback(`${POST_BASE_URL}/approved`, {
    method: "GET",
    headers: buildHeaders(),
  });

  return handleJsonResponse(
    response,
    "Không thể tải danh sách bài viết đã duyệt."
  );
};

export const createPost = async (postPayload) => {
  const response = await fetchWithFallback(`${POST_BASE_URL}/CreatePost`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(postPayload),
  });

  return handleJsonResponse(response, "Không thể tạo bài viết mới.");
};

export const likePost = async (postId) => {
  const response = await fetchWithFallback(
    `/api/PostReaction/like/${postId}`,
    {
      method: "POST",
      headers: buildHeaders(true),
    }
  );

  return handleJsonResponse(response, "Không thể thả cảm xúc cho bài viết.");
};

export const unlikePost = async (postReactionId) => {
  const response = await fetchWithFallback(
    `/api/PostReaction/unlike/${postReactionId}`,
    {
      method: "DELETE",
      headers: buildHeaders(true),
    }
  );

  return handleJsonResponse(response, "Không thể bỏ cảm xúc cho bài viết.");
};