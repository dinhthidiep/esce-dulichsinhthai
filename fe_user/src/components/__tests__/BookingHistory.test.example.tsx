/**
 * Ví dụ Unit Test cho Booking History View
 * 
 * File này là ví dụ về cách implement các test cases được liệt kê trong
 * BOOKING_HISTORY_TEST_CASES.md
 * 
 * Lưu ý: Đây chỉ là ví dụ, cần cài đặt dependencies và cấu hình test framework trước
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';    
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../ProfilePage';
import axiosInstance from '../../utils/axiosInstance';
import * as router from 'react-router-dom';

// Mock dependencies
vi.mock('../../utils/axiosInstance');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Booking History View', () => {
  const mockNavigate = vi.fn();
  const mockUserId = 1;
  const mockUserInfo = {
    Id: mockUserId,
    Name: 'Test User',
    Email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));
    
    // Mock useNavigate
    vi.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Fetching Data', () => {
    it('1.1. Fetch Bookings Successfully', async () => {
      const mockBookings = [
        {
          Id: 1,
          Status: 'confirmed',
          BookingDate: '2024-01-01',
          StartDate: '2024-01-15',
          EndDate: '2024-01-20',
          Quantity: 2,
          TotalAmount: 1000000,
          ServiceCombo: {
            Id: 1,
            Name: 'Tour Đà Lạt',
            Image: 'tour-dalat.jpg',
          },
        },
      ];

      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: mockBookings,
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      // Chuyển sang tab bookings
      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      // Kiểm tra loading state
      expect(screen.getByText(/Đang tải lịch sử đặt dịch vụ/i)).toBeInTheDocument();

      // Đợi loading xong
      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith(
          expect.stringContaining(`/api/Booking/user/${mockUserId}`)
        );
      });

      // Kiểm tra bookings được hiển thị
      await waitFor(() => {
        expect(screen.getByText('Tour Đà Lạt')).toBeInTheDocument();
        expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
      });
    });

    it('1.2. Fetch Bookings - Empty Array', async () => {
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText(/Chưa có đặt dịch vụ nào/i)).toBeInTheDocument();
        expect(screen.getByText('Đặt dịch vụ mới')).toBeInTheDocument();
      });
    });

    it('1.3. Fetch Bookings - API Error 401/403', async () => {
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockRejectedValueOnce({
        response: { status: 401 },
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(
          screen.getByText(/Bạn không có quyền xem lịch sử đặt dịch vụ/i)
        ).toBeInTheDocument();
      });
    });

    it('1.4. Fetch Bookings - API Error 404', async () => {
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockRejectedValueOnce({
        response: { status: 404 },
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        // 404 không phải error, chỉ là user chưa có booking
        expect(screen.getByText(/Chưa có đặt dịch vụ nào/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Display Bookings', () => {
    const mockBooking = {
      Id: 1,
      Status: 'confirmed',
      BookingDate: '2024-01-01T00:00:00',
      StartDate: '2024-01-15T00:00:00',
      EndDate: '2024-01-20T00:00:00',
      Quantity: 2,
      TotalAmount: 1000000,
      ServiceCombo: {
        Id: 1,
        Name: 'Tour Đà Lạt',
        Image: 'tour-dalat.jpg',
      },
    };

    beforeEach(() => {
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [mockBooking],
      });
    });

    it('2.1. Display Booking Card - Đầy đủ thông tin', async () => {
      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Tour Đà Lạt')).toBeInTheDocument();
        expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
        expect(screen.getByText(/Số người: 2/i)).toBeInTheDocument();
      });
    });

    it('2.5. Display Booking Status - Pending', async () => {
      const pendingBooking = { ...mockBooking, Status: 'pending' };
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [pendingBooking],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
      });
    });

    it('2.6. Display Booking Status - Completed', async () => {
      const completedBooking = { ...mockBooking, Status: 'completed' };
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [completedBooking],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      });
    });
  });

  describe('3. Actions', () => {
    const mockBooking = {
      Id: 1,
      Status: 'pending',
      ServiceCombo: {
        Id: 10,
        Name: 'Tour Đà Lạt',
      },
    };

    beforeEach(() => {
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [mockBooking],
      });
    });

    it('3.1. View Details Button - Click', async () => {
      // Mock window.confirm để không hiển thị dialog
      window.confirm = vi.fn(() => false);

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Chi tiết')).toBeInTheDocument();
      });

      const detailsButton = screen.getByText('Chi tiết');
      fireEvent.click(detailsButton);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/payment/1',
        expect.objectContaining({
          state: expect.objectContaining({
            returnUrl: '/profile',
            returnTab: 'bookings',
          }),
        })
      );
    });

    it('3.2. Cancel Booking Button - Hiển thị đúng điều kiện', async () => {
      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Hủy dịch vụ')).toBeInTheDocument();
      });
    });

    it('3.5. Cancel Booking - Success', async () => {
      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      (axiosInstance.put as any).mockResolvedValueOnce({});
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: [{ ...mockBooking, Status: 'cancelled' }],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Hủy dịch vụ')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Hủy dịch vụ');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(axiosInstance.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/Booking/1/status'),
          { Status: 'cancelled' }
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Hủy đặt dịch vụ thành công/i)).toBeInTheDocument();
      });
    });

    it('3.8. Review Button - Hiển thị đúng điều kiện', async () => {
      const completedBooking = { ...mockBooking, Status: 'completed' };
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [completedBooking],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Đánh giá')).toBeInTheDocument();
      });
    });

    it('3.10. Review Button - Click', async () => {
      const completedBooking = { ...mockBooking, Status: 'completed' };
      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [completedBooking],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Đánh giá')).toBeInTheDocument();
      });

      const reviewButton = screen.getByText('Đánh giá');
      fireEvent.click(reviewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/services/10/review');
    });
  });

  describe('4. Loading States', () => {
    it('4.1. Loading State - Initial Load', async () => {
      (axiosInstance.get as any).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockUserInfo });
          }, 100);
        });
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      expect(screen.getByText(/Đang tải lịch sử đặt dịch vụ/i)).toBeInTheDocument();
    });
  });

  describe('5. Edge Cases', () => {
    it('5.1. Booking với dữ liệu null/undefined', async () => {
      const bookingWithNulls = {
        Id: 1,
        Status: null,
        BookingDate: null,
        ServiceCombo: null,
      };

      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [bookingWithNulls],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      // Component không nên crash
      await waitFor(() => {
        expect(screen.queryByText(/Dịch vụ/i)).toBeInTheDocument();
      });
    });

    it('5.2. Booking với dữ liệu rỗng', async () => {
      const bookingWithEmpty = {
        Id: 1,
        Status: '',
        ServiceCombo: { Name: '', Image: '' },
      };

      (axiosInstance.get as any).mockResolvedValueOnce({
        data: mockUserInfo,
      }).mockResolvedValueOnce({
        data: [bookingWithEmpty],
      });

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      const bookingsTab = screen.getByText('Lịch sử đặt dịch vụ');
      fireEvent.click(bookingsTab);

      // Component không nên crash
      await waitFor(() => {
        expect(screen.queryByText(/Chưa xác định/i)).toBeInTheDocument();
      });
    });
  });
});







