# Báo Cáo So Khớp Backend và Frontend

## ✅ Đã Sửa

### 1. Booking Create API
- **Vấn đề**: Frontend đang gửi thêm các field không cần thiết: `UnitPrice`, `TotalAmount`, `Status`, `StartDate`, `EndDate`
- **Backend yêu cầu** (CreateBookingDto):
  - `UserId` (required)
  - `ServiceComboId` (optional)
  - `ServiceId` (optional)
  - `Quantity` (required)
  - `ItemType` (required) - expect "combo" hoặc "service"
  - `Notes` (optional)
  - `BookingDate` (required)
- **Backend tự tính**: `BookingNumber`, `UnitPrice`, `TotalAmount`, `Status` (mặc định "pending")
- **Đã sửa**: Xóa các field không cần thiết trong `BookingPage.tsx`

### 2. Booking Calculate API
- **Backend**: POST `/api/Booking/calculate` nhận `{ ServiceComboId, ServiceId, Quantity, ItemType }` và trả về `{ TotalAmount }`
- **Frontend**: Đang gửi đúng format với `ItemType: 'combo'` - ✅ Đúng

## ✅ Đã Kiểm Tra và Đúng

### 3. Auth Login API
- **Backend**: POST `/api/Auth/login` nhận `{ UserEmail, Password }` và trả về `{ Token, UserInfo }`
- **Frontend**: Đang gọi đúng format - ✅ Đúng

### 4. User Profile API
- **Backend**: 
  - GET `/api/user/{id}` - Lấy user theo ID
  - PUT `/api/user/profile` - Cập nhật profile
- **Frontend**: Sử dụng `API_ENDPOINTS.USER = '/user'` - ✅ Đúng

### 5. Review Can-Review API
- **Backend**: GET `/api/Review/booking/{bookingId}/user/{userId}/can-review` trả về `{ CanReview = bool }`
- **Frontend**: Đang check `canReviewData.CanReview === true || canReviewData.canReview === true` - ✅ Đúng

### 6. Coupon Validate API
- **Backend**: POST `/api/Coupon/validate` nhận `{ Code, ServiceComboId }` và trả về `{ IsValid = bool }`
- **Frontend**: Đang return `response.data` trực tiếp - Cần kiểm tra xem có xử lý đúng format không

### 7. ItemType Values
- **Backend BookingService**: Expect `ItemType == "combo"` hoặc `ItemType == "service"` (lowercase)
- **Frontend**: Đang gửi `'combo'` - ✅ Đúng

## 📝 Lưu Ý

1. **BookingService** tự động tính toán:
   - `BookingNumber`: Tự generate
   - `UnitPrice`: Từ ServiceCombo hoặc Service price
   - `TotalAmount`: `UnitPrice * Quantity` (có thể áp dụng giảm giá Agency 3%)
   - `Status`: Mặc định "pending"

2. **ItemType** phải là lowercase: "combo" hoặc "service"

3. Backend route `/api/user` (lowercase) - frontend đã dùng đúng

---

*Báo cáo được tạo sau khi so sánh backend và frontend*


















