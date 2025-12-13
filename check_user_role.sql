-- Check user role for trinhhung27012003@gmail.com
SELECT a.Id, a.Email, a.RoleId, r.Name as RoleName
FROM Accounts a
JOIN Roles r ON a.RoleId = r.Id
WHERE a.Email = 'trinhhung27012003@gmail.com';

-- Check all roles in database
SELECT * FROM Roles;
