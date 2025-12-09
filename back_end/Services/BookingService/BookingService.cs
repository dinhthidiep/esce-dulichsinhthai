using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using Microsoft.EntityFrameworkCore;

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

        public async Task<Booking> CreateAsync(Booking booking)
        {
            // Tạo booking number tự động
            booking.BookingNumber = GenerateBookingNumber();

            // Tính toán total amount
            decimal totalAmount = await CalculateTotalAmountAsync(
                booking.ServiceComboId ?? 0,
                booking.ServiceId ?? 0,
                booking.Quantity,
                booking.ItemType);

            // Kiểm tra nếu user là agency thì giảm 3%
            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user != null && user.Role != null && user.Role.Name.ToLower() == "agency")
            {
                totalAmount = totalAmount * 0.97m; // Giảm 3%
            }

            booking.TotalAmount = totalAmount;

            await _repository.CreateAsync(booking);
            return booking;
        }

        public async Task<Booking?> UpdateAsync(int id, Booking booking)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Quantity = booking.Quantity;
            existing.Notes = booking.Notes;
            existing.Status = booking.Status;
            existing.UpdatedAt = DateTime.Now;

            // Tính lại total amount nếu có thay đổi
            decimal totalAmount = await CalculateTotalAmountAsync(
                existing.ServiceComboId ?? 0,
                existing.ServiceId ?? 0,
                existing.Quantity,
                existing.ItemType);

            // Kiểm tra nếu user là agency thì giảm 3%
            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == existing.UserId);

            if (user != null && user.Role != null && user.Role.Name.ToLower() == "agency")
            {
                totalAmount = totalAmount * 0.97m; // Giảm 3%
            }

            existing.TotalAmount = totalAmount;

            await _repository.UpdateAsync(existing);
            return existing;
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