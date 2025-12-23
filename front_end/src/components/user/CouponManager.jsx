import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCouponsByComboId, deleteCoupon } from "~/api/user/CouponApi";
import HostHeader from "~/components/user/HostHeader";

const CouponManager = () => {
    const location = useLocation();
    const [sidebarActive, setSidebarActive] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userInfo, setUserInfo] = useState(null);

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

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

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "N/A";
        }
    };

    // Format discount display
    const formatDiscount = (coupon) => {
        if (
            coupon.DiscountPercent !== null &&
            coupon.DiscountPercent !== undefined
        ) {
            return `${coupon.DiscountPercent}%`;
        } else if (
            coupon.DiscountAmount !== null &&
            coupon.DiscountAmount !== undefined
        ) {
            return `${parseFloat(coupon.DiscountAmount).toLocaleString("vi-VN")} VND`;
        }
        return "N/A";
    };

    const handleEditCoupon = (couponId) => {
        // Navigate to edit coupon page
        const urlParams = new URLSearchParams(location.search);
        const comboId = urlParams.get("comboId");
        window.location.href = `/edit-coupon?id=${couponId}${comboId ? `&comboId=${comboId}` : ""}`;
    };

    const handleDeleteCoupon = async (couponId) => {
        if (
            window.confirm(
                "Bạn có chắc chắn muốn xóa coupon này? Hành động này không thể hoàn tác."
            )
        ) {
            try {
                await deleteCoupon(couponId);
                alert("Coupon đã được xóa thành công!");
                // Remove the deleted coupon from the list
                setCoupons((prevCoupons) =>
                    prevCoupons.filter((c) => (c.Id || c.id) !== couponId)
                );
            } catch (error) {
                console.error("Error deleting coupon:", error);
                const errorMessage =
                    error.message ||
                    "Có lỗi xảy ra khi xóa coupon. Vui lòng thử lại.";
                alert(errorMessage);
            }
        }
    };

    useEffect(() => {
        // Check authentication first - check both localStorage and sessionStorage
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = "/login";
            return;
        }

        // Reset loading and error when location changes
        setLoading(true);
        setError("");

        const urlParams = new URLSearchParams(location.search);
        const comboId = urlParams.get("comboId");

        if (!comboId) {
            setError(
                "Combo ID không được tìm thấy. Vui lòng truy cập từ trang quản lý combo."
            );
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadCoupons = async () => {
            try {
                // Fetch coupons by comboId - backend automatically filters by HOST_ID from JWT token
                const data = await getCouponsByComboId(comboId);

                if (mounted) {
                    setCoupons(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (mounted) {
                    // If authentication error, redirect to login
                    if (e.message && e.message.includes("Authentication")) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("userInfo");
                        sessionStorage.removeItem("token");
                        sessionStorage.removeItem("userInfo");
                        window.location.href = "/login";
                        return;
                    }
                    setError(
                        e.message ||
                            "Không thể tải danh sách coupon. Vui lòng thử lại."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadCoupons();

        return () => {
            mounted = false;
        };
    }, [location.search, location.pathname]);

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
                    <h2>Quản lý coupon</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`content ${sidebarActive ? "shift" : ""}`}
                role="main"
            >
                <div className="form-content">
                    <div className="create-service-header">
                        <button
                            className="btn-back"
                            onClick={() =>
                                (window.location.href =
                                    "/service-combo-manager")
                            }
                        >
                            ← Về quản lý combo dịch vụ
                        </button>
                        <button
                            className="btn-create-new"
                            onClick={() => {
                                const urlParams = new URLSearchParams(
                                    window.location.search
                                );
                                const comboId = urlParams.get("comboId");
                                window.location.href = comboId
                                    ? `/create-coupon?comboId=${comboId}`
                                    : "/create-coupon";
                            }}
                        >
                            ➕ Tạo coupon mới
                        </button>
                    </div>
                    {loading && <div>Đang tải...</div>}
                    {error && (
                        <div className="error" role="alert">
                            {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="services-grid">
                            {coupons.length === 0 ? (
                                <div className="no-services">
                                    Không có coupon nào
                                </div>
                            ) : (
                                coupons.map((coupon) => (
                                    <div
                                        key={coupon.Id || coupon.id}
                                        className="service-card"
                                    >
                                        <div className="service-details">
                                            <h3 className="service-name">
                                                {coupon.Code || coupon.code}
                                            </h3>
                                            {coupon.Description ||
                                            coupon.description ? (
                                                <p className="service-description">
                                                    {coupon.Description ||
                                                        coupon.description}
                                                </p>
                                            ) : null}
                                            <p className="service-price">
                                                Giảm giá:{" "}
                                                {formatDiscount(coupon)}
                                            </p>
                                            <p className="service-date">
                                                Giới hạn sử dụng:{" "}
                                                {coupon.UsageLimit ||
                                                    coupon.usageLimit}{" "}
                                                lần
                                            </p>
                                            <p className="service-date">
                                                Đã sử dụng:{" "}
                                                {coupon.UsageCount ||
                                                    coupon.usageCount ||
                                                    0}{" "}
                                                lần
                                            </p>
                                            <p className="service-date">
                                                Ngày tạo:{" "}
                                                {formatDate(
                                                    coupon.CreatedAt ||
                                                        coupon.createdAt
                                                )}
                                            </p>
                                            <p className="service-status-gray">
                                                Trạng thái:{" "}
                                                {coupon.IsActive ||
                                                coupon.isActive
                                                    ? "Hoạt động"
                                                    : "Không hoạt động"}
                                            </p>
                                        </div>
                                        <div className="service-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() =>
                                                    handleEditCoupon(
                                                        coupon.Id || coupon.id
                                                    )
                                                }
                                            >
                                                ✏️ Chỉnh sửa
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() =>
                                                    handleDeleteCoupon(
                                                        coupon.Id || coupon.id
                                                    )
                                                }
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CouponManager;





