import {
  fetchWithFallback,
  extractErrorMessage,
  getAuthToken
} from "./httpClient";

const USER_BASE_URL = "/api/user";

// =======================================================================================
// GET CURRENT USER PROFILE - Lấy thông tin profile của user hiện tại
// =======================================================================================
// Thử gọi GET /api/user/profile trước, nếu không có thì fallback về GetUserById
export const getCurrentUserProfile = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Thử gọi GET /api/user/profile trước
    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // Nếu endpoint tồn tại và thành công
      if (response.ok) {
        const data = await response.json();
        console.log('Get current user profile success (from /api/user/profile):', data);
        return data;
      }

      // Nếu endpoint không tồn tại (404) hoặc method không được phép (405)
      if (response.status === 404 || response.status === 405) {
        console.warn('GET /api/user/profile endpoint not found, falling back to GetUserById');
        // Fallback về cách cũ
      } else {
        // Có lỗi khác
        const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
        const errorMessage = await extractErrorMessage(response, fallbackMessage);
        throw new Error(errorMessage);
      }
    } catch (networkError) {
      // Nếu có lỗi network, thử fallback
      console.warn('Network error when calling GET /api/user/profile, falling back:', networkError);
    }

    // Fallback: Lấy userId từ localStorage hoặc decode token, rồi gọi GetUserById
    let userId = null;
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        userId = parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId;
      }
    } catch (err) {
      console.warn('Could not get userId from localStorage:', err);
    }

    // Nếu không có userId từ localStorage, thử decode token (simple base64 decode)
    if (!userId) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload?.sub || payload?.nameid || payload?.userId || payload?.UserId;
      } catch (err) {
        console.warn('Could not decode token to get userId:', err);
      }
    }

    if (!userId) {
      throw new Error("Không thể lấy User ID. Vui lòng đăng nhập lại.");
    }

    // Gọi API để lấy profile
    return await getUserProfileById(userId);
  } catch (error) {
    console.error("Get current user profile failed:", error);
    throw error;
  }
};

// =======================================================================================
// GET USER PROFILE BY ID - Lấy thông tin profile của user theo ID
// =======================================================================================
export const getUserProfileById = async (userId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate userId
    if (!userId || userId === "") {
      throw new Error("User ID is required");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/${userId}`, {
        method: "GET",
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
      console.error('Get user profile by ID failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        userId
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get user profile by ID failed:", error);
    throw error;
  }
};

// =======================================================================================
// UPDATE PROFILE - Cập nhật thông tin profile
// =======================================================================================
export const updateProfile = async (updateDto) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate required fields - Name là bắt buộc
    if (updateDto.Name !== undefined && updateDto.Name !== null) {
      const trimmedName = updateDto.Name.trim();
      if (trimmedName.length < 2) {
        throw new Error("Tên phải có ít nhất 2 ký tự");
      }
    }

    // Build request body với đúng format DTO (PascalCase)
    const requestBody = {};

    // Name
    if (updateDto.Name !== undefined && updateDto.Name !== null) {
      requestBody.Name = updateDto.Name.trim();
    }

    // Phone
    if (updateDto.Phone !== undefined) {
      requestBody.Phone = updateDto.Phone?.trim() || "";
    }

    // Avatar
    if (updateDto.Avatar !== undefined) {
      requestBody.Avatar = updateDto.Avatar?.trim() || "";
    }

    // Gender
    if (updateDto.Gender !== undefined) {
      requestBody.Gender = updateDto.Gender?.trim() || "";
    }

    // Address
    if (updateDto.Address !== undefined) {
      requestBody.Address = updateDto.Address?.trim() || "";
    }

    // DOB - DateTime?
    if (updateDto.DOB !== undefined) {
      if (!updateDto.DOB) {
        requestBody.DOB = "";
      } else {
        // Backend expects DateTime?, but we'll send ISO date string
        // Try to parse the date
        const date = new Date(updateDto.DOB);
        if (!isNaN(date.getTime())) {
          // Format as yyyy-MM-dd for backend
          requestBody.DOB = date.toISOString().split("T")[0];
        } else {
          // If it's already in yyyy-MM-dd format, use it directly
          if (typeof updateDto.DOB === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(updateDto.DOB)) {
            requestBody.DOB = updateDto.DOB;
          } else {
            requestBody.DOB = "";
          }
        }
      }
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      
      console.error('Update profile failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        requestBody
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Update profile success:', data);
    return data;
  } catch (error) {
    console.error("Update profile failed:", error);
    throw error;
  }
};

// =======================================================================================
// CHANGE PASSWORD - Đổi mật khẩu
// =======================================================================================
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate passwords
    if (!oldPassword || !oldPassword.trim()) {
      throw new Error("Mật khẩu cũ không được để trống");
    }

    if (!newPassword || !newPassword.trim()) {
      throw new Error("Mật khẩu mới không được để trống");
    }

    if (newPassword.length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    if (oldPassword === newPassword) {
      throw new Error("Mật khẩu mới phải khác mật khẩu cũ");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          OldPassword: oldPassword.trim(),
          NewPassword: newPassword.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      
      console.error('Change password failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Change password success:', data);
    return data;
  } catch (error) {
    console.error("Change password failed:", error);
    throw error;
  }
};

// =======================================================================================
// REQUEST OTP - Yêu cầu gửi OTP
// =======================================================================================
export const requestOtp = async (email) => {
  try {
    // Validate email
    if (!email || !email.trim()) {
      throw new Error("Email không được để trống");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Email không hợp lệ");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Request OTP failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        email
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Request OTP success:', data);
    return data;
  } catch (error) {
    console.error("Request OTP failed:", error);
    throw error;
  }
};

// =======================================================================================
// VERIFY OTP - Xác thực OTP
// =======================================================================================
export const verifyOtp = async (email, otp) => {
  try {
    // Validate email
    if (!email || !email.trim()) {
      throw new Error("Email không được để trống");
    }

    // Validate OTP
    if (!otp || !otp.trim()) {
      throw new Error("OTP không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email.trim(),
          Otp: otp.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Verify OTP failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        email
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Verify OTP success:', data);
    return data;
  } catch (error) {
    console.error("Verify OTP failed:", error);
    throw error;
  }
};

// =======================================================================================
// REQUEST OTP FOR FORGET PASSWORD - Yêu cầu OTP để reset password
// =======================================================================================
export const requestOtpForForgetPassword = async (email) => {
  try {
    // Validate email
    if (!email || !email.trim()) {
      throw new Error("Email không được để trống");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Email không hợp lệ");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/request-otp-forget-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Request OTP for forget password failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        email
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Request OTP for forget password success:', data);
    return data;
  } catch (error) {
    console.error("Request OTP for forget password failed:", error);
    throw error;
  }
};

// =======================================================================================
// RESET PASSWORD - Reset mật khẩu (sau khi có OTP)
// =======================================================================================
export const resetPassword = async (email, newPassword, otp) => {
  try {
    // Validate email
    if (!email || !email.trim()) {
      throw new Error("Email không được để trống");
    }

    // Validate new password
    if (!newPassword || !newPassword.trim()) {
      throw new Error("Mật khẩu mới không được để trống");
    }

    if (newPassword.length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    // Validate OTP
    if (!otp || !otp.trim()) {
      throw new Error("OTP không được để trống");
    }

    let response;
    try {
      response = await fetchWithFallback(`${USER_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email.trim(),
          NewPassword: newPassword.trim(),
          Otp: otp.trim(),
        }),
      });
    } catch (networkError) {
      throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Reset password failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        email
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Reset password success:', data);
    return data;
  } catch (error) {
    console.error("Reset password failed:", error);
    throw error;
  }
};

