import React, { useState, useEffect, useCallback } from "react";
import { createServiceCombo } from "~/api/user/ServiceComboApi";
import { getMyServices, addServiceToCombo } from "~/api/user/ServiceApi";
import HostHeader from "~/components/user/HostHeader";

const CreateServiceCombo = () => {
    // State management
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        description: "",
        price: "",
        availableSlots: "",
        image: null,
        status: "open",
        cancellationPolicy: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState({}); // { serviceId: { selected: boolean, quantity: number } }

    // Check authentication and load user info
    useEffect(() => {
        // Check authentication first - check both localStorage and sessionStorage
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            // Redirect to login if not authenticated
            console.warn("No token found, redirecting to login");
            window.location.href = "/login";
            return;
        }
    }, []);

    // Load approved services for current host
    useEffect(() => {
        const loadServices = async () => {
            try {
                // getMyServices already filters by Approved status and HostId
                const services = await getMyServices();
                setAllServices(Array.isArray(services) ? services : []);
            } catch (err) {
                console.error("Error loading services:", err);
            }
        };
        loadServices();
    }, []);

    // Configuration
    const config = {
        maxDescriptionLength: 1000,
        maxCancellationPolicyLength: 1000,
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
                return !value || value.trim() === ""
                    ? "Tên combo dịch vụ không được để trống"
                    : "";

            case "address":
                return !value || value.trim() === ""
                    ? "Địa chỉ không được để trống"
                    : "";

            case "price":
                const price = parseFloat(value);
                if (isNaN(price) || price < 0) return "Giá phải là số >= 0";
                return "";

            case "availableSlots":
                const slots = parseInt(value);
                if (isNaN(slots) || slots < 1)
                    return "Số chỗ trống phải là số nguyên >= 1";
                return "";

            case "image":
                if (!value) return "";
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
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }

        handleInputChange(e);
    };

    const handleServiceSelect = (serviceId, checked) => {
        setSelectedServices((prev) => ({
            ...prev,
            [serviceId]: {
                selected: checked,
                quantity: prev[serviceId]?.quantity || 0,
            },
        }));
    };

    const handleServiceQuantityChange = (serviceId, quantity) => {
        setSelectedServices((prev) => ({
            ...prev,
            [serviceId]: {
                selected: prev[serviceId]?.selected || false,
                quantity: parseInt(quantity) || 0,
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

        setIsLoading(true);

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
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

        try {
            // Grab current user id from storage (check both localStorage and sessionStorage)
            let hostId = null;
            try {
                const userInfo =
                    localStorage.getItem("userInfo") ||
                    sessionStorage.getItem("userInfo");
                if (userInfo) {
                    const info = JSON.parse(userInfo);
                    hostId = info.Id || info.id || info.ID || null;
                }
            } catch {}

            // Ensure HostId is a valid integer
            const hostIdInt = hostId ? parseInt(hostId, 10) : null;
            if (!hostIdInt || isNaN(hostIdInt)) {
                throw new Error(
                    "Không thể xác định người dùng. Vui lòng đăng nhập lại."
                );
            }

            // Convert formData to object for API (Image will be handled by backend from file upload)
            const submitData = {
                Name: formData.name,
                Address: formData.address,
                Description: formData.description || null,
                Price: parseFloat(formData.price) || 0,
                AvailableSlots: parseInt(formData.availableSlots, 10) || 0,
                Status: formData.status || "open",
                CancellationPolicy: formData.cancellationPolicy || null,
                HostId: hostIdInt, // Ensure it's an integer
                // Image will be uploaded as a file, backend will save it and set the filename
            };

            // Submit to backend API with image file
            const result = await createServiceCombo(submitData, formData.image);
            const comboId = result?.id || result?.Id;

            if (comboId) {
                // Save selected services to SERVICECOMBO_DETAIL
                const selectedServiceIds = Object.keys(selectedServices).filter(
                    (serviceId) =>
                        selectedServices[serviceId]?.selected === true
                );

                if (selectedServiceIds.length > 0) {
                    try {
                        for (const serviceId of selectedServiceIds) {
                            const quantity =
                                parseInt(
                                    selectedServices[serviceId]?.quantity || 0
                                ) || 0;
                            await addServiceToCombo(
                                parseInt(comboId),
                                parseInt(serviceId),
                                quantity
                            );
                        }
                    } catch (serviceError) {
                        console.error(
                            "Error adding services to combo:",
                            serviceError
                        );
                        alert(
                            "Combo dịch vụ đã được tạo nhưng có lỗi khi thêm dịch vụ. Vui lòng chỉnh sửa sau."
                        );
                    }
                }

                alert("Tạo combo dịch vụ thành công!");
                // Redirect to service combo manager page
                window.location.href = "/service-combo-manager";
            }
        } catch (error) {
            console.error("Error creating service combo:", error);
            alert("Có lỗi xảy ra khi tạo combo dịch vụ. Vui lòng thử lại.");
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
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Cài đặt"
                                    >
                                        Cài đặt
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Trợ lý ảo"
                                    >
                                        Trợ lý ảo
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="sidebar-select"
                                        aria-label="Chatbot"
                                    >
                                        Chatbot
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
                    <h2>Tạo combo dịch vụ mới</h2>
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
                                placeholder="Địa chỉ combo dịch vụ..."
                                value={formData.address}
                                onChange={handleInputChange}
                                autoComplete="off"
                            />
                        </div>

                        {/* Description Field */}
                        <div className="field">
                            <label htmlFor="description">
                                Mô tả về combo dịch vụ (Service Combo
                                Description)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength="1000"
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

                        {/* Price and Available Slots Fields */}
                        <div className="small-field">
                            <div className="field">
                                <label htmlFor="price">
                                    Giá (Price)
                                    <span className="required-indicator">
                                        *
                                    </span>
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

                            <div className="field">
                                <label htmlFor="availableSlots">
                                    Số chỗ trống (Available Slots)
                                    <span className="required-indicator">
                                        *
                                    </span>
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
                        </div>

                        {/* Cancellation Policy Field */}
                        <div className="field">
                            <label htmlFor="cancellationPolicy">
                                Chính sách hủy (Cancellation Policy)
                            </label>
                            <textarea
                                id="cancellationPolicy"
                                name="cancellationPolicy"
                                maxLength="1000"
                                placeholder="Chính sách hủy combo dịch vụ (tối đa 1000 ký tự)"
                                value={formData.cancellationPolicy}
                                onChange={handleInputChange}
                                aria-describedby="cancellationPolicy-hint"
                                rows="3"
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
                                {isLoading
                                    ? "Đang xử lý..."
                                    : "Tạo combo dịch vụ"}
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

export default CreateServiceCombo;





