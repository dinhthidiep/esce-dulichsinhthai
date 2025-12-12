using ESCE_SYSTEM.DTOs.News;
using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services.NewsService
{
    public class NewsService : INewsService
    {
        private const string NewsReactionType = "News";
        private readonly ESCEContext _dbContext;

        public NewsService(ESCEContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IEnumerable<NewsDto>> GetAllNewsAsync(int? currentUserId)
        {
            var query = _dbContext.News
                .Include(n => n.Account)
                    .ThenInclude(a => a.Role)
                .OrderByDescending(n => n.CreatedDate ?? DateTime.MinValue);

            var newsList = await query.ToListAsync();
            var newsIds = newsList.Select(n => n.NewsId).ToList();

            var likeMeta = await GetLikeMetaAsync(newsIds, currentUserId);

            return newsList.Select(news => ToNewsDto(news, likeMeta.counts, likeMeta.likedIds));
        }

        public async Task<NewsDto> GetNewsByIdAsync(int newsId, int? currentUserId)
        {
            var news = await _dbContext.News
                .Include(n => n.Account)
                    .ThenInclude(a => a.Role)
                .FirstOrDefaultAsync(n => n.NewsId == newsId);

            if (news == null)
            {
                throw new InvalidOperationException("Tin tức không tồn tại.");
            }

            var likeMeta = await GetLikeMetaAsync(new List<int> { newsId }, currentUserId);
            return ToNewsDto(news, likeMeta.counts, likeMeta.likedIds);
        }

        public async Task<NewsDto> CreateNewsAsync(int authorId, CreateNewsDto dto)
        {
            var accountExists = await _dbContext.Accounts.AnyAsync(a => a.Id == authorId);
            if (!accountExists)
            {
                throw new InvalidOperationException("Tài khoản không tồn tại.");
            }

            var news = new News
            {
                AccountId = authorId,
                NewsTitle = dto.Content.Trim(),
                Image = SerializeImages(dto.Images),
                SocialMediaLink = string.IsNullOrWhiteSpace(dto.SocialMediaLink) ? null : dto.SocialMediaLink.Trim(),
                CreatedDate = DateTime.UtcNow.AddHours(7)
            };

            await _dbContext.News.AddAsync(news);
            await _dbContext.SaveChangesAsync();

            return await GetNewsByIdAsync(news.NewsId, authorId);
        }

        public async Task<NewsDto> UpdateNewsAsync(int newsId, UpdateNewsDto dto)
        {
            var news = await _dbContext.News
                .Include(n => n.Account)
                    .ThenInclude(a => a.Role)
                .FirstOrDefaultAsync(n => n.NewsId == newsId);

            if (news == null)
            {
                throw new InvalidOperationException("Tin tức không tồn tại.");
            }

            if (!string.IsNullOrWhiteSpace(dto.Content))
            {
                news.NewsTitle = dto.Content.Trim();
            }

            if (dto.Images != null)
            {
                news.Image = SerializeImages(dto.Images);
            }

            if (dto.SocialMediaLink != null)
            {
                news.SocialMediaLink = string.IsNullOrWhiteSpace(dto.SocialMediaLink)
                    ? null
                    : dto.SocialMediaLink.Trim();
            }

            await _dbContext.SaveChangesAsync();

            var likeMeta = await GetLikeMetaAsync(new List<int> { news.NewsId }, null);
            return ToNewsDto(news, likeMeta.counts, likeMeta.likedIds);
        }

        public async Task DeleteNewsAsync(int newsId)
        {
            try
            {
                Console.WriteLine($"[NewsService.DeleteNewsAsync] Starting to delete news with ID: {newsId}");

                // Tìm news cần xóa
                var news = await _dbContext.News.FirstOrDefaultAsync(n => n.NewsId == newsId);
                if (news == null)
                {
                    Console.WriteLine($"[NewsService.DeleteNewsAsync] News with ID {newsId} not found");
                    throw new InvalidOperationException("Tin tức không tồn tại.");
                }

                Console.WriteLine($"[NewsService.DeleteNewsAsync] Found news: {news.NewsTitle}");

                // Xóa related reactions trước (sử dụng transaction để đảm bảo atomicity)
                using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    // Xóa reactions
                    var reactions = await _dbContext.Reactions
                        .Where(r => r.TargetType == NewsReactionType && r.TargetId == newsId)
                        .ToListAsync();

                    if (reactions.Any())
                    {
                        Console.WriteLine($"[NewsService.DeleteNewsAsync] Found {reactions.Count} reactions to delete");
                        _dbContext.Reactions.RemoveRange(reactions);
                        await _dbContext.SaveChangesAsync();
                        Console.WriteLine($"[NewsService.DeleteNewsAsync] Reactions deleted successfully");
                    }
                    else
                    {
                        Console.WriteLine($"[NewsService.DeleteNewsAsync] No reactions found for this news");
                    }

                    // Xóa news
                    _dbContext.News.Remove(news);
                    await _dbContext.SaveChangesAsync();

                    // Commit transaction
                    await transaction.CommitAsync();

                    Console.WriteLine($"[NewsService.DeleteNewsAsync] News deleted successfully");
                }
                catch (Exception ex)
                {
                    // Rollback nếu có lỗi
                    await transaction.RollbackAsync();
                    Console.WriteLine($"[NewsService.DeleteNewsAsync] Transaction rolled back due to error: {ex.Message}");
                    throw;
                }
            }
            catch (InvalidOperationException)
            {
                throw; // Re-throw để controller xử lý
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                Console.WriteLine($"[NewsService.DeleteNewsAsync] Database error: {dbEx.Message}");
                if (dbEx.InnerException != null)
                {
                    Console.WriteLine($"[NewsService.DeleteNewsAsync] InnerException: {dbEx.InnerException.Message}");
                    
                    // Kiểm tra foreign key constraint error
                    if (dbEx.InnerException.Message.Contains("FOREIGN KEY") || 
                        dbEx.InnerException.Message.Contains("REFERENCE"))
                    {
                        throw new Exception("Không thể xóa tin tức vì còn dữ liệu liên quan. Vui lòng xóa các dữ liệu liên quan trước.", dbEx);
                    }
                }
                throw new Exception($"Lỗi database khi xóa tin tức: {dbEx.Message}", dbEx);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NewsService.DeleteNewsAsync] Error: {ex.Message}");
                Console.WriteLine($"[NewsService.DeleteNewsAsync] StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[NewsService.DeleteNewsAsync] InnerException: {ex.InnerException.Message}");
                }
                throw new Exception($"Lỗi khi xóa tin tức: {ex.Message}", ex);
            }
        }

        public async Task<(bool liked, int likesCount)> ToggleLikeAsync(int newsId, int userId)
        {
            var newsExists = await _dbContext.News.AnyAsync(n => n.NewsId == newsId);
            if (!newsExists)
            {
                throw new InvalidOperationException("Tin tức không tồn tại.");
            }

            var existingReaction = await _dbContext.Reactions.FirstOrDefaultAsync(r =>
                r.TargetType == NewsReactionType &&
                r.TargetId == newsId &&
                r.UserId == userId);

            bool liked;
            if (existingReaction != null)
            {
                _dbContext.Reactions.Remove(existingReaction);
                liked = false;
            }
            else
            {
                var reaction = new Reaction
                {
                    TargetType = NewsReactionType,
                    TargetId = newsId,
                    UserId = userId,
                    ReactionType = "like",
                    CreatedAt = DateTime.UtcNow.AddHours(7)
                };
                await _dbContext.Reactions.AddAsync(reaction);
                liked = true;
            }

            await _dbContext.SaveChangesAsync();

            var likesCount = await _dbContext.Reactions
                .Where(r => r.TargetType == NewsReactionType && r.TargetId == newsId)
                .CountAsync();

            return (liked, likesCount);
        }

        private static string SerializeImages(IEnumerable<string>? images)
        {
            if (images == null)
            {
                return string.Empty;
            }

            var sanitized = images
                .Where(img => !string.IsNullOrWhiteSpace(img))
                .Select(img => img.Trim());

            return string.Join(";", sanitized);
        }

        private static string[] DeserializeImages(string? serializedImages)
        {
            if (string.IsNullOrWhiteSpace(serializedImages))
            {
                return Array.Empty<string>();
            }

            return serializedImages
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        private NewsDto ToNewsDto(News news, IDictionary<int, int> likeCounts, ISet<int> likedNews)
        {
            likeCounts.TryGetValue(news.NewsId, out var likes);

            return new NewsDto
            {
                NewsId = news.NewsId,
                Content = news.NewsTitle,
                Images = DeserializeImages(news.Image),
                SocialMediaLink = news.SocialMediaLink,
                CreatedDate = news.CreatedDate,
                AuthorId = news.AccountId,
                AuthorName = news.Account?.Name ?? string.Empty,
                AuthorAvatar = news.Account?.Avatar,
                AuthorRole = news.Account?.Role?.Name ?? string.Empty,
                LikesCount = likes,
                IsLiked = likedNews.Contains(news.NewsId)
            };
        }

        private async Task<(Dictionary<int, int> counts, HashSet<int> likedIds)> GetLikeMetaAsync(
            IEnumerable<int> newsIds,
            int? currentUserId)
        {
            var ids = newsIds.Distinct().ToList();
            var counts = new Dictionary<int, int>();
            var likedIds = new HashSet<int>();

            if (ids.Count == 0)
            {
                return (counts, likedIds);
            }

            counts = await _dbContext.Reactions
                .Where(r => r.TargetType == NewsReactionType && ids.Contains(r.TargetId))
                .GroupBy(r => r.TargetId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            if (currentUserId.HasValue)
            {
                var liked = await _dbContext.Reactions
                    .Where(r => r.TargetType == NewsReactionType &&
                                r.UserId == currentUserId.Value &&
                                ids.Contains(r.TargetId))
                    .Select(r => r.TargetId)
                    .ToListAsync();

                likedIds = liked.ToHashSet();
            }

            return (counts, likedIds);
        }
    }
}