using ESCE_SYSTEM.DTOs.News;

namespace ESCE_SYSTEM.Services.NewsService
{
    public interface INewsService
    {
        Task<IEnumerable<NewsDto>> GetAllNewsAsync(int? currentUserId);
        Task<NewsDto> GetNewsByIdAsync(int newsId, int? currentUserId);
        Task<NewsDto> CreateNewsAsync(int authorId, CreateNewsDto dto);
        Task<NewsDto> UpdateNewsAsync(int newsId, UpdateNewsDto dto);
        Task DeleteNewsAsync(int newsId);
        Task<(bool liked, int likesCount)> ToggleLikeAsync(int newsId, int userId);
    }
}