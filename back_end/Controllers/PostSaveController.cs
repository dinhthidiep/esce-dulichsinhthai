using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostSaveController : ControllerBase
    {
        private readonly IPostSaveService _postSaveService;

        public PostSaveController(IPostSaveService postSaveService)
        {
            _postSaveService = postSaveService;
        }

        [HttpPost("save/{postId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> SavePost(int postId)
        {
            try
            {
                await _postSaveService.SavePost(postId);
                return Ok(new { message = "Đã lưu bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("unsave/{postId}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<IActionResult> UnsavePost(int postId)
        {
            try
            {
                await _postSaveService.UnsavePost(postId);
                return Ok(new { message = "Đã bỏ lưu bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}