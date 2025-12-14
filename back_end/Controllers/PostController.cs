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
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpPost("CreatePost")]
        [Authorize(Roles = "Admin,Host,Agency,Tourist,Customer")]
        public async Task<ActionResult> CreatePost([FromBody] PostDto postDto)
        {
            try
            {
                var newPost = await _postService.Create(postDto);
                return Ok(new { message = "Tạo bài viết thành công", post = newPost });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("GetAllPost")]
        [AllowAnonymous]
        public async Task<ActionResult> GetAllPosts()
        {
            try
            {
                var posts = await _postService.GetAllPosts();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("approved")]
        [AllowAnonymous]
        public async Task<ActionResult> GetAllPostsApproved()
        {
            try
            {
                var posts = await _postService.GetAllPostsApproved();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllPostsPending()
        {
            try
            {
                var posts = await _postService.GetAllPostsPending();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ApprovePost([FromBody] ApprovePostDto approvePostDto)
        {
            try
            {
                await _postService.Approve(approvePostDto);
                return Ok(new { message = "Đã duyệt bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RejectPost([FromBody] RejectPostDto rejectPostDto)
        {
            try
            {
                await _postService.Reject(rejectPostDto);
                return Ok(new { message = "Đã từ chối bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("UpdatePost")]
        [Authorize(Roles = "Admin,Host,Agency,Tourist,Customer")]
        public async Task<ActionResult> UpdatePost(int id, [FromBody] PostDto postDto)
        {
            try
            {
                await _postService.Update(id, postDto);
                return Ok(new { message = "Cập nhật bài viết thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền cập nhật bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("DeletePost")]
        [Authorize(Roles = "Admin,Host,Agency,Tourist,Customer")]
        public async Task<ActionResult> DeletePost(int id)
        {
            try
            {
                await _postService.Delete(id);
                return Ok(new { message = "Xóa bài viết thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền xóa bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("GetPostById")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPostById(int id)
        {
            try
            {
                var post = await _postService.GetById(id);
                if (post == null)
                    return NotFound(new { message = "Không tìm thấy bài viết" });

                return Ok(post);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("detail/{postId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPostDetail(int postId)
        {
            try
            {
                var postDetail = await _postService.GetPostDetail(postId);
                if (postDetail == null)
                    return NotFound(new { message = "Không tìm thấy bài viết" });

                return Ok(postDetail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("review")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ReviewPost([FromBody] ReviewPostDto reviewPostDto)
        {
            try
            {
                await _postService.Review(reviewPostDto);
                return Ok(new { message = "Đã gửi yêu cầu chỉnh sửa bài viết" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}