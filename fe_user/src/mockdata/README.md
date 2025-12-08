# Mock Data System

Hệ thống mockdata này được tạo để cho phép thiết kế frontend mà không cần backend chạy.

## Cấu trúc

- `index.ts`: Chứa tất cả mockdata (users, serviceCombos, bookings, reviews, posts, news, coupons, etc.)
- `mockService.ts`: Mock axios instance để thay thế tất cả API calls
- `mockAuthService.ts`: Mock auth service để thay thế fetch calls trong Au.ts

## Cách sử dụng

Hệ thống tự động sử dụng mockdata khi `USE_MOCK_DATA = true` trong:
- `src/utils/axiosInstance.ts`
- `src/API/instances/Au.ts`

## Bật/Tắt Mock Data

Để bật/tắt mockdata, thay đổi biến `USE_MOCK_DATA` trong các file:
- `src/utils/axiosInstance.ts` (dòng 7)
- `src/API/instances/Au.ts` (dòng 5)

```typescript
const USE_MOCK_DATA = true  // Bật mockdata
const USE_MOCK_DATA = false // Tắt mockdata, dùng backend thật
```

## Mock Data

### Users
- User ID 1: user1@example.com
- User ID 2: user2@example.com

### ServiceCombos
- 6 service combos mẫu với các tour phổ biến ở Đà Nẵng và Hội An

### Bookings
- 2 bookings mẫu

### Reviews
- 3 reviews mẫu

### Posts
- 2 posts mẫu

### News
- 2 news mẫu

### Coupons
- WELCOME10: Giảm 10%, tối đa 500k
- SUMMER20: Giảm 20%, tối đa 1 triệu (chỉ cho ServiceCombo ID 1)

## OTP Mock

Khi sử dụng mockdata, OTP sẽ được in ra console. Ví dụ:
```
[MOCK AUTH] OTP for user@example.com: 123456
```

## Lưu ý

- Mockdata được lưu trong memory, sẽ reset khi refresh trang
- Tất cả thao tác (create, update, delete) sẽ ảnh hưởng đến mockdata trong session hiện tại
- Để test với dữ liệu mới, chỉ cần refresh trang















