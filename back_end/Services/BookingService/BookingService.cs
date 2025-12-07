using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using Microsoft.EntityFrameworkCore;
using ESCE_SYSTEM.DTOs;

namespace ESCE_SYSTEM.Services
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _repository;
        private readonly IServiceRepository _serviceRepository;
        private readonly IServiceComboRepository _serviceComboRepository;
        private readonly ESCEContext _context;

        public BookingService(
            IBookingRepository repository,
            IServiceRepository serviceRepository,
            IServiceComboRepository serviceComboRepository,
            ESCEContext context)
        {
            _repository = repository;
            _serviceRepository = serviceRepository;
            _serviceComboRepository = serviceComboRepository;
            _context = context;
        }

        public async Task<IEnumerable<Booking>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Booking?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId)
        {
            return await _repository.GetByUserIdAsync(userId);
        }

        public async Task<IEnumerable<Booking>> GetByServiceComboIdAsync(int serviceComboId)
        {
            return await _repository.GetByServiceComboIdAsync(serviceComboId);
        }

        public async Task<IEnumerable<Booking>> GetByServiceIdAsync(int serviceId)
        {
            return await _repository.GetByServiceIdAsync(serviceId);
        }

        public async Task<Booking> CreateAsync(CreateBookingDto bookingDto)
        {
            // 1. Ánh xạ DTO sang Model Booking (hoặc sử dụng AutoMapper)
            var booking = new Booking
            {
                UserId = bookingDto.UserId,
                ServiceComboId = bookingDto.ServiceComboId,
                ServiceId = bookingDto.ServiceId,
                Quantity = bookingDto.Quantity,
                ItemType = bookingDto.ItemType,
                BookingDate = bookingDto.BookingDate,
                Notes = bookingDto.Notes,

                // Thiết lập các trường mặc định/tính toán
                Status = "pending", // Thiết lập giá trị mặc định trong Service logic
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                // BookingNumber và TotalAmount sẽ được tính ở dưới
            };

            // 2. Logic tạo Booking Number và Tính toán Total Amount (giữ nguyên)
            booking.BookingNumber = GenerateBookingNumber();

            decimal totalAmount = await CalculateTotalAmountAsync(
                booking.ServiceComboId ?? 0,
                booking.ServiceId ?? 0,
                booking.Quantity,
                booking.ItemType);

            // ... Logic giảm 3% cho Agency (giữ nguyên) ...

            booking.TotalAmount = totalAmount;

            await _repository.CreateAsync(booking);
            return booking;
        }

        public async Task<Booking> UpdateAsync(int bookingId, UpdateBookingDto bookingDto)
        {
            // 1. Tìm Booking hiện có
            var booking = await _repository.GetByIdAsync(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found.");
            }

            // 2. Áp dụng các thay đổi từ DTO

            // Cập nhật trường Quantity và các ID Service/Combo
            int newQuantity = bookingDto.Quantity ?? booking.Quantity;
            int? newComboId = bookingDto.ServiceComboId ?? booking.ServiceComboId;
            int? newServiceId = bookingDto.ServiceId ?? booking.ServiceId;
            string newItemType = bookingDto.ItemType ?? booking.ItemType;

            // 3. Nếu có thay đổi Quantity, Service/Combo, hoặc ItemType: Tính toán lại TotalAmount
            bool needsRecalculation = newQuantity != booking.Quantity ||
                                      newComboId != booking.ServiceComboId ||
                                      newServiceId != booking.ServiceId ||
                                      newItemType != booking.ItemType;

            if (needsRecalculation)
            {
                // Cập nhật các trường trước khi tính toán
                booking.Quantity = newQuantity;
                booking.ServiceComboId = newComboId;
                booking.ServiceId = newServiceId;
                booking.ItemType = newItemType;

                // Gọi lại hàm tính toán (giả định hàm CalculateTotalAmountAsync đã có)
                decimal newTotalAmount = await CalculateTotalAmountAsync(
                    booking.ServiceComboId ?? 0,
                    booking.ServiceId ?? 0,
                    booking.Quantity,
                    booking.ItemType);

                // ... (Áp dụng logic giảm 3% Agency nếu cần) ...

                booking.TotalAmount = newTotalAmount;
            }

            // 4. Cập nhật các trường còn lại (Notes, BookingDate, Status)
            if (bookingDto.Notes != null) booking.Notes = bookingDto.Notes;
            if (bookingDto.BookingDate.HasValue) booking.BookingDate = bookingDto.BookingDate.Value;
            if (bookingDto.Status != null)
            {
                booking.Status = bookingDto.Status;

                // Logic cập nhật ngày dựa trên trạng thái (Ví dụ)
                if (booking.Status.ToLower() == "confirmed")
                {
                    booking.ConfirmedDate = DateTime.Now;
                }
                else if (booking.Status.ToLower() == "completed")
                {
                    booking.CompletedDate = DateTime.Now;
                }
            }

            // 5. Cập nhật ngày sửa đổi (UpdatedAt) và lưu
            booking.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(booking);
            return booking;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            existing.Status = status;
            existing.UpdatedAt = DateTime.Now;

            if (status == "confirmed")
                existing.ConfirmedDate = DateTime.Now;
            else if (status == "completed")
                existing.CompletedDate = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return true;
        }

        public async Task<decimal> CalculateTotalAmountAsync(int serviceComboId, int serviceId, int quantity, string itemType)
        {
            decimal unitPrice = 0;

            if (itemType == "combo" && serviceComboId > 0)
            {
                var serviceCombo = await _serviceComboRepository.GetByIdAsync(serviceComboId);
                if (serviceCombo != null)
                    unitPrice = serviceCombo.Price;
            }
            else if (itemType == "service" && serviceId > 0)
            {
                var service = await _serviceRepository.GetByIdAsync(serviceId);
                if (service != null)
                    unitPrice = service.Price;
            }

            return unitPrice * quantity;
        }

        public async Task<decimal> CalculateTotalAmountWithCouponsAsync(int bookingId)
        {
            var booking = await _repository.GetByIdAsync(bookingId);
            if (booking == null) return 0;

            decimal totalAmount = booking.TotalAmount;

            // Kiểm tra nếu user là agency thì giảm 3%
            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user != null && user.Role != null && user.Role.Name.ToLower() == "agency")
            {
                totalAmount = totalAmount * 0.97m; // Giảm 3%
            }

            // Áp dụng coupon: tạm thời bỏ qua tính giảm trực tiếp (có thể bổ sung sau)

            return Math.Max(totalAmount, 0); // Đảm bảo không âm
        }

        private string GenerateBookingNumber()
        {
            return "BK" + DateTime.Now.ToString("yyyyMMddHHmmss") + new Random().Next(1000, 9999);
        }
    }
}