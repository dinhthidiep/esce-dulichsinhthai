-- Kiểm tra status của các booking
-- Chạy script này để xem booking nào có thể review (status = 'completed')

SELECT 
    b.Id AS BookingId,
    b.UserId,
    a.Name AS UserName,
    b.Status,
    b.ServiceId,
    b.ServiceComboId,
    b.CreatedAt,
    b.UpdatedAt,
    CASE 
        WHEN b.Status = 'completed' THEN 'Có thể review'
        ELSE 'Chưa thể review (cần status = completed)'
    END AS CanReview
FROM Booking b
LEFT JOIN Account a ON b.UserId = a.Id
ORDER BY b.Id DESC;

-- Nếu muốn update status của một booking để test review:
-- UPDATE Booking SET Status = 'completed' WHERE Id = YOUR_BOOKING_ID;
