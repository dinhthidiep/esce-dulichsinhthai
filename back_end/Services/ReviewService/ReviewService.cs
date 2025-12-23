using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ESCE_SYSTEM.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ESCEContext _context;

        public ReviewService(
            IReviewRepository repository,
            IBookingRepository bookingRepository,
            ESCEContext context)
        {
            _repository = repository;
            _bookingRepository = bookingRepository;
            _context = context;
        }

        public async Task<IEnumerable<Review>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Review?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Review>> GetByBookingIdAsync(int bookingId)
        {
            return await _repository.GetByBookingIdAsync(bookingId);
        }

        public async Task<IEnumerable<Review>> GetByUserIdAsync(int userId)
        {
            return await _repository.GetByUserIdAsync(userId);
        }

        public async Task<Review?> GetByBookingIdAndUserIdAsync(int bookingId, int userId)
        {
            return await _repository.GetByBookingIdAndUserIdAsync(bookingId, userId);
        }

        public async Task<decimal> GetAverageRatingByServicecomboAsync(int ServicecomboId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Booking)
                .Where(r => r.Booking.ServiceComboId == ServicecomboId && r.Status == "approved")
                .Select(r => r.Rating)
                .ToListAsync();

            if (!reviews.Any()) return 0;

            return (decimal)reviews.Average();
        }

        public async Task<decimal> GetAverageRatingByServiceAsync(int serviceId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Booking)
                .Where(r => r.Booking.ServiceId == serviceId && r.Status == "approved")
                .Select(r => r.Rating)
                .ToListAsync();

            if (!reviews.Any()) return 0;

            return (decimal)reviews.Average();
        }

        public async Task<Review> CreateAsync(Review review)
        {
            // Ki?m tra xem booking c� t?n t?i kh�ng
            var booking = await _bookingRepository.GetByIdAsync(review.BookingId);
            if (booking == null)
            {
                throw new Exception("Booking not found");
            }

            // Ki?m tra xem user c� quy?n review booking n�y kh�ng
            if (booking.UserId != review.UserId)
            {
                throw new Exception("User can only review their own bookings");
            }

            // Chỉ cho phép review khi đã hoàn thành chuyến du lịch
            if (booking.Status != "completed")
            {
                throw new Exception("Chỉ có thể đánh giá sau khi hoàn thành chuyến du lịch");
            }

            // Ki?m tra xem user d� review booking n�y chua
            var existingReview = await GetByBookingIdAndUserIdAsync(review.BookingId, review.UserId);
            if (existingReview != null)
            {
                throw new Exception("You have already reviewed this booking");
            }

            review.CreatedDate = DateTime.Now;
            await _repository.CreateAsync(review);
            return review;
        }

        public async Task<Review?> UpdateAsync(int id, Review review)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            // Cho ph�p s?a b?t c? l�c n�o
            existing.Rating = review.Rating;
            existing.Comment = review.Comment;

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
            await _repository.UpdateAsync(existing);
            return true;
        }

        public async Task<bool> CanUserReviewAsync(int bookingId, int userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            // Kiểm tra booking thuộc về user
            if (booking.UserId != userId) return false;

            // Chỉ cho phép review khi đã hoàn thành chuyến du lịch
            if (booking.Status != "completed") return false;

            // Kiểm tra user đã review chưa
            var existingReview = await GetByBookingIdAndUserIdAsync(bookingId, userId);
            if (existingReview != null) return false;

            return true;
        }

        // --------------------------------------
        // REPLY REVIEW METHODS
        // --------------------------------------
        public async Task<Review> CreateReplyAsync(int parentReviewId, int authorId, string content)
        {
            // Kiểm tra parent review có tồn tại không
            var parentReview = await GetByIdAsync(parentReviewId);
            if (parentReview == null)
            {
                throw new Exception("Parent review not found");
            }

            // Kiểm tra đã có reply chưa (mỗi review chỉ có 1 reply)
            var existingReply = await _context.Reviews
                .Where(r => r.ParentReviewId == parentReviewId)
                .FirstOrDefaultAsync();

            if (existingReply != null)
            {
                throw new Exception("This review already has a reply");
            }

            // Tạo reply (không cần Rating, BookingId lấy từ parent)
            var reply = new Review
            {
                ParentReviewId = parentReviewId,
                BookingId = parentReview.BookingId,
                UserId = authorId,
                Rating = 0, // Reply không có rating
                Comment = content,
                Status = "approved", // Reply tự động approved
                CreatedDate = DateTime.Now
            };

            await _repository.CreateAsync(reply);
            return reply;
        }

        public async Task<Review?> UpdateReplyAsync(int replyId, string content)
        {
            var reply = await GetByIdAsync(replyId);
            if (reply == null || reply.ParentReviewId == null)
            {
                return null; // Không phải reply hoặc không tồn tại
            }

            reply.Comment = content;
            await _repository.UpdateAsync(reply);
            return reply;
        }

        public async Task<bool> DeleteReplyAsync(int replyId)
        {
            var reply = await GetByIdAsync(replyId);
            if (reply == null || reply.ParentReviewId == null)
            {
                return false; // Không phải reply hoặc không tồn tại
            }

            await _repository.DeleteAsync(replyId);
            return true;
        }

        public async Task<IEnumerable<Review>> GetRepliesByParentIdAsync(int parentReviewId)
        {
            return await _context.Reviews
                .Where(r => r.ParentReviewId == parentReviewId)
                .Include(r => r.User)
                .OrderBy(r => r.CreatedDate)
                .ToListAsync();
        }
    }
}
