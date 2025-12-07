using ESCE_SYSTEM.DTOs.News;
using ESCE_SYSTEM.Services.NewsService; // 
using ESCE_SYSTEM.Services.UserContextService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
            var currentUserId = TryGetCurrentUserId();
            var result = await _newsService.GetAllNewsAsync(currentUserId);
            return Ok(result);
        }

        [HttpGet("{newsId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNewsById(int newsId)
        {
            var currentUserId = TryGetCurrentUserId();
            var result = await _newsService.GetNewsByIdAsync(newsId, currentUserId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNews([FromBody] CreateNewsDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var authorId = _userContextService.GetCurrentUserId();
            var result = await _newsService.CreateNewsAsync(authorId, dto);
            return Ok(result);
        }

        [HttpPut("{newsId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateNews(int newsId, [FromBody] UpdateNewsDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _newsService.UpdateNewsAsync(newsId, dto);
            return Ok(result);
        }

        [HttpDelete("{newsId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNews(int newsId)
        {
            await _newsService.DeleteNewsAsync(newsId);
            return NoContent();
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