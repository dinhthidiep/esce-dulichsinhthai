# Test Cases cho Booking History View

## Tổng quan
Tài liệu này liệt kê các test cases cần thiết cho unit test của Booking History View trong `ProfilePage.tsx` (tab "bookings").

---

## 1. Test Cases - Fetching Data (Lấy dữ liệu)

### 1.1. Fetch Bookings Successfully
**Mô tả:** Kiểm tra khi fetch bookings thành công
- **Setup:** Mock API trả về mảng bookings hợp lệ
- **Assertions:**
  - `loadingBookings` chuyển từ `true` → `false`
  - `bookings` state được cập nhật với dữ liệu từ API
  - Component hiển thị danh sách bookings
  - Không có error message

### 1.2. Fetch Bookings - Empty Array
**Mô tả:** Kiểm tra khi user chưa có booking nào
- **Setup:** Mock API trả về mảng rỗng `[]`
- **Assertions:**
  - `bookings` state là mảng rỗng
  - Hiển thị empty state với message "Chưa có đặt dịch vụ nào"
  - Hiển thị button "Đặt dịch vụ mới"
  - Button navigate đến `/services`

### 1.3. Fetch Bookings - API Error 401/403
**Mô tả:** Kiểm tra khi không có quyền truy cập
- **Setup:** Mock API trả về 401 hoặc 403
- **Assertions:**
  - Error message hiển thị: "Bạn không có quyền xem lịch sử đặt dịch vụ. Vui lòng đăng nhập lại."
  - `bookings` state là mảng rỗng

### 1.4. Fetch Bookings - API Error 404
**Mô tả:** Kiểm tra khi user chưa có booking (404)
- **Setup:** Mock API trả về 404
- **Assertions:**
  - `bookings` state là mảng rỗng (không phải error)
  - Hiển thị empty state
  - Không có error message

### 1.5. Fetch Bookings - Network Error
**Mô tả:** Kiểm tra khi có lỗi mạng
- **Setup:** Mock API throw network error
- **Assertions:**
  - Error message hiển thị: "Không thể tải lịch sử đặt dịch vụ. Vui lòng thử lại sau."
  - `bookings` state là mảng rỗng

### 1.6. Fetch Bookings - Invalid Response Data
**Mô tả:** Kiểm tra khi API trả về dữ liệu không hợp lệ
- **Setup:** Mock API trả về `null`, `undefined`, hoặc không phải array
- **Assertions:**
  - `bookings` state được set thành mảng rỗng
  - Không crash component

### 1.7. Fetch Bookings - Chỉ fetch khi tab active
**Mô tả:** Kiểm tra chỉ fetch khi tab "bookings" được active
- **Setup:** Component mount với `activeTab !== 'bookings'`
- **Assertions:**
  - API không được gọi
  - Khi chuyển sang tab "bookings", API được gọi

### 1.8. Fetch Bookings - Không có userId
**Mô tả:** Kiểm tra khi không có userId
- **Setup:** `getUserId()` trả về `null`
- **Assertions:**
  - API không được gọi
  - Không có error

---

## 2. Test Cases - Display Bookings (Hiển thị bookings)

### 2.1. Display Booking Card - Đầy đủ thông tin
**Mô tả:** Kiểm tra hiển thị booking card với đầy đủ thông tin
- **Setup:** Booking có đầy đủ fields: ServiceCombo, StartDate, EndDate, Quantity, TotalAmount, Status
- **Assertions:**
  - Hiển thị service name từ `ServiceCombo.Name`
  - Hiển thị service image
  - Hiển thị StartDate và EndDate đã format
  - Hiển thị Quantity
  - Hiển thị TotalAmount đã format (formatPrice)
  - Hiển thị status badge với text và className đúng

### 2.2. Display Booking Card - Missing Optional Fields
**Mô tả:** Kiểm tra khi booking thiếu một số fields tùy chọn
- **Setup:** Booking thiếu EndDate hoặc Quantity
- **Assertions:**
  - Component không crash
  - Chỉ hiển thị StartDate nếu không có EndDate
  - Hiển thị "N/A" hoặc không hiển thị cho fields thiếu

### 2.3. Display Booking Card - Missing ServiceCombo
**Mô tả:** Kiểm tra khi booking không có ServiceCombo
- **Setup:** Booking không có `ServiceCombo` hoặc `serviceCombo`
- **Assertions:**
  - Hiển thị "Dịch vụ" làm fallback cho service name
  - Hiển thị fallback image

### 2.4. Display Booking Card - Multiple Images
**Mô tả:** Kiểm tra khi ServiceCombo có nhiều ảnh (phân cách bởi dấu phẩy)
- **Setup:** `ServiceCombo.Image = "img1.jpg,img2.jpg,img3.jpg"`
- **Assertions:**
  - Chỉ lấy ảnh đầu tiên để hiển thị
  - Split đúng và trim whitespace

### 2.5. Display Booking Status - Pending
**Mô tả:** Kiểm tra hiển thị status "pending"
- **Assertions:**
  - Badge text: "Chờ xác nhận"
  - Badge className: "status-pending"

### 2.6. Display Booking Status - Confirmed
**Mô tả:** Kiểm tra hiển thị status "confirmed"
- **Assertions:**
  - Badge text: "Đã xác nhận"
  - Badge className: "status-confirmed"

### 2.7. Display Booking Status - Processing
**Mô tả:** Kiểm tra hiển thị status "processing"
- **Assertions:**
  - Badge text: "Đang xử lý"
  - Badge className: "status-confirmed"

### 2.8. Display Booking Status - Completed
**Mô tả:** Kiểm tra hiển thị status "completed"
- **Assertions:**
  - Badge text: "Hoàn thành"
  - Badge className: "status-completed"

### 2.9. Display Booking Status - Cancelled
**Mô tả:** Kiểm tra hiển thị status "cancelled"
- **Assertions:**
  - Badge text: "Đã hủy"
  - Badge className: "status-cancelled"

### 2.10. Display Booking Status - Unknown/Invalid
**Mô tả:** Kiểm tra hiển thị status không hợp lệ
- **Setup:** Status = "unknown" hoặc null/undefined
- **Assertions:**
  - Badge text: "Chưa xác định" hoặc giá trị status
  - Badge className: "status-unknown"

### 2.11. Display Booking Status - Case Insensitive
**Mô tả:** Kiểm tra status không phân biệt hoa thường
- **Setup:** Status = "PENDING", "Pending", "pending"
- **Assertions:**
  - Tất cả đều hiển thị "Chờ xác nhận"

### 2.12. Format Date - Valid Date
**Mô tả:** Kiểm tra format date đúng định dạng
- **Setup:** Date string hợp lệ
- **Assertions:**
  - Date được format theo locale 'vi-VN'
  - Format: `dd/mm/yyyy`

### 2.13. Format Date - Invalid Date
**Mô tả:** Kiểm tra khi date không hợp lệ
- **Setup:** Date string không hợp lệ hoặc null
- **Assertions:**
  - Trả về chuỗi rỗng `''`
  - Component không crash

### 2.14. Format Price - Valid Amount
**Mô tả:** Kiểm tra format giá tiền
- **Setup:** TotalAmount = 1000000
- **Assertions:**
  - Hiển thị đúng format (ví dụ: "1.000.000 ₫")

---

## 3. Test Cases - Actions (Các hành động)

### 3.1. View Details Button - Click
**Mô tả:** Kiểm tra nút "Chi tiết"
- **Setup:** Booking có ID hợp lệ
- **Actions:** Click button "Chi tiết"
- **Assertions:**
  - Navigate đến `/payment/{bookingId}`
  - State được truyền: `{ returnUrl: '/profile', returnTab: 'bookings' }`

### 3.2. Cancel Booking Button - Hiển thị đúng điều kiện
**Mô tả:** Kiểm tra nút "Hủy dịch vụ" chỉ hiển thị khi status là pending hoặc confirmed
- **Setup:** Booking với status = "pending"
- **Assertions:**
  - Button "Hủy dịch vụ" được hiển thị

### 3.3. Cancel Booking Button - Không hiển thị
**Mô tả:** Kiểm tra nút "Hủy dịch vụ" không hiển thị với status khác
- **Setup:** Booking với status = "completed" hoặc "cancelled"
- **Assertions:**
  - Button "Hủy dịch vụ" không được hiển thị

### 3.4. Cancel Booking - Confirm Dialog
**Mô tả:** Kiểm tra dialog xác nhận khi hủy booking
- **Actions:** Click button "Hủy dịch vụ"
- **Assertions:**
  - Dialog hiển thị: "Bạn có chắc muốn hủy đặt dịch vụ này?"
  - Nếu cancel dialog, không gọi API

### 3.5. Cancel Booking - Success
**Mô tả:** Kiểm tra hủy booking thành công
- **Setup:** Mock API trả về success
- **Actions:** Click "Hủy dịch vụ" và confirm
- **Assertions:**
  - API được gọi: `PUT /api/Booking/{bookingId}/status` với `{ Status: 'cancelled' }`
  - Bookings được reload
  - Success message: "Hủy đặt dịch vụ thành công!"
  - Message tự động ẩn sau 3 giây

### 3.6. Cancel Booking - API Error
**Mô tả:** Kiểm tra khi hủy booking thất bại
- **Setup:** Mock API trả về error
- **Actions:** Click "Hủy dịch vụ" và confirm
- **Assertions:**
  - Error message hiển thị từ API response
  - Message tự động ẩn sau 5 giây
  - Bookings không được reload

### 3.7. Cancel Booking - Loading State
**Mô tả:** Kiểm tra loading state khi hủy booking
- **Actions:** Click "Hủy dịch vụ" và confirm
- **Assertions:**
  - `loadingBookings` = `true` trong quá trình xử lý
  - `loadingBookings` = `false` sau khi hoàn thành

### 3.8. Review Button - Hiển thị đúng điều kiện
**Mô tả:** Kiểm tra nút "Đánh giá" chỉ hiển thị khi status = "completed"
- **Setup:** Booking với status = "completed"
- **Assertions:**
  - Button "Đánh giá" được hiển thị

### 3.9. Review Button - Không hiển thị
**Mô tả:** Kiểm tra nút "Đánh giá" không hiển thị với status khác
- **Setup:** Booking với status khác "completed"
- **Assertions:**
  - Button "Đánh giá" không được hiển thị

### 3.10. Review Button - Click
**Mô tả:** Kiểm tra khi click nút "Đánh giá"
- **Setup:** Booking có ServiceCombo với ID
- **Actions:** Click button "Đánh giá"
- **Assertions:**
  - Navigate đến `/services/{serviceComboId}/review`

### 3.11. Review Button - Missing ServiceCombo ID
**Mô tả:** Kiểm tra khi ServiceCombo không có ID
- **Setup:** Booking không có ServiceCombo hoặc ServiceCombo không có ID
- **Assertions:**
  - Navigate với ID = null hoặc undefined (cần xử lý edge case)

### 3.12. "Đặt dịch vụ mới" Button - Click
**Mô tả:** Kiểm tra button ở header
- **Actions:** Click button "Đặt dịch vụ mới"
- **Assertions:**
  - Navigate đến `/services`

---

## 4. Test Cases - Loading States (Trạng thái loading)

### 4.1. Loading State - Initial Load
**Mô tả:** Kiểm tra loading state khi fetch lần đầu
- **Setup:** Component mount với `activeTab = 'bookings'`
- **Assertions:**
  - Hiển thị `LoadingSpinner` với message "Đang tải lịch sử đặt dịch vụ..."
  - `loadingBookings` = `true`

### 4.2. Loading State - After Load
**Mô tả:** Kiểm tra sau khi load xong
- **Assertions:**
  - `LoadingSpinner` không còn hiển thị
  - `loadingBookings` = `false`

---

## 5. Test Cases - Edge Cases (Trường hợp đặc biệt)

### 5.1. Booking với dữ liệu null/undefined
**Mô tả:** Kiểm tra khi booking có nhiều fields null/undefined
- **Setup:** Booking object với nhiều fields null
- **Assertions:**
  - Component không crash
  - Hiển thị fallback values hợp lý

### 5.2. Booking với dữ liệu rỗng
**Mô tả:** Kiểm tra khi booking có string rỗng
- **Setup:** Booking với Name = "", Status = ""
- **Assertions:**
  - Component xử lý đúng
  - Hiển thị fallback values

### 5.3. Booking với số lượng lớn
**Mô tả:** Kiểm tra hiển thị nhiều bookings
- **Setup:** 50+ bookings
- **Assertions:**
  - Tất cả bookings đều được render
  - Performance không bị ảnh hưởng nghiêm trọng

### 5.4. Booking với giá trị số lớn
**Mô tả:** Kiểm tra format giá tiền lớn
- **Setup:** TotalAmount = 999999999
- **Assertions:**
  - Format đúng, không bị overflow

### 5.5. Booking với date trong tương lai
**Mô tả:** Kiểm tra date trong tương lai
- **Setup:** StartDate/EndDate là date trong tương lai
- **Assertions:**
  - Format date đúng
  - Không có lỗi validation

### 5.6. Booking với date trong quá khứ xa
**Mô tả:** Kiểm tra date trong quá khứ xa
- **Setup:** StartDate/EndDate là date rất cũ
- **Assertions:**
  - Format date đúng
  - Không có lỗi

### 5.7. Rapid Tab Switching
**Mô tả:** Kiểm tra khi chuyển tab nhanh
- **Actions:** Chuyển qua lại giữa các tab nhanh
- **Assertions:**
  - Không có race condition
  - API chỉ được gọi khi tab "bookings" active
  - Không có memory leak

### 5.8. Component Unmount During Fetch
**Mô tả:** Kiểm tra khi component unmount trong lúc fetch
- **Actions:** Unmount component khi đang fetch
- **Assertions:**
  - Không có warning về setState trên unmounted component
  - Không có memory leak

---

## 6. Test Cases - Integration (Tích hợp)

### 6.1. Integration với getUserId
**Mô tả:** Kiểm tra tích hợp với hàm getUserId
- **Setup:** Mock localStorage/sessionStorage
- **Assertions:**
  - getUserId được gọi đúng
  - Xử lý đúng khi không có userId

### 6.2. Integration với axiosInstance
**Mô tả:** Kiểm tra tích hợp với axios instance
- **Assertions:**
  - API được gọi với đúng endpoint
  - Headers được set đúng (token)
  - Error handling đúng

### 6.3. Integration với navigate
**Mô tả:** Kiểm tra tích hợp với react-router navigate
- **Assertions:**
  - Navigate được gọi với đúng path và state
  - Không có lỗi routing

### 6.4. Integration với formatDate
**Mô tả:** Kiểm tra tích hợp với hàm formatDate
- **Assertions:**
  - formatDate được gọi với đúng tham số
  - Kết quả format đúng

### 6.5. Integration với formatPrice
**Mô tả:** Kiểm tra tích hợp với hàm formatPrice
- **Assertions:**
  - formatPrice được gọi với đúng tham số
  - Kết quả format đúng

### 6.6. Integration với getImageUrl
**Mô tả:** Kiểm tra tích hợp với hàm getImageUrl
- **Assertions:**
  - getImageUrl được gọi với đúng tham số
  - Fallback image được sử dụng khi cần

---

## 7. Test Cases - Accessibility (Khả năng truy cập)

### 7.1. Keyboard Navigation
**Mô tả:** Kiểm tra điều hướng bằng bàn phím
- **Actions:** Tab qua các elements
- **Assertions:**
  - Tất cả buttons có thể focus được
  - Tab order hợp lý

### 7.2. Screen Reader Support
**Mô tả:** Kiểm tra hỗ trợ screen reader
- **Assertions:**
  - Các elements có aria-labels phù hợp
  - Status badges có text mô tả rõ ràng

### 7.3. Focus Management
**Mô tả:** Kiểm tra quản lý focus
- **Assertions:**
  - Focus được quản lý đúng khi navigate
  - Không mất focus khi không cần thiết

---

## 8. Test Cases - Performance (Hiệu năng)

### 8.1. Render Performance
**Mô tả:** Kiểm tra hiệu năng render
- **Setup:** 100 bookings
- **Assertions:**
  - Render time hợp lý (< 1s)
  - Không có unnecessary re-renders

### 8.2. Memory Usage
**Mô tả:** Kiểm tra sử dụng bộ nhớ
- **Assertions:**
  - Không có memory leak
  - Cleanup đúng khi unmount

---

## 9. Test Cases - Data Transformation (Chuyển đổi dữ liệu)

### 9.1. Case Insensitive Status
**Mô tả:** Kiểm tra status không phân biệt hoa thường
- **Setup:** Status = "PENDING", "Pending", "pending"
- **Assertions:**
  - Tất cả đều được xử lý như "pending"

### 9.2. Field Name Variations
**Mô tả:** Kiểm tra xử lý cả PascalCase và camelCase
- **Setup:** Booking có cả `Status` và `status`, `BookingDate` và `bookingDate`
- **Assertions:**
  - Ưu tiên PascalCase, fallback camelCase
  - Xử lý đúng cả hai trường hợp

### 9.3. ServiceCombo Nested Object
**Mô tả:** Kiểm tra xử lý ServiceCombo nested
- **Setup:** ServiceCombo có thể là `booking.ServiceCombo` hoặc `booking.serviceCombo`
- **Assertions:**
  - Xử lý đúng cả hai trường hợp
  - Fallback đúng khi không có

---

## 10. Test Cases - Error Boundaries (Xử lý lỗi)

### 10.1. Error During Render
**Mô tả:** Kiểm tra khi có lỗi trong quá trình render
- **Setup:** Booking data gây lỗi khi render
- **Assertions:**
  - Component không crash hoàn toàn
  - Error được log ra console
  - User vẫn có thể sử dụng phần còn lại

### 10.2. Error During Action
**Mô tả:** Kiểm tra khi có lỗi trong action
- **Setup:** API error khi cancel booking
- **Assertions:**
  - Error được hiển thị cho user
  - Component state được reset đúng
  - User có thể thử lại

---

## Ghi chú về Testing Framework

Để implement các test cases trên, bạn cần:

1. **Cài đặt testing framework:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

2. **Cấu hình Vitest** (tạo `vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

3. **Mock axios và các dependencies:**
- Mock `axiosInstance`
- Mock `useNavigate` từ react-router-dom
- Mock `localStorage` và `sessionStorage`
- Mock `getUserId` function

4. **Test structure:**
```
fe_user/src/
  components/
    __tests__/
      ProfilePage.test.tsx
        - BookingHistory.test.tsx (hoặc tách riêng)
```

---

## Ưu tiên Test Cases

### High Priority (Phải test):
1. Fetch Bookings Successfully (1.1)
2. Fetch Bookings - Empty Array (1.2)
3. Fetch Bookings - API Error (1.3, 1.4, 1.5)
4. Display Booking Card - Đầy đủ thông tin (2.1)
5. Display Booking Status - Tất cả status (2.5-2.9)
6. Cancel Booking - Success (3.5)
7. Cancel Booking - API Error (3.6)
8. Review Button - Click (3.10)

### Medium Priority (Nên test):
1. Display Booking Card - Missing Fields (2.2, 2.3)
2. Cancel Booking - Confirm Dialog (3.4)
3. Loading States (4.1, 4.2)
4. Edge Cases - Null/undefined (5.1, 5.2)

### Low Priority (Có thể test sau):
1. Performance tests (8.1, 8.2)
2. Accessibility tests (7.1-7.3)
3. Integration tests chi tiết (6.1-6.6)






