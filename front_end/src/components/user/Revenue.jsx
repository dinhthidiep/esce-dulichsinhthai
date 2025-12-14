import "./Revenue.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HostHeader from "~/components/user/HostHeader";
import { getAllBookings } from "~/api/user/BookingApi";
// import { getPaymentsByHostId } from '~/api/user/PaymentApi'; // Not needed - payments are extracted from bookings
import { getMyServiceCombos } from "~/api/user/ServiceComboApi";
import { getAllReviews } from "~/api/user/ReviewApi";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const Revenue = ({ embedded = false }) => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [serviceCombos, setServiceCombos] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [fromDate, setFromDate] = useState(() => {
        return new Date().toISOString().split("T")[0]; // Current system date
    });
    const [toDate, setToDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [comboSortBy, setComboSortBy] = useState("rating"); // 'rating' or 'revenue'
    const [chartViewBy, setChartViewBy] = useState("month"); // 'month' or 'year'
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }); // Format: YYYY-MM
    const [selectedYear, setSelectedYear] = useState(() => {
        return new Date().getFullYear().toString();
    }); // Format: YYYY
    const navigate = useNavigate();

    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    // Helper function to get roleId
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

    // Load bookings and payments
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

        const loadData = async () => {
            try {
                const currentUserId = userInfo.Id || userInfo.id;

                // Load all bookings
                const allBookings = await getAllBookings();
                const bookingsArray = Array.isArray(allBookings)
                    ? allBookings
                    : [];

                // Filter bookings for this host
                const hostBookings = bookingsArray.filter((booking) => {
                    const serviceCombo =
                        booking.ServiceCombo || booking.serviceCombo;
                    if (!serviceCombo) return false;
                    const hostId = serviceCombo.HostId || serviceCombo.hostId;
                    return hostId === currentUserId;
                });

                setBookings(hostBookings);

                // Extract payments from bookings (since payments are linked to bookings)
                // Also create payment objects from booking data if payments aren't included
                const hostPayments = [];
                hostBookings.forEach((booking) => {
                    const bookingPayments =
                        booking.Payments || booking.payments || [];
                    if (
                        Array.isArray(bookingPayments) &&
                        bookingPayments.length > 0
                    ) {
                        // If payments are included in the booking response
                        hostPayments.push(...bookingPayments);
                    } else {
                        // If payments aren't included, create a payment object from booking data
                        // This handles cases where the backend doesn't include Payments navigation property
                        const bookingId = booking.Id || booking.id;
                        const bookingTotal =
                            booking.TotalAmount || booking.totalAmount || 0;
                        const bookingStatus = (
                            booking.Status ||
                            booking.status ||
                            ""
                        ).toLowerCase();

                        // Only create payment for confirmed/completed bookings
                        if (
                            bookingStatus === "confirmed" ||
                            bookingStatus === "completed"
                        ) {
                            hostPayments.push({
                                Id: bookingId, // Use booking ID as payment ID placeholder
                                BookingId: bookingId,
                                Amount: bookingTotal,
                                PaymentDate:
                                    booking.ConfirmedDate ||
                                    booking.confirmedDate ||
                                    booking.CreatedAt ||
                                    booking.createdAt ||
                                    booking.BookingDate ||
                                    booking.bookingDate,
                                Status: "success", // Assume successful if booking is confirmed/completed
                                Method: "booking",
                                CreatedAt:
                                    booking.CreatedAt ||
                                    booking.createdAt ||
                                    booking.BookingDate ||
                                    booking.bookingDate,
                            });
                        }
                    }
                });
                setPayments(hostPayments);

                // Load service combos for this host
                const hostServiceCombos = await getMyServiceCombos();
                setServiceCombos(hostServiceCombos);

                // Load all reviews to calculate average ratings
                const allReviews = await getAllReviews();
                const reviewsArray = Array.isArray(allReviews)
                    ? allReviews
                    : [];
                setReviews(reviewsArray);
            } catch (err) {
                console.error("Error loading data:", err);
                // If authentication error, redirect to login
                if (err.message && err.message.includes("Authentication")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userInfo");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("userInfo");
                    window.location.href = "/login";
                    return;
                }
            }
        };

        if (userInfo) {
            loadData();
        }
    }, [userInfo]);

    // Calculate booking statistics
    const totalBookings = bookings.length;
    const acceptedBookings = bookings.filter((b) => {
        const status = (b.Status || b.status || "").toLowerCase();
        return status === "confirmed" || status === "completed";
    }).length;
    const rejectedBookings = bookings.filter((b) => {
        const status = (b.Status || b.status || "").toLowerCase();
        return status === "cancelled";
    }).length;
    const pendingBookings = bookings.filter((b) => {
        const status = (b.Status || b.status || "").toLowerCase();
        return status === "pending";
    }).length;

    // Filter successful payments
    const successfulPayments = payments.filter((p) => {
        const status = (p.Status || p.status || "").toLowerCase();
        return status === "success";
    });

    // Filter and group payments based on chartViewBy
    let paymentsForChart = [];
    let chartLabels = [];
    let chartData = [];

    if (chartViewBy === "month") {
        // Filter payments for selected month
        const [year, month] = selectedMonth.split("-").map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        paymentsForChart = successfulPayments.filter((payment) => {
            const date =
                payment.PaymentDate ||
                payment.paymentDate ||
                payment.CreatedAt ||
                payment.createdAt;
            if (!date) return false;
            const paymentDate = new Date(date);
            return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
        });

        // Group by day in the month
        const paymentsByDay = {};
        const daysInMonth = endOfMonth.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            paymentsByDay[dateKey] = 0;
        }

        paymentsForChart.forEach((payment) => {
            const date =
                payment.PaymentDate ||
                payment.paymentDate ||
                payment.CreatedAt ||
                payment.createdAt;
            if (!date) return;
            const paymentDate = new Date(date);
            const dateKey = paymentDate.toISOString().split("T")[0];

            if (paymentsByDay[dateKey] !== undefined) {
                const amount = payment.Amount || payment.amount || 0;
                paymentsByDay[dateKey] += Number(amount);
            }
        });

        // Create labels and data for each day
        chartLabels = Object.keys(paymentsByDay).map((dateKey) => {
            const d = new Date(dateKey);
            return d.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            });
        });

        chartData = Object.values(paymentsByDay);
    } else {
        // Filter payments for selected year
        const year = Number(selectedYear);
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        paymentsForChart = successfulPayments.filter((payment) => {
            const date =
                payment.PaymentDate ||
                payment.paymentDate ||
                payment.CreatedAt ||
                payment.createdAt;
            if (!date) return false;
            const paymentDate = new Date(date);
            return paymentDate >= startOfYear && paymentDate <= endOfYear;
        });

        // Group by month in the year
        const paymentsByMonth = {};

        for (let month = 0; month < 12; month++) {
            paymentsByMonth[month] = 0;
        }

        paymentsForChart.forEach((payment) => {
            const date =
                payment.PaymentDate ||
                payment.paymentDate ||
                payment.CreatedAt ||
                payment.createdAt;
            if (!date) return;
            const paymentDate = new Date(date);
            const month = paymentDate.getMonth();

            const amount = payment.Amount || payment.amount || 0;
            paymentsByMonth[month] += Number(amount);
        });

        // Create labels and data for each month
        const monthNames = [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
        ];
        chartLabels = monthNames;
        chartData = Object.values(paymentsByMonth);
    }

    // Calculate total revenue for filtered payments
    const totalRevenue = paymentsForChart.reduce((sum, payment) => {
        const amount = payment.Amount || payment.amount || 0;
        return sum + Number(amount);
    }, 0);

    // Get current user ID for filtering
    const currentUserId = userInfo?.Id || userInfo?.id || userInfo?.ID || null;

    // Calculate average ratings and total revenue for each service combo
    const combosWithRatings = serviceCombos.map((combo) => {
        const comboId = combo.Id || combo.id;

        // Get reviews for this combo
        // Reviews are linked to Bookings, and Bookings are linked to ServiceCombos
        // Backend includes: review.Booking.ServiceCombo
        const comboReviews = reviews.filter((review) => {
            // Get the booking from the review
            const reviewBooking = review.Booking || review.booking;
            if (!reviewBooking) return false;

            // Verify this booking belongs to the current host
            // Get the service combo from the booking
            const bookingCombo =
                reviewBooking.ServiceCombo || reviewBooking.serviceCombo;
            if (bookingCombo) {
                const bookingHostId =
                    bookingCombo.HostId || bookingCombo.hostId;
                // Only include reviews for bookings that belong to the current host
                if (currentUserId && bookingHostId !== currentUserId) {
                    return false;
                }
            }

            // Try to get ServiceComboId from the booking (direct property)
            const bookingComboId =
                reviewBooking.ServiceComboId || reviewBooking.serviceComboId;

            // If ServiceComboId matches, check rating
            if (bookingComboId === comboId) {
                const rating = review.Rating ?? review.rating;
                // Include all reviews with rating (including 0)
                return rating != null;
            }

            // Fallback: try to get ServiceCombo from the booking (navigation property)
            if (bookingCombo) {
                const comboIdFromNav = bookingCombo.Id || bookingCombo.id;
                if (comboIdFromNav === comboId) {
                    const rating = review.Rating ?? review.rating;
                    return rating != null;
                }
            }

            return false;
        });

        // Calculate average rating (include 0 ratings)
        const totalRating = comboReviews.reduce((sum, review) => {
            const rating = review.Rating ?? review.rating ?? 0;
            return sum + Number(rating);
        }, 0);

        const averageRating =
            comboReviews.length > 0
                ? (totalRating / comboReviews.length).toFixed(1)
                : 0;

        // Calculate total revenue for this combo from successful bookings
        // Filter by date range and view type (month/year)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const comboBookings = bookings.filter((booking) => {
            const bookingCombo = booking.ServiceCombo || booking.serviceCombo;
            const bookingComboId = bookingCombo?.Id || bookingCombo?.id;
            const status = (
                booking.Status ||
                booking.status ||
                ""
            ).toLowerCase();

            if (
                bookingComboId !== comboId ||
                (status !== "confirmed" && status !== "completed")
            ) {
                return false;
            }

            // Filter by date based on chartViewBy
            const bookingDate =
                booking.CreatedAt ||
                booking.createdAt ||
                booking.BookingDate ||
                booking.bookingDate;
            if (!bookingDate) return false;

            const bookingDateObj = new Date(bookingDate);
            if (chartViewBy === "month") {
                // Filter by current month
                return (
                    bookingDateObj.getMonth() + 1 === currentMonth &&
                    bookingDateObj.getFullYear() === currentYear
                );
            } else {
                // Filter by current year
                return bookingDateObj.getFullYear() === currentYear;
            }
        });

        // Calculate revenue for these bookings
        // Use booking TotalAmount if payments aren't available, otherwise use payment amounts
        const comboRevenue = comboBookings.reduce((sum, booking) => {
            const bookingId = booking.Id || booking.id;
            const bookingPayments = successfulPayments.filter((payment) => {
                const paymentBookingId = payment.BookingId || payment.bookingId;
                return paymentBookingId === bookingId;
            });

            if (bookingPayments.length > 0) {
                // Use payment amounts if available
                const bookingTotal = bookingPayments.reduce(
                    (paymentSum, payment) => {
                        const amount = payment.Amount || payment.amount || 0;
                        return paymentSum + Number(amount);
                    },
                    0
                );
                return sum + bookingTotal;
            } else {
                // Fallback to booking TotalAmount if no payments found
                const bookingTotal =
                    booking.TotalAmount || booking.totalAmount || 0;
                return sum + Number(bookingTotal);
            }
        }, 0);

        return {
            ...combo,
            averageRating: parseFloat(averageRating),
            reviewCount: comboReviews.length,
            totalRevenue: comboRevenue,
        };
    });

    // Get top 3 service combos by selected filter (rating or revenue)
    const top3Combos = combosWithRatings
        .filter((combo) => {
            if (comboSortBy === "rating") {
                return combo.reviewCount > 0; // Must have at least one review for rating sort
            } else {
                // For revenue sort, include combos with revenue > 0 OR at least one review
                return combo.totalRevenue > 0 || combo.reviewCount > 0;
            }
        })
        .sort((a, b) => {
            if (comboSortBy === "rating") {
                // Sort by rating, then by review count as tiebreaker
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating;
                }
                return b.reviewCount - a.reviewCount;
            } else {
                // Sort by revenue, then by rating as tiebreaker
                if (b.totalRevenue !== a.totalRevenue) {
                    return b.totalRevenue - a.totalRevenue;
                }
                return b.averageRating - a.averageRating;
            }
        })
        .slice(0, 3);

    // Helper function to get image URL
    const getComboImageUrl = (combo) => {
        // Backend is running on HTTP port 5002
        const backend_url = "http://localhost:5002";
        const DEFAULT_IMAGE_URL =
            "https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1";

        const imageName = combo.ImageUrl || combo.Image || combo.image || "";

        if (!imageName || imageName.trim() === "") {
            return DEFAULT_IMAGE_URL;
        }

        // If it's already a full URL (Firebase or http/https)
        if (
            imageName.startsWith("http://") ||
            imageName.startsWith("https://") ||
            imageName.startsWith("data:image")
        ) {
            return imageName;
        }

        // Try backend image endpoints
        return `${backend_url}/images/${imageName}`;
    };

    // Chart configuration
    const chartConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: "Doanh thu (VNĐ)",
                data: chartData,
                borderColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return "rgb(46, 125, 50)";
                    }
                    const gradient = ctx.createLinearGradient(
                        0,
                        chartArea.top,
                        0,
                        chartArea.bottom
                    );
                    gradient.addColorStop(0, "rgb(46, 125, 50)"); // Green at top
                    gradient.addColorStop(0.7, "rgb(255, 152, 0)"); // Orange in middle
                    gradient.addColorStop(1, "rgb(198, 40, 40)"); // Red at bottom
                    return gradient;
                },
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return "rgba(46, 125, 50, 0.3)";
                    }
                    const gradient = ctx.createLinearGradient(
                        0,
                        chartArea.top,
                        0,
                        chartArea.bottom
                    );
                    gradient.addColorStop(0, "rgba(46, 125, 50, 0.7)"); // Green at top - more opaque
                    gradient.addColorStop(0.5, "rgba(255, 152, 0, 0.5)"); // Orange in middle - more opaque
                    gradient.addColorStop(1, "rgba(198, 40, 40, 0.7)"); // Red at bottom - more opaque
                    return gradient;
                },
                pointBackgroundColor: "rgb(75, 192, 192)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgb(75, 192, 192)",
                fill: true,
                tension: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text:
                    chartViewBy === "month"
                        ? `Doanh thu tháng ${new Date(selectedMonth + "-01").toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`
                        : `Doanh thu năm ${selectedYear}`,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(context.parsed.y);
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            notation: "compact",
                        }).format(value);
                    },
                },
            },
        },
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount == null) return "0 VNĐ";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
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
        <div className={embedded ? "" : "create-tour-page"}>
            {!embedded && (
                <>
                    {/* Sidebar Navigation */}
                    {/* <Sidebar 
            sidebarActive={sidebarActive} 
            userInfo={userInfo}
          /> */}

                    {/* Header */}
                    <HostHeader />

                    {/* Page Title */}
                    <section className="content-title-display-box">
                        <div className="content-title-display-name">
                            <h2>Doanh thu</h2>
                        </div>
                    </section>
                </>
            )}

            {/* Main Content */}
            <main
                className={
                    embedded ? "" : `rev-page-content ${sidebarActive ? "shift" : ""}`
                }
                role="main"
            >
                <div className="rev-page-form-content rev-page-revenue-content">
                    {/* Booking Statistics */}
                    <div className="rev-page-revenue-stats-section">
                        <h3 className="rev-page-revenue-section-title">
                            Thống kê booking
                        </h3>
                        <div className="rev-page-revenue-stats-grid">
                            <div className="rev-page-revenue-stat-card">
                                <div className="rev-page-revenue-stat-label">
                                    Tổng số booking
                                </div>
                                <div className="rev-page-revenue-stat-value">
                                    {totalBookings}
                                </div>
                            </div>
                            <div className="rev-page-revenue-stat-card">
                                <div className="rev-page-revenue-stat-label">
                                    Đã chấp nhận
                                </div>
                                <div className="rev-page-revenue-stat-value rev-page-revenue-stat-accepted">
                                    {acceptedBookings}
                                </div>
                            </div>
                            <div className="rev-page-revenue-stat-card">
                                <div className="rev-page-revenue-stat-label">
                                    Đã từ chối
                                </div>
                                <div className="rev-page-revenue-stat-value rev-page-revenue-stat-rejected">
                                    {rejectedBookings}
                                </div>
                            </div>
                            <div className="rev-page-revenue-stat-card">
                                <div className="rev-page-revenue-stat-label">
                                    Đang chờ
                                </div>
                                <div className="rev-page-revenue-stat-value rev-page-revenue-stat-pending">
                                    {pendingBookings}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Chart Section */}
                    <div className="rev-page-revenue-chart-section">
                        <h3 className="rev-page-revenue-section-title">Doanh thu</h3>
                        <div className="rev-page-revenue-chart-container">
                            {/* Chart View Filter */}
                            <div className="rev-page-revenue-date-filter">
                                <div className="rev-page-revenue-date-filter-group">
                                    <label
                                        htmlFor="chart-view-by"
                                        className="rev-page-revenue-filter-label"
                                    >
                                        Xem theo:
                                    </label>
                                    <select
                                        id="chart-view-by"
                                        className="rev-page-revenue-filter-select"
                                        value={chartViewBy}
                                        onChange={(e) => {
                                            setChartViewBy(e.target.value);
                                            // Reset to current month/year when switching
                                            if (e.target.value === "month") {
                                                const now = new Date();
                                                setSelectedMonth(
                                                    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
                                                );
                                            } else {
                                                setSelectedYear(
                                                    new Date()
                                                        .getFullYear()
                                                        .toString()
                                                );
                                            }
                                        }}
                                    >
                                        <option value="month">
                                            Theo tháng
                                        </option>
                                        <option value="year">Theo năm</option>
                                    </select>
                                </div>
                                {chartViewBy === "month" ? (
                                    <div className="rev-page-revenue-date-filter-group">
                                        <label
                                            htmlFor="selected-month"
                                            className="rev-page-revenue-filter-label"
                                        >
                                            Chọn tháng:
                                        </label>
                                        <input
                                            type="month"
                                            id="selected-month"
                                            className="rev-page-revenue-filter-date"
                                            value={selectedMonth}
                                            onChange={(e) =>
                                                setSelectedMonth(e.target.value)
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div className="rev-page-revenue-date-filter-group">
                                        <label
                                            htmlFor="selected-year"
                                            className="rev-page-revenue-filter-label"
                                        >
                                            Chọn năm:
                                        </label>
                                        <input
                                            type="number"
                                            id="selected-year"
                                            className="rev-page-revenue-filter-date"
                                            min="2020"
                                            max={new Date().getFullYear()}
                                            value={selectedYear}
                                            onChange={(e) =>
                                                setSelectedYear(e.target.value)
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="rev-page-revenue-chart-wrapper">
                                <Line
                                    key={`chart-${chartViewBy}-${chartViewBy === "month" ? selectedMonth : selectedYear}`}
                                    data={chartConfig}
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Top Service Combos Section */}
                    <div className="rev-page-revenue-top-combos-section">
                        <div className="rev-page-revenue-section-header">
                            <h3 className="rev-page-revenue-section-title">
                                Combo dịch vụ hot nhất
                            </h3>
                            <div className="rev-page-revenue-combo-filters">
                                <div className="rev-page-revenue-combo-filter">
                                    <label
                                        htmlFor="combo-sort-filter"
                                        className="rev-page-revenue-filter-label"
                                    >
                                        Sắp xếp theo:
                                    </label>
                                    <select
                                        id="combo-sort-filter"
                                        className="rev-page-revenue-filter-select"
                                        value={comboSortBy}
                                        onChange={(e) =>
                                            setComboSortBy(e.target.value)
                                        }
                                    >
                                        <option value="rating">Đánh giá</option>
                                        <option value="revenue">
                                            Doanh thu
                                        </option>
                                    </select>
                                </div>
                                <div className="rev-page-revenue-combo-filter">
                                    <label
                                        htmlFor="combo-view-by"
                                        className="rev-page-revenue-filter-label"
                                    >
                                        Xem theo:
                                    </label>
                                    <select
                                        id="combo-view-by"
                                        className="rev-page-revenue-filter-select"
                                        value={chartViewBy}
                                        onChange={(e) =>
                                            setChartViewBy(e.target.value)
                                        }
                                    >
                                        <option value="month">
                                            Theo tháng
                                        </option>
                                        <option value="year">Theo năm</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="rev-page-revenue-combos-grid">
                            {top3Combos.length > 0 ? (
                                top3Combos.map((combo, index) => {
                                    const comboName =
                                        combo.Name || combo.name || "N/A";
                                    const comboImage = getComboImageUrl(combo);
                                    const ranking = index + 1;

                                    return (
                                        <div
                                            key={combo.Id || combo.id || index}
                                            className="rev-page-revenue-combo-card"
                                        >
                                            <div className="rev-page-revenue-combo-content">
                                                <div
                                                    className={`rev-page-revenue-combo-ranking revenue-ranking-${ranking}`}
                                                >
                                                    {ranking}
                                                </div>
                                                <img
                                                    src={comboImage}
                                                    alt={comboName}
                                                    className="rev-page-revenue-combo-image"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1";
                                                    }}
                                                />
                                                <div className="rev-page-revenue-combo-info">
                                                    <div className="rev-page-revenue-combo-name">
                                                        {comboName}
                                                    </div>
                                                    <div className="rev-page-revenue-combo-revenue">
                                                        {formatCurrency(
                                                            combo.totalRevenue ||
                                                                0
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="rev-page-revenue-combo-rating">
                                                    <span className="rev-page-revenue-rating-value">
                                                        {combo.averageRating}/5
                                                    </span>
                                                    <span className="rev-page-revenue-rating-count">
                                                        {combo.reviewCount} đánh
                                                        giá
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rev-page-revenue-no-combos">
                                    Chưa có combo dịch vụ nào có đánh giá
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Revenue;





