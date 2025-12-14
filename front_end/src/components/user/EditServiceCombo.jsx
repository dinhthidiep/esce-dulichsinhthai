import React, { useState, useEffect, useCallback } from "react";
import {
    updateServiceCombo,
    getServiceComboById,
} from "~/api/user/ServiceComboApi";
import {
    getMyServices,
    addServiceToCombo,
    getServiceComboDetailsByComboId,
    deleteServiceComboDetail,
    updateServiceComboDetail,
} from "~/api/user/ServiceApi";
import HostHeader from "~/components/user/HostHeader";

const backend_url = "http://localhost:5002";

const EditServiceCombo = () => {
    // State management
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        address: "",
        description: "",
        price: "",
        availableSlots: "",
        status: "open",
        cancellationPolicy: "",
        image: null,
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState({}); // { serviceId: { selected: boolean, quantity: number, detailId?: number } }

    // Configuration
    const config = {
        maxDescriptionLength: 1000, // Match backend MaxLength(1000)
        maxCancellationPolicyLength: 1000, // Match backend MaxLength(1000)
        maxImageSize: 5 * 1024 * 1024, // 5MB
        allowedImageTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ],
    };

    // Utility functions
    const validateField = useCallback((name, value) => {
        switch (name) {
            case "name":
            case "address":
                return !value || value.trim() === ""
                    ? `${name === "name" ? "Tên combo dịch vụ" : "Địa chỉ"} không được để trống`
                    : "";

            case "price":
                const price = parseFloat(value);
                if (isNaN(price) || price < 0) return "Giá phải là số >= 0";
                return "";

            case "availableSlots":
                const slots = parseInt(value);
                if (isNaN(slots)) return "Số slot phải là số nguyên";
                if (slots <= 0) return "Số slot phải lớn hơn 0";
                return "";

            case "image":
                // Only validate if it's a File object (new file selected)
                // If it's a string, it's an existing image filename - no validation needed
                if (!value) return "";
                if (typeof value === "string") return ""; // Existing image filename - no validation
                if (!(value instanceof File)) return ""; // Not a file - skip validation
                // Now validate the File object
                if (!config.allowedImageTypes.includes(value.type)) {
                    return "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)";
                }
                if (value.size > config.maxImageSize) {
                    return "Kích thước file không được vượt quá 5MB";
                }
                return "";

            default:
                return "";
        }
    }, []);

    // Event handlers
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        const fieldValue = files ? files[0] : value;

        setFormData((prev) => ({
            ...prev,
            [name]: fieldValue,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const error = validateField("image", file);
            if (error) {
                setErrors((prev) => ({ ...prev, image: error }));
                setImagePreview(null);
                // Don't update formData if validation fails
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);

            // Update formData with the new File object
            setFormData((prev) => ({
                ...prev,
                image: file,
            }));

            // Clear any previous error
            if (errors.image) {
                setErrors((prev) => ({
                    ...prev,
                    image: "",
                }));
            }
        } else {
            // No file selected - preserve existing image (don't clear it)
            // Only clear the preview if user explicitly cleared the input
            // But keep the existing image filename in formData
            setImagePreview(null);
            // Don't update formData - keep the existing image value (string filename or null)
        }
    };

    const handleServiceSelect = (serviceId, checked) => {
        setSelectedServices((prev) => ({
            ...prev,
            [serviceId]: {
                selected: checked,
                quantity: prev[serviceId]?.quantity || 0,
                detailId: prev[serviceId]?.detailId,
            },
        }));
    };

    const handleServiceQuantityChange = (serviceId, quantity) => {
        setSelectedServices((prev) => ({
            ...prev,
            [serviceId]: {
                selected: prev[serviceId]?.selected || false,
                quantity: parseInt(quantity) || 0,
                detailId: prev[serviceId]?.detailId,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check required fields first
        const requiredFields = {
            name: formData.name,
            address: formData.address,
            price: formData.price,
            availableSlots: formData.availableSlots,
        };

        const emptyRequiredFields = Object.entries(requiredFields).filter(
            ([key, value]) => {
                if (key === "price") {
                    if (value === null || value === undefined) return true;
                    const priceValue =
                        typeof value === "string"
                            ? value.trim()
                            : String(value);
                    if (priceValue === "") return true; // Empty string is invalid
                    const priceNum = parseFloat(priceValue);
                    return isNaN(priceNum) || priceNum < 0; // 0 is valid, negative is invalid
                }
                if (key === "availableSlots") {
                    if (value === null || value === undefined) return true;
                    const slotsValue =
                        typeof value === "string"
                            ? value.trim()
                            : String(value);
                    if (slotsValue === "") return true; // Empty string is invalid
                    const slotsNum = parseInt(slotsValue);
                    return isNaN(slotsNum) || slotsNum < 1; // Must be >= 1
                }
                if (value === null || value === undefined) return true;
                const textValue =
                    typeof value === "string" ? value.trim() : String(value);
                return textValue === "";
            }
        );

        if (emptyRequiredFields.length > 0) {
            alert("Vui lòng điền vào ô bắt buộc.");
            setIsLoading(false);
            return;
        }

        console.log("handleSubmit called, formData:", formData);
        setIsLoading(true);

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        console.log("Validation errors:", newErrors);

        if (Object.keys(newErrors).length > 0) {
            console.log("Validation failed, not submitting");
            setErrors(newErrors);
            setIsLoading(false);

            // Scroll to first error
            const firstErrorField =
                document.querySelector(
                    ".error:not(:empty)"
                )?.previousElementSibling;
            if (firstErrorField) {
                firstErrorField.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                firstErrorField.focus();
            }
            return;
        }

        console.log("Validation passed, proceeding with update");

        try {
            // Determine if a new image file was selected
            let imageFileToUpload = null;
            if (formData.image instanceof File) {
                // New image file selected - upload it
                imageFileToUpload = formData.image;
            }
            // If formData.image is a string (existing image filename) or null, we don't send a new file
            // The backend will preserve the existing image if no new file is provided

            // Convert formData to object for API
            // Use PascalCase to match backend C# model properties
            // Convert empty strings to null for nullable fields to avoid validation errors
            const submitData = {
                Name: formData.name?.trim() || "",
                Address: formData.address?.trim() || "",
                Description: formData.description?.trim() || null, // Convert empty string to null
                Price: parseFloat(formData.price),
                AvailableSlots: parseInt(formData.availableSlots),
                Status: formData.status || "open",
                CancellationPolicy: formData.cancellationPolicy?.trim() || null, // Convert empty string to null
                // Don't include Image field - backend will handle it from the file upload or preserve existing
            };

            // Check if ID is present
            if (!formData.id) {
                console.error("No ID found in formData:", formData);
                alert(
                    "Không tìm thấy ID combo dịch vụ. Vui lòng tải lại trang."
                );
                setIsLoading(false);
                return;
            }

            // Submit to backend API with image file (if new file selected)
            console.log("Submitting update with:", {
                id: formData.id,
                submitData,
                imageFileToUpload,
            });
            const result = await updateServiceCombo(
                formData.id,
                submitData,
                imageFileToUpload
            );
            console.log("Update result:", result);

            // Check if update was successful (result should have an id or be truthy)
            if (
                result &&
                (result.id || result.Id || result.name || result.Name)
            ) {
                // Update service combo details
                const comboId = parseInt(formData.id);
                const selectedServiceIds = Object.keys(selectedServices).filter(
                    (serviceId) =>
                        selectedServices[serviceId]?.selected === true
                );

                // Get existing details
                const existingDetails =
                    await getServiceComboDetailsByComboId(comboId);
                const existingDetailsArray = Array.isArray(existingDetails)
                    ? existingDetails
                    : [];
                const existingDetailsMap = new Map();
                existingDetailsArray.forEach((detail) => {
                    const serviceId = String(
                        detail.ServiceId || detail.serviceId
                    );
                    existingDetailsMap.set(serviceId, detail);
                });

                // Delete details that are no longer selected
                for (const [
                    serviceId,
                    detail,
                ] of existingDetailsMap.entries()) {
                    if (!selectedServiceIds.includes(serviceId)) {
                        try {
                            const detailId = detail.Id || detail.id;
                            await deleteServiceComboDetail(detailId);
                        } catch (err) {
                            console.error(
                                `Error deleting detail for service ${serviceId}:`,
                                err
                            );
                        }
                    }
                }

                // Update or create selected services
                for (const serviceId of selectedServiceIds) {
                    const quantity =
                        parseInt(selectedServices[serviceId]?.quantity || 0) ||
                        0;
                    const existingDetail = existingDetailsMap.get(serviceId);

                    if (existingDetail) {
                        // Update existing detail
                        try {
                            const detailId =
                                existingDetail.Id || existingDetail.id;
                            await updateServiceComboDetail(
                                detailId,
                                comboId,
                                parseInt(serviceId),
                                quantity
                            );
                        } catch (err) {
                            console.error(
                                `Error updating detail for service ${serviceId}:`,
                                err
                            );
                        }
                    } else {
                        // Create new detail
                        try {
                            await addServiceToCombo(
                                comboId,
                                parseInt(serviceId),
                                quantity
                            );
                        } catch (err) {
                            console.error(
                                `Error adding service ${serviceId} to combo:`,
                                err
                            );
                        }
                    }
                }

                alert("Combo dịch vụ đã được cập nhật thành công!");
                // Redirect to service-combo-manager page
                window.location.href = "/service-combo-manager";
            } else {
                console.warn("Update returned unexpected result:", result);
                // Still redirect even if result format is unexpected - the update might have succeeded
                alert("Cập nhật đã được gửi. Vui lòng kiểm tra lại.");
                window.location.href = "/service-combo-manager";
            }
        } catch (error) {
            console.error("Error updating service combo:", error);
            const errorMessage =
                error.message ||
                "Có lỗi xảy ra khi cập nhật combo dịch vụ. Vui lòng thử lại.";
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        window.location.href = "/service-combo-manager";
    };

    const toggleSidebar = () => {
        setSidebarActive(!sidebarActive);
    };

    // Load service combo data on component mount
    useEffect(() => {
        const loadServiceComboData = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const serviceComboId = urlParams.get("id");

            if (serviceComboId) {
                try {
                    const serviceComboData =
                        await getServiceComboById(serviceComboId);
                    console.log("Service combo data loaded:", serviceComboData); // Debug log
                    const existingImage =
                        serviceComboData.Image ||
                        serviceComboData.image ||
                        null;
                    setFormData({
                        id: serviceComboData.Id || serviceComboData.id,
                        name:
                            serviceComboData.Name ||
                            serviceComboData.name ||
                            "",
                        address:
                            serviceComboData.Address ||
                            serviceComboData.address ||
                            "",
                        description:
                            serviceComboData.Description ||
                            serviceComboData.description ||
                            "",
                        price:
                            serviceComboData.Price ||
                            serviceComboData.price ||
                            "",
                        availableSlots:
                            serviceComboData.AvailableSlots ||
                            serviceComboData.availableSlots ||
                            "",
                        status:
                            serviceComboData.Status ||
                            serviceComboData.status ||
                            "open",
                        cancellationPolicy:
                            serviceComboData.CancellationPolicy ||
                            serviceComboData.cancellationPolicy ||
                            "",
                        image: existingImage, // Store existing image (base64 string) or null
                    });
                    setErrors({});
                    // Set image preview if there's an existing image
                    if (
                        existingImage &&
                        (existingImage.startsWith("data:image") ||
                            existingImage.startsWith("http://") ||
                            existingImage.startsWith("https://"))
                    ) {
                        setImagePreview(existingImage);
                    } else if (existingImage) {
                        // If it's a file path, try to construct the URL
                        setImagePreview(
                            `${backend_url}/images/${existingImage}`
                        );
                    } else {
                        setImagePreview(null);
                    }
                } catch (error) {
                    console.error("Error loading service combo data:", error);
                    alert(
                        "Không thể tải dữ liệu combo dịch vụ. Vui lòng thử lại."
                    );
                }
            }
        };

        loadServiceComboData();
    }, []);

    // Load approved services for current host
    useEffect(() => {
        const loadServices = async () => {
            try {
                const services = await getMyServices();
                setAllServices(Array.isArray(services) ? services : []);
            } catch (err) {
                console.error("Error loading services:", err);
            }
        };
        loadServices();
    }, []);

    // Load existing service combo details when combo ID is available
    useEffect(() => {
        const loadServiceComboDetails = async () => {
            if (!formData.id) return;

            try {
                const details = await getServiceComboDetailsByComboId(
                    formData.id
                );
                const detailsArray = Array.isArray(details) ? details : [];

                const selected = {};
                detailsArray.forEach((detail) => {
                    const serviceId = String(
                        detail.ServiceId || detail.serviceId
                    );
                    selected[serviceId] = {
                        selected: true,
                        quantity: detail.Quantity || detail.quantity || 0,
                        detailId: detail.Id || detail.id,
                    };
                });

                setSelectedServices(selected);
            } catch (err) {
                console.error("Error loading service combo details:", err);
            }
        };

        loadServiceComboDetails();
    }, [formData.id]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && sidebarActive) {
                setSidebarActive(false);
            }
            if (e.ctrlKey && e.key === "Enter") {
                document
                    .getElementById("createServiceComboForm")
                    .dispatchEvent(new Event("submit"));
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [sidebarActive]);

    return (
        <div className="create-tour-page">
            {/* Sidebar Navigation */}
            <aside
                className={`sidebar ${sidebarActive ? "active" : ""}`}
                role="navigation"
                aria-label="Menu chính"
            >
                <nav>
                    <ul>
                        {userInfo &&
                        (userInfo.RoleId === 2 || userInfo.roleId === 2) ? (
                            <>
                                <li>
                                    <a
                                        href="/"
                                        className="sidebar-select"
                                        aria-label="Trang chủ"
                                    >
                                        <span>🏠</span> Trang chủ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/service-manager"
                                        className="sidebar-select"
                                        aria-label="Quản lý dịch vụ"
                                    >
                                        <span>⚙️</span> Quản lý dịch vụ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/service-combo-manager"
                                        className="sidebar-select"
                                        aria-label="Quản lý combo dịch vụ"
                                    >
                                        <span>📦</span> Quản lý combo dịch vụ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/social-media"
                                        className="sidebar-select"
                                        aria-label="Mạng xã hội"
                                    >
                                        <span>📱</span> Mạng xã hội
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Hỗ trợ"
                                    >
                                        <span>👤</span> Hỗ trợ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Chat"
                                    >
                                        <span>💬</span> Chat
                                    </a>
                                </li>
                                <li className="sidebar-logout">
                                    <a
                                        href="#"
                                        className="sidebar-select sidebar-logout-link"
                                        aria-label="Đăng xuất"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            localStorage.removeItem("token");
                                            localStorage.removeItem("userInfo");
                                            window.location.href = "/login";
                                        }}
                                    >
                                        <span>🔌</span> Đăng xuất
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Thông tin cá nhân"
                                    >
                                        Thông tin cá nhân
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/service-combo-manager"
                                        className="sidebar-select"
                                        aria-label="Quản lý combo dịch vụ"
                                    >
                                        Quản lý combo dịch vụ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/social-media"
                                        className="sidebar-select"
                                        aria-label="Mạng xã hội"
                                    >
                                        Mạng xã hội
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Hỗ trợ"
                                    >
                                        Hỗ trợ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Chat"
                                    >
                                        Chat
                                    </a>
                                </li>
                                <li className="sidebar-logout">
                                    <a
                                        href="#"
                                        className="sidebar-select sidebar-logout-link"
                                        aria-label="Đăng xuất"
                                    >
                                        Đăng xuất
                                    </a>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </aside>

            {/* Header */}
            <HostHeader />

            {/* Page Title */}
            <section className="content-title-display-box">
                <div className="content-title-display-name">
                    <h2>Chỉnh sửa combo dịch vụ</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`content ${sidebarActive ? "shift" : ""}`}
                role="main"
            >
                <div className="form-content">
                    <div className="disclaimer-text">
                        (<span className="required-indicator">*</span>) bắt buộc
                    </div>

                    <form
                        id="createServiceComboForm"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {/* Service Combo Name Field */}
                        <div className="field">
                            <label htmlFor="name">
                                Nhập tên combo dịch vụ (Service Combo Name)
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                maxLength="255"
                                required
                                placeholder="Tên combo dịch vụ..."
                                value={formData.name}
                                onChange={handleInputChange}
                                autoComplete="off"
                            />
                        </div>

                        {/* Address Field */}
                        <div className="field">
                            <label htmlFor="address">
                                Địa chỉ (Address)
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                maxLength="255"
                                required
                                placeholder="Địa chỉ..."
                                value={formData.address}
                                onChange={handleInputChange}
                                autoComplete="off"
                            />
                        </div>

                        {/* Description Field */}
                        <div className="field">
                            <label htmlFor="description">
                                Mô tả về combo dịch vụ (Description)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength={config.maxDescriptionLength}
                                placeholder="Mô tả ngắn về combo dịch vụ (tối đa 1000 ký tự)"
                                value={formData.description}
                                onChange={handleInputChange}
                                aria-describedby="description-hint"
                                rows="4"
                            />
                            <div id="description-hint" className="hint">
                                Còn lại:{" "}
                                <span>
                                    {config.maxDescriptionLength -
                                        formData.description.length}
                                </span>{" "}
                                ký tự
                            </div>
                        </div>

                        {/* Price Field */}
                        <div className="field">
                            <label htmlFor="price">
                                Giá (Price)
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleInputChange}
                                inputMode="decimal"
                            />
                        </div>

                        {/* Available Slots Field */}
                        <div className="field">
                            <label htmlFor="availableSlots">
                                Số slot có sẵn (Available Slots)
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="availableSlots"
                                name="availableSlots"
                                type="number"
                                min="1"
                                required
                                placeholder="1"
                                value={formData.availableSlots}
                                onChange={handleInputChange}
                                inputMode="numeric"
                            />
                        </div>

                        {/* Status Field */}
                        <div className="field">
                            <label htmlFor="status">Trạng thái (Status)</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <option value="open">Mở (Open)</option>
                                <option value="closed">Đóng (Closed)</option>
                                <option value="canceled">
                                    Đã hủy (Canceled)
                                </option>
                            </select>
                        </div>

                        {/* Cancellation Policy Field */}
                        <div className="field">
                            <label htmlFor="cancellationPolicy">
                                Chính sách hủy (Cancellation Policy)
                            </label>
                            <textarea
                                id="cancellationPolicy"
                                name="cancellationPolicy"
                                maxLength={config.maxCancellationPolicyLength}
                                placeholder="Mô tả chính sách hủy (tối đa 1000 ký tự)"
                                value={formData.cancellationPolicy}
                                onChange={handleInputChange}
                                aria-describedby="cancellationPolicy-hint"
                                rows="4"
                            />
                            <div id="cancellationPolicy-hint" className="hint">
                                Còn lại:{" "}
                                <span>
                                    {config.maxCancellationPolicyLength -
                                        formData.cancellationPolicy.length}
                                </span>{" "}
                                ký tự
                            </div>
                        </div>

                        {/* Image Upload Field */}
                        <div className="field">
                            <label htmlFor="image">Chọn ảnh (Image)</label>
                            <input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                aria-describedby="image-hint"
                            />
                            <div id="image-hint" className="hint">
                                Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)
                            </div>
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    className="img-preview"
                                    alt="Xem trước ảnh"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* Services Section */}
                        <div className="field">
                            <label>Dịch vụ theo kèm (Services)</label>
                            <div className="services-table-container">
                                <table className="services-table">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>Mô tả</th>
                                            <th>Giá</th>
                                            <th>Số lượng</th>
                                            <th>Chọn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allServices.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "1rem",
                                                    }}
                                                >
                                                    Không có dịch vụ nào
                                                </td>
                                            </tr>
                                        ) : (
                                            allServices.map((service) => {
                                                const serviceId = String(
                                                    service.Id || service.id
                                                );
                                                const isSelected =
                                                    selectedServices[serviceId]
                                                        ?.selected || false;
                                                const quantity =
                                                    selectedServices[serviceId]
                                                        ?.quantity || 0;
                                                return (
                                                    <tr key={serviceId}>
                                                        <td>
                                                            {service.Name ||
                                                                service.name ||
                                                                "N/A"}
                                                        </td>
                                                        <td>
                                                            {service.Description ||
                                                                service.description ||
                                                                "N/A"}
                                                        </td>
                                                        <td>
                                                            {(
                                                                service.Price ||
                                                                service.price ||
                                                                0
                                                            ).toLocaleString(
                                                                "vi-VN"
                                                            )}{" "}
                                                            VND
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={quantity}
                                                                onChange={(e) =>
                                                                    handleServiceQuantityChange(
                                                                        serviceId,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    !isSelected
                                                                }
                                                                style={{
                                                                    width: "80px",
                                                                    padding:
                                                                        "0.25rem",
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onChange={(e) =>
                                                                    handleServiceSelect(
                                                                        serviceId,
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="form-action">
                            <button
                                type="submit"
                                className="primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang xử lý..." : "Cập nhật combo"}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={handleGoBack}
                            >
                                Quay lại
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay" aria-hidden="false">
                    <div className="loading-spinner" role="status">
                        <span className="sr-only">Đang xử lý...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditServiceCombo;





