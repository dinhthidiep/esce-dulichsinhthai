-- Kiểm tra các role trong database
SELECT * FROM ROLES;

-- Kiểm tra user và role của họ
SELECT a.ID, a.EMAIL, a.NAME, a.ROLE_ID, r.NAME as ROLE_NAME
FROM ACCOUNTS a
JOIN ROLES r ON a.ROLE_ID = r.ID
ORDER BY a.ID;
