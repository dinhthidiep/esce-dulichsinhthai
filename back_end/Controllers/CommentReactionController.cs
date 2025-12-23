using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentReactionController : ControllerBase
    {
        private readonly ICommentReactionService _commentReactionService;

        public CommentReactionController(ICommentReactionService commentReactionService)
        {
            _commentReactionService = commentReactionService;
        }

        [HttpPost("like")]
        [Authorize(Roles = "Admin,Host,Agency,Tourist,Customer")]
        public async Task<IActionResult> LikeComment([FromBody] PostCommentLikeDto postCommentLikeDto)
        {
            try
            {
                await _commentReactionService.LikeComment(postCommentLikeDto);
                return Ok(new { message = "Đã thích bình luận" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("unlike/{commentReactionId}")]
        [Authorize(Roles = "Admin,Host,Agency,Tourist,Customer")]
        public async Task<IActionResult> UnlikeComment(int commentReactionId)
        {
            try
            {
                await _commentReactionService.UnlikeComment(commentReactionId);
                return Ok(new { message = "Đã bỏ thích bình luận" });
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

        [HttpGet("count/{commentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLikeCount(int commentId)
        {
            try
            {
                var count = await _commentReactionService.GetLikeCount(commentId);
                return Ok(new { commentId, likeCount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}