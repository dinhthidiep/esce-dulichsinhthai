# Thông tin đăng nhập Mock Data

## Tài khoản mẫu theo Role

### 1. Admin (Role: 1)
- **Email**: `admin@esce.com`
- **Password**: Bất kỳ (mockdata chấp nhận mọi password)
- **Quyền**: Quản trị viên hệ thống

### 2. Host (Role: 2)
- **Email**: `host@esce.com`
- **Password**: Bất kỳ (mockdata chấp nhận mọi password)
- **Quyền**: Chủ tour, quản lý các service combos

### 3. Agency (Role: 3)
- **Email**: `agency@esce.com`
- **Password**: Bất kỳ (mockdata chấp nhận mọi password)
- **Quyền**: Công ty du lịch, đại lý

### 4. Tourist (Role: 4)
- **Email**: `tourist@esce.com`
- **Password**: Bất kỳ (mockdata chấp nhận mọi password)
- **Quyền**: Khách du lịch, người dùng cuối

### 5. Tourist Level 0 (Role: 4, MembershipTier: none)
- **Email**: `level0@esce.com`
- **Password**: Bất kỳ (mockdata chấp nhận mọi password)
- **Quyền**: Khách du lịch, chưa có gói thành viên
- **MembershipTier**: `none` (Level 0 - chưa mua dịch vụ nào)
- **Dùng để test**: Giao diện "Ưu đãi dành cho bạn" khi chưa có gói thành viên

## Lưu ý

- Trong mockdata, **mọi password đều được chấp nhận** cho các tài khoản trên
- Nếu đăng nhập với email không tồn tại, hệ thống sẽ tự động tạo user mới với role **tourist (4)**
- Đăng ký tài khoản mới sẽ có role **tourist (4)** mặc định

## Cấu trúc Role

- **Role 1**: Admin - Quản trị viên
- **Role 2**: Host - Chủ tour
- **Role 3**: Agency - Công ty du lịch
- **Role 4**: Tourist - Khách du lịch




