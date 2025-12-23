using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ESCEContext _context;

        public ReviewRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Review>> GetAllAsync()
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<Review?> GetByIdAsync(int id)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<IEnumerable<Review>> GetByBookingIdAsync(int bookingId)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .Where(r => r.BookingId == bookingId)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetByUserIdAsync(int userId)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.Booking)
                    .ThenInclude(b => b.ServiceCombo)
                .Include(r => r.User)
                .Where(r => r.UserId == userId && r.ParentReviewId == null) // Chỉ lấy review chính, không lấy reply
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<Review?> GetByBookingIdAndUserIdAsync(int bookingId, int userId)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.BookingId == bookingId && r.UserId == userId);
        }

        public async Task<IEnumerable<Review>> GetByRatingAsync(int rating)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .Where(r => r.Rating == rating)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetByStatusAsync(string status)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                    .ThenInclude(b => b.User)
                .Include(r => r.User)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task CreateAsync(Review review)
        {
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Review review)
        {
            _context.Reviews.Update(review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review != null)
            {
                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();
            }
        }
    }
}