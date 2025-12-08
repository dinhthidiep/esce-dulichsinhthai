# Tóm tắt sửa lỗi Review - Khớp với Database và Backend

## Vấn đề phát hiện:

### 1. **Review Model không khớp:**
- ❌ Frontend dùng `ComboId` - **Backend KHÔNG có field này**
- ❌ Frontend dùng `AuthorId` - **Backend dùng `UserId`**
- ❌ Frontend dùng `Content` - **Backend dùng `Comment`**
- ❌ Frontend dùng `CreatedAt` - **Backend dùng `CreatedDate`**

### 2. **Logic fetch reviews sai:**
- ❌ Filter reviews theo `ComboId` trực tiếp
- ✅ **Đúng:** Filter qua `Booking.ServiceComboId` (Review -> Booking -> ServiceComboId)

### 3. **Logic tạo review sai:**
- ❌ Gửi `ComboId`, `AuthorId`, `Content`
- ✅ **Đúng:** Gửi `BookingId`, `UserId`, `Comment`

## Các thay đổi đã thực hiện:

### 1. **Sửa fetch reviews:**
```typescript
// TRƯỚC (SAI):
const serviceReviews = allReviews.filter(review => {
  const comboId = review.ComboId || review.comboId;
  return comboId === parseInt(id);
});

// SAU (ĐÚNG):
const serviceReviews = allReviews.filter(review => {
  const booking = review.Booking || review.booking;
  if (!booking) return false;
  const comboId = booking.ServiceComboId || booking.serviceComboId;
  return comboId === parseInt(id);
});
```

### 2. **Sửa tạo review:**
```typescript
// TRƯỚC (SAI):
const reviewData = {
  ComboId: parseInt(id),
  AuthorId: userId,
  Content: reviewForm.comment || '',
  Rating: reviewForm.rating
};

// SAU (ĐÚNG):
// 1. Tìm BookingId từ bookings của user
const bookingsResponse = await axiosInstance.get(`${API_ENDPOINTS.BOOKING}/user/${userId}`);
const validBooking = userBookings.find(booking => 
  booking.ServiceComboId === parseInt(id) && 
  (booking.Status === 'confirmed' || booking.Status === 'completed')
);

// 2. Gửi review với BookingId
const reviewData = {
  BookingId: bookingId,
  UserId: userId,
  Comment: reviewForm.comment || null, // Backend dùng Comment
  Rating: reviewForm.rating
};
```

### 3. **Sửa hiển thị review:**
```typescript
// TRƯỚC (SAI):
const authorId = review.AuthorId || review.authorId;
const comment = review.Content || review.content;
const createdAt = review.CreatedAt || review.createdAt;

// SAU (ĐÚNG):
const userId = review.UserId || review.userId;
const comment = review.Comment || review.comment;
const createdAt = review.CreatedDate || review.createdDate;
```

### 4. **Sửa enrichReviews:**
```typescript
// TRƯỚC (SAI):
const authorIds = reviewsData.map(review => review.AuthorId || review.authorId);

// SAU (ĐÚNG):
const userIds = reviewsData.map(review => {
  const userId = review.UserId || review.userId;
  const userFromInclude = review.User?.Id || review.User?.id;
  return userId || userFromInclude;
});
```

### 5. **Sửa update review:**
```typescript
// TRƯỚC (SAI):
const reviewData = {
  Rating: editForm.rating,
  Content: editForm.comment || ''
};

// SAU (ĐÚNG):
const reviewData = {
  Rating: editForm.rating,
  Comment: editForm.comment || null // Backend dùng Comment
};
```

## Database Schema (Backend):

### Review Model:
```csharp
public class Review
{
    public int Id { get; set; }
    public int BookingId { get; set; }      // Required
    public int UserId { get; set; }        // Required (KHÔNG phải AuthorId)
    public int Rating { get; set; }        // Required (1-5)
    public string? Comment { get; set; }   // Nullable (KHÔNG phải Content)
    public DateTime CreatedDate { get; set; } // KHÔNG phải CreatedAt
    public string Status { get; set; } = "pending";
}
```

### Booking Model:
```csharp
public class Booking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? ServiceComboId { get; set; } // Review liên kết qua đây
    public string Status { get; set; } = "pending";
}
```

## Kết luận:

✅ **Đã sửa tất cả các field không khớp:**
- `ComboId` → `Booking.ServiceComboId` (qua Booking)
- `AuthorId` → `UserId`
- `Content` → `Comment`
- `CreatedAt` → `CreatedDate`

✅ **Đã sửa logic fetch và tạo review để khớp với database schema**

Reviews bây giờ sẽ hiển thị đúng!




















