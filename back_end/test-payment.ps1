# ============================================
# SCRIPT TEST THANH TOÁN PAYOS
# ============================================

$baseUrl = "http://localhost:5002"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TEST THANH TOÁN PAYOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Tạo payment intent cho booking
Write-Host "1. Test tạo payment intent cho Booking ID = 3..." -ForegroundColor Yellow
$bookingPayment = @{
    BookingId = 3
    Amount = 100000
    Description = "Thanh toán cho đặt dịch vụ #3"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/payment/create-intent" `
        -Method POST `
        -ContentType "application/json" `
        -Body $bookingPayment
    
    Write-Host "✅ Thành công!" -ForegroundColor Green
    Write-Host "Checkout URL: $($response.CheckoutUrl)" -ForegroundColor Green
    Write-Host "Order Code: $($response.OrderCode)" -ForegroundColor Green
    Write-Host ""
    
    # Mở checkout URL trong browser
    $openBrowser = Read-Host "Bạn có muốn mở checkout URL trong browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $response.CheckoutUrl
    }
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Kiểm tra payment status
Write-Host "2. Kiểm tra payment status của Booking ID = 3..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/api/payment/status/3" `
        -Method GET `
        -ContentType "application/json"
    
    Write-Host "✅ Thành công!" -ForegroundColor Green
    Write-Host "Payment Status: $($status.Status)" -ForegroundColor Green
    Write-Host "Amount: $($status.Amount)" -ForegroundColor Green
    Write-Host "Transaction ID: $($status.TransactionId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Tạo payment cho upgrade Agency
Write-Host "3. Test tạo payment cho upgrade Agency (User ID = 5)..." -ForegroundColor Yellow
$upgradePayment = @{
    UserId = 5
    UpgradeType = "Agency"
    Amount = 1000000
    Description = "Thanh toán phí nâng cấp tài khoản lên Agency"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/payment/create-upgrade-payment" `
        -Method POST `
        -ContentType "application/json" `
        -Body $upgradePayment
    
    Write-Host "✅ Thành công!" -ForegroundColor Green
    Write-Host "Checkout URL: $($response.CheckoutUrl)" -ForegroundColor Green
    Write-Host "Order Code: $($response.OrderCode)" -ForegroundColor Green
    Write-Host ""
    
    # Mở checkout URL trong browser
    $openBrowser = Read-Host "Bạn có muốn mở checkout URL trong browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $response.CheckoutUrl
    }
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TEST HOÀN TẤT!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan




