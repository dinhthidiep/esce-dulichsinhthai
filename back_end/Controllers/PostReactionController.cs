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

        [HttpPost("{postId}/{reactionTypeId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> ReactToPost(int postId, byte reactionTypeId)
        {
            try
            {
                await _postReactionService.ReactToPost(postId, reactionTypeId);

                // Trả về thông báo cụ thể dựa trên loại reaction (Giả định mapping ID)
                string reactionName = GetReactionName(reactionTypeId);
                return Ok(new { message = $"Đã bày tỏ cảm xúc '{reactionName}' cho bài viết" });
            }
            catch (Exception ex)
            {
                // Thay đổi để lấy Inner Exception
                var innerExceptionMessage = ex.InnerException != null
                                           ? ex.InnerException.Message
                                           : ex.Message;

                // Log lỗi chi tiết trên server
                Console.WriteLine($"Lỗi khi ReactToPost: {innerExceptionMessage}");

                return BadRequest(new { message = innerExceptionMessage });
            }
        }

        [HttpDelete("unlike/{postReactionId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> UnlikePost(int postReactionId)
        {
            try
            {
                await _postReactionService.UnlikePost(postReactionId);
                return Ok(new { message = "Đã bỏ cảm xúc khỏi bài viết" });
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

        // Phương thức hỗ trợ để ánh xạ ReactionTypeId sang tên
        private string GetReactionName(int typeId)
        {
            switch (typeId)
            {
                case 1: return "Like";
                case 2: return "Love";
                case 3: return "Haha";
                case 4: return "Wow";
                case 5: return "Sad";
                case 6: return "Angry";
                default: return "Cảm xúc không xác định";
            }
        }
    }
}