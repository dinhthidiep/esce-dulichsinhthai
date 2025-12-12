using ESCE_SYSTEM.DTOs.News;
using ESCE_SYSTEM.Services.NewsService;
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class NewsController : ControllerBase
    {
        private readonly INewsService _newsService;
        private readonly IUserContextService _userContextService;

        public NewsController(INewsService newsService, IUserContextService userContextService)
        {
            _newsService = newsService;
            _userContextService = userContextService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllNews()
        {
            try
            {
                var currentUserId = TryGetCurrentUserId();
                var result = await _newsService.GetAllNewsAsync(currentUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lấy danh sách tin tức: {ex.Message}", error = ex.GetType().Name });
            }
        }

        [HttpGet("{newsId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNewsById(int newsId)
        {
            try
            {
                var currentUserId = TryGetCurrentUserId();
                var result = await _newsService.GetNewsByIdAsync(newsId, currentUserId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lấy tin tức: {ex.Message}", error = ex.GetType().Name });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNews([FromBody] CreateNewsDto dto)
        {
            try
            {
                // Kiểm tra ModelState validation
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                // Kiểm tra null
                if (dto == null)
                {
                    return BadRequest(new { message = "Dữ liệu tin tức không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(dto.Content))
                {
                    return BadRequest(new { message = "Nội dung tin tức không được để trống." });
                }

                // Kiểm tra quyền Admin
                if (!_userContextService.IsAdmin())
                {
                    return Forbid("Chỉ Admin mới có thể đăng tin tức.");
                }

                var authorId = _userContextService.GetCurrentUserId();
                var result = await _newsService.CreateNewsAsync(authorId, dto);
                return Ok(new { message = "Tạo tin tức thành công", news = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
            }
        }

        [HttpPut("{newsId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateNews(int newsId, [FromBody] UpdateNewsDto dto)
        {
            try
            {
                // Kiểm tra ModelState validation
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                // Kiểm tra null
                if (dto == null)
                {
                    return BadRequest(new { message = "Dữ liệu tin tức không được để trống." });
                }

                // Kiểm tra quyền Admin
                if (!_userContextService.IsAdmin())
                {
                    return Forbid("Chỉ Admin mới có thể chỉnh sửa tin tức.");
                }

                var result = await _newsService.UpdateNewsAsync(newsId, dto);
                return Ok(new { message = "Cập nhật tin tức thành công", news = result });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
            }
        }

        [HttpDelete("{newsId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNews(int newsId)
        {
            try
            {
                Console.WriteLine($"[NewsController.DeleteNews] Request to delete news ID: {newsId}");

                // Kiểm tra quyền Admin
                if (!_userContextService.IsAdmin())
                {
                    Console.WriteLine($"[NewsController.DeleteNews] User is not Admin");
                    return Forbid("Chỉ Admin mới có thể xóa tin tức.");
                }

                Console.WriteLine($"[NewsController.DeleteNews] User is Admin, proceeding with delete");

                await _newsService.DeleteNewsAsync(newsId);
                
                Console.WriteLine($"[NewsController.DeleteNews] News deleted successfully");
                return Ok(new { message = "Xóa tin tức thành công" });
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"[NewsController.DeleteNews] News not found: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NewsController.DeleteNews] ========== ERROR ==========");
                Console.WriteLine($"[NewsController.DeleteNews] Error Type: {ex.GetType().Name}");
                Console.WriteLine($"[NewsController.DeleteNews] Error Message: {ex.Message}");
                Console.WriteLine($"[NewsController.DeleteNews] StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[NewsController.DeleteNews] InnerException Type: {ex.InnerException.GetType().Name}");
                    Console.WriteLine($"[NewsController.DeleteNews] InnerException Message: {ex.InnerException.Message}");
                    Console.WriteLine($"[NewsController.DeleteNews] InnerException StackTrace: {ex.InnerException.StackTrace}");
                }
                Console.WriteLine($"[NewsController.DeleteNews] ===========================");

                return BadRequest(new { 
                    message = ex.Message, 
                    error = ex.GetType().Name,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPost("{newsId:int}/like")]
        [Authorize]
        public async Task<IActionResult> ToggleLike(int newsId)
        {
            var userId = _userContextService.GetCurrentUserId();
            var (liked, likesCount) = await _newsService.ToggleLikeAsync(newsId, userId);
            return Ok(new { liked, likesCount });
        }

        private int? TryGetCurrentUserId()
        {
            var userIdString = _userContextService.UserId;
            if (int.TryParse(userIdString, out var userId))
            {
                return userId;
            }
            return null;
        }
    }
}