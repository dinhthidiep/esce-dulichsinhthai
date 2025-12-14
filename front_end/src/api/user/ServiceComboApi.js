// Backend is running on HTTP port 5002
const backend_url = "http://localhost:5002";

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

export const createServiceCombo = async (
    serviceComboData,
    imageFile = null
) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");

    // Upload image to Firebase Storage first if provided
    let imageUrl = null;
    // if (imageFile instanceof File) {
    //     const { uploadImageToFirebase } =
    //         await import("../services/firebaseStorage");
    //     imageUrl = await uploadImageToFirebase(imageFile, "service-combos");
    // }

    // Use JSON instead of FormData since we're sending URL, not file
    const requestBody = {
        ...serviceComboData,
        Image: imageUrl,
    };

    // Ensure HostId is an integer
    if (requestBody.HostId !== undefined) {
        requestBody.HostId = parseInt(requestBody.HostId, 10);
        if (isNaN(requestBody.HostId)) {
            throw new Error("HostId must be a valid integer");
        }
    }

    const res = await fetch(`${backend_url}/api/ServiceCombo`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("createServiceCombo API error:", {
            status: res.status,
            statusText: res.statusText,
            errorText: errorText,
        });
        throw new Error(errorText || "Failed to create service combo");
    }
    return res.json();
};

export const getMyServiceCombos = async () => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const u = getUserInfo();
    let userId = null;
    if (u) {
        userId = u.Id || u.id || u.ID || null;
    }
    const res = await fetch(`${backend_url}/api/ServiceCombo`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to load service combos");
    const all = await res.json();
    return userId
        ? Array.isArray(all)
            ? all.filter((sc) => (sc.HostId || sc.hostId) === userId)
            : []
        : Array.isArray(all)
          ? all
          : [];
};

export const getServiceComboById = async (id) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error((await res.text()) || "Failed to load service combo");
    return res.json();
};

export const getServiceComboByName = async (name) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/api/ServiceCombo/name/${encodeURIComponent(name)}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error((await res.text()) || "Failed to load service combo");
    }
    return res.json();
};

export const updateServiceCombo = async (id, updateData, imageFile = null) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");

    // Upload image to Firebase Storage first if a new file is provided
    let imageUrl = null;
    // if (imageFile instanceof File) {
    //     const { uploadImageToFirebase } =
    //         await import("../services/firebaseStorage");
    //     imageUrl = await uploadImageToFirebase(imageFile, "service-combos");
    // }

    // Use JSON instead of FormData since we're sending URL, not file
    const requestBody = {
        ...updateData,
        Image: imageUrl, // Send Firebase Storage URL (null if no new image, backend preserves existing) - backend expects 'Image', not 'ImageUrl'
    };

    try {
        const res = await fetch(`${backend_url}/api/ServiceCombo/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Update failed with error:", errorText);
            throw new Error(errorText || "Failed to update service combo");
        }

        const result = await res.json();
        return result;
    } catch (error) {
        console.error("Error in updateServiceCombo:", error);
        throw error;
    }
};

export const deleteServiceCombo = async (serviceComboId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");

    const res = await fetch(
        `${backend_url}/api/ServiceCombo/${serviceComboId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!res.ok) {
        let errorMessage = "Failed to delete service combo";
        try {
            const errorText = await res.text();
            if (errorText) {
                try {
                    const err = JSON.parse(errorText);
                    errorMessage = err.message || err.error || errorText;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
            }
        } catch (e) {
            console.error("Error parsing delete response:", e);
        }

        // Handle specific HTTP status codes
        if (res.status === 401) {
            errorMessage = "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.";
        } else if (res.status === 403) {
            errorMessage = "Bạn không có quyền xóa combo dịch vụ này.";
        } else if (res.status === 404) {
            errorMessage = "Không tìm thấy combo dịch vụ cần xóa.";
        }

        const error = new Error(errorMessage);
        error.status = res.status;
        throw error;
    }

    // Handle both JSON and plain text responses
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        // If it's not JSON, return a success object
        return { message: text || "Service combo deleted successfully" };
    }
};

export const getServicesByComboId = async (comboId) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");
    const res = await fetch(
        `${backend_url}/api/ServiceComboDetail/combo/${comboId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    const text = await res.text();
    if (!res.ok) {
        throw new Error(text || "Failed to load services for combo");
    }
    try {
        const details = JSON.parse(text);

        // Extract Service objects from ServiceComboDetail array
        // Each detail has a nested Service property (case-insensitive check)
        if (Array.isArray(details)) {
            const services = details
                .filter((d) => {
                    // Check for Service property (case-insensitive)
                    const service = d.Service || d.service || null;
                    return service != null;
                })
                .map((d) => {
                    // Get Service object (case-insensitive)
                    const service = d.Service || d.service || {};
                    return {
                        ...service, // Spread the Service properties
                        Quantity: d.Quantity || d.quantity || 1, // Include quantity from the detail
                        ServiceComboDetailId: d.Id || d.id, // Include the detail ID for updates
                    };
                });
            return services;
        }
        console.warn("Response is not an array:", details);
        return [];
    } catch (e) {
        console.error("Error parsing ServiceComboDetail response:", e);
        return [];
    }
};


