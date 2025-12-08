# Tài liệu Flow Người Dùng: Từ Home đến Thanh Toán PayOS

## Tổng quan Flow

Flow hoàn chỉnh từ trang home đến thanh toán PayOS được mô tả chi tiết dưới đây:

```
Home (LandingPage) 
  ↓
ServicesPage (Danh sách dịch vụ)
  ↓
ServiceDetail (Chi tiết dịch vụ)
  ↓
Login (nếu chưa đăng nhập)
  ↓
BookingPage (Đặt dịch vụ)
  ↓
PaymentPage (Thanh toán PayOS)
```

---

## 1. Home Page (LandingPage)

**File**: `src/components/LandingPage.tsx`

### Chức năng:
- Hiển thị trang chủ với các dịch vụ nổi bật
- Hiển thị top 6 dịch vụ có rating cao nhất từ API
- Hiển thị thông tin giới thiệu, features, stats

### Flow:
1. Component mount → Gọi `useTours()` hook để fetch danh sách ServiceCombo từ API
2. Fetch ratings cho từng service để hiển thị sao
3. Map dữ liệu từ API (PascalCase) sang format frontend
4. Filter các service có `Status = 'open'`
5. Sort theo rating từ cao xuống thấp
6. Hiển thị top 6 services

### Navigation:
- Click vào service card → Navigate đến `/services/{id}` (ServiceDetail)
- Click "Xem tất cả" → Navigate đến `/services` (ServicesPage)

### Code liên quan:
```tsx
// LandingPage.tsx
const { tours, loading, error } = useTours() // Fetch từ API
const displayServices = useMemo(() => {
  // Filter, sort, và map services
  return activeServices.slice(0, 6) // Top 6
}, [tours, loading, error])

// Click vào service card
<Link to={`/services/${service.id}`}>
```

---

## 2. Services Page (Danh sách dịch vụ)

**File**: `src/components/ServicesPage.tsx`

### Chức năng:
- Hiển thị danh sách tất cả các dịch vụ (ServiceCombo)
- Filter và search dịch vụ
- Sort theo: phổ biến, giá, tên

### Flow:
1. Component mount → Gọi `useTours()` hook để fetch tất cả ServiceCombo
2. Fetch ratings cho từng service
3. Filter các service có `Status = 'open'`
4. Apply filters (search, price range, sort)
5. Hiển thị danh sách services

### Navigation:
- Click vào service card → Navigate đến `/services/{id}` (ServiceDetail)

### Code liên quan:
```tsx
// ServicesPage.tsx
const { tours, loading, error } = useTours()
const filteredAndSortedServices = useMemo(() => {
  // Apply filters và sort
}, [allServices, searchName, priceRange, sortBy])

// Click vào service card
<Link to={`/services/${tour.id}`}>
```

---

## 3. Service Detail (Chi tiết dịch vụ)

**File**: `src/components/ServiceDetail.tsx`

### Chức năng:
- Hiển thị chi tiết đầy đủ của một ServiceCombo
- Hiển thị hình ảnh, mô tả, đánh giá, reviews
- Nút "Đặt dịch vụ ngay"

### Flow:
1. Component mount với `id` từ URL params
2. Fetch ServiceCombo detail từ API: `GET /api/ServiceCombo/{id}`
3. Fetch average rating: `GET /api/Review/servicecombo/{id}/average-rating`
4. Fetch reviews: `GET /api/Review` → Filter theo `ComboId`
5. Fetch similar services
6. Check nếu user có thể review (nếu đã đăng nhập)

### Navigation:
- Click "Đặt dịch vụ ngay" → Kiểm tra đăng nhập:
  - **Chưa đăng nhập**: Navigate đến `/login` với `returnUrl: /booking/{id}`
  - **Đã đăng nhập**: Navigate đến `/booking/{id}` (BookingPage)

### Code liên quan:
```tsx
// ServiceDetail.tsx
const { id } = useParams()
const navigate = useNavigate()

// Fetch service detail
useEffect(() => {
  const response = await axiosInstance.get(`${API_ENDPOINTS.SERVICE_COMBO}/${id}`)
  setService(response.data)
}, [id])

// Click "Đặt dịch vụ ngay"
onClick={() => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    navigate('/login', { state: { returnUrl: `/booking/${id}` } })
  } else {
    navigate(`/booking/${id}`)
  }
}}
```

---

## 4. Login (Nếu chưa đăng nhập)

**File**: `src/components/LoginForm.tsx`

### Chức năng:
- Form đăng nhập với email và password
- Xử lý "Ghi nhớ đăng nhập" (localStorage vs sessionStorage)
- Redirect về trang trước sau khi đăng nhập thành công

### Flow:
1. User nhập email và password
2. Submit form → Gọi API: `POST /api/Auth/login`
3. Nhận response với `Token` và `UserInfo`
4. Lưu token và userInfo vào storage:
   - Nếu "Ghi nhớ đăng nhập": `localStorage`
   - Nếu không: `sessionStorage`
5. Redirect:
   - Nếu có `returnUrl` từ location state → Navigate đến `returnUrl`
   - Nếu không → Navigate đến `/` (Home)

### Code liên quan:
```tsx
// LoginForm.tsx
const location = useLocation()
const returnUrl = (location.state as LocationState)?.returnUrl

const handleSubmit = async (e) => {
  const response = await login(formData.email, formData.password)
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem('token', response.Token)
  storage.setItem('userInfo', JSON.stringify(response.UserInfo))
  
  navigate(returnUrl || '/', { replace: true })
}
```

---

## 5. Booking Page (Đặt dịch vụ)

**File**: `src/components/BookingPage.tsx`

### Chức năng:
- Form đặt dịch vụ với các thông tin:
  - Số lượng người
  - Loại đặt (đi trong ngày / đi nhiều ngày)
  - Ngày bắt đầu, ngày kết thúc, thời gian
  - Dịch vụ thêm (tùy chọn)
  - Mã giảm giá (tùy chọn)
  - Ghi chú

### Flow:
1. Component mount với `id` từ URL params
2. Fetch ServiceCombo detail: `GET /api/ServiceCombo/{id}`
3. Fetch ServiceComboDetail (dịch vụ thêm): `GET /api/ServiceComboDetail/combo/{id}`
   - **Lưu ý**: Có thể lỗi 500 do circular reference, nhưng không ảnh hưởng chức năng chính
4. User điền form và submit
5. Validate form:
   - Kiểm tra đăng nhập (token)
   - Kiểm tra số lượng người
   - Kiểm tra ngày tháng
   - Kiểm tra available slots
6. Tính toán tổng tiền (bao gồm dịch vụ thêm và coupon nếu có)
7. Tạo booking: `POST /api/Booking`
   - Body: `ServiceComboId`, `Quantity`, `UnitPrice`, `TotalAmount`, `ItemType: 'combo'`, `Status: 'pending'`, `StartDate`, `EndDate`, `Notes`
8. Áp dụng coupon nếu có: `POST /api/Coupon/apply`
9. Navigate đến `/payment/{bookingId}` (PaymentPage)

### Code liên quan:
```tsx
// BookingPage.tsx
const handleSubmit = async (e) => {
  // Validate
  if (!validateForm()) return
  
  // Tính tổng tiền
  const finalTotal = baseTotal + additionalServicesTotal - discountAmount
  
  // Tạo booking
  const bookingData = {
    ServiceComboId: parseInt(id),
    Quantity: quantity,
    UnitPrice: servicePrice,
    TotalAmount: totalAfterDiscount,
    ItemType: 'combo',
    Status: 'pending',
    StartDate: finalStartDate,
    EndDate: finalEndDate,
    Notes: bookingNotes
  }
  
  const response = await axiosInstance.post(`${API_ENDPOINTS.BOOKING}`, bookingData)
  const bookingId = response.data.Id || response.data.id
  
  // Áp dụng coupon nếu có
  if (appliedCoupon && bookingId) {
    await couponService.applyCoupon(bookingId, appliedCoupon.Code)
  }
  
  // Navigate đến payment
  navigate(`/payment/${bookingId}`, { replace: true })
}
```

---

## 6. Payment Page (Thanh toán PayOS)

**File**: `src/components/PaymentPage.tsx`

### Chức năng:
- Hiển thị thông tin booking và tổng tiền
- Áp dụng/gỡ mã giảm giá
- Tạo payment intent và redirect đến PayOS
- Xử lý kết quả thanh toán

### Flow:

#### 6.1. Load Booking Data
1. Component mount với `bookingId` từ URL params
2. Fetch booking: `GET /api/Booking/{bookingId}`
3. Fetch payment status: `GET /api/Payment/status/{bookingId}`
   - Nếu chưa có payment → Status = null hoặc 404 (bình thường)
   - Nếu đã có payment → Trả về payment status

#### 6.2. Áp dụng Coupon (Tùy chọn)
1. User nhập mã coupon và click "Áp dụng"
2. Validate coupon: `POST /api/Coupon/validate`
3. Calculate discount: `POST /api/Coupon/calculate-discount`
4. Apply coupon: `POST /api/Coupon/apply`
5. Reload booking để lấy `TotalAmount` mới (đã giảm giá)

#### 6.3. Thanh toán PayOS
1. User click "Thanh toán ngay"
2. Tạo payment intent: `POST /api/Payment/create-intent`
   - Body: `BookingId`, `Amount`, `Description`
   - Response: PayOS payment link và payment code
3. Redirect user đến PayOS payment link
4. User thanh toán trên PayOS
5. PayOS redirect về frontend (hoặc gọi webhook)
6. Frontend kiểm tra payment status: `GET /api/Payment/status/{bookingId}`
7. Hiển thị kết quả:
   - **Thành công**: Hiển thị thông báo thành công
   - **Thất bại**: Hiển thị thông báo lỗi

### Code liên quan:
```tsx
// PaymentPage.tsx
const handlePayment = async () => {
  const bookingIdValue = booking.Id || booking.id
  const totalAmount = booking.TotalAmount || booking.totalAmount
  
  // Tạo payment intent
  const response = await axiosInstance.post(`${API_ENDPOINTS.PAYMENT}/create-intent`, {
    BookingId: bookingIdValue,
    Amount: totalAmount,
    Description: `Thanh toán cho booking #${bookingIdValue}`
  })
  
  // Redirect đến PayOS
  const paymentLink = response.data.paymentLink || response.data.PaymentLink
  if (paymentLink) {
    window.location.href = paymentLink // Redirect đến PayOS
  }
}

// Sau khi thanh toán, kiểm tra status
useEffect(() => {
  const checkPaymentStatus = async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.PAYMENT}/status/${bookingId}`)
    const status = response.data.Status || response.data.status
    if (status === 'paid' || status === 'success') {
      // Thanh toán thành công
      setPaymentStatus(response.data)
    }
  }
  checkPaymentStatus()
}, [bookingId])
```

---

## Tóm tắt Flow Diagram

```
┌─────────────────┐
│  LandingPage   │  (Home)
│  - Top 6 tours │
└────────┬────────┘
         │ Click service
         ↓
┌─────────────────┐
│  ServicesPage   │  (Danh sách)
│  - All services │
└────────┬────────┘
         │ Click service
         ↓
┌─────────────────┐
│ ServiceDetail   │  (Chi tiết)
│  - Info, reviews│
└────────┬────────┘
         │ Click "Đặt dịch vụ"
         ↓
    ┌────────┐
    │Logged?│
    └───┬───┘
        │ No
        ↓
┌─────────────────┐
│   LoginForm     │  (Đăng nhập)
│  - Email/Pass   │
└────────┬────────┘
         │ Success
         ↓
┌─────────────────┐
│  BookingPage    │  (Đặt dịch vụ)
│  - Form booking │
│  - Coupon       │
└────────┬────────┘
         │ Submit
         ↓
┌─────────────────┐
│  PaymentPage    │  (Thanh toán)
│  - Booking info │
│  - PayOS link   │
└────────┬────────┘
         │ Click "Thanh toán"
         ↓
┌─────────────────┐
│     PayOS       │  (Gateway)
│  - Payment form │
└────────┬────────┘
         │ Success/Fail
         ↓
┌─────────────────┐
│  PaymentPage    │  (Kết quả)
│  - Status check │
│  - Show result  │
└─────────────────┘
```

---

## API Endpoints Sử Dụng

### 1. LandingPage & ServicesPage
- `GET /api/ServiceCombo` - Lấy danh sách tất cả ServiceCombo
- `GET /api/Review/servicecombo/{id}/average-rating` - Lấy rating trung bình

### 2. ServiceDetail
- `GET /api/ServiceCombo/{id}` - Lấy chi tiết ServiceCombo
- `GET /api/Review` - Lấy tất cả reviews (filter theo ComboId ở frontend)
- `GET /api/Review/servicecombo/{id}/average-rating` - Lấy rating trung bình
- `GET /api/Booking/user/{userId}` - Lấy bookings của user (để check can review)
- `GET /api/Review/booking/{bookingId}/user/{userId}/can-review` - Check user có thể review không

### 3. Login
- `POST /api/Auth/login` - Đăng nhập
  - Body: `{ UserEmail, Password }`
  - Response: `{ Token, UserInfo }`

### 4. BookingPage
- `GET /api/ServiceCombo/{id}` - Lấy chi tiết ServiceCombo
- `GET /api/ServiceComboDetail/combo/{id}` - Lấy dịch vụ thêm (có thể lỗi 500)
- `POST /api/Booking/calculate` - Tính tổng tiền (tùy chọn)
- `POST /api/Booking` - Tạo booking
  - Body: `{ ServiceComboId, Quantity, UnitPrice, TotalAmount, ItemType, Status, StartDate, EndDate, Notes }`
  - Response: `{ Id, ... }`
- `POST /api/Coupon/validate` - Validate coupon
- `POST /api/Coupon/calculate-discount` - Tính discount
- `POST /api/Coupon/apply` - Áp dụng coupon

### 5. PaymentPage
- `GET /api/Booking/{bookingId}` - Lấy thông tin booking
- `GET /api/Payment/status/{bookingId}` - Lấy trạng thái thanh toán
- `POST /api/Coupon/validate` - Validate coupon
- `POST /api/Coupon/calculate-discount` - Tính discount
- `POST /api/Coupon/apply` - Áp dụng coupon
- `POST /api/Coupon/remove` - Gỡ coupon
- `POST /api/Payment/create-intent` - Tạo payment intent PayOS
  - Body: `{ BookingId, Amount, Description }`
  - Response: `{ paymentLink, paymentCode, ... }`

---

## Data Flow

### 1. ServiceCombo Data
```
Backend (PascalCase)
  ↓ API Response
Frontend (xử lý cả PascalCase và camelCase)
  ↓ Map to ServiceItem
Display Component
```

### 2. Booking Data
```
User Input (Form)
  ↓ Validate
BookingData Object
  ↓ POST /api/Booking
Backend (Create Booking)
  ↓ Response (BookingId)
Frontend (Navigate to Payment)
```

### 3. Payment Data
```
Booking (TotalAmount)
  ↓ Apply Coupon (optional)
Updated TotalAmount
  ↓ POST /api/Payment/create-intent
PayOS Payment Link
  ↓ User Payment
PayOS Webhook → Backend
  ↓ GET /api/Payment/status
Frontend (Show Result)
```

---

## Lưu ý Quan Trọng

### 1. Authentication
- Token được lưu trong `localStorage` (nếu "Ghi nhớ đăng nhập") hoặc `sessionStorage`
- Token được tự động thêm vào header `Authorization: Bearer {token}` bởi axios interceptor
- Nếu token hết hạn (401/403), tự động redirect đến `/login`

### 2. Error Handling
- ServiceComboDetail có thể lỗi 500 (circular reference) nhưng không ảnh hưởng chức năng chính
- BookingPage vẫn hoạt động bình thường dù không có dịch vụ thêm
- PaymentPage xử lý trường hợp chưa có payment (404) là bình thường

### 3. Coupon Flow
- Có thể áp dụng coupon ở cả BookingPage và PaymentPage
- Coupon được validate và apply qua API
- TotalAmount được cập nhật sau khi apply coupon

### 4. PayOS Integration
- Payment intent được tạo ở backend
- Frontend redirect user đến PayOS payment link
- Backend nhận webhook từ PayOS và cập nhật payment status
- Frontend poll hoặc check payment status để hiển thị kết quả

---

## Kết luận

Flow từ Home đến PayOS được thiết kế rõ ràng với các bước:
1. **Browse**: User xem danh sách và chi tiết dịch vụ
2. **Authenticate**: User đăng nhập (nếu cần)
3. **Book**: User điền form đặt dịch vụ
4. **Pay**: User thanh toán qua PayOS

Mỗi bước đều có validation và error handling đầy đủ để đảm bảo trải nghiệm người dùng tốt nhất.

---

## 7. Đánh Giá Chức Năng Thả Cảm Xúc (Reaction Feature)

**File**: `front_end/src/components/socialMedia/SocialMedia.jsx`

### Tổng Quan

Chức năng thả cảm xúc cho phép người dùng thể hiện cảm xúc với bài viết và bình luận, tương tự như Facebook Reactions.

### So Sánh Với Facebook

| Tính năng | Facebook | Hệ thống hiện tại | Đánh giá |
|-----------|----------|------------------|----------|
| **Số loại cảm xúc** | 6 (Like, Love, Haha, Wow, Sad, Angry) | 5 (Like, Dislike, Love, Haha, Wow) | ⚠️ Thiếu 2 loại: Sad, Angry |
| **Hiển thị menu** | Hover hoặc Click vào nút Like | Chỉ Hover | ⚠️ Nên thêm Click để mở menu |
| **Toggle reaction** | Click lại cảm xúc đã chọn → Bỏ | ✅ Hoạt động đúng | ✅ OK |
| **Thay đổi cảm xúc** | Click cảm xúc khác → Thay đổi | ✅ Hoạt động đúng | ✅ OK |
| **Optimistic update** | ✅ Có | ✅ Có | ✅ OK |
| **Hiển thị số lượng** | ✅ Có (tổng + từng loại) | ✅ Có (tổng + từng loại) | ✅ OK |
| **Error handling** | ✅ Có | ✅ Có (revert khi lỗi) | ✅ OK |
| **Reaction cho comment** | ✅ Có | ✅ Có | ✅ OK |

### Chi Tiết Implementation

#### 7.1. Các Loại Cảm Xúc

**Cho Post:**
- 👍 Like (Thích)
- 👎 Dislike (Không thích)
- ❤️ Love (Thương thương)
- 😂 Haha (Haha)
- 😮 Wow (Wow)

**Cho Comment:**
- Tương tự Post, nhưng có thêm `angry` trong code (chưa hiển thị trong UI)

#### 7.2. Flow Thả Cảm Xúc

```
User hover vào nút Like
  ↓
Menu cảm xúc hiển thị (với delay 300ms để ẩn)
  ↓
User click vào một cảm xúc
  ↓
Optimistic update UI ngay lập tức
  ↓
Gọi API: POST /api/Reaction
  ↓
Backend xử lý:
  - Nếu chưa có reaction → Tạo mới
  - Nếu có reaction cùng loại → Xóa (toggle off)
  - Nếu có reaction khác loại → Cập nhật
  ↓
Response về frontend
  ↓
Nếu thành công → Giữ nguyên UI
Nếu lỗi → Revert lại trạng thái cũ
```

#### 7.3. Logic Xử Lý

**File**: `SocialMedia.jsx` - Function `handleReaction()`

```javascript
// Logic toggle:
if (currentReaction === reactionType) {
  // Click lại cảm xúc đã chọn → Bỏ cảm xúc
  newReaction = null;
  reactionsCount -= 1;
} else {
  // Click cảm xúc khác hoặc chưa có → Đặt cảm xúc mới
  // Nếu có cảm xúc cũ → Giảm count cảm xúc cũ
  // Tăng count cảm xúc mới
  newReaction = reactionType;
  reactionsCount += 1;
}
```

#### 7.4. API Integration

**Endpoint**: `POST /api/Reaction`

**Request Body:**
```json
{
  "TargetType": "POST" | "COMMENT",
  "TargetId": number,
  "ReactionType": "like" | "dislike" | "love" | "haha" | "wow" | "angry"
}
```

**Response:**
- `{ created: true }` - Tạo mới thành công
- `{ updated: true }` - Cập nhật thành công
- `{ deleted: true }` - Xóa thành công

### Điểm Mạnh ✅

1. **Optimistic Update**: UI cập nhật ngay lập tức, không cần chờ API
2. **Error Handling**: Tự động revert khi API lỗi
3. **Toggle Logic**: Hoạt động đúng như Facebook (click lại để bỏ)
4. **Thay đổi cảm xúc**: Có thể thay đổi từ cảm xúc này sang cảm xúc khác
5. **Hiển thị số lượng**: Hiển thị tổng số và số lượng từng loại cảm xúc
6. **Hỗ trợ Comment**: Có thể thả cảm xúc cho cả comment
7. **UI/UX**: Menu cảm xúc có animation, hover effect đẹp

### Điểm Cần Cải Thiện ⚠️

1. **Thiếu 2 loại cảm xúc**: 
   - ❌ Thiếu "Sad" (😢) - Facebook có
   - ❌ Thiếu "Angry" (😠) - Facebook có (có trong code comment nhưng chưa hiển thị)

2. **Cách mở menu**:
   - ⚠️ Hiện tại chỉ mở bằng hover
   - 💡 Nên thêm: Click vào nút Like cũng mở menu (giống Facebook)

3. **Inconsistency**:
   - Comment có `angry` trong code nhưng không hiển thị trong UI
   - Post không có `angry` trong code

### Đề Xuất Cải Thiện 💡

1. **Thêm 2 loại cảm xúc còn thiếu**:
   ```javascript
   // Thêm vào reaction menu
   <button onClick={() => handleReaction(post.id, 'sad')}>😢</button>
   <button onClick={() => handleReaction(post.id, 'angry')}>😠</button>
   ```

2. **Thêm click để mở menu**:
   ```javascript
   <button onClick={() => {
     // Toggle menu visibility
     const menu = document.getElementById(`reaction-menu-${post.id}`);
     menu.classList.toggle('visible');
   }}>
   ```

3. **Đồng bộ cảm xúc giữa Post và Comment**:
   - Đảm bảo cả Post và Comment có cùng các loại cảm xúc

### Kết Luận

**Tổng thể**: Chức năng thả cảm xúc hoạt động **tốt và hợp lý**, tương tự Facebook về mặt logic và UX. 

**Điểm mạnh**: Logic toggle, optimistic update, error handling đều được implement đúng cách.

**Cần cải thiện**: Thêm 2 loại cảm xúc còn thiếu (Sad, Angry) và cải thiện cách mở menu (thêm click event).

**Đánh giá**: ⭐⭐⭐⭐ (4/5 sao) - Rất tốt, chỉ cần bổ sung một số chi tiết nhỏ để hoàn thiện như Facebook.

---













