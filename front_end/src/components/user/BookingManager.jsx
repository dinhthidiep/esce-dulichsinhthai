import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HostHeader from "~/components/user/HostHeader";
import {
    getAllBookings,
    updateBookingStatus,
    updateBooking,
} from "~/api/user/BookingApi";

const BookingManager = () => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allBookings, setAllBookings] = useState([]); // Store all bookings
    const [filteredBookings, setFilteredBookings] = useState([]); // Filtered and sorted bookings
    const [statusFilter, setStatusFilter] = useState("all"); // all, pending, confirmed, processing, completed, cancelled
    const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        bookingId: null,
        action: "",
        notes: "",
    });
    const navigate = useNavigate();

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    // Helper function to get roleId (handles both RoleId and roleId, converts to number)
    const getRoleId = (user) => {
        if (!user) return null;
        const roleId = user.RoleId ?? user.roleId;
        if (roleId === undefined || roleId === null) return null;
        return Number(roleId);
    };

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
    }, [navigate]);

    // Load bookings
    useEffect(() => {
        // Check authentication first - check both localStorage and sessionStorage
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = "/login";
            return;
        }

        if (!userInfo) return;

        const loadBookings = async () => {
            try {
                const allBookings = await getAllBookings();
                const bookingsArray = Array.isArray(allBookings)
                    ? allBookings
                    : [];

                // Get current user ID
                const currentUserId = userInfo.Id || userInfo.id;

                // Filter bookings:
                // 1. Booking's ServiceCombo.HostId matches current user ID
                const userBookings = bookingsArray.filter((booking) => {
                    const serviceCombo =
                        booking.ServiceCombo || booking.serviceCombo;
                    if (!serviceCombo) return false;

                    const hostId = serviceCombo.HostId || serviceCombo.hostId;

                    return hostId === currentUserId;
                });

                setAllBookings(userBookings);
            } catch (err) {
                console.error("Error loading bookings:", err);
                // If authentication error, redirect to login
                if (err.message && err.message.includes("Authentication")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userInfo");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("userInfo");
                    window.location.href = "/login";
                    return;
                }
                setError(err.message || "Không thể tải danh sách booking");
            }
        };

        if (userInfo) {
            loadBookings();
        }
    }, [userInfo]);

    // Handle accept booking - show modal
    const handleAcceptBooking = (bookingId, currentNotes) => {
        setModalData({
            bookingId: bookingId,
            action: "accept",
            notes: currentNotes || "",
        });
        setShowModal(true);
    };

    // Handle reject booking - show modal
    const handleRejectBooking = (bookingId, currentNotes) => {
        setModalData({
            bookingId: bookingId,
            action: "reject",
            notes: currentNotes || "",
        });
        setShowModal(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowModal(false);
        setModalData({ bookingId: null, action: "", notes: "" });
    };

    // Handle modal confirm
    const handleConfirmAction = async () => {
        const { bookingId, action, notes } = modalData;

        try {
            const newStatus = action === "accept" ? "confirmed" : "cancelled";

            // Find the booking to get its current Quantity
            const booking = allBookings.find(
                (b) => (b.Id || b.id) === bookingId
            );
            const currentQuantity = booking
                ? booking.Quantity || booking.quantity || 1
                : 1;

            // Update booking with status, notes, and quantity (required field)
            await updateBooking(bookingId, {
                Status: newStatus,
                Notes: notes || "",
                Quantity: currentQuantity,
            });

            // Reload the page to show updated data
            window.location.reload();
        } catch (err) {
            console.error(
                `Error ${action === "accept" ? "accepting" : "rejecting"} booking:`,
                err
            );
            alert(
                `Không thể ${action === "accept" ? "chấp nhận" : "từ chối"} booking: ` +
                    (err.message || "Lỗi không xác định")
            );
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount == null) return "0 VNĐ";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    // Filter and sort bookings
    useEffect(() => {
        let filtered = [...allBookings];

        // Filter by status
        if (statusFilter && statusFilter !== "all") {
            filtered = filtered.filter((booking) => {
                const status = (
                    booking.Status ||
                    booking.status ||
                    ""
                ).toLowerCase();
                return status === statusFilter.toLowerCase();
            });
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.BookingDate || a.bookingDate || 0);
            const dateB = new Date(b.BookingDate || b.bookingDate || 0);

            if (sortOrder === "newest") {
                return dateB - dateA; // Newest first
            } else {
                return dateA - dateB; // Oldest first
            }
        });

        setFilteredBookings(filtered);
    }, [allBookings, statusFilter, sortOrder]);

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    // Handle sort order change
    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
    };

    // Don't render if still loading or user doesn't have permission
    if (loading) {
        return (
            <div className="create-tour-page">
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    Đang tải...
                </div>
            </div>
        );
    }

    // Check permission before rendering
    const roleId = getRoleId(userInfo);
    if (!userInfo || roleId !== 2) {
        return (
            <div className="create-tour-page">
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    <h2>Không có quyền truy cập</h2>
                    <p>Chỉ Host mới có thể truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="create-tour-page">
            {/* Header */}
            <HostHeader />

            {/* Page Title */}
            <section className="content-title-display-box">
                <div className="content-title-display-name">
                    <h2>Quản lý booking</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`content ${sidebarActive ? "shift" : ""}`}
                role="main"
            >
                <div className="form-content">
                    {error && (
                        <div
                            className="error-message"
                            style={{ color: "red", marginBottom: "1rem" }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="booking-filters">
                        <div className="filter-group">
                            <label
                                htmlFor="status-filter"
                                className="filter-label"
                            >
                                Trạng thái:
                            </label>
                            <select
                                id="status-filter"
                                className="filter-select"
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                            >
                                <option value="all">Tất cả</option>
                                <option value="pending">Đang chờ</option>
                                <option value="confirmed">Đã chấp nhận</option>
                                <option value="processing">Đang xử lý</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="cancelled">Đã từ chối</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label
                                htmlFor="sort-order"
                                className="filter-label"
                            >
                                Sắp xếp:
                            </label>
                            <select
                                id="sort-order"
                                className="filter-select"
                                value={sortOrder}
                                onChange={handleSortOrderChange}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                            </select>
                        </div>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div
                            className="no-bookings"
                            style={{ textAlign: "center", padding: "2rem" }}
                        >
                            <p>Không có booking nào.</p>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {filteredBookings.map((booking) => {
                                const serviceCombo =
                                    booking.ServiceCombo ||
                                    booking.serviceCombo ||
                                    {};
                                const comboName =
                                    serviceCombo.Name ||
                                    serviceCombo.name ||
                                    "N/A";
                                const bookingDate =
                                    booking.BookingDate || booking.bookingDate;
                                // Note: START_DATE and END_DATE may not be in the model
                                // They exist in DB but are ignored in the model
                                // For now, we'll show a placeholder or try to get from raw data
                                const startDate =
                                    booking.StartDate ||
                                    booking.startDate ||
                                    booking.START_DATE ||
                                    "N/A";
                                const endDate =
                                    booking.EndDate ||
                                    booking.endDate ||
                                    booking.END_DATE ||
                                    "N/A";
                                const quantity =
                                    booking.Quantity || booking.quantity || 0;
                                const totalAmount =
                                    booking.TotalAmount ||
                                    booking.totalAmount ||
                                    0;
                                const notes =
                                    booking.Notes ||
                                    booking.notes ||
                                    "Không có ghi chú";
                                const bookingId = booking.Id || booking.id;
                                const status = (
                                    booking.Status ||
                                    booking.status ||
                                    ""
                                ).toLowerCase();
                                const user = booking.User || booking.user || {};
                                const userName =
                                    user.Name || user.name || "N/A";

                                return (
                                    <div
                                        key={bookingId}
                                        className="booking-card"
                                    >
                                        <div className="booking-card-content">
                                            <div className="booking-combo-name">
                                                <h3>{comboName}</h3>
                                            </div>

                                            <div className="booking-info-grid">
                                                <div className="booking-info-item">
                                                    <span className="booking-info-label">
                                                        Người đặt:
                                                    </span>
                                                    <span className="booking-info-value">
                                                        {userName}
                                                    </span>
                                                </div>

                                                <div className="booking-info-item">
                                                    <span className="booking-info-label">
                                                        Ngày đặt:
                                                    </span>
                                                    <span className="booking-info-value">
                                                        {formatDate(
                                                            bookingDate
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="booking-info-item">
                                                    <span className="booking-info-label">
                                                        Thời gian:
                                                    </span>
                                                    <span className="booking-info-value">
                                                        {startDate !== "N/A" &&
                                                        endDate !== "N/A"
                                                            ? `${formatDate(startDate)} / ${formatDate(endDate)}`
                                                            : "N/A"}
                                                    </span>
                                                </div>

                                                <div className="booking-info-item">
                                                    <span className="booking-info-label">
                                                        Số người:
                                                    </span>
                                                    <span className="booking-info-value">
                                                        {quantity}
                                                    </span>
                                                </div>

                                                <div className="booking-info-item">
                                                    <span className="booking-info-label">
                                                        Tổng:
                                                    </span>
                                                    <span className="booking-info-value">
                                                        {formatCurrency(
                                                            totalAmount
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="booking-notes">
                                                <span className="booking-info-label">
                                                    Ghi chú:
                                                </span>
                                                <span className="booking-info-value">
                                                    {notes}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="booking-actions">
                                            {status === "pending" ? (
                                                <>
                                                    <button
                                                        className="booking-btn booking-btn-accept"
                                                        onClick={() =>
                                                            handleAcceptBooking(
                                                                bookingId,
                                                                notes
                                                            )
                                                        }
                                                    >
                                                        Chấp nhận
                                                    </button>
                                                    <button
                                                        className="booking-btn booking-btn-reject"
                                                        onClick={() =>
                                                            handleRejectBooking(
                                                                bookingId,
                                                                notes
                                                            )
                                                        }
                                                    >
                                                        Từ chối
                                                    </button>
                                                </>
                                            ) : status === "confirmed" ? (
                                                <div className="booking-status booking-status-confirmed">
                                                    Đã chấp nhận
                                                </div>
                                            ) : status === "processing" ? (
                                                <div className="booking-status booking-status-processing">
                                                    Đang xử lý
                                                </div>
                                            ) : status === "completed" ? (
                                                <div className="booking-status booking-status-completed">
                                                    Hoàn thành
                                                </div>
                                            ) : status === "cancelled" ? (
                                                <div className="booking-status booking-status-cancelled">
                                                    Đã từ chối
                                                </div>
                                            ) : (
                                                <div className="booking-status">
                                                    {status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Confirmation Modal */}
            {showModal && (
                <div
                    className="booking-modal-overlay"
                    onClick={handleCloseModal}
                >
                    <div
                        className="booking-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="booking-modal-header">
                            <h3>
                                {modalData.action === "accept"
                                    ? "Chấp nhận booking"
                                    : "Từ chối booking"}
                            </h3>
                            <button
                                className="booking-modal-close"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className="booking-modal-body">
                            <p className="booking-modal-message">
                                {modalData.action === "accept"
                                    ? "Bạn có chắc chắn muốn chấp nhận booking này?"
                                    : "Bạn có chắc chắn muốn từ chối booking này?"}
                            </p>

                            <div className="booking-modal-notes">
                                <label
                                    htmlFor="booking-notes-input"
                                    className="booking-modal-label"
                                >
                                    Ghi chú:
                                </label>
                                <textarea
                                    id="booking-notes-input"
                                    className="booking-modal-textarea"
                                    value={modalData.notes}
                                    onChange={(e) =>
                                        setModalData({
                                            ...modalData,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    rows="4"
                                />
                            </div>
                        </div>

                        <div className="booking-modal-footer">
                            <button
                                className="booking-modal-btn booking-modal-btn-cancel"
                                onClick={handleCloseModal}
                            >
                                Hủy
                            </button>
                            <button
                                className={`booking-modal-btn ${
                                    modalData.action === "accept"
                                        ? "booking-modal-btn-confirm-accept"
                                        : "booking-modal-btn-confirm-reject"
                                }`}
                                onClick={handleConfirmAction}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManager;





