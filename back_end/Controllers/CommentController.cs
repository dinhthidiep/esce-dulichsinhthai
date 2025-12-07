using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> CreateComment([FromBody] PostCommentDto commentDto)
        {
            try
            {
                // DTO đã thay đổi, không cần thay đổi gì thêm ở đây
                await _commentService.Create(commentDto);
                return Ok(new { message = "Tạo bình luận thành công" });
            }
            catch (Exception ex)
            {
                // Trả về Inner Exception để gỡ lỗi sâu hơn nếu cần
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { message = innerExceptionMessage });
            }
        }

        [HttpGet("post/{postId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetCommentsByPost(int postId)
        {
            try
            {
                var comments = await _commentService.GetByPostId(postId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> UpdateComment(int id, [FromBody] UpdatePostCommentDto commentDto)
        {
            try
            {
                await _commentService.Update(id, commentDto);
                return Ok(new { message = "Cập nhật bình luận thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền cập nhật bình luận này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> DeleteComment(int id)
        {
            try
            {
                await _commentService.Delete(id);
                return Ok(new { message = "Xóa bình luận thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền xóa bình luận này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetCommentById(int id)
        {
            try
            {
                var comment = await _commentService.GetById(id);
                if (comment == null)
                    return NotFound(new { message = "Không tìm thấy bình luận" });

                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}