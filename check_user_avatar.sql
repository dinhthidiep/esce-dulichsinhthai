-- Kiểm tra avatar của các user
-- Chạy script này để xem user nào có avatar và user nào không có

SELECT 
    Id,
    Name,
    Email,
    Avatar,
    CASE 
        WHEN Avatar IS NULL OR Avatar = '' THEN 'Không có avatar'
        ELSE 'Có avatar'
    END AS AvatarStatus
FROM Account
ORDER BY Id;

-- Nếu muốn update avatar cho một user cụ thể:
-- UPDATE Account SET Avatar = 'URL_AVATAR_CUA_BAN' WHERE Id = YOUR_USER_ID;
