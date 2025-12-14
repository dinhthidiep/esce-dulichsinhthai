// Khớp với cấu hình trong back_end/Properties/launchSettings.json
// Profile https:  https://localhost:7267
// Profile http:   http://localhost:5002
const backend_url_https = "https://localhost:7267";
const backend_url_http = "http://localhost:5002";

// Kết nối trực tiếp backend
export const DISABLE_BACKEND = false;

export const getAuthToken = () => {
  const stored = localStorage.getItem("token") || "";
  return stored;
};

export const fetchWithFallback = async (url, options = {}, useHttps = true) => {
  const baseUrl = useHttps ? backend_url_https : backend_url_http;
  const fullUrl = `${baseUrl}${url}`;

  try {
    // Log headers để debug Authorization
    const hasAuth = options.headers?.Authorization || options.headers?.authorization;
    console.log('[httpClient] Fetching:', { 
      url, 
      fullUrl, 
      method: options.method || 'GET',
      hasAuthHeader: !!hasAuth,
      authHeaderPreview: hasAuth ? `${hasAuth.substring(0, 30)}...` : 'NONE'
    });
    const response = await fetch(fullUrl, options);
    console.log('[httpClient] Response:', { url, status: response.status, ok: response.ok });
    return response;
  } catch (error) {
    console.error('[httpClient] Fetch error:', { url, fullUrl, error: error.message, useHttps });
    
    if (
      useHttps &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed") ||
        error.name === "TypeError")
    ) {
      console.warn("HTTPS failed, trying HTTP fallback...");
      return fetchWithFallback(url, options, false);
    }
    throw error;
  }
};

export const extractErrorMessage = async (response, fallbackMessage) => {
  try {
    const bodyText = await response.text();
    if (!bodyText) {
      return fallbackMessage;
    }

    try {
      const parsed = JSON.parse(bodyText);

      if (typeof parsed === "string") {
        return parsed;
      }

      if (parsed?.errors && typeof parsed.errors === "object") {
        const fieldNameMap = {
          Fullname: "Họ và tên",
          FullName: "Họ và tên",
          Name: "Họ và tên",
          UserEmail: "Email",
          Phone: "Số điện thoại",
          Avatar: "Ảnh đại diện",
          DOB: "Ngày sinh",
          Gender: "Giới tính",
          Address: "Địa chỉ",
          Password: "Mật khẩu",
          RoleId: "Vai trò",
          AccountId: "ID tài khoản",
        };

        const collected = Object.entries(parsed.errors).flatMap(
          ([field, messages]) => {
            const displayField = fieldNameMap[field] || field;

            if (Array.isArray(messages)) {
              return messages.map((msg) =>
                displayField ? `${displayField}: ${msg}` : msg
              );
            }

            return displayField ? `${displayField}: ${messages}` : messages;
          }
        );

        if (collected.length) {
          return collected.join("\n");
        }
      }

      if (parsed?.message) {
        return parsed.message;
      }

      if (parsed?.title) {
        return parsed.title;
      }

      return fallbackMessage;
    } catch {
      return bodyText;
    }
  } catch (err) {
    console.warn("Failed to parse error body:", err);
    return fallbackMessage;
  }
};

