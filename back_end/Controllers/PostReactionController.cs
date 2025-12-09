using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostReactionController : ControllerBase
    {
        private readonly IPostReactionService _postReactionService;

        public PostReactionController(IPostReactionService postReactionService)
        {
            _postReactionService = postReactionService;
        }

        [HttpPost("like/{postId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> LikePost(int postId)
        {
            try
            {
                await _postReactionService.LikePost(postId);
                return Ok(new { message = "Đã thích bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("unlike/{postReactionId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> UnlikePost(int postReactionId)
        {
            try
            {
                await _postReactionService.UnlikePost(postReactionId);
                return Ok(new { message = "Đã bỏ thích bài viết" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền bỏ lượt thích này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("count/{postId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLikeCount(int postId)
        {
            try
            {
                var count = await _postReactionService.GetLikeCount(postId);
                return Ok(new { postId, likeCount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}