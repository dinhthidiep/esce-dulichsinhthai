using ESCE_SYSTEM.DTOs.News;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace ESCE_SYSTEM.Services.NewsService
{
    public class NewsService : INewsService
    {
        private const string NewsReactionType = "News";
        private readonly ESCEContext _dbContext;
        private readonly IUserContextService _userContextService;

        public NewsService(ESCEContext dbContext, IUserContextService userContextService)
        {
            _dbContext = dbContext;
            _userContextService = userContextService;
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

            // Chỉ cho phép tác giả chỉnh sửa tin tức của chính mình (kể cả Admin)
            var currentUserId = _userContextService.GetCurrentUserId();
            if (news.AccountId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật tin tức này");
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
            var news = await _dbContext.News.FirstOrDefaultAsync(n => n.NewsId == newsId);
            if (news == null)
            {
                throw new InvalidOperationException("Tin tức không tồn tại.");
            }

            // Remove related reactions
            var reactions = _dbContext.Reactions
                .Where(r => r.TargetType == NewsReactionType && r.TargetId == newsId);
            _dbContext.Reactions.RemoveRange(reactions);

            _dbContext.News.Remove(news);
            await _dbContext.SaveChangesAsync();
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