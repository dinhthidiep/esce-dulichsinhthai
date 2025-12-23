import "~/components/user/coupon/CouponManagement.css";
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { getCouponById, updateCoupon } from "~/api/user/CouponApi";
import HostHeader from "~/components/user/HostHeader";

const EditCoupon = () => {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const couponId = urlParams.get("id");
    const comboId = urlParams.get("comboId");

    // State management
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        usageLimit: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    // Configuration
    const config = {
        maxCodeLength: 50,
        maxDescriptionLength: 255,
        maxDiscountPercent: 100,
        minUsageLimit: 1,
    };

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
    }, []);

    // Load coupon data
    useEffect(() => {
        const loadCoupon = async () => {
            if (!couponId) {
                setErrors({ general: "Không tìm thấy ID coupon." });
                setIsLoadingData(false);
                return;
            }

            try {
                const coupon = await getCouponById(couponId);
                if (!coupon) {
                    setErrors({ general: "Không tìm thấy coupon." });
                    setIsLoadingData(false);
                    return;
                }

                // Determine discount type
                const hasPercent = coupon.DiscountPercent !== null && coupon.DiscountPercent !== undefined;
                const discountType = hasPercent ? "percentage" : "amount";
                const discountValue = hasPercent 
                    ? coupon.DiscountPercent 
                    : (coupon.DiscountAmount || "");

                setFormData({
                    code: coupon.Code || coupon.code || "",
                    description: coupon.Description || coupon.description || "",
                    discountType,
                    discountValue: discountValue.toString(),
                    usageLimit: (coupon.UsageLimit || coupon.usageLimit || "").toString(),
                });
            } catch (error) {
                console.error("Error loading coupon:", error);
                setErrors({ general: error.message || "Không thể tải thông tin coupon." });
            } finally {
                setIsLoadingData(false);
            }
        };

        loadCoupon();
    }, [couponId]);

    // Validation
    const validateField = useCallback((name, value) => {
        switch (name) {
            case "code":
                if (!value || value.trim() === "") {
                    return "Mã coupon không được để trống";
                }
                if (value.includes(" ")) {
                    return "Mã giảm giá không được có dấu cách.";
                }
                if (value.trim().length > config.maxCodeLength) {
                    return `Mã coupon không được vượt quá ${config.maxCodeLength} ký tự`;
                }
                const couponRegex = /^[A-Za-z0-9\-_]+$/;
                if (!couponRegex.test(value.trim())) {
                    return "Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới";
                }
                return "";

            case "description":
                if (value && value.length > config.maxDescriptionLength) {
                    return `Mô tả không được vượt quá ${config.maxDescriptionLength} ký tự`;
                }
                return "";

            case "discountValue":
                if (!value || value.trim() === "") {
                    return formData.discountType === "percentage"
                        ? "Phần trăm giảm giá không được để trống"
                        : "Số tiền giảm giá không được để trống";
                }
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0) {
                    return "Giá trị phải là số dương";
                }
                if (formData.discountType === "percentage" && num > config.maxDiscountPercent) {
                    return `Phần trăm không được vượt quá ${config.maxDiscountPercent}%`;
                }
                return "";

            case "usageLimit":
                if (!value || value.trim() === "") {
                    return "Giới hạn sử dụng không được để trống";
                }
                const limit = parseInt(value);
                if (isNaN(limit) || limit < config.minUsageLimit) {
                    return `Giới hạn sử dụng phải là số nguyên >= ${config.minUsageLimit}`;
                }
                return "";

            default:
                return "";
        }
    }, [formData.discountType]);

    // Event handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let fieldValue = type === "radio" ? value : type === "checkbox" ? checked : value;

        setFormData((prev) => ({ ...prev, [name]: fieldValue }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (key !== "discountType") {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsLoading(false);
            return;
        }

        try {
            const updateData = {
                Code: formData.code.trim(),
                Description: formData.description.trim() || null,
                DiscountPercent: formData.discountType === "percentage" ? parseFloat(formData.discountValue) : null,
                DiscountAmount: formData.discountType === "amount" ? parseFloat(formData.discountValue) : null,
                UsageLimit: parseInt(formData.usageLimit),
            };

            await updateCoupon(couponId, updateData);
            alert("Coupon đã được cập nhật thành công!");
            handleGoBack();
        } catch (error) {
            console.error("Error updating coupon:", error);
            alert(error.message || "Có lỗi xảy ra khi cập nhật coupon.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        if (comboId) {
            window.location.href = `/coupon-manager?comboId=${comboId}`;
        } else {
            window.location.href = "/coupon-manager";
        }
    };

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    if (isLoadingData) {
        return (
            <div className="create-tour-page">
                <HostHeader />
                <main className="content">
                    <div className="form-content">
                        <div>Đang tải thông tin coupon...</div>
                    </div>
                </main>
            </div>
        );
    }

    if (errors.general) {
        return (
            <div className="create-tour-page">
                <HostHeader />
                <main className="content">
                    <div className="form-content">
                        <div className="error">{errors.general}</div>
                        <button className="secondary" onClick={handleGoBack}>Quay lại</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="create-tour-page">
            <aside className={`sidebar ${sidebarActive ? "active" : ""}`} role="navigation">
                <nav>
                    <ul>
                        <li><a href="/" className="sidebar-select"><span>🏠</span> Trang chủ</a></li>
                        <li><a href="/service-manager" className="sidebar-select"><span>⚙️</span> Quản lý dịch vụ</a></li>
                        <li><a href="/service-combo-manager" className="sidebar-select"><span>📦</span> Quản lý combo</a></li>
                        <li><a href="/social-media" className="sidebar-select"><span>📱</span> Mạng xã hội</a></li>
                    </ul>
                </nav>
            </aside>

            <HostHeader />

            <section className="content-title-display-box">
                <div className="content-title-display-name">
                    <h2>Chỉnh sửa coupon</h2>
                </div>
            </section>

            <main className={`content ${sidebarActive ? "shift" : ""}`} role="main">
                <div className="form-content">
                    <div className="disclaimer-text">
                        (<span className="required-indicator">*</span>) bắt buộc
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="field">
                            <label htmlFor="code">
                                Mã coupon (CODE)<span className="required-indicator">*</span>
                            </label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                maxLength={config.maxCodeLength}
                                required
                                value={formData.code}
                                onChange={handleInputChange}
                                autoComplete="off"
                            />
                            {errors.code && <div className="error">{errors.code}</div>}
                        </div>

                        <div className="field">
                            <label htmlFor="description">Mô tả</label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength={config.maxDescriptionLength}
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                            />
                            <div className="hint">
                                Còn lại: {config.maxDescriptionLength - formData.description.length} ký tự
                            </div>
                        </div>

                        <div className="field">
                            <label>Loại giảm giá</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="discountType"
                                        value="percentage"
                                        checked={formData.discountType === "percentage"}
                                        onChange={handleInputChange}
                                    />
                                    <span>Phần trăm</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="discountType"
                                        value="amount"
                                        checked={formData.discountType === "amount"}
                                        onChange={handleInputChange}
                                    />
                                    <span>Số tiền</span>
                                </label>
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="discountValue">
                                {formData.discountType === "percentage" ? "Phần trăm giảm (%)" : "Số tiền giảm (VND)"}
                                <span className="required-indicator">*</span>
                            </label>
                            <input
                                id="discountValue"
                                name="discountValue"
                                type="number"
                                step={formData.discountType === "percentage" ? "1" : "0.01"}
                                min="0"
                                max={formData.discountType === "percentage" ? config.maxDiscountPercent : undefined}
                                required
                                value={formData.discountValue}
                                onChange={handleInputChange}
                            />
                            {errors.discountValue && <div className="error">{errors.discountValue}</div>}
                        </div>

                        <div className="field">
                            <label htmlFor="usageLimit">
                                Giới hạn sử dụng<span className="required-indicator">*</span>
                            </label>
                            <input
                                id="usageLimit"
                                name="usageLimit"
                                type="number"
                                min={config.minUsageLimit}
                                required
                                value={formData.usageLimit}
                                onChange={handleInputChange}
                            />
                            {errors.usageLimit && <div className="error">{errors.usageLimit}</div>}
                        </div>

                        <div className="form-action">
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
                            </button>
                            <button type="button" className="secondary" onClick={handleGoBack}>
                                Quay lại
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner" role="status">
                        <span className="sr-only">Đang xử lý...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditCoupon;





