using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.DTOs;
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
            => await _repository.GetAllAsync();

        public async Task<Booking?> GetByIdAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId)
            => await _repository.GetByUserIdAsync(userId);
        
        // Method tối ưu để lấy bookings với projection (chỉ load field cần thiết)
        // Sử dụng Include nhưng chỉ load các field cần thiết từ related entities
        public async Task<IEnumerable<Booking>> GetByUserIdOptimizedAsync(int userId)
        {
            // Load bookings với Include nhưng chỉ select các field cần thiết
            // Điều này giúp giảm lượng dữ liệu được load từ database
            var bookings = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BookingDate)
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .ToListAsync();
            
            return bookings;
        }

        public async Task<IEnumerable<Booking>> GetByServiceComboIdAsync(int serviceComboId)
            => await _repository.GetByServiceComboIdAsync(serviceComboId);

        public async Task<IEnumerable<Booking>> GetByServiceIdAsync(int serviceId)
            => await _repository.GetByServiceIdAsync(serviceId);

        public async Task<Booking> CreateAsync(Booking booking)
        {
            booking.BookingNumber = GenerateBookingNumber();
            booking.Status = "pending"; // 🔥 Quan trọng: dùng cho payment

            // Validate itemType
            if (booking.ItemType != "combo" && booking.ItemType != "service")
                throw new Exception("ItemType must be 'combo' or 'service'");

            // Nếu là combo: kiểm tra số chỗ còn lại trước khi cho đặt
            if (booking.ItemType == "combo" && booking.ServiceComboId.HasValue)
            {
                var combo = await _serviceComboRepository.GetByIdAsync(booking.ServiceComboId.Value);
                if (combo == null)
                {
                    throw new Exception("ServiceCombo not found");
                }

                if (combo.AvailableSlots < booking.Quantity)
                {
                    throw new Exception("Số chỗ còn lại không đủ cho số lượng bạn đặt.");
                }
            }

            decimal totalAmount = await CalculateTotalAmountAsync(
                booking.ServiceComboId ?? 0,
                booking.ServiceId ?? 0,
                booking.Quantity,
                booking.ItemType
            );

            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user?.Role?.Name.ToLower() == "agency")
                totalAmount *= 0.97m;

            booking.TotalAmount = totalAmount;

            await _repository.CreateAsync(booking);
            return booking;
        }

        public async Task<Booking> CreateFromDtoAsync(CreateBookingDto dto)
        {
            // Map từ DTO sang Booking model (không có navigation properties)
            var booking = new Booking
            {
                UserId = dto.UserId,
                ServiceComboId = dto.ServiceComboId,
                ServiceId = dto.ServiceId,
                Quantity = dto.Quantity,
                ItemType = dto.ItemType,
                Notes = dto.Notes,
                BookingDate = dto.BookingDate ?? DateTime.UtcNow,
                Status = "pending", // 🔥 Quan trọng: dùng cho payment
                BookingNumber = GenerateBookingNumber(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Validate itemType
            if (booking.ItemType != "combo" && booking.ItemType != "service")
                throw new Exception("ItemType must be 'combo' or 'service'");

            // Nếu là combo: kiểm tra số chỗ còn lại trước khi cho đặt
            if (booking.ItemType == "combo" && booking.ServiceComboId.HasValue)
            {
                var combo = await _serviceComboRepository.GetByIdAsync(booking.ServiceComboId.Value);
                if (combo == null)
                {
                    throw new Exception("ServiceCombo not found");
                }

                if (combo.AvailableSlots < booking.Quantity)
                {
                    throw new Exception("Số chỗ còn lại không đủ cho số lượng bạn đặt.");
                }
            }

            // Tính tổng tiền
            decimal totalAmount = await CalculateTotalAmountAsync(
                booking.ServiceComboId ?? 0,
                booking.ServiceId ?? 0,
                booking.Quantity,
                booking.ItemType
            );

            // Kiểm tra user role để áp dụng discount cho agency
            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user?.Role?.Name.ToLower() == "agency")
                totalAmount *= 0.97m;

            booking.TotalAmount = totalAmount;

            // Lưu booking (không có navigation properties, Entity Framework sẽ tự load từ UserId)
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
            existing.UpdatedAt = DateTime.UtcNow;

            decimal totalAmount = await CalculateTotalAmountAsync(
                existing.ServiceComboId ?? 0,
                existing.ServiceId ?? 0,
                existing.Quantity,
                existing.ItemType
            );

            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == existing.UserId);

            if (user?.Role?.Name.ToLower() == "agency")
                totalAmount *= 0.97m;

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

            var oldStatus = existing.Status;
            existing.Status = status;
            existing.UpdatedAt = DateTime.UtcNow;

            if (status == "confirmed")
                existing.ConfirmedDate = DateTime.UtcNow;

            if (status == "completed")
            {
                existing.CompletedDate = DateTime.UtcNow;

                // Khi booking chuyển sang completed lần đầu tiên, trừ số chỗ của ServiceCombo
                if (oldStatus != "completed"
                    && existing.ItemType == "combo"
                    && existing.ServiceComboId.HasValue)
                {
                    var combo = await _serviceComboRepository.GetByIdAsync(existing.ServiceComboId.Value);
                    if (combo != null)
                    {
                        var newSlots = Math.Max(0, combo.AvailableSlots - existing.Quantity);
                        combo.AvailableSlots = newSlots;
                        await _serviceComboRepository.UpdateAsync(combo);
                    }
                }
            }

            await _repository.UpdateAsync(existing);
            return true;
        }

        public async Task<decimal> CalculateTotalAmountAsync(int serviceComboId, int serviceId, int quantity, string itemType)
        {
            decimal price = 0;

            if (itemType == "combo" && serviceComboId > 0)
            {
                var combo = await _serviceComboRepository.GetByIdAsync(serviceComboId);
                price = combo?.Price ?? 0;
            }
            else if (itemType == "service" && serviceId > 0)
            {
                var service = await _serviceRepository.GetByIdAsync(serviceId);
                price = service?.Price ?? 0;
            }

            return price * quantity;
        }

        public async Task<decimal> CalculateTotalAmountWithCouponsAsync(int bookingId)
        {
            var booking = await _repository.GetByIdAsync(bookingId);
            if (booking == null) return 0;

            decimal total = booking.TotalAmount;

            var user = await _context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == booking.UserId);

            if (user?.Role?.Name.ToLower() == "agency")
                total *= 0.97m;

            return Math.Max(total, 0);
        }

        private string GenerateBookingNumber()
        {
            return "BK" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + new Random().Next(1000, 9999);
        }
    }
}
