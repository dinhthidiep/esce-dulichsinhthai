import React, { useState, useEffect, useCallback } from "react";
import { createService } from "~/api/user/ServiceApi";
import HostHeader from "~/components/user/HostHeader";

const CreateService = () => {
    // State management
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        capacity: "",
        availableSlot: "",
        startDate: "",
        endDate: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

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

    // Configuration
    const config = {
        maxDescriptionLength: 5000,
    };

    // Utility functions
    const validateField = useCallback(
        (name, value) => {
            switch (name) {
                case "name":
                    return !value || value.trim() === ""
                        ? "Tên dịch vụ không được để trống"
                        : "";

                case "price":
                    const price = parseFloat(value);
                    if (isNaN(price) || price < 0) return "Giá phải là số >= 0";
                    return "";

                default:
                    return "";
            }
        },
        [formData.capacity, formData.startDate]
    );

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
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            ];
            if (!allowedTypes.includes(file.type)) {
                setErrors((prev) => ({
                    ...prev,
                    image: "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)",
                }));
                setImagePreview(null);
                return;
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setErrors((prev) => ({
                    ...prev,
                    image: "Kích thước file không được vượt quá 5MB",
                }));
                setImagePreview(null);
                return;
            }

            // Clear error
            setErrors((prev) => ({ ...prev, image: "" }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);

            // Update formData
            setFormData((prev) => ({
                ...prev,
                image: file,
            }));
        } else {
            setImagePreview(null);
            setFormData((prev) => ({
                ...prev,
                image: null,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (isLoading || isSubmitting) {
            e.stopPropagation();
            return;
        }

        setIsSubmitting(true);

        // Check required fields first
        const requiredFields = {
            name: formData.name,
            price: formData.price,
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
                if (value === null || value === undefined) return true;
                const textValue =
                    typeof value === "string" ? value.trim() : String(value);
                return textValue === "";
            }
        );

        if (emptyRequiredFields.length > 0) {
            alert("Vui lòng điền vào ô bắt buộc.");
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
            // Create FormData for file upload (exclude fields not used by API)
            const submitData = new FormData();
            const excluded = new Set([
                "capacity",
                "availableSlot",
                "startDate",
                "endDate",
            ]);
            Object.keys(formData).forEach((key) => {
                if (
                    !excluded.has(key) &&
                    formData[key] !== null &&
                    formData[key] !== ""
                ) {
                    submitData.append(key, formData[key]);
                }
            });

            // Submit to backend API
            const result = await createService(submitData);

            console.log("Service creation response:", result);

            // Backend returns: { message: "...", service: { Id, Name, ... } }
            // Check for service in result or direct id/Id
            const serviceId =
                result?.service?.Id ||
                result?.service?.id ||
                result?.id ||
                result?.Id;

            // Show success message regardless (if we got here, the request succeeded)
            alert(
                "Dịch vụ được tạo thành công, vui lòng đợi xác nhận từ ban quản lý!"
            );

            // Redirect to service-manager page after a short delay to ensure alert is seen
            setTimeout(() => {
                window.location.href = "/service-manager";
            }, 100);
        } catch (error) {
            console.error("Error creating service:", error);
            const errorMessage =
                error.message ||
                "Có lỗi xảy ra khi tạo dịch vụ. Vui lòng thử lại.";
            alert(errorMessage);
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        window.location.href = "/service-manager";
    };

    const toggleSidebar = () => {
        setSidebarActive(!sidebarActive);
    };

    // Set minimum date to today
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setFormData((prev) => ({
            ...prev,
            startDate: prev.startDate || today,
            endDate: prev.endDate || today,
        }));
    }, []);

    // Update end date minimum when start date changes
    useEffect(() => {
        if (
            formData.startDate &&
            formData.endDate &&
            formData.endDate < formData.startDate
        ) {
            setFormData((prev) => ({
                ...prev,
                endDate: formData.startDate,
            }));
        }
    }, [formData.startDate]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && sidebarActive) {
                setSidebarActive(false);
            }
            if (e.ctrlKey && e.key === "Enter") {
                document
                    .getElementById("createServiceForm")
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
                    <h2>Tạo dịch vụ mới</h2>
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
                        id="createServiceForm"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {/* Service Name Field */}
                        <div className="field">
                            <label htmlFor="name">
                                Nhập tên dịch vụ (Service Name)
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                maxLength="255"
                                required
                                placeholder="Tên dịch vụ..."
                                value={formData.name}
                                onChange={handleInputChange}
                                autoComplete="off"
                            />
                        </div>

                        {/* Description Field */}
                        <div className="field">
                            <label htmlFor="description">
                                Mô tả về dịch vụ (Service Description)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength="5000"
                                placeholder="Mô tả ngắn về dịch vụ (tối đa 5000 ký tự)"
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
                                Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP),
                                tối đa 5MB
                            </div>
                            {errors.image && (
                                <div className="error">{errors.image}</div>
                            )}
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    className="img-preview"
                                    alt="Xem trước ảnh"
                                    loading="lazy"
                                    style={{
                                        maxWidth: "300px",
                                        maxHeight: "300px",
                                        marginTop: "10px",
                                        borderRadius: "4px",
                                    }}
                                />
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="form-action">
                            <button
                                type="submit"
                                className="primary"
                                disabled={
                                    isLoading ||
                                    isSubmitting ||
                                    !formData.name ||
                                    !formData.price
                                }
                            >
                                {isLoading || isSubmitting
                                    ? "Đang xử lý..."
                                    : "Tạo dịch vụ"}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={handleGoBack}
                                disabled={isLoading || isSubmitting}
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

export default CreateService;





