import React, { useEffect, useState } from "react";
import {
    getMyServiceCombos,
    deleteServiceCombo,
    getServiceComboById,
} from "~/api/user/ServiceComboApi";
import HostHeader from "~/components/user/HostHeader";

// Backend is running on HTTP port 5002
const backend_url = "http://localhost:5002";
// Default image from Firebase Storage
const DEFAULT_IMAGE_URL =
    "https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1";
import { deleteService } from "~/api/user/ServiceApi";

const ServiceComboManager = () => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterName, setFilterName] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");
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

    const handleEditService = (serviceId) => {
        // TODO: Implement edit service functionality
        alert(`Chỉnh sửa dịch vụ ID: ${serviceId}`);
    };

    const handleDeleteServiceCombo = async (serviceComboId) => {
        if (
            window.confirm(
                "Bạn có chắc chắn muốn xóa combo dịch vụ này? Hành động này không thể hoàn tác."
            )
        ) {
            try {
                // First, get the service combo to retrieve the image URL
                const serviceCombo = await getServiceComboById(serviceComboId);
                const imageUrl =
                    serviceCombo?.Image || serviceCombo?.image || null;

                // Delete from Firebase Storage if it's a Firebase URL
                if (imageUrl && imageUrl.includes("firebasestorage")) {
                    try {
                        // const { deleteImageFromFirebase } =
                        //     await import("../services/firebaseStorage");
                        // await deleteImageFromFirebase(imageUrl);
                    } catch (firebaseError) {
                        console.error(
                            "Error deleting image from Firebase Storage:",
                            firebaseError
                        );
                        // Continue with deletion even if Firebase deletion fails
                    }
                }

                // Delete the service combo from backend
                await deleteServiceCombo(serviceComboId);
                alert("Combo dịch vụ đã được xóa thành công!");
                // Remove the deleted item from the list instead of reloading the page
                setServices((prevServices) =>
                    prevServices.filter(
                        (s) => (s.Id || s.id) !== serviceComboId
                    )
                );
                // Also update filtered services
                setFilteredServices((prevFiltered) =>
                    prevFiltered.filter(
                        (s) => (s.Id || s.id) !== serviceComboId
                    )
                );
            } catch (error) {
                console.error("Error deleting service combo:", error);
                let errorMessage =
                    error.message ||
                    "Có lỗi xảy ra khi xóa combo dịch vụ. Vui lòng thử lại.";

                // Check for foreign key constraint errors
                if (
                    errorMessage.includes("foreign key") ||
                    errorMessage.includes("FOREIGN KEY") ||
                    errorMessage.includes("constraint") ||
                    errorMessage.includes("CONSTRAINT") ||
                    errorMessage.includes("reference") ||
                    errorMessage.includes("REFERENCE")
                ) {
                    errorMessage =
                        "Không thể xóa combo dịch vụ này vì đang có coupon hoặc booking liên quan. Vui lòng xóa các coupon và booking trước.";
                }

                alert(errorMessage);
            }
        }
    };

    // Filter and sort function
    const applyFilters = (serviceList, nameFilter, statusFilter, order) => {
        let filtered = [...serviceList];

        // Filter by name
        if (nameFilter && nameFilter.trim() !== "") {
            filtered = filtered.filter((s) => {
                const name = (s.Name || s.name || "").toLowerCase();
                return name.includes(nameFilter.toLowerCase().trim());
            });
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((s) => {
                const status = (s.Status || s.status || "").toLowerCase();
                // Map English status to Vietnamese and vice versa
                const statusMap = {
                    open: ["mở", "open"],
                    closed: ["đóng", "closed"],
                    canceled: ["đã hủy", "canceled"],
                };
                const statusOptions = statusMap[statusFilter] || [];
                return statusOptions.some((opt) => status === opt);
            });
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.CreatedAt || a.createdAt || 0);
            const dateB = new Date(b.CreatedAt || b.createdAt || 0);
            return order === "newest" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    };

    // Handle search button click
    const handleSearch = () => {
        const filtered = applyFilters(
            services,
            filterName,
            filterStatus,
            sortOrder
        );
        setFilteredServices(filtered);
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

        let mounted = true;
        (async () => {
            try {
                const data = await getMyServiceCombos();
                if (mounted) {
                    const serviceArray = Array.isArray(data) ? data : [];
                    setServices(serviceArray);
                    // Initially show all services with default sort
                    setFilteredServices(
                        applyFilters(serviceArray, "", "all", "newest")
                    );
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
                    setError(e.message || "Failed to load service combos");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="create-tour-page">
            {/* Header */}
            <HostHeader />

            {/* Page Title */}
            <section className="content-title-display-box">
                <div className="content-title-display-name">
                    <h2>Các combo dịch vụ bạn đã tạo</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`content ${sidebarActive ? "shift" : ""}`}
                role="main"
            >
                <div className="form-content">
                    {/* Filter Section */}
                    <div className="service-filter-container">
                        <div className="filter-row">
                            <div className="filter-field">
                                <label htmlFor="filter-name">
                                    Lọc theo tên:
                                </label>
                                <input
                                    id="filter-name"
                                    type="text"
                                    className="filter-input"
                                    placeholder="Nhập tên combo..."
                                    value={filterName}
                                    onChange={(e) =>
                                        setFilterName(e.target.value)
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch();
                                        }
                                    }}
                                />
                            </div>
                            <div className="filter-field">
                                <label htmlFor="filter-status">
                                    Trạng thái:
                                </label>
                                <select
                                    id="filter-status"
                                    className="filter-select"
                                    value={filterStatus}
                                    onChange={(e) =>
                                        setFilterStatus(e.target.value)
                                    }
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="open">Mở</option>
                                    <option value="closed">Đóng</option>
                                    <option value="canceled">Đã hủy</option>
                                </select>
                            </div>
                            <div className="filter-field">
                                <label htmlFor="sort-order">Thứ tự:</label>
                                <select
                                    id="sort-order"
                                    className="filter-select"
                                    value={sortOrder}
                                    onChange={(e) =>
                                        setSortOrder(e.target.value)
                                    }
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                </select>
                            </div>
                            <button
                                className="btn-search"
                                onClick={handleSearch}
                            >
                                🔍 Tìm kiếm
                            </button>
                        </div>
                    </div>

                    <div className="create-service-header">
                        <button
                            className="btn-create-new"
                            onClick={() =>
                                (window.location.href = "/create-service-combo")
                            }
                        >
                            ➕ Tạo combo mới
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
                            {filteredServices.length === 0 ? (
                                <div className="no-services">
                                    Không có combo dịch vụ nào
                                </div>
                            ) : (
                                filteredServices.map((s) => (
                                    <div
                                        key={s.Id || s.id}
                                        className="servicecombo-card"
                                    >
                                        <div className="service-image">
                                            {(() => {
                                                const name =
                                                    s.Image || s.image || "";
                                                const isAbsolute =
                                                    name.startsWith(
                                                        "data:image"
                                                    ) ||
                                                    name.startsWith(
                                                        "http://"
                                                    ) ||
                                                    name.startsWith("https://");
                                                const candidates = [];
                                                if (
                                                    name &&
                                                    name.trim() !== ""
                                                ) {
                                                    if (isAbsolute) {
                                                        candidates.push(name);
                                                    } else {
                                                        const publicUrl = (
                                                            process.env
                                                                .PUBLIC_URL ||
                                                            ""
                                                        ).replace(/\/$/, "");
                                                        // 1) Frontend public folder
                                                        candidates.push(
                                                            `${publicUrl}/img/uploads/${name}`
                                                        );
                                                        // 2) Backend common static candidates (if served)
                                                        candidates.push(
                                                            `${backend_url}/img/uploads/${name}`
                                                        );
                                                        candidates.push(
                                                            `${backend_url}/images/${name}`
                                                        );
                                                    }
                                                }
                                                if (candidates.length === 0) {
                                                    candidates.push(
                                                        DEFAULT_IMAGE_URL
                                                    );
                                                }
                                                const onImgError = (e) => {
                                                    try {
                                                        const list = JSON.parse(
                                                            e.target.dataset
                                                                .candidates ||
                                                                "[]"
                                                        );
                                                        const idx = parseInt(
                                                            e.target.dataset
                                                                .idx || "0",
                                                            10
                                                        );
                                                        const nextIdx = idx + 1;
                                                        if (
                                                            nextIdx <
                                                            list.length
                                                        ) {
                                                            e.target.dataset.idx =
                                                                String(nextIdx);
                                                            e.target.src =
                                                                list[nextIdx];
                                                        } else {
                                                            e.target.src =
                                                                DEFAULT_IMAGE_URL;
                                                        }
                                                    } catch {
                                                        e.target.src =
                                                            DEFAULT_IMAGE_URL;
                                                    }
                                                };
                                                return (
                                                    <img
                                                        src={candidates[0]}
                                                        data-candidates={JSON.stringify(
                                                            candidates
                                                        )}
                                                        data-idx="0"
                                                        alt={s.Name || s.name}
                                                        onError={onImgError}
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <div className="service-content-wrapper">
                                            <div className="service-info">
                                                <h3 className="service-name">
                                                    {s.Name || s.name}
                                                </h3>
                                                <p className="service-date">
                                                    Ngày tạo:{" "}
                                                    {new Date(
                                                        s.CreatedAt
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </p>
                                                <p className="service-status-gray">
                                                    Trạng thái:{" "}
                                                    {s.Status || s.status}
                                                </p>
                                            </div>
                                            <div
                                                className="service-view-link"
                                                onClick={() =>
                                                    (window.location.href = `/service-combo-preview?id=${s.Id || s.id}`)
                                                }
                                            >
                                                &gt;&gt;Xem ngay
                                            </div>
                                        </div>
                                        <div className="service-actions">
                                            <button
                                                className="btn-view"
                                                onClick={() =>
                                                    (window.location.href = `/coupon-manager?comboId=${s.Id || s.id}`)
                                                }
                                            >
                                                🎫 Thêm coupon
                                            </button>
                                            <button
                                                className="btn-edit"
                                                onClick={() =>
                                                    (window.location.href = `/edit-service-combo?id=${s.Id || s.id}`)
                                                }
                                            >
                                                ✏️ Chỉnh sửa
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() =>
                                                    handleDeleteServiceCombo(
                                                        s.Id || s.id
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

export default ServiceComboManager;





