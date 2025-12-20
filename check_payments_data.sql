-- Kiểm tra tất cả payments có status = 'success' trong tháng 12/2024
SELECT 
    Id,
    Amount,
    PaymentDate,
    Status,
    PaymentType,
    TransactionId,
    CreatedAt
FROM Payments 
WHERE Status = 'success'
ORDER BY PaymentDate DESC;

-- Kiểm tra payments theo ngày trong tháng 12
SELECT 
    CAST(PaymentDate AS DATE) as PaymentDay,
    COUNT(*) as PaymentCount,
    SUM(Amount) as TotalAmount
FROM Payments 
WHERE Status = 'success' 
    AND PaymentDate >= '2024-12-01' 
    AND PaymentDate < '2025-01-01'
GROUP BY CAST(PaymentDate AS DATE)
ORDER BY PaymentDay;

-- Kiểm tra tất cả payments (kể cả pending, failed)
SELECT 
    Id,
    Amount,
    PaymentDate,
    Status,
    PaymentType,
    CreatedAt
FROM Payments 
WHERE PaymentDate >= '2024-12-01' OR CreatedAt >= '2024-12-01'
ORDER BY CreatedAt DESC;
