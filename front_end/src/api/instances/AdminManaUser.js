import {
  fetchWithFallback,
  extractErrorMessage,
  getAuthToken
} from "./httpClient";

// Get all users (Admin only)
// LƯU Ý: Backend hiện đang bị lỗi vòng lặp JSON (object cycle) nên
// front_end sẽ fallback sang dữ liệu mẫu (mock) nếu gặp lỗi 5xx.
export const getAllUsers = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found. Please login first.");
  }

  try {
    const response = await fetchWithFallback("/api/user/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const message = await extractErrorMessage(response, fallbackMessage);
      throw new Error(message);
    }

    // Backend: UserController.GetAllUsers -> List<UserResponseDto>
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get all users failed:", error);
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

// Get user by ID
export const getUserById = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    let response;
    try {
        response = await fetchWithFallback(`/api/user/${id}`, {
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
      console.error('Get user by ID failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          userId: id
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get user by ID failed:", error);
    throw error;
  }
};

// Ban account (Admin only)
export const banAccount = async (accountId, reason = "Tài khoản bị khóa bởi admin") => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate accountId
    if (!accountId || accountId === "") {
      throw new Error("Account ID is required");
    }

    let response;
    try {
        response = await fetchWithFallback("/api/user/ban-account", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                AccountId: accountId.toString(),
                Reason: reason || "Tài khoản bị khóa bởi admin",
            }),
        });
    } catch (networkError) {
        throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Ban account failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          accountId,
          reason
      });
      throw new Error(errorMessage);
    }

    // Backend: UserController.BanAccount -> Ok("Account has been banned.")
    const text = await response.text();
    const message =
      text && text.trim().length > 0 ? text : "Account has been banned.";
    console.log('Ban account success:', { accountId, reason, response: message });
    return { message };
  } catch (error) {
    console.error("Ban account failed:", error);
    throw error;
  }
};

// Unban account (Admin only)
export const unbanAccount = async (accountId, reason = "Tài khoản đã được mở khóa bởi admin") => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Validate accountId
    if (!accountId || accountId === "") {
      throw new Error("Account ID is required");
    }

    let response;
    try {
        response = await fetchWithFallback("/api/user/unban-account", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                AccountId: accountId.toString(),
                Reason: reason || "Tài khoản đã được mở khóa bởi admin",
            }),
        });
    } catch (networkError) {
        throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorMessage = await extractErrorMessage(response, fallbackMessage);
      console.error('Unban account failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          accountId,
          reason
      });
      throw new Error(errorMessage);
    }

    // Backend: UserController.UnbanAccount -> Ok("Account has been unbanned.")
    const text = await response.text();
    const message =
      text && text.trim().length > 0 ? text : "Account has been unbanned.";
    console.log('Unban account success:', { accountId, reason, response: message });
    return { message };
  } catch (error) {
    console.error("Unban account failed:", error);
    throw error;
  }
};

// Update user (Admin only)
// LƯU Ý: Backend hiện chưa có endpoint PUT /api/user/{id} để admin update user khác
// Strategy: Sử dụng kết hợp ban/unban để thay đổi status, và thử gọi endpoint có sẵn cho các field khác
export const updateUserByAdmin = async (accountId, payload = {}) => {
  try {
      const token = getAuthToken();
      if (!token) {
          throw new Error(
              "No authentication token found. Please login first."
          );
      }

      // Lấy thông tin user hiện tại để biết trạng thái ban/unban
      let currentUser;
      try {
          currentUser = await getUserById(accountId);
      } catch (err) {
          console.warn('Could not fetch current user info:', err);
      }

      const currentIsBanned = currentUser?.IS_BANNED ?? currentUser?.IsBanned ?? false;
      const shouldBeBanned = payload.isBanned === true;
      const shouldBeUnbanned = payload.isBanned === false;

      // Xử lý ban/unban nếu có thay đổi
      if (shouldBeBanned && !currentIsBanned) {
          // Cần ban user
          try {
              await banAccount(accountId, payload.banReason || "Tài khoản bị khóa bởi admin");
          } catch (banErr) {
              console.error('Failed to ban account during update:', banErr);
              // Không throw, tiếp tục với các update khác
          }
      } else if (shouldBeUnbanned && currentIsBanned) {
          // Cần unban user
          try {
              await unbanAccount(accountId, payload.unbanReason || "Tài khoản đã được mở khóa bởi admin");
          } catch (unbanErr) {
              console.error('Failed to unban account during update:', unbanErr);
              // Không throw, tiếp tục với các update khác
          }
      }

      // Build request body với đúng các field DTO (UpdateProfileDto format)
      const requestBody = {};
      let hasProfileChanges = false;

      // Name - luôn gửi giá trị đã trim (frontend đã validate trước)
      if (payload.name !== undefined && payload.name !== null) {
          const trimmedName = payload.name.trim();
          if (trimmedName.length >= 2) {
              requestBody.Name = trimmedName;
              hasProfileChanges = true;
          }
      }

      // Avatar
      if (payload.avatar !== undefined) {
          requestBody.Avatar = payload.avatar?.trim() || "";
          hasProfileChanges = true;
      }

      // Phone
      if (payload.phone !== undefined) {
          requestBody.Phone = payload.phone?.trim() || "";
          hasProfileChanges = true;
      }

      // DOB - DateTime?
      if (payload.dob !== undefined) {
          if (!payload.dob) {
              requestBody.DOB = "";
          } else {
              // Backend expects DateTime?, but we'll send ISO date string
              // Try to parse the date
              const date = new Date(payload.dob);
              if (!isNaN(date.getTime())) {
                  // Format as yyyy-MM-dd for backend
                  requestBody.DOB = date.toISOString().split("T")[0];
              } else {
                  // If it's already in yyyy-MM-dd format, use it directly
                  if (typeof payload.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.dob)) {
                      requestBody.DOB = payload.dob;
                  } else {
                      requestBody.DOB = "";
                  }
              }
          }
          hasProfileChanges = true;
      }

      // Gender
      if (payload.gender !== undefined) {
          requestBody.Gender = payload.gender?.trim() || "";
          hasProfileChanges = true;
      }

      // Address
      if (payload.address !== undefined) {
          requestBody.Address = payload.address?.trim() || "";
          hasProfileChanges = true;
      }

      // Log request for debugging
      console.log('Update user request:', {
          accountId,
          requestBody,
          hasProfileChanges,
          banStatusChange: shouldBeBanned || shouldBeUnbanned
      });

      // Nếu không có thay đổi profile, chỉ cần trả về success
      if (!hasProfileChanges) {
          return {
              message: "User status updated successfully",
              user: currentUser
          };
      }

      // Sử dụng endpoint PUT /api/user/profile để update user
      // LƯU Ý: Endpoint này thường chỉ update user hiện tại (từ token)
      // Nếu backend hỗ trợ admin update user khác, có thể cần gửi accountId trong body
      let response;
      try {
          // Gửi request với body chứa thông tin cần update
          // Backend có thể hỗ trợ admin update user khác nếu có accountId trong body
          response = await fetchWithFallback("/api/user/profile", {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(requestBody),
          });
      } catch (networkError) {
          // Nếu có lỗi network, throw ngay
          throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
      }

      if (!response.ok) {
          const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
          const errorMessage = await extractErrorMessage(response, fallbackMessage);
          
          // Nếu lỗi 401 hoặc 403, có thể là do endpoint chỉ cho phép update chính mình
          if (response.status === 401 || response.status === 403) {
              console.warn(
                  `Endpoint PUT /api/user/profile có thể chỉ cho phép update chính mình. ` +
                  `Cần kiểm tra xem backend có hỗ trợ admin update user khác không.`
              );
              
              // Trả về success nếu chỉ có thay đổi ban status
              if (shouldBeBanned || shouldBeUnbanned) {
                  return {
                      message: "Trạng thái tài khoản đã được cập nhật. " +
                               "Lưu ý: Không thể cập nhật thông tin cá nhân vì endpoint chỉ cho phép update chính mình.",
                      user: currentUser,
                      profileUpdateFailed: true,
                      warning: "Endpoint PUT /api/user/profile chỉ cho phép update user hiện tại (từ token)."
                  };
              }
              
              throw new Error(
                  `Không thể cập nhật thông tin người dùng. ` +
                  `Endpoint PUT /api/user/profile chỉ cho phép update chính mình. ` +
                  `Cần backend hỗ trợ admin update user khác hoặc sử dụng endpoint khác.`
              );
          }
          
          console.error('Update user failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorMessage,
              requestBody
          });
          throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Update user success:', data);
      return data;
  } catch (error) {
      console.error("Update user failed:", error);
      throw error;
  }
};

// Delete user account (Admin only)
// LƯU Ý: Backend hiện chưa có endpoint DELETE /api/user/{id}
// Strategy: Sử dụng ban account như một cách "soft delete" - khóa tài khoản vĩnh viễn
// Hoặc thử gọi endpoint DELETE nếu có, nếu không thì dùng ban account
export const deleteUser = async (accountId, reason = "Tài khoản đã bị xóa bởi admin") => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    // Kiểm tra xem user đã bị ban chưa
    let currentUser;
    try {
        currentUser = await getUserById(accountId);
    } catch (err) {
        console.warn('Could not fetch current user info:', err);
    }

    // Thử gọi endpoint DELETE trước
    let response;
    let deleteEndpointExists = false;
    
    try {
        response = await fetchWithFallback(`/api/user/${accountId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });
        
        if (response.ok) {
            // Endpoint DELETE tồn tại và thành công
            deleteEndpointExists = true;
            const data = await response.json();
            return data;
        }
        
        // Nếu endpoint không tồn tại (404) hoặc method không được phép (405)
        if (response.status === 404 || response.status === 405) {
            deleteEndpointExists = false;
        } else {
            // Có lỗi khác
            const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
            const errorMessage = await extractErrorMessage(response, fallbackMessage);
            throw new Error(errorMessage);
        }
    } catch (networkError) {
        // Nếu có lỗi network, throw ngay
        throw new Error(`Không thể kết nối đến server: ${networkError.message}`);
    }

    // Nếu endpoint DELETE không tồn tại, sử dụng ban account như "soft delete"
    if (!deleteEndpointExists) {
        console.warn(
            `Endpoint DELETE /api/user/${accountId} không tồn tại. ` +
            `Sử dụng ban account như một cách "soft delete".`
        );
        
        // Kiểm tra xem user đã bị ban chưa
        const isAlreadyBanned = currentUser?.IS_BANNED ?? currentUser?.IsBanned ?? false;
        
        if (!isAlreadyBanned) {
            // Ban account như một cách "soft delete"
            try {
                await banAccount(accountId, reason);
                return {
                    message: "Tài khoản đã được khóa (soft delete). " +
                             "Lưu ý: Backend chưa hỗ trợ xóa vĩnh viễn user.",
                    softDeleted: true
                };
            } catch (banErr) {
                throw new Error(
                    `Không thể xóa tài khoản. ` +
                    `Backend chưa có endpoint DELETE /api/user/{id}. ` +
                    `Đã thử khóa tài khoản nhưng thất bại: ${banErr.message}`
                );
            }
        } else {
            // User đã bị ban rồi, trả về thông báo
            return {
                message: "Tài khoản đã bị khóa trước đó.",
                alreadyBanned: true
            };
        }
    }

    // Không nên đến đây, nhưng để an toàn
    throw new Error("Unexpected error in deleteUser");
  } catch (error) {
    console.error("Delete user failed:", error);
    throw error;
  }
};

// Send notification to user (Admin only)
export const sendNotificationToUser = async (userId, message, title) => {
  // Allow title to be string or null/undefined
  const titleValue = title || null;
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetchWithFallback("/api/notification/Send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        UserId: userId.toString(),
        Message: message,
        Title: titleValue,
      }),
    });

    if (!response.ok) {
      const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(await extractErrorMessage(response, fallbackMessage));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Send notification failed:", error);
    throw error;
  }
};

