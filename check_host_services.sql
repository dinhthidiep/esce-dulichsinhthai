-- Kiểm tra services của Host
-- Chạy script này để xem Host nào có services

-- 1. Xem tất cả accounts với role Host (RoleId = 2)
SELECT 
    a.Id AS HostId,
    a.Name AS HostName,
    a.Email,
    a.RoleId,
    r.Name AS RoleName
FROM Account a
LEFT JOIN Role r ON a.RoleId = r.Id
WHERE a.RoleId = 2
ORDER BY a.Id;

-- 2. Xem tất cả services và HostId của chúng
SELECT 
    s.Id AS ServiceId,
    s.Name AS ServiceName,
    s.HostId,
    a.Name AS HostName,
    s.Status,
    s.Created_At
FROM Service s
LEFT JOIN Account a ON s.HostId = a.Id
ORDER BY s.HostId, s.Id;

-- 3. Đếm số services theo từng Host
SELECT 
    s.HostId,
    a.Name AS HostName,
    COUNT(*) AS ServiceCount
FROM Service s
LEFT JOIN Account a ON s.HostId = a.Id
GROUP BY s.HostId, a.Name
ORDER BY ServiceCount DESC;

-- 4. Nếu muốn tạo service mẫu cho một Host:
-- INSERT INTO Service (Name, Description, Price, HostId, Status, Created_At)
-- VALUES ('Dịch vụ test', 'Mô tả test', 100000, YOUR_HOST_ID, 'Approved', GETDATE());
