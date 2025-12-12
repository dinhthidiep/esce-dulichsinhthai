using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
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
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> CreatePost([FromBody] PostDto postDto)
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
                if (postDto == null)
                {
                    return BadRequest(new { message = "Dữ liệu bài viết không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(postDto.PostContent))
                {
                    return BadRequest(new { message = "Nội dung bài viết không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(postDto.PosterName))
                {
                    return BadRequest(new { message = "Tên người đăng không được để trống." });
                }

                var newPost = await _postService.Create(postDto);
                return Ok(new { message = "Tạo bài viết thành công", post = newPost });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("GetAllPost")]
        [AllowAnonymous]
        public async Task<ActionResult> GetAllPosts()
        {
            try
            {
                Console.WriteLine("[PostController.GetAllPosts] Request received");
                var posts = await _postService.GetAllPosts();
                Console.WriteLine($"[PostController.GetAllPosts] Service returned {posts?.Count ?? 0} posts");
                
                if (posts == null)
                {
                    Console.WriteLine("[PostController.GetAllPosts] Posts is null, returning empty list");
                    return Ok(new List<PostResponseDto>());
                }
                
                Console.WriteLine($"[PostController.GetAllPosts] Returning {posts.Count} posts to client");
                return Ok(posts);
            }
            catch (Exception ex)
            {
                // Log chi tiết lỗi
                Console.WriteLine($"[PostController.GetAllPosts] ========== ERROR ==========");
                Console.WriteLine($"[PostController.GetAllPosts] Error Type: {ex.GetType().Name}");
                Console.WriteLine($"[PostController.GetAllPosts] Error Message: {ex.Message}");
                Console.WriteLine($"[PostController.GetAllPosts] StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[PostController.GetAllPosts] InnerException Type: {ex.InnerException.GetType().Name}");
                    Console.WriteLine($"[PostController.GetAllPosts] InnerException Message: {ex.InnerException.Message}");
                    Console.WriteLine($"[PostController.GetAllPosts] InnerException StackTrace: {ex.InnerException.StackTrace}");
                }
                Console.WriteLine($"[PostController.GetAllPosts] ===========================");
                
                return BadRequest(new { 
                    message = $"Lỗi khi lấy danh sách bài viết: {ex.Message}",
                    error = ex.GetType().Name,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
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
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> UpdatePost(int id, [FromBody] PostDto postDto)
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
                if (postDto == null)
                {
                    return BadRequest(new { message = "Dữ liệu bài viết không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(postDto.PostContent))
                {
                    return BadRequest(new { message = "Nội dung bài viết không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(postDto.PosterName))
                {
                    return BadRequest(new { message = "Tên người đăng không được để trống." });
                }

                await _postService.Update(id, postDto);
                return Ok(new { message = "Cập nhật bài viết thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền cập nhật bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
            }
        }

        [HttpDelete("DeletePost")]
        [Authorize(Roles = "Admin,Host,Agency,Customer")]
        public async Task<ActionResult> DeletePost([FromBody] DeletePostDto deletePostDto)
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
                if (deletePostDto == null)
                {
                    return BadRequest(new { message = "Dữ liệu xóa bài viết không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(deletePostDto.PostId))
                {
                    return BadRequest(new { message = "ID bài viết không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(deletePostDto.Reason))
                {
                    return BadRequest(new { message = "Lý do xóa không được để trống." });
                }

                await _postService.Delete(deletePostDto);
                return Ok(new { message = "Xóa bài viết thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền xóa bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
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

        [HttpPut("lock")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> LockPost([FromBody] LockPostDto lockPostDto)
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
                if (lockPostDto == null)
                {
                    return BadRequest(new { message = "Dữ liệu khóa bài viết không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(lockPostDto.PostId))
                {
                    return BadRequest(new { message = "ID bài viết không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(lockPostDto.Reason))
                {
                    return BadRequest(new { message = "Lý do khóa không được để trống." });
                }

                await _postService.LockPost(lockPostDto);
                return Ok(new { message = "Đã khóa bài viết" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền khóa bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
            }
        }

        [HttpPut("unlock")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UnlockPost([FromBody] UnlockPostDto unlockPostDto)
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
                if (unlockPostDto == null)
                {
                    return BadRequest(new { message = "Dữ liệu mở khóa bài viết không được để trống." });
                }

                // Kiểm tra các field bắt buộc
                if (string.IsNullOrWhiteSpace(unlockPostDto.PostId))
                {
                    return BadRequest(new { message = "ID bài viết không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(unlockPostDto.Reason))
                {
                    return BadRequest(new { message = "Lý do mở khóa không được để trống." });
                }

                await _postService.UnlockPost(unlockPostDto);
                return Ok(new { message = "Đã mở khóa bài viết" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền mở khóa bài viết này");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, error = ex.GetType().Name });
            }
        }
    }
}