import "./ServiceManager.css";
import React, { useEffect, useState } from "react";
import { getMyServices, deleteService } from "~/api/user/ServiceApi";
import HostHeader from "~/components/user/HostHeader";

const ServiceManager = () => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterName, setFilterName] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [userInfo, setUserInfo] = useState(null);

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    const handleEditService = (serviceId) => {
        // TODO: Implement edit service functionality
        alert(`Chỉnh sửa dịch vụ ID: ${serviceId}`);
    };

    const handleDeleteService = async (serviceId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
            try {
                await deleteService(serviceId);
                alert("Dịch vụ đã được xóa thành công!");
                // Remove the deleted item from the list instead of reloading the page
                setServices((prevServices) =>
                    prevServices.filter((s) => (s.Id || s.id) !== serviceId)
                );
                // Also update filtered services
                setFilteredServices((prevFiltered) =>
                    prevFiltered.filter((s) => (s.Id || s.id) !== serviceId)
                );
            } catch (err) {
                console.error("Error deleting service:", err);
                alert("Có lỗi xảy ra khi xóa dịch vụ. Vui lòng thử lại.");
            }
        }
    };

    // Filter and sort function
    const applyFilters = (serviceList, nameFilter, order) => {
        let filtered = [...serviceList];

        // Filter by name
        if (nameFilter && nameFilter.trim() !== "") {
            filtered = filtered.filter((s) => {
                const name = (s.Name || s.name || "").toLowerCase();
                return name.includes(nameFilter.toLowerCase().trim());
            });
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.Created_At || a.CreatedAt || 0);
            const dateB = new Date(b.Created_At || b.CreatedAt || 0);
            return order === "newest" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    };

    // Handle search button click
    const handleSearch = () => {
        const filtered = applyFilters(services, filterName, sortOrder);
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

        // Reset loading and error
        setLoading(true);
        setError("");

        let mounted = true;

        const loadServices = async () => {
            try {
                // Always load all user services
                console.log("Loading all user services");
                const data = await getMyServices();
                console.log("All services loaded:", data);

                if (mounted) {
                    const servicesArray = Array.isArray(data) ? data : [];
                    console.log("Setting services:", servicesArray);
                    setServices(servicesArray);
                    // Initially show all services with default sort
                    const filtered = applyFilters(servicesArray, "", "newest");
                    console.log("After applyFilters:", filtered);
                    console.log("Filtered length:", filtered.length);
                    setFilteredServices(filtered);
                    if (servicesArray.length === 0) {
                        console.warn("No services found");
                    }
                }
            } catch (e) {
                console.error("Error loading services:", e);
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
                    setError(e.message || "Failed to load services");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadServices();

        return () => {
            mounted = false;
        };
    }, []); // Only load once on mount

    return (
        <div className="srv-mgr-create-tour-page">
            {/* Header */}
            <HostHeader />

            {/* Page Title */}
            <section className="srv-mgr-content-title-display-box">
                <div className="srv-mgr-content-title-display-name">
                    <h2>Quản lý dịch vụ</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`srv-mgr-content ${sidebarActive ? "srv-mgr-shift" : ""}`}
                role="main"
            >
                <div className="srv-mgr-form-content">
                    {/* Filter Section */}
                    <div className="srv-mgr-service-filter-container">
                        <div className="srv-mgr-filter-row">
                            <div className="srv-mgr-filter-field">
                                <label htmlFor="filter-name">
                                    Lọc theo tên:
                                </label>
                                <input
                                    id="filter-name"
                                    type="text"
                                    className="srv-mgr-filter-input"
                                    placeholder="Nhập tên dịch vụ..."
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
                            <div className="srv-mgr-filter-field">
                                <label htmlFor="sort-order">Thứ tự:</label>
                                <select
                                    id="sort-order"
                                    className="srv-mgr-filter-select"
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
                                className="srv-mgr-btn-search"
                                onClick={handleSearch}
                            >
                                🔍 Tìm kiếm
                            </button>
                        </div>
                    </div>

                    <div className="srv-mgr-create-service-header">
                        <button
                            className="srv-mgr-btn-create-new"
                            onClick={() => {
                                window.location.href = "/create-service";
                            }}
                        >
                            ➕ Tạo dịch vụ mới
                        </button>
                    </div>
                    {(() => {
                        console.log("Render check - loading:", loading, "error:", error, "filteredServices.length:", filteredServices.length);
                        return null;
                    })()}
                    {loading && <div>Đang tải...</div>}
                    {error && (
                        <div className="srv-mgr-error" role="alert">
                            {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="srv-mgr-services-grid">
                            {(() => {
                                console.log(
                                    "Inside srv-mgr-services-grid - filteredServices:",
                                    filteredServices
                                );
                                return filteredServices.length === 0 ? (
                                    <div className="srv-mgr-no-services">
                                        Không có dịch vụ nào
                                    </div>
                                ) : (
                                    filteredServices.map((s) => {
                                        console.log(
                                            "Rendering service card:",
                                            s
                                        );
                                        return (
                                            <div
                                                key={s.Id || s.id}
                                                className="srv-mgr-service-card"
                                            >
                                                <div className="srv-mgr-service-details">
                                                    <h3 className="srv-mgr-service-name">
                                                        {s.Name || s.name}
                                                    </h3>
                                                    {s.Description ||
                                                    s.description ? (
                                                        <p className="srv-mgr-service-description">
                                                            Mô tả:{" "}
                                                            {s.Description ||
                                                                s.description}
                                                        </p>
                                                    ) : null}
                                                    <p className="srv-mgr-service-date">
                                                        Ngày tạo:{" "}
                                                        {s.Created_At ||
                                                        s.CreatedAt
                                                            ? new Date(
                                                                  s.Created_At ||
                                                                      s.CreatedAt
                                                              ).toLocaleDateString(
                                                                  "vi-VN"
                                                              )
                                                            : "N/A"}
                                                    </p>
                                                    <p className="srv-mgr-service-date">
                                                        Ngày sửa:{" "}
                                                        {s.Updated_At ||
                                                        s.UpdatedAt
                                                            ? new Date(
                                                                  s.Updated_At ||
                                                                      s.UpdatedAt
                                                              ).toLocaleDateString(
                                                                  "vi-VN"
                                                              )
                                                            : "Không"}
                                                    </p>
                                                    <p className="srv-mgr-service-price">
                                                        Giá:{" "}
                                                        {s.Price
                                                            ? s.Price.toLocaleString(
                                                                  "vi-VN"
                                                              )
                                                            : "0"}{" "}
                                                        VND
                                                    </p>
                                                </div>
                                                <div className="srv-mgr-service-actions">
                                                    <button
                                                        className="srv-mgr-btn-edit"
                                                        onClick={() => {
                                                            const serviceId =
                                                                s.Id || s.id;
                                                            window.location.href = `/edit-service?id=${serviceId}`;
                                                        }}
                                                    >
                                                        ✏️ Chỉnh sửa
                                                    </button>
                                                    <button
                                                        className="srv-mgr-btn-delete"
                                                        onClick={() =>
                                                            handleDeleteService(
                                                                s.Id || s.id
                                                            )
                                                        }
                                                    >
                                                        🗑️ Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ServiceManager;





