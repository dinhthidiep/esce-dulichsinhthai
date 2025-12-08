# Database Mapping Fixes

## Các thay đổi đã thực hiện để đồng bộ với SQL script database

### 1. Bảng SERVICE
**Thêm các cột mới vào model:**
- `Images` (nvarchar(max))
- `Status` (nvarchar(50))
- `RejectComment` (nvarchar(max))
- `ReviewComments` (nvarchar(max))

**File:** `Models/Service.cs` và `Models/ESCEContext.cs`

### 2. Bảng SERVICECOMBO
**Sửa tên bảng trong mapping:**
- Từ: `Servicecombo` → Thành: `SERVICECOMBO`

**File:** `Models/ESCEContext.cs` (dòng 549)

### 3. Bảng SERVICECOMBO_DETAIL
**Sửa tên bảng và cột:**
- Tên bảng: `Servicecombo_DETAIL` → `SERVICECOMBO_DETAIL`
- Tên cột: `Servicecombo_ID` → `SERVICECOMBO_ID`

**File:** `Models/ESCEContext.cs` (dòng 576, 580, 238)

### 4. Bảng BOOKINGS
**Đã có đầy đủ các cột:**
- ID, USER_ID, BOOKING_NUMBER, COMBO_ID, SERVICE_ID
- QUANTITY, UNIT_PRICE, TOTAL_AMOUNT, ITEM_TYPE
- STATUS, NOTES, BOOKING_DATE, CONFIRMED_DATE, COMPLETED_DATE
- CREATED_AT, UPDATED_AT

### 5. Bảng ACCOUNTS
**Đã có cột IS_BANNED**

## Lưu ý
- Tất cả các mapping đã được cập nhật để khớp với SQL script
- Database name: `ESCE1`
- Connection string trong `appsettings.json` đã đúng

## Các bước tiếp theo
1. Rebuild solution
2. Chạy lại ứng dụng
3. Kiểm tra các API endpoints hoạt động đúng




















