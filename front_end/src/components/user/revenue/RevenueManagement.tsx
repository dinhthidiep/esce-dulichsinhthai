import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import axiosInstance from '~/utils/axiosInstance';
import { API_ENDPOINTS } from '~/config/api';
import './RevenueManagement.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// ========== MOCK DATA - Đặt USE_MOCK_DATA = true để xem demo ==========
const USE_MOCK_DATA = true;

const MOCK_PAYMENTS = [
  // Tháng 12/2025
  { Id: 1, Status: 'success', Amount: 2500000, PaymentDate: '2025-12-01T10:00:00' },
  { Id: 2, Status: 'success', Amount: 3200000, PaymentDate: '2025-12-03T14:30:00' },
  { Id: 3, Status: 'success', Amount: 1800000, PaymentDate: '2025-12-05T09:15:00' },
  { Id: 4, Status: 'success', Amount: 4500000, PaymentDate: '2025-12-07T16:45:00' },
  { Id: 5, Status: 'success', Amount: 2100000, PaymentDate: '2025-12-10T11:20:00' },
  { Id: 6, Status: 'success', Amount: 5800000, PaymentDate: '2025-12-12T08:00:00' },
  { Id: 7, Status: 'success', Amount: 3600000, PaymentDate: '2025-12-14T13:30:00' },
  // Tháng 11/2025
  { Id: 8, Status: 'success', Amount: 2800000, PaymentDate: '2025-11-05T10:00:00' },
  { Id: 9, Status: 'success', Amount: 4200000, PaymentDate: '2025-11-12T14:30:00' },
  { Id: 10, Status: 'success', Amount: 3100000, PaymentDate: '2025-11-20T09:15:00' },
  { Id: 11, Status: 'success', Amount: 5500000, PaymentDate: '2025-11-25T16:45:00' },
  // Tháng 10/2025
  { Id: 12, Status: 'success', Amount: 3800000, PaymentDate: '2025-10-08T11:20:00' },
  { Id: 13, Status: 'success', Amount: 2900000, PaymentDate: '2025-10-15T08:00:00' },
  { Id: 14, Status: 'success', Amount: 4100000, PaymentDate: '2025-10-22T13:30:00' },
  // Tháng 9/2025
  { Id: 15, Status: 'success', Amount: 2200000, PaymentDate: '2025-09-10T10:00:00' },
  { Id: 16, Status: 'success', Amount: 3500000, PaymentDate: '2025-09-18T14:30:00' },
  // Tháng 8/2025
  { Id: 17, Status: 'success', Amount: 4800000, PaymentDate: '2025-08-05T09:15:00' },
  { Id: 18, Status: 'success', Amount: 2600000, PaymentDate: '2025-08-20T16:45:00' },
  // Tháng 7/2025
  { Id: 19, Status: 'success', Amount: 3300000, PaymentDate: '2025-07-12T11:20:00' },
  { Id: 20, Status: 'success', Amount: 5100000, PaymentDate: '2025-07-25T08:00:00' },
];
// ========== END MOCK DATA ==========

const RevenueManagement: React.FC<RevenueManagementProps> = ({ onSuccess, onError }) => {
  // Revenue states
  const [revenueSubTab, setRevenueSubTab] = useState('revenue'); // 'revenue' or 'statistics'
  const [payments, setPayments] = useState<any[]>([]);
  const [chartViewBy, setChartViewBy] = useState('month'); // 'month' or 'year'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return String(now.getMonth() + 1);
  }); // Format: 1-12
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    return now.getFullYear().toString();
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString();
  });

  // Get user ID helper
  const getUserId = useCallback(() => {
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const userId = userInfo.Id || userInfo.id;
        if (userId) {
          const parsedId = parseInt(userId);
          if (!isNaN(parsedId) && parsedId > 0) {
            return parsedId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }, []);

  // Load payments from API
  useEffect(() => {
    const loadPayments = async () => {
      // Sử dụng mock data nếu USE_MOCK_DATA = true
      if (USE_MOCK_DATA) {
        console.log('📊 [RevenueManagement] Using MOCK_PAYMENTS data');
        setPayments(MOCK_PAYMENTS);
        return;
      }

      try {
        const userId = getUserId();
        if (!userId) {
          setPayments([]);
          return;
        }

        // Get payments for host's bookings
        // First get host's service combos, then get bookings for those combos, then get payments
        const serviceCombosResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${userId}`);
        const serviceCombos = serviceCombosResponse.data || [];
        const comboIds = serviceCombos.map((c: any) => c.Id || c.id).filter((id: any) => id);
        
        // Get bookings for each service combo
        const allBookings: any[] = [];
        for (const comboId of comboIds) {
          try {
            const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/combo/${comboId}`);
            const comboBookings = bookingsResponse.data || [];
            allBookings.push(...comboBookings);
          } catch (err) {
            // Ignore 404 for combos without bookings
            if ((err as any)?.response?.status !== 404) {
              console.error(`Error loading bookings for combo ${comboId}:`, err);
            }
          }
        }
        
        const bookingIds = allBookings.map((b: any) => b.Id || b.id);

        // Get payments for each booking
        const hostPayments: any[] = [];
        for (const bookingId of bookingIds) {
          try {
            const paymentResponse = await axiosInstance.get(`${API_ENDPOINTS.PAYMENT}/status/${bookingId}`);
            const payment = paymentResponse.data;
            if (payment) {
              hostPayments.push(payment);
            }
          } catch (err) {
            // Ignore 404 for bookings without payments
            if ((err as any)?.response?.status !== 404) {
              console.error(`Error loading payment for booking ${bookingId}:`, err);
            }
          }
        }

        setPayments(hostPayments);
      } catch (err) {
        console.error('Error loading payments:', err);
        setPayments([]);
      }
    };

    loadPayments();
  }, [getUserId]);

  // Revenue chart calculations
  const revenueChartData = useMemo(() => {
    // Filter successful payments
    const successfulPayments = payments.filter(p => {
      const status = (p.Status || p.status || '').toLowerCase();
      return status === 'success';
    });

    // Filter and group payments based on chartViewBy
    let paymentsForChart = [];
    let chartLabels = [];
    let chartData = [];
    
    if (chartViewBy === 'month') {
      // Filter payments for selected month
      const year = Number(selectedMonthYear);
      const month = Number(selectedMonth);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      
      paymentsForChart = successfulPayments.filter(payment => {
        const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
        if (!date) return false;
        const paymentDate = new Date(date);
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      });
      
      // Group by day in the month
      const paymentsByDay = {};
      const daysInMonth = endOfMonth.getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        paymentsByDay[dateKey] = 0;
      }
      
      paymentsForChart.forEach(payment => {
        const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
        if (!date) return;
        const paymentDate = new Date(date);
        const dateKey = paymentDate.toISOString().split('T')[0];
        
        if (paymentsByDay[dateKey] !== undefined) {
          const amount = payment.Amount || payment.amount || 0;
          paymentsByDay[dateKey] += Number(amount);
        }
      });
      
      // Create labels and data for each day
      chartLabels = Object.keys(paymentsByDay).map(dateKey => {
        const d = new Date(dateKey);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      });
      
      chartData = Object.values(paymentsByDay);
      
    } else {
      // Filter payments for selected year
      const year = Number(selectedYear);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      
      paymentsForChart = successfulPayments.filter(payment => {
        const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
        if (!date) return false;
        const paymentDate = new Date(date);
        return paymentDate >= startOfYear && paymentDate <= endOfYear;
      });
      
      // Group by month in the year
      const paymentsByMonth = {};
      
      for (let month = 0; month < 12; month++) {
        paymentsByMonth[month] = 0;
      }
      
      paymentsForChart.forEach(payment => {
        const date = payment.PaymentDate || payment.paymentDate || payment.CreatedAt || payment.createdAt;
        if (!date) return;
        const paymentDate = new Date(date);
        const month = paymentDate.getMonth();
        
        const amount = payment.Amount || payment.amount || 0;
        paymentsByMonth[month] += Number(amount);
      });
      
      // Create labels and data for each month
      const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      chartLabels = monthNames;
      chartData = Object.values(paymentsByMonth);
    }

    // Calculate total revenue
    const totalRevenue = paymentsForChart.reduce((sum, payment) => {
      const amount = payment.Amount || payment.amount || 0;
      return sum + Number(amount);
    }, 0);

    return { chartLabels, chartData, totalRevenue };
  }, [payments, chartViewBy, selectedMonth, selectedMonthYear, selectedYear]);

  // Chart configuration
  const chartConfig = useMemo(() => ({
    labels: revenueChartData.chartLabels,
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: revenueChartData.chartData,
        borderColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgb(46, 125, 50)';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgb(46, 125, 50)');
          gradient.addColorStop(0.7, 'rgb(255, 152, 0)');
          gradient.addColorStop(1, 'rgb(198, 40, 40)');
          return gradient;
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgba(46, 125, 50, 0.3)';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(46, 125, 50, 0.7)');
          gradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(198, 40, 40, 0.7)');
          return gradient;
        },
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(75, 192, 192)',
        fill: 'origin',
        tension: 0.4,
        cubicInterpolationMode: 'monotone' as const,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }), [revenueChartData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            weight: '600' as const
          },
          color: '#1e293b',
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Doanh thu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#64748b',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#64748b',
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }), []);

  // Load bookings for statistics
  const [bookingsForStats, setBookingsForStats] = useState([]);

  useEffect(() => {
    const loadBookingsForStats = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          setBookingsForStats([]);
          return;
        }

        // Get bookings for host's service combos
        const serviceCombosResponse = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/host/${userId}`);
        const serviceCombos = serviceCombosResponse.data || [];
        const comboIds = serviceCombos.map((c: any) => c.Id || c.id).filter((id: any) => id);
        
        // Get bookings for each service combo
        const allBookings: any[] = [];
        for (const comboId of comboIds) {
          try {
            const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/combo/${comboId}`);
            const comboBookings = bookingsResponse.data || [];
            allBookings.push(...comboBookings);
          } catch (err) {
            // Ignore 404 for combos without bookings
            if ((err as any)?.response?.status !== 404) {
              console.error(`Error loading bookings for combo ${comboId}:`, err);
            }
          }
        }
        
        setBookingsForStats(allBookings);
      } catch (err) {
        console.error('Error loading bookings for stats:', err);
        setBookingsForStats([]);
      }
    };

    loadBookingsForStats();
  }, [getUserId]);

  return (
    <div className="revenue-mgr-revenue-management">
      {/* Revenue Sub-tabs */}
      <div className="service-view-toggle">
        <button
          className={`toggle-btn ${revenueSubTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setRevenueSubTab('revenue')}
        >
          Doanh thu
        </button>
        <button
          className={`toggle-btn ${revenueSubTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setRevenueSubTab('statistics')}
        >
          Số liệu thống kê
        </button>
      </div>
      
      {revenueSubTab === 'revenue' ? (
        <div className="revenue-mgr-revenue-content">
          {/* Revenue Chart Section */}
          <div className="revenue-mgr-revenue-chart-section">
            <div className="revenue-mgr-revenue-chart-container">
              {/* Chart View Filter */}
              <div className="revenue-mgr-revenue-date-filter">
                <div className="revenue-mgr-revenue-date-filter-group">
                  <label htmlFor="chart-view-by" className="revenue-mgr-revenue-filter-label">Xem theo</label>
                  <select
                    id="chart-view-by"
                    className="revenue-mgr-revenue-filter-select"
                    value={chartViewBy}
                    onChange={(e) => {
                      setChartViewBy(e.target.value);
                      // Reset to current month/year when switching
                      if (e.target.value === 'month') {
                        const now = new Date();
                        setSelectedMonth(String(now.getMonth() + 1));
                        setSelectedMonthYear(now.getFullYear().toString());
                      } else {
                        setSelectedYear(new Date().getFullYear().toString());
                      }
                    }}
                  >
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </div>
                {chartViewBy === 'month' ? (
                  <>
                    <div className="revenue-mgr-revenue-date-filter-group">
                      <label htmlFor="selected-month" className="revenue-mgr-revenue-filter-label">Tháng</label>
                      <select
                        id="selected-month"
                        className="revenue-mgr-revenue-filter-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="1">Tháng 1</option>
                        <option value="2">Tháng 2</option>
                        <option value="3">Tháng 3</option>
                        <option value="4">Tháng 4</option>
                        <option value="5">Tháng 5</option>
                        <option value="6">Tháng 6</option>
                        <option value="7">Tháng 7</option>
                        <option value="8">Tháng 8</option>
                        <option value="9">Tháng 9</option>
                        <option value="10">Tháng 10</option>
                        <option value="11">Tháng 11</option>
                        <option value="12">Tháng 12</option>
                      </select>
                    </div>
                    <div className="revenue-mgr-revenue-date-filter-group">
                      <label htmlFor="selected-month-year" className="revenue-mgr-revenue-filter-label">Năm</label>
                      <input
                        type="number"
                        id="selected-month-year"
                        className="revenue-mgr-revenue-filter-date"
                        min="2020"
                        max={new Date().getFullYear()}
                        value={selectedMonthYear}
                        onChange={(e) => setSelectedMonthYear(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="revenue-mgr-revenue-date-filter-group">
                    <label htmlFor="selected-year" className="revenue-mgr-revenue-filter-label">Chọn năm</label>
                    <input
                      type="number"
                      id="selected-year"
                      className="revenue-mgr-revenue-filter-date"
                      min="2020"
                      max={new Date().getFullYear()}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="revenue-mgr-revenue-chart-wrapper">
                <Line 
                  key={`chart-${chartViewBy}-${chartViewBy === 'month' ? `${selectedMonthYear}-${selectedMonth}` : selectedYear}`}
                  data={chartConfig} 
                  options={chartOptions} 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="revenue-mgr-revenue-content">
          {/* Booking Statistics */}
          <div className="revenue-mgr-revenue-stats-section">
            <h3 className="revenue-mgr-revenue-section-title">Thống kê booking</h3>
            <div className="revenue-mgr-revenue-stats-grid">
              <div className="revenue-mgr-revenue-stat-card">
                <div className="revenue-mgr-revenue-stat-label">Tổng số booking</div>
                <div className="revenue-mgr-revenue-stat-value">{bookingsForStats.length}</div>
              </div>
              <div className="revenue-mgr-revenue-stat-card">
                <div className="revenue-mgr-revenue-stat-label">Đã hoàn thành</div>
                <div className="revenue-mgr-revenue-stat-value revenue-mgr-revenue-stat-completed">
                  {bookingsForStats.filter(b => {
                    const status = (b.Status || b.status || '').toLowerCase();
                    return status === 'completed';
                  }).length}
                </div>
              </div>
              <div className="revenue-mgr-revenue-stat-card">
                <div className="revenue-mgr-revenue-stat-label">Đã chấp nhận</div>
                <div className="revenue-mgr-revenue-stat-value revenue-mgr-revenue-stat-accepted">
                  {bookingsForStats.filter(b => {
                    const status = (b.Status || b.status || '').toLowerCase();
                    return status === 'confirmed';
                  }).length}
                </div>
              </div>
              <div className="revenue-mgr-revenue-stat-card">
                <div className="revenue-mgr-revenue-stat-label">Đã từ chối</div>
                <div className="revenue-mgr-revenue-stat-value revenue-mgr-revenue-stat-rejected">
                  {bookingsForStats.filter(b => {
                    const status = (b.Status || b.status || '').toLowerCase();
                    return status === 'cancelled';
                  }).length}
                </div>
              </div>
              <div className="revenue-mgr-revenue-stat-card">
                <div className="revenue-mgr-revenue-stat-label">Đã xử lý</div>
                <div className="revenue-mgr-revenue-stat-value revenue-mgr-revenue-stat-pending">
                  {bookingsForStats.filter(b => {
                    const status = (b.Status || b.status || '').toLowerCase();
                    return status === 'pending';
                  }).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManagement;





