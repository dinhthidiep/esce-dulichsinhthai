// import './Revenue.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { getCurrentUser } from '../API/SocialMediaApi';
import { getAllBookings } from '../API/BookingApi';
import { getPaymentsByHostId } from '../API/PaymentApi';
import { getMyServiceCombos } from '../API/ServiceComboApi';
import { getAllReviews } from '../API/ReviewApi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

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

const Revenue = () => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Current system date
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [comboSortBy, setComboSortBy] = useState('rating'); // 'rating' or 'revenue'
  const [chartViewBy, setChartViewBy] = useState('month'); // 'month' or 'year'
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  // Helper function to get roleId
  const getRoleId = (user) => {
    if (!user) return null;
    const roleId = user.RoleId ?? user.roleId;
    if (roleId === undefined || roleId === null) return null;
    return Number(roleId);
  };

  // Load user info and check role
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const storedUserInfo = localStorage.getItem('userInfo');
        let storedUser = null;
        if (storedUserInfo) {
          try {
            storedUser = JSON.parse(storedUserInfo);
            setUserInfo(storedUser);
            
            const roleId = getRoleId(storedUser);
            if (roleId !== 2) {
              alert('Bạn không có quyền truy cập trang này. Chỉ Host mới có thể xem doanh thu.');
              navigate('/');
              return;
            }
          } catch (err) {
            console.error('Error parsing user info:', err);
          }
        }

        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUserInfo(currentUser);
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            const roleId = getRoleId(currentUser);
            if (roleId !== 2) {
              alert('Bạn không có quyền truy cập trang này. Chỉ Host mới có thể xem doanh thu.');
              navigate('/');
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching current user:', err);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserInfo();
  }, [navigate]);

  // Load bookings and payments
  useEffect(() => {
    const loadData = async () => {
      if (!userInfo) return;
      
      try {
        const currentUserId = userInfo.Id || userInfo.id;
        
        // Load all bookings
        const allBookings = await getAllBookings();
        const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
        
        // Filter bookings for this host
        const hostBookings = bookingsArray.filter(booking => {
          const serviceCombo = booking.ServiceCombo || booking.serviceCombo;
          if (!serviceCombo) return false;
          const hostId = serviceCombo.HostId || serviceCombo.hostId;
          return hostId === currentUserId;
        });
        
        setBookings(hostBookings);
        
        // Load payments for this host
        const hostPayments = await getPaymentsByHostId(currentUserId);
        const paymentsArray = Array.isArray(hostPayments) ? hostPayments : [];
        setPayments(paymentsArray);
        
        // Load service combos for this host
        const hostServiceCombos = await getMyServiceCombos();
        setServiceCombos(hostServiceCombos);
        
        // Load all reviews to calculate average ratings
        const allReviews = await getAllReviews();
        const reviewsArray = Array.isArray(allReviews) ? allReviews : [];
        setReviews(reviewsArray);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    
    if (userInfo) {
      loadData();
    }
  }, [userInfo]);

  // Calculate booking statistics
  const totalBookings = bookings.length;
  const acceptedBookings = bookings.filter(b => {
    const status = (b.Status || b.status || '').toLowerCase();
    return status === 'confirmed';
  }).length;
  const rejectedBookings = bookings.filter(b => {
    const status = (b.Status || b.status || '').toLowerCase();
    return status === 'cancelled';
  }).length;
  const pendingBookings = bookings.filter(b => {
    const status = (b.Status || b.status || '').toLowerCase();
    return status === 'pending';
  }).length;

  // Filter successful payments
  const successfulPayments = payments.filter(p => {
    const status = (p.Status || p.status || '').toLowerCase();
    return status === 'success';
  });

  // Filter payments by date range
  const paymentsForDateRange = successfulPayments.filter(payment => {
    const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
    if (!date) return false;
    const paymentDate = new Date(date).toISOString().split('T')[0];
    return paymentDate >= fromDate && paymentDate <= toDate;
  });

  // Calculate total revenue for date range
  const totalRevenue = paymentsForDateRange.reduce((sum, payment) => {
    const amount = payment.Amount || payment.amount || 0;
    return sum + Number(amount);
  }, 0);

  // Group payments by date for the chart
  const paymentsByDate = {};
  paymentsForDateRange.forEach(payment => {
    const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
    if (!date) return;
    
    const paymentDate = new Date(date);
    const dateKey = paymentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!paymentsByDate[dateKey]) {
      paymentsByDate[dateKey] = 0;
    }
    
    const amount = payment.Amount || payment.amount || 0;
    paymentsByDate[dateKey] += Number(amount);
  });

  // Create chart data - get all dates in range and sort them
  // If no payments, create a simple chart with just the date range endpoints
  const allDates = Object.keys(paymentsByDate).sort();
  let chartLabels, chartData;
  
  if (allDates.length > 0) {
    chartLabels = allDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });
    chartData = allDates.map(date => paymentsByDate[date] || 0);
  } else {
    // If no data, show empty chart with date range
    chartLabels = [
      new Date(fromDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      new Date(toDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    ];
    chartData = [0, 0];
  }
  
  // Calculate average ratings and total revenue for each service combo
  const combosWithRatings = serviceCombos.map(combo => {
    const comboId = combo.Id || combo.id;
    
    // Get reviews for this combo (include all reviews, even with rating 0)
    const comboReviews = reviews.filter(review => {
      const reviewCombo = review.ServiceCombo || review.serviceCombo;
      const reviewComboId = reviewCombo?.Id || reviewCombo?.id;
      const rating = review.Rating ?? review.rating;
      // Include all reviews with rating (including 0)
      return reviewComboId === comboId && rating != null;
    });
    
    // Calculate average rating (include 0 ratings)
    const totalRating = comboReviews.reduce((sum, review) => {
      const rating = review.Rating ?? review.rating ?? 0;
      return sum + Number(rating);
    }, 0);
    
    const averageRating = comboReviews.length > 0 ? (totalRating / comboReviews.length).toFixed(1) : 0;
    
    // Calculate total revenue for this combo from successful bookings
    // Filter by date range and view type (month/year)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const comboBookings = bookings.filter(booking => {
      const bookingCombo = booking.ServiceCombo || booking.serviceCombo;
      const bookingComboId = bookingCombo?.Id || bookingCombo?.id;
      const status = (booking.Status || booking.status || '').toLowerCase();
      
      if (bookingComboId !== comboId || status !== 'confirmed') {
        return false;
      }
      
      // Filter by date based on chartViewBy
      const bookingDate = booking.CreatedAt || booking.createdAt || booking.BookingDate || booking.bookingDate;
      if (!bookingDate) return false;
      
      const bookingDateObj = new Date(bookingDate);
      if (chartViewBy === 'month') {
        // Filter by current month
        return bookingDateObj.getMonth() + 1 === currentMonth && 
               bookingDateObj.getFullYear() === currentYear;
      } else {
        // Filter by current year
        return bookingDateObj.getFullYear() === currentYear;
      }
    });
    
    // Get payments for these bookings
    const comboRevenue = comboBookings.reduce((sum, booking) => {
      const bookingId = booking.Id || booking.id;
      const bookingPayments = successfulPayments.filter(payment => {
        const paymentBookingId = payment.BookingId || payment.bookingId;
        return paymentBookingId === bookingId;
      });
      
      const bookingTotal = bookingPayments.reduce((paymentSum, payment) => {
        const amount = payment.Amount || payment.amount || 0;
        return paymentSum + Number(amount);
      }, 0);
      
      return sum + bookingTotal;
    }, 0);
    
    return {
      ...combo,
      averageRating: parseFloat(averageRating),
      reviewCount: comboReviews.length,
      totalRevenue: comboRevenue
    };
  });
  
  // Get top 3 service combos by selected filter (rating or revenue)
  const top3Combos = combosWithRatings
    .filter(combo => {
      if (comboSortBy === 'rating') {
        return combo.reviewCount > 0; // Must have at least one review for rating sort
      } else {
        return true; // For revenue sort, include all combos
      }
    })
    .sort((a, b) => {
      if (comboSortBy === 'rating') {
        return b.averageRating - a.averageRating;
      } else {
        return b.totalRevenue - a.totalRevenue;
      }
    })
    .slice(0, 3);
  
  // Helper function to get image URL
  const getComboImageUrl = (combo) => {
    // Dùng cùng domain với API deploy
    const backend_url = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;
    const DEFAULT_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1';
    
    const imageName = combo.ImageUrl || combo.Image || combo.image || '';
    
    if (!imageName || imageName.trim() === '') {
      return DEFAULT_IMAGE_URL;
    }
    
    // If it's already a full URL (Firebase or http/https)
    if (imageName.startsWith('http://') || imageName.startsWith('https://') || imageName.startsWith('data:image')) {
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
        label: 'Doanh thu (VNĐ)',
        data: chartData,
        borderColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgb(46, 125, 50)';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgb(46, 125, 50)'); // Green at top
          gradient.addColorStop(0.7, 'rgb(255, 152, 0)'); // Orange in middle
          gradient.addColorStop(1, 'rgb(198, 40, 40)'); // Red at bottom
          return gradient;
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgba(46, 125, 50, 0.2)';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(46, 125, 50, 0.6)'); // Green at top
          gradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.4)'); // Orange in middle
          gradient.addColorStop(1, 'rgba(198, 40, 40, 0.6)'); // Red at bottom
          return gradient;
        },
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(75, 192, 192)',
        fill: true,
        tension: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Doanh thu từ ${new Date(fromDate).toLocaleDateString('vi-VN')} đến ${new Date(toDate).toLocaleDateString('vi-VN')}`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              notation: 'compact'
            }).format(value);
          }
        }
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount == null) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Don't render if still loading or user doesn't have permission
  if (loading) {
    return (
      <div className="create-tour-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
      </div>
    );
  }

  // Check permission before rendering
  const roleId = getRoleId(userInfo);
  if (!userInfo || roleId !== 2) {
    return (
      <div className="create-tour-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Không có quyền truy cập</h2>
          <p>Chỉ Host mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-tour-page">
      {/* Sidebar Navigation */}
      <Sidebar 
        sidebarActive={sidebarActive} 
        userInfo={userInfo}
      />

      {/* Header */}
      <Header 
        showMenuButton={true}
        onMenuToggle={toggleSidebar}
        sidebarActive={sidebarActive}
      />

      {/* Page Title */}
      <section className="content-title-display-box">
        <div className="content-title-display-name">
          <h2>Doanh thu</h2>
        </div>
      </section>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content revenue-content">
          {/* Booking Statistics */}
          <div className="revenue-stats-section">
            <h3 className="revenue-section-title">Thống kê booking</h3>
            <div className="revenue-stats-grid">
              <div className="revenue-stat-card">
                <div className="revenue-stat-label">Tổng số booking</div>
                <div className="revenue-stat-value">{totalBookings}</div>
              </div>
              <div className="revenue-stat-card">
                <div className="revenue-stat-label">Đã chấp nhận</div>
                <div className="revenue-stat-value revenue-stat-accepted">{acceptedBookings}</div>
              </div>
              <div className="revenue-stat-card">
                <div className="revenue-stat-label">Đã từ chối</div>
                <div className="revenue-stat-value revenue-stat-rejected">{rejectedBookings}</div>
              </div>
              <div className="revenue-stat-card">
                <div className="revenue-stat-label">Đang chờ</div>
                <div className="revenue-stat-value revenue-stat-pending">{pendingBookings}</div>
              </div>
            </div>
          </div>

          {/* Revenue Chart Section */}
          <div className="revenue-chart-section">
            <h3 className="revenue-section-title">Doanh thu</h3>
            <div className="revenue-chart-container">
              {/* Date Range Filter */}
              <div className="revenue-date-filter">
                <div className="revenue-date-filter-group">
                  <label htmlFor="from-date" className="revenue-filter-label">Từ ngày:</label>
                  <input
                    type="date"
                    id="from-date"
                    className="revenue-filter-date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="revenue-date-filter-group">
                  <label htmlFor="to-date" className="revenue-filter-label">Đến ngày:</label>
                  <input
                    type="date"
                    id="to-date"
                    className="revenue-filter-date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="revenue-date-filter-group">
                  <label htmlFor="chart-view-by" className="revenue-filter-label">Xem theo:</label>
                  <select
                    id="chart-view-by"
                    className="revenue-filter-select"
                    value={chartViewBy}
                    onChange={(e) => setChartViewBy(e.target.value)}
                  >
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </div>
              </div>
              <div className="revenue-chart-wrapper">
                <Line data={chartConfig} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Top Service Combos Section */}
          <div className="revenue-top-combos-section">
            <div className="revenue-section-header">
              <h3 className="revenue-section-title">Combo dịch vụ hot nhất</h3>
              <div className="revenue-combo-filters">
                <div className="revenue-combo-filter">
                  <label htmlFor="combo-sort-filter" className="revenue-filter-label">Sắp xếp theo:</label>
                  <select
                    id="combo-sort-filter"
                    className="revenue-filter-select"
                    value={comboSortBy}
                    onChange={(e) => setComboSortBy(e.target.value)}
                  >
                    <option value="rating">Đánh giá</option>
                    <option value="revenue">Doanh thu</option>
                  </select>
                </div>
                <div className="revenue-combo-filter">
                  <label htmlFor="combo-view-by" className="revenue-filter-label">Xem theo:</label>
                  <select
                    id="combo-view-by"
                    className="revenue-filter-select"
                    value={chartViewBy}
                    onChange={(e) => setChartViewBy(e.target.value)}
                  >
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="revenue-combos-grid">
              {top3Combos.length > 0 ? (
                top3Combos.map((combo, index) => {
                  const comboName = combo.Name || combo.name || 'N/A';
                  const comboImage = getComboImageUrl(combo);
                  const ranking = index + 1;
                  
                  return (
                    <div key={combo.Id || combo.id || index} className="revenue-combo-card">
                      <div className="revenue-combo-content">
                        <div className={`revenue-combo-ranking revenue-ranking-${ranking}`}>{ranking}</div>
                        <img 
                          src={comboImage} 
                          alt={comboName}
                          className="revenue-combo-image"
                          onError={(e) => { 
                            e.target.src = 'https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1';
                          }}
                        />
                        <div className="revenue-combo-info">
                          <div className="revenue-combo-name">{comboName}</div>
                          <div className="revenue-combo-revenue">{formatCurrency(combo.totalRevenue || 0)}</div>
                        </div>
                        <div className="revenue-combo-rating">
                          <span className="revenue-rating-value">{combo.averageRating}/5</span>
                          <span className="revenue-rating-count">{combo.reviewCount} đánh giá</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="revenue-no-combos">Chưa có combo dịch vụ nào có đánh giá</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Revenue;

