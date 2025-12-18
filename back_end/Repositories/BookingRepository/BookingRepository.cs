using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly ESCEContext _context;

        public BookingRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Booking>> GetAllAsync()
        {
            // Load bookings first without includes to check if basic columns exist
            return await _context.Bookings
                .Include(b => b.User)
                   .ThenInclude(u => u.Role)
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .ToListAsync();
        }

        public async Task<Booking?> GetByIdAsync(int id)
        {
            return await _context.Bookings
                .Include(b => b.User)
                    .ThenInclude(u => u.Role)
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId)
        {
            // Chỉ load ServiceCombo và Service vì MapToDto không sử dụng User/Role
            // Điều này giảm số lượng JOIN và tăng tốc độ query đáng kể
            return await _context.Bookings
                .AsNoTracking() // Tăng tốc độ query bằng cách không track changes
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BookingDate) // Sắp xếp để dễ đọc và có thể tối ưu index
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByServiceComboIdAsync(int ServicecomboId)
        {
            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.User)
                    .ThenInclude(u => u.Role)
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .Where(b => b.ServiceComboId == ServicecomboId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByServiceIdAsync(int serviceId)
        {
            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.User)
                    .ThenInclude(u => u.Role)
                .Include(b => b.ServiceCombo)
                .Include(b => b.Service)
                .Where(b => b.ServiceId == serviceId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        public async Task CreateAsync(Booking booking)
        {
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking != null)
            {
                _context.Bookings.Remove(booking);
                await _context.SaveChangesAsync();
            }
        }
    }
}
