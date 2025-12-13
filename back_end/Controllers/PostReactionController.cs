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
        [Authorize(Roles = "Admin,Host,Agency,tourist")]
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

        [HttpPost("{postId}/{reactionTypeId}")]
        [Authorize(Roles = "Admin,Host,Agency,tourist")]
        public async Task<IActionResult> ReactToPost(int postId, byte reactionTypeId)
        {
            try
            {
                await _postReactionService.ReactToPost(postId, reactionTypeId);
                
                var reactionMessages = new Dictionary<byte, string>
                {
                    { 1, "Đã thích bài viết" },
                    { 2, "Đã yêu thích bài viết" },
                    { 3, "Đã haha bài viết" },
                    { 4, "Đã wow bài viết" },
                    { 5, "Đã buồn với bài viết" },
                    { 6, "Đã phẫn nộ với bài viết" }
                };
                
                var message = reactionMessages.ContainsKey(reactionTypeId) 
                    ? reactionMessages[reactionTypeId] 
                    : "Đã phản ứng với bài viết";
                
                return Ok(new { message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("unlike/{postReactionId}")]
        [Authorize(Roles = "Admin,Host,Agency,tourist")]
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