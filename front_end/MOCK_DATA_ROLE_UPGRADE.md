# Mock Data - Nâng cấp vai trò

## ⚠️ Lưu ý quan trọng

**Chỉ Customer mới có thể gửi yêu cầu nâng cấp vai trò!**

- Sau khi approve, role của user thay đổi từ Customer → Host/Agency
- Các certificate đã approve sẽ không còn hiển thị (vì role đã thay đổi)
- Mock data chỉ hiển thị các đơn từ Customer với status: **Pending**, **Review**, **Rejected**

## Cách bật Mock Data

Để xem mock data, mở file `front_end/src/api/instances/RoleUpgradeApi.ts` và đổi:

```typescript
const USE_MOCK_ROLE_UPGRADE = false
```

thành:

```typescript
const USE_MOCK_ROLE_UPGRADE = true
```

## Mock Data hiện có

### Agency Certificates (6 items) - Tất cả từ Customer

1. **Công ty Du lịch ABC** - Status: Pending
   - User: Nguyễn Văn A (Customer) - customer1@example.com
   - Phone: 0901234567
   - Website: https://abc-travel.vn
   - Created: 2 ngày trước

2. **Công ty Lữ hành Việt Nam** - Status: Pending
   - User: Trần Thị B (Customer) - customer2@example.com
   - Phone: 0923456789
   - Website: https://vietnamtravel.vn
   - Created: 1 ngày trước

3. **Công ty Du lịch Sinh thái** - Status: Review
   - User: Lê Văn C (Customer) - customer3@example.com
   - Phone: 0934567890
   - Website: https://ecotravel.vn
   - Created: 5 ngày trước, Updated: 1 ngày trước

4. **Công ty Du lịch Quốc tế** - Status: Rejected
   - User: Phạm Thị D (Customer) - customer4@example.com
   - Phone: 0945678901
   - Website: https://internationaltravel.com
   - Reject Comment: "Giấy phép kinh doanh không hợp lệ, vui lòng cung cấp bản gốc"
   - Created: 10 ngày trước, Rejected: 8 ngày trước

5. **Công ty Tổ chức Tour** - Status: Pending
   - User: Hoàng Văn E (Customer) - customer5@example.com
   - Phone: 0956789012
   - Website: https://tourorg.vn
   - Created: 12 giờ trước

6. **Công ty Du lịch Miền Trung** - Status: Pending
   - User: Võ Thị F (Customer) - customer6@example.com
   - Phone: 0967890123
   - Website: https://mientrungtravel.vn
   - Created: 6 giờ trước

### Host Certificates (7 items) - Tất cả từ Customer

1. **Homestay Đà Lạt Xinh** - Status: Pending
   - Host: Lê Văn G (Customer) - customer7@example.com
   - Phone: 0987654321
   - Created: 3 ngày trước

2. **Villa Biển Xanh** - Status: Rejected
   - Host: Phạm Thị H (Customer) - customer8@example.com
   - Phone: 0977777777
   - Reject Comment: "Thiếu giấy tờ xác minh địa chỉ kinh doanh"
   - Created: 10 ngày trước, Rejected: 5 ngày trước

3. **Resort Núi Rừng** - Status: Pending
   - Host: Trần Văn I (Customer) - customer9@example.com
   - Phone: 0955555555
   - Created: 1 ngày trước

4. **Khu Cắm Trại Thiên Nhiên** - Status: Review
   - Host: Lê Thị K (Customer) - customer10@example.com
   - Phone: 0944444444
   - Created: 6 ngày trước, Updated: 2 ngày trước

5. **Nhà Nghỉ Biển Đẹp** - Status: Pending
   - Host: Phạm Văn L (Customer) - customer11@example.com
   - Phone: 0933333333
   - Created: 6 giờ trước

6. **Boutique Hotel Phố Cổ** - Status: Rejected
   - Host: Hoàng Thị M (Customer) - customer12@example.com
   - Phone: 0922222222
   - Reject Comment: "Giấy phép kinh doanh đã hết hạn, cần gia hạn"
   - Created: 12 ngày trước, Rejected: 9 ngày trước

7. **Farm Stay Sinh thái** - Status: Pending
   - Host: Nguyễn Văn N (Customer) - customer13@example.com
   - Phone: 0911111111
   - Created: 4 ngày trước

## Tổng kết

- **Agency Certificates**: 6 items (tất cả từ Customer)
  - Pending: 4
  - Rejected: 1
  - Review: 1

- **Host Certificates**: 7 items (tất cả từ Customer)
  - Pending: 4
  - Rejected: 2
  - Review: 1

- **Tổng cộng**: 13 yêu cầu nâng cấp vai trò từ Customer

## Các trạng thái có trong mock data

- ✅ **Pending**: Đang chờ duyệt (8 items) - Chỉ từ Customer
- ✅ **Rejected**: Đã từ chối (3 items) - Chỉ từ Customer
- ✅ **Review**: Yêu cầu bổ sung thông tin (2 items) - Chỉ từ Customer
- ❌ **Approved**: Không có trong mock data (vì sau khi approve, role đã thay đổi nên không còn hiển thị)

