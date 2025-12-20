-- Check reviews for Host users
-- This script verifies the data that the ReviewManagement component should fetch

-- 1. Check all reviews with their booking and service combo info
SELECT 
    r.ID as ReviewId,
    r.RATING,
    r.COMMENT,
    r.STATUS as ReviewStatus,
    r.CREATED_DATE,
    r.USER_ID as ReviewerUserId,
    b.ID as BookingId,
    b.SERVICECOMBO_ID,
    b.STATUS as BookingStatus,
    sc.NAME as ServiceComboName,
    sc.HOST_ID
FROM REVIEWS r
LEFT JOIN BOOKINGS b ON r.BOOKING_ID = b.ID
LEFT JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
ORDER BY r.CREATED_DATE DESC;

-- 2. Check reviews grouped by host
SELECT 
    sc.HOST_ID,
    u.FULL_NAME as HostName,
    COUNT(r.ID) as TotalReviews,
    AVG(r.RATING) as AverageRating
FROM REVIEWS r
INNER JOIN BOOKINGS b ON r.BOOKING_ID = b.ID
INNER JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
INNER JOIN USERS u ON sc.HOST_ID = u.ID
GROUP BY sc.HOST_ID, u.FULL_NAME
ORDER BY TotalReviews DESC;

-- 3. Check service combos for a specific host (replace HOST_ID with actual value)
-- Example: Get service combos for host with ID = 2
SELECT 
    sc.ID,
    sc.NAME,
    sc.HOST_ID,
    COUNT(r.ID) as ReviewCount
FROM SERVICE_COMBOS sc
LEFT JOIN BOOKINGS b ON sc.ID = b.SERVICECOMBO_ID
LEFT JOIN REVIEWS r ON b.ID = r.BOOKING_ID
WHERE sc.HOST_ID = 2  -- Change this to the actual host ID
GROUP BY sc.ID, sc.NAME, sc.HOST_ID;

-- 4. Check if there are any reviews without proper booking/servicecombo links
SELECT 
    r.ID as ReviewId,
    r.BOOKING_ID,
    b.ID as BookingExists,
    b.SERVICECOMBO_ID,
    sc.ID as ServiceComboExists
FROM REVIEWS r
LEFT JOIN BOOKINGS b ON r.BOOKING_ID = b.ID
LEFT JOIN SERVICE_COMBOS sc ON b.SERVICECOMBO_ID = sc.ID
WHERE b.ID IS NULL OR sc.ID IS NULL;

-- 5. Check all hosts and their service combo counts
SELECT 
    u.ID as HostId,
    u.FULL_NAME as HostName,
    u.ROLE_ID,
    COUNT(sc.ID) as ServiceComboCount
FROM USERS u
LEFT JOIN SERVICE_COMBOS sc ON u.ID = sc.HOST_ID
WHERE u.ROLE_ID = 2  -- Host role
GROUP BY u.ID, u.FULL_NAME, u.ROLE_ID;
