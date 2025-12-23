import "./ReviewManager.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HostHeader from "~/components/user/HostHeader";
import {
    getAllReviews,
    getReviewById,
    createReply,
    updateReply,
    deleteReply,
} from "~/api/user/ReviewApi";

const DEFAULT_AVATAR_URL =
    "https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1";

const ReviewManager = () => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allReviews, setAllReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [ratingFilter, setRatingFilter] = useState("all");
    const [replyFilter, setReplyFilter] = useState("all"); // all, rev-page-replied, rev-page-not-replied
    const [comboFilter, setComboFilter] = useState("all");
    const [userNameFilter, setUserNameFilter] = useState("");
    const [comboNameFilter, setComboNameFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [replyText, setReplyText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

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

    // Load reviews
    useEffect(() => {
        // Check authentication first - check both localStorage and sessionStorage
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = "/login";
            return;
        }

        if (userInfo) {
            loadReviewsData();
        }
    }, [userInfo]);

    // Filter and sort reviews
    useEffect(() => {
        let filtered = [...allReviews];

        // Filter by rating
        if (ratingFilter && ratingFilter !== "all") {
            const rating = parseInt(ratingFilter);
            filtered = filtered.filter((review) => {
                const reviewRating = review.Rating ?? review.rating ?? 0;
                return reviewRating === rating;
            });
        }

        // Filter by reply status
        if (replyFilter && replyFilter !== "all") {
            filtered = filtered.filter((review) => {
                const replies = review.Replies || review.replies || [];
                const hasReply = replies.length > 0;
                if (replyFilter === "rev-page-replied") {
                    return hasReply;
                } else if (replyFilter === "rev-page-not-replied") {
                    return !hasReply;
                }
                return true;
            });
        }

        // Filter by combo
        if (comboFilter && comboFilter !== "all") {
            filtered = filtered.filter((review) => {
                const booking = review.Booking || review.booking;
                const serviceCombo =
                    booking?.ServiceCombo || booking?.serviceCombo;
                const comboId = serviceCombo?.Id || serviceCombo?.id;
                return comboId === parseInt(comboFilter);
            });
        }

        // Filter by user name
        if (userNameFilter && userNameFilter.trim() !== "") {
            const searchTerm = userNameFilter.toLowerCase().trim();
            filtered = filtered.filter((review) => {
                const user = review.User || review.user;
                const userName = user?.Name || user?.name || "";
                return userName.toLowerCase().includes(searchTerm);
            });
        }

        // Filter by combo name
        if (comboNameFilter && comboNameFilter.trim() !== "") {
            const searchTerm = comboNameFilter.toLowerCase().trim();
            filtered = filtered.filter((review) => {
                const booking = review.Booking || review.booking;
                const serviceCombo =
                    booking?.ServiceCombo || booking?.serviceCombo;
                const comboName =
                    serviceCombo?.Name || serviceCombo?.name || "";
                return comboName.toLowerCase().includes(searchTerm);
            });
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.CreatedDate || a.createdDate || 0);
            const dateB = new Date(b.CreatedDate || b.createdDate || 0);

            if (sortOrder === "newest") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        setFilteredReviews(filtered);
    }, [
        allReviews,
        ratingFilter,
        replyFilter,
        comboFilter,
        userNameFilter,
        comboNameFilter,
        sortOrder,
    ]);

    // Get unique service combos for filter
    const getUniqueServiceCombos = () => {
        const combos = new Map();
        allReviews.forEach((review) => {
            const booking = review.Booking || review.booking;
            const serviceCombo = booking?.ServiceCombo || booking?.serviceCombo;
            if (serviceCombo) {
                const comboId = serviceCombo.Id || serviceCombo.id;
                const comboName =
                    serviceCombo.Name ||
                    serviceCombo.name ||
                    `Combo #${comboId}`;
                if (!combos.has(comboId)) {
                    combos.set(comboId, comboName);
                }
            }
        });
        return Array.from(combos.entries()).map(([id, name]) => ({ id, name }));
    };

    // Handle view details
    const handleViewDetails = async (reviewId) => {
        try {
            const review = await getReviewById(reviewId);
            setSelectedReview(review);
            // Get reply text from Replies collection
            const replies = review.Replies || review.replies || [];
            const reply = replies.length > 0 ? replies[0] : null;
            setReplyText(reply?.Comment || reply?.comment || "");
        } catch (err) {
            console.error("Error loading review details:", err);
            alert("Không thể tải chi tiết review. Vui lòng thử lại.");
        }
    };

    // Handle close details
    const handleCloseDetails = () => {
        setSelectedReview(null);
        setReplyText("");
    };

    // Handle submit reply (create or update)
    const handleSubmitReply = async () => {
        if (!selectedReview) return;

        if (!replyText.trim()) {
            alert("Vui lòng nhập nội dung phản hồi.");
            return;
        }

        setIsSubmittingReply(true);
        try {
            const reviewId = selectedReview.Id || selectedReview.id;
            const currentUserId = userInfo.Id || userInfo.id;

            // Check if reply already exists
            const existingReply =
                selectedReview.Replies && selectedReview.Replies.length > 0
                    ? selectedReview.Replies[0]
                    : null;

            if (existingReply) {
                // Update existing reply
                await updateReply(
                    existingReply.Id || existingReply.id,
                    replyText.trim()
                );
            } else {
                // Create new reply
                await createReply(reviewId, currentUserId, replyText.trim());
            }

            // Refresh reviews list
            await loadReviewsData();

            alert("Đã lưu phản hồi thành công!");

            // Reset page: close modal and clear reply text
            setSelectedReview(null);
            setReplyText("");
        } catch (err) {
            console.error("Error submitting reply:", err);
            alert("Không thể lưu phản hồi. Vui lòng thử lại.");
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Handle delete reply
    const handleDeleteReply = async () => {
        if (!selectedReview) return;

        const reply =
            selectedReview.Replies && selectedReview.Replies.length > 0
                ? selectedReview.Replies[0]
                : null;

        if (!reply) {
            alert("Không có phản hồi để xóa.");
            return;
        }

        if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
            return;
        }

        setIsSubmittingReply(true);
        try {
            const replyId = reply.Id || reply.id;
            await deleteReply(replyId);

            // Refresh reviews list
            await loadReviewsData();

            alert("Đã xóa phản hồi thành công!");

            // Reset page: close modal and clear reply text
            setSelectedReview(null);
            setReplyText("");
        } catch (err) {
            console.error("Error deleting reply:", err);
            alert("Không thể xóa phản hồi. Vui lòng thử lại.");
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Load reviews data helper
    const loadReviewsData = async () => {
        if (!userInfo) return;

        try {
            const reviews = await getAllReviews();
            const reviewsArray = Array.isArray(reviews) ? reviews : [];
            const currentUserId = userInfo.Id || userInfo.id;
            const hostReviews = reviewsArray.filter((review) => {
                const booking = review.Booking || review.booking;
                const serviceCombo =
                    booking?.ServiceCombo || booking?.serviceCombo;
                const hostId = serviceCombo?.HostId || serviceCombo?.hostId;
                return hostId === currentUserId;
            });
            setAllReviews(hostReviews);
        } catch (err) {
            console.error("Error loading reviews:", err);
            // If authentication error, redirect to login
            if (err.message && err.message.includes("Authentication")) {
                localStorage.removeItem("token");
                localStorage.removeItem("userInfo");
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("userInfo");
                window.location.href = "/login";
                return;
            }
            setError("Không thể tải danh sách review. Vui lòng thử lại sau.");
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
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    // Get avatar URL
    const getAvatarUrl = (user) => {
        if (!user) return DEFAULT_AVATAR_URL;
        const avatar = user.Avatar || user.avatar;
        if (!avatar) return DEFAULT_AVATAR_URL;
        if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
            return avatar;
        }
        return DEFAULT_AVATAR_URL;
    };

    // Render stars - only show 1 rev-page-star: grey at 0, yellow for > 0
    const renderStars = (rating) => {
        const ratingValue = rating || 0;

        // Always show only 1 rev-page-star: grey if 0, yellow if > 0
        return (
            <span className={ratingValue === 0 ? "rev-page-star rev-page-greyed" : "rev-page-star rev-page-filled"}>
                ⭐
            </span>
        );
    };

    if (loading) {
        return (
            <div className="create-tour-page">
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    Đang tải...
                </div>
            </div>
        );
    }

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
                    <h2>Quản lý review</h2>
                </div>
            </section>

            {/* Main Content */}
            <main
                className={`rev-page-content ${sidebarActive ? "shift" : ""}`}
                role="main"
            >
                <div className="rev-page-form-content">
                    {error && (
                        <div
                            className="error-message"
                            style={{ color: "red", marginBottom: "1rem" }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="rev-page-review-filters">
                        {/* Filter Row 1: Dropdowns */}
                        <div className="rev-page-filter-row">
                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="rating-filter"
                                    className="rev-page-filter-label"
                                >
                                    Đánh giá:
                                </label>
                                <select
                                    id="rating-filter"
                                    className="rev-page-filter-select"
                                    value={ratingFilter}
                                    onChange={(e) =>
                                        setRatingFilter(e.target.value)
                                    }
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="5">5 sao</option>
                                    <option value="4">4 sao</option>
                                    <option value="3">3 sao</option>
                                    <option value="2">2 sao</option>
                                    <option value="1">1 sao</option>
                                    <option value="0">0 sao</option>
                                </select>
                            </div>

                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="reply-filter"
                                    className="rev-page-filter-label"
                                >
                                    Trạng thái phản hồi:
                                </label>
                                <select
                                    id="reply-filter"
                                    className="rev-page-filter-select"
                                    value={replyFilter}
                                    onChange={(e) =>
                                        setReplyFilter(e.target.value)
                                    }
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="rev-page-replied">Đã phản hồi</option>
                                    <option value="rev-page-not-replied">
                                        Chưa phản hồi
                                    </option>
                                </select>
                            </div>

                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="combo-filter"
                                    className="rev-page-filter-label"
                                >
                                    Combo:
                                </label>
                                <select
                                    id="combo-filter"
                                    className="rev-page-filter-select"
                                    value={comboFilter}
                                    onChange={(e) =>
                                        setComboFilter(e.target.value)
                                    }
                                >
                                    <option value="all">Tất cả</option>
                                    {getUniqueServiceCombos().map((combo) => (
                                        <option key={combo.id} value={combo.id}>
                                            {combo.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="sort-order"
                                    className="rev-page-filter-label"
                                >
                                    Sắp xếp:
                                </label>
                                <select
                                    id="sort-order"
                                    className="rev-page-filter-select"
                                    value={sortOrder}
                                    onChange={(e) =>
                                        setSortOrder(e.target.value)
                                    }
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Row 2: Search Fields */}
                        <div className="rev-page-filter-row">
                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="user-name-filter"
                                    className="rev-page-filter-label"
                                >
                                    Tên người dùng:
                                </label>
                                <input
                                    id="user-name-filter"
                                    type="text"
                                    className="rev-page-filter-input"
                                    placeholder="Tìm theo tên người dùng..."
                                    value={userNameFilter}
                                    onChange={(e) =>
                                        setUserNameFilter(e.target.value)
                                    }
                                />
                            </div>

                            <div className="rev-page-filter-group">
                                <label
                                    htmlFor="combo-name-filter"
                                    className="rev-page-filter-label"
                                >
                                    Tên combo dịch vụ:
                                </label>
                                <input
                                    id="combo-name-filter"
                                    type="text"
                                    className="rev-page-filter-input"
                                    placeholder="Tìm theo tên combo..."
                                    value={comboNameFilter}
                                    onChange={(e) =>
                                        setComboNameFilter(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {filteredReviews.length === 0 ? (
                        <div
                            className="rev-page-no-reviews"
                            style={{ textAlign: "center", padding: "2rem" }}
                        >
                            <p>Không có review nào.</p>
                        </div>
                    ) : (
                        <div className="rev-page-reviews-list">
                            {filteredReviews.map((review) => {
                                const user = review.User || review.user;
                                const booking =
                                    review.Booking || review.booking;
                                const serviceCombo =
                                    booking?.ServiceCombo ||
                                    booking?.serviceCombo;
                                const rating = review.Rating || review.rating;
                                const comment =
                                    review.Comment || review.comment || "";
                                // Replies are stored in Replies collection (child reviews)
                                const replies =
                                    review.Replies || review.replies || [];
                                const hasReply = replies.length > 0;
                                const reply = hasReply ? replies[0] : null; // Get first reply (host should only have one)
                                const createdDate =
                                    review.CreatedDate || review.createdDate;

                                return (
                                    <div
                                        key={review.Id || review.id}
                                        className="rev-page-review-card"
                                    >
                                        <div className="rev-page-review-header">
                                            <div className="rev-page-review-user-info">
                                                <img
                                                    src={getAvatarUrl(user)}
                                                    alt={
                                                        user?.Name ||
                                                        user?.name ||
                                                        "User"
                                                    }
                                                    className="rev-page-review-avatar"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            DEFAULT_AVATAR_URL;
                                                    }}
                                                />
                                                <div className="rev-page-review-user-details">
                                                    <div className="rev-page-review-user-name">
                                                        {user?.Name ||
                                                            user?.name ||
                                                            "Người dùng"}
                                                    </div>
                                                    <div className="rev-page-review-date">
                                                        {formatDate(
                                                            createdDate
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rev-page-review-rating">
                                                {renderStars(rating)}
                                                <span className="rev-page-rating-value">
                                                    {rating || 0}/5
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rev-page-review-combo-info">
                                            <strong>Combo:</strong>{" "}
                                            {serviceCombo?.Name ||
                                                serviceCombo?.name ||
                                                "N/A"}
                                        </div>

                                        <div className="rev-page-review-comment">
                                            {comment}
                                        </div>

                                        {hasReply && reply && (
                                            <div className="rev-page-review-reply-section">
                                                <div className="rev-page-review-reply-label">
                                                    Phản hồi từ Host:
                                                </div>
                                                <div className="rev-page-review-reply-content">
                                                    {reply.Comment ||
                                                        reply.comment}
                                                </div>
                                                <div className="rev-page-review-reply-date">
                                                    Đã phản hồi:{" "}
                                                    {formatDate(
                                                        reply.CreatedDate ||
                                                            reply.createdDate
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="rev-page-review-status">
                                            <span
                                                className={`rev-page-status-badge ${hasReply ? "rev-page-replied" : "rev-page-not-replied"}`}
                                            >
                                                {hasReply
                                                    ? "Đã phản hồi"
                                                    : "Chưa phản hồi"}
                                            </span>
                                        </div>

                                        <button
                                            className="rev-page-review-detail-btn"
                                            onClick={() =>
                                                handleViewDetails(
                                                    review.Id || review.id
                                                )
                                            }
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Review Detail Modal */}
            {selectedReview && (
                <div
                    className="rev-page-review-detail-modal-overlay"
                    onClick={handleCloseDetails}
                >
                    <div
                        className="rev-page-review-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rev-page-review-detail-header">
                            <h3>Chi tiết Review</h3>
                            <button
                                className="rev-page-close-btn"
                                onClick={handleCloseDetails}
                            >
                                ×
                            </button>
                        </div>

                        <div className="rev-page-review-detail-content">
                            {(() => {
                                const user =
                                    selectedReview.User || selectedReview.user;
                                const booking =
                                    selectedReview.Booking ||
                                    selectedReview.booking;
                                const serviceCombo =
                                    booking?.ServiceCombo ||
                                    booking?.serviceCombo;
                                const rating =
                                    selectedReview.Rating ||
                                    selectedReview.rating;
                                const comment =
                                    selectedReview.Comment ||
                                    selectedReview.comment ||
                                    "";
                                // Replies are stored in Replies collection (child reviews)
                                const replies =
                                    selectedReview.Replies ||
                                    selectedReview.replies ||
                                    [];
                                const hasReply = replies.length > 0;
                                const reply = hasReply ? replies[0] : null; // Get first reply (host should only have one)
                                const createdDate =
                                    selectedReview.CreatedDate ||
                                    selectedReview.createdDate;

                                return (
                                    <>
                                        <div className="rev-page-review-detail-section">
                                            <h4>Thông tin người đánh giá</h4>
                                            <div className="rev-page-review-detail-user">
                                                <img
                                                    src={getAvatarUrl(user)}
                                                    alt={
                                                        user?.Name ||
                                                        user?.name ||
                                                        "User"
                                                    }
                                                    className="rev-page-review-detail-avatar"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            DEFAULT_AVATAR_URL;
                                                    }}
                                                />
                                                <div>
                                                    <div>
                                                        <strong>Tên:</strong>{" "}
                                                        {user?.Name ||
                                                            user?.name ||
                                                            "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>Email:</strong>{" "}
                                                        {user?.Email ||
                                                            user?.email ||
                                                            "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rev-page-review-detail-section">
                                            <div className="rev-page-review-rating-row">
                                                <div className="rev-page-review-rating-item">
                                                    <strong>Đánh giá:</strong>{" "}
                                                    {renderStars(rating)}
                                                    <span className="rev-page-rating-value">
                                                        {rating || 0}/5
                                                    </span>
                                                </div>
                                                <div className="rev-page-review-rating-item">
                                                    <strong>
                                                        Ngày đánh giá:
                                                    </strong>{" "}
                                                    {formatDate(createdDate)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rev-page-review-detail-section">
                                            <h4>Nội dung review</h4>
                                            <div className="rev-page-review-detail-comment">
                                                {comment}
                                            </div>
                                        </div>

                                        <div className="rev-page-review-detail-section">
                                            <h4>Thông tin combo dịch vụ</h4>
                                            <div>
                                                <strong>Combo:</strong>{" "}
                                                {serviceCombo?.Name ||
                                                    serviceCombo?.name ||
                                                    "N/A"}
                                            </div>
                                            <div>
                                                <strong>Mô tả:</strong>{" "}
                                                {serviceCombo?.Description ||
                                                    serviceCombo?.description ||
                                                    "N/A"}
                                            </div>
                                            <div>
                                                <strong>Giá:</strong>{" "}
                                                {serviceCombo?.Price
                                                    ? new Intl.NumberFormat(
                                                          "vi-VN"
                                                      ).format(
                                                          serviceCombo.Price
                                                      ) + "đ"
                                                    : "N/A"}
                                            </div>
                                            <div>
                                                <strong>Địa chỉ:</strong>{" "}
                                                {serviceCombo?.Address ||
                                                    serviceCombo?.address ||
                                                    "N/A"}
                                            </div>
                                        </div>

                                        <div className="rev-page-review-detail-section">
                                            <h4>Phản hồi từ Host</h4>
                                            {hasReply && reply ? (
                                                <>
                                                    <div className="rev-page-review-detail-reply">
                                                        {reply.Comment ||
                                                            reply.comment}
                                                    </div>
                                                    <div className="rev-page-review-detail-reply-date">
                                                        Đã phản hồi:{" "}
                                                        {formatDate(
                                                            reply.CreatedDate ||
                                                                reply.createdDate
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginTop: "1rem",
                                                        }}
                                                    >
                                                        <textarea
                                                            className="rev-page-review-reply-textarea"
                                                            placeholder="Nhập phản hồi của bạn..."
                                                            value={replyText}
                                                            onChange={(e) =>
                                                                setReplyText(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            rows="4"
                                                        />
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: "0.5rem",
                                                                marginTop:
                                                                    "0.5rem",
                                                            }}
                                                        >
                                                            <button
                                                                className="rev-page-review-submit-reply-btn"
                                                                onClick={
                                                                    handleSubmitReply
                                                                }
                                                                disabled={
                                                                    isSubmittingReply
                                                                }
                                                            >
                                                                {isSubmittingReply
                                                                    ? "Đang lưu..."
                                                                    : "Cập nhật phản hồi"}
                                                            </button>
                                                            <button
                                                                className="rev-page-review-delete-reply-btn"
                                                                onClick={
                                                                    handleDeleteReply
                                                                }
                                                                disabled={
                                                                    isSubmittingReply
                                                                }
                                                            >
                                                                {isSubmittingReply
                                                                    ? "Đang xóa..."
                                                                    : "Xóa phản hồi"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <textarea
                                                        className="rev-page-review-reply-textarea"
                                                        placeholder="Nhập phản hồi của bạn..."
                                                        value={replyText}
                                                        onChange={(e) =>
                                                            setReplyText(
                                                                e.target.value
                                                            )
                                                        }
                                                        rows="4"
                                                    />
                                                    <button
                                                        className="rev-page-review-submit-reply-btn"
                                                        onClick={
                                                            handleSubmitReply
                                                        }
                                                        disabled={
                                                            isSubmittingReply
                                                        }
                                                    >
                                                        {isSubmittingReply
                                                            ? "Đang gửi..."
                                                            : "Gửi phản hồi"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManager;





