-- Check completed bookings and their TOTAL_AMOUNT
-- This script verifies the data that the RevenueManagement component should fetch

-- 1. Check all bookings with completed status
SELECT 
    b.ID,
    b.USER_ID,
    b.SERVICECOMBO_ID,
    b.TOTAL_AMOUNT,
    b.STATUS,
    b.BOOKING_DATE,
    b.COMPLETED_DATE,
    sc.NAME as ServiceComboName,
    sc.HOST_ID
FROM BOOKINGS b
LEFT JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
WHERE b.STATUS = 'completed'
ORDER BY b.COMPLETED_DATE DESC;

-- 2. Check total revenue by host (sum of TOTAL_AMOUNT from completed bookings)
SELECT 
    sc.HOST_ID,
    u.FULL_NAME as HostName,
    COUNT(b.ID) as TotalCompletedBookings,
    SUM(b.TOTAL_AMOUNT) as TotalRevenue
FROM BOOKINGS b
INNER JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
INNER JOIN USERS u ON sc.HOST_ID = u.ID
WHERE b.STATUS = 'completed'
GROUP BY sc.HOST_ID, u.FULL_NAME
ORDER BY TotalRevenue DESC;

-- 3. Check monthly revenue for a specific host (replace HOST_ID with actual value)
-- Example: Get monthly revenue for host with ID = 2
SELECT 
    YEAR(b.COMPLETED_DATE) as Year,
    MONTH(b.COMPLETED_DATE) as Month,
    COUNT(b.ID) as BookingCount,
    SUM(b.TOTAL_AMOUNT) as MonthlyRevenue
FROM BOOKINGS b
INNER JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
WHERE b.STATUS = 'completed'
  AND sc.HOST_ID = 2  -- Change this to the actual host ID
GROUP BY YEAR(b.COMPLETED_DATE), MONTH(b.COMPLETED_DATE)
ORDER BY Year DESC, Month DESC;

-- 4. Check all booking statuses in the system
SELECT 
    STATUS,
    COUNT(*) as Count,
    SUM(TOTAL_AMOUNT) as TotalAmount
FROM BOOKINGS
GROUP BY STATUS;
