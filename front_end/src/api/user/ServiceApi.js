// Import API config - sử dụng cùng config với các API khác
import { API_BASE_URL } from '~/config/api';

// API_BASE_URL đã bao gồm /api, nên backend_url không cần thêm /api
const backend_url = API_BASE_URL;

// Helper function to get token from either storage
const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");
// Helper function to get userInfo from either storage
const getUserInfo = () => {
    const info =
        localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (!info) return null;
    try {
        return JSON.parse(info);
    } catch {
        return null;
    }
};

export const createService = async (formData) => {
    const token = getToken();
    if (!token) {
        console.error(
            "createService: No token found in localStorage or sessionStorage"
        );
        console.log(
            "localStorage token:",
            localStorage.getItem("token") ? "exists" : "null"
        );
        console.log(
            "sessionStorage token:",
            sessionStorage.getItem("token") ? "exists" : "null"
        );
        throw new Error("Authentication required.");
    }
    console.log("createService: Token found, length:", token.length);

    // Resolve current user id to set HostId so the new service appears under "my services"
    let hostId = null;
    try {
        const info = getUserInfo();
        if (info) {
            hostId = info.Id || info.id || info.ID || null;
        }
    } catch {}

    // If still no hostId, throw error
    if (!hostId || hostId === 0) {
        throw new Error(
            "Không thể xác định người dùng. Vui lòng đăng nhập lại."
        );
    }

    // Upload image to Firebase Storage first if provided
    let imageUrl = null;
    const imageFile =
        formData instanceof FormData ? formData.get("image") : null;
    // if (imageFile instanceof File) {
    //     const { uploadImageToFirebase } =
    //         await import("../services/firebaseStorage");
    //     imageUrl = await uploadImageToFirebase(imageFile, "services");
    // }

    const body = {
        Name:
            formData instanceof FormData
                ? formData.get("name") || ""
                : formData.name || "",
        Description:
            formData instanceof FormData
                ? formData.get("description") || null
                : formData.description || null,
        Price:
            formData instanceof FormData
                ? parseFloat(formData.get("price") || "0")
                : parseFloat(formData.price || "0"),
        HostId: hostId,
        Images: imageUrl, // Send Firebase Storage URL
    };

    const res = await fetch(`${backend_url}/Service`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("createService API error:", {
            status: res.status,
            statusText: res.statusText,
            errorText: errorText,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 20) + "..." : "null",
        });

        if (res.status === 401) {
            // Token might be expired or invalid - clear it and redirect
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userInfo");
            throw new Error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            );
        }

        throw new Error(errorText || "Failed to create service");
    }
    return res.json();
};

export const getMyServices = async () => {
    // Check both localStorage and sessionStorage for token
    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) throw new Error("Authentication required.");

    // Get userId from storage (check both) or fetch from API
    let userId = null;
    try {
        const userInfo =
            localStorage.getItem("userInfo") ||
            sessionStorage.getItem("userInfo");
        if (userInfo) {
            const u = JSON.parse(userInfo);
            userId = u.Id || u.id || u.ID || null;
        }
    } catch (err) {
        console.error("Error getting userId:", err);
    }

    // Fetch only approved services
    const res = await fetch(`${backend_url}/Service?status=Approved`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to load services");
    const all = await res.json();

    // Filter by HostId - backend returns HostId (PascalCase)
    if (!userId) {
        console.warn("No userId found, returning all services");
        return Array.isArray(all) ? all : [];
    }

    // Convert userId to number for comparison
    const userIdNum = parseInt(userId, 10);
    return Array.isArray(all)
        ? all.filter((s) => {
              const hostId = s.HostId || s.hostId || s.HOST_ID;
              return hostId !== undefined && parseInt(hostId, 10) === userIdNum;
          })
        : [];
};

export const getAllServices = async () => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(`${backend_url}/Service`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to load services");
    const all = await res.json();
    return Array.isArray(all) ? all : [];
};

export const getServiceById = async (serviceId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required");
    const res = await fetch(`${backend_url}/Service/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to load service");
    return res.json();
};

export const updateService = async (formData) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required");
    const serviceId =
        formData instanceof FormData
            ? formData.get("id") || formData.get("Id")
            : formData.id || formData.Id;
    if (!serviceId) throw new Error("Service ID is required");

    // Upload image to Firebase Storage first if a new file is provided
    let imageUrl = null;
    const imageFile =
        formData instanceof FormData ? formData.get("image") : formData.image;
    // if (imageFile instanceof File) {
    //     const { uploadImageToFirebase } =
    //         await import("../services/firebaseStorage");
    //     imageUrl = await uploadImageToFirebase(imageFile, "services");
    // }

    const body =
        formData instanceof FormData
            ? {
                  Id: parseInt(serviceId),
                  Name: formData.get("name") || "",
                  Description: formData.get("description") || "",
                  Price: parseFloat(formData.get("price") || 0),
                  Images: imageUrl, // Send Firebase Storage URL (null if no new image, backend preserves existing)
              }
            : {
                  Id: parseInt(serviceId),
                  Name: formData.name || "",
                  Description: formData.description || "",
                  Price: parseFloat(formData.price || 0),
                  Images: imageUrl || formData.Images, // Use new image URL or existing one
              };
    const res = await fetch(`${backend_url}/Service/${serviceId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to update service");
    return res.json();
};

export const deleteService = async (serviceId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required");
    const res = await fetch(`${backend_url}/Service/${serviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to delete service");
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text || "Service deleted successfully" };
    }
};

export const addServiceToCombo = async (comboId, serviceId, quantity = 1) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(`${backend_url}/ServiceComboDetail`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ServiceComboId: comboId,
            ServiceId: serviceId,
            Quantity: quantity,
        }),
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to add service to combo");
    return res.json();
};

export const getServiceComboDetailByComboAndService = async (
    comboId,
    serviceId
) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/combo/${comboId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to load service combo details"
        );
    const details = await res.json();
    // Find the detail for this specific service
    const detail = Array.isArray(details)
        ? details.find(
              (d) => (d.ServiceId || d.serviceId) === parseInt(serviceId)
          )
        : null;
    return detail;
};

export const updateServiceComboDetail = async (
    detailId,
    comboId,
    serviceId,
    quantity
) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/${detailId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ServiceComboId: comboId,
                ServiceId: serviceId,
                Quantity: quantity,
            }),
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to update service combo detail"
        );
    return res.json();
};

export const deleteServiceComboDetail = async (detailId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/${detailId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to delete service combo detail"
        );
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text || "Service combo detail deleted successfully" };
    }
};

export const getServiceComboDetailsByComboId = async (comboId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/combo/${comboId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to load service combo details"
        );
    return res.json();
};

export const getAllServiceComboDetails = async () => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(`${backend_url}/ServiceComboDetail`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to load service combo details"
        );
    const all = await res.json();
    return Array.isArray(all) ? all : [];
};

export const getServiceComboDetailById = async (detailId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/${detailId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to load service combo detail"
        );
    return res.json();
};

export const getServiceComboDetailsByServiceId = async (serviceId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/service/${serviceId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to load service combo details"
        );
    const all = await res.json();
    return Array.isArray(all) ? all : [];
};

export const deleteServiceComboDetailsByComboId = async (comboId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/ServiceComboDetail/combo/${comboId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok)
        throw new Error(
            (await res.text()) || "Failed to delete service combo details"
        );
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text || "Service combo details deleted successfully",
        };
    }
};


