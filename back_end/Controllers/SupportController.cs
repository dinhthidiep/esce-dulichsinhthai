using ESCE_SYSTEM.DTOs.Support;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupportController : ControllerBase
    {
        private readonly ISupportService _supportService;

        public SupportController(ISupportService supportService)
        {
            _supportService = supportService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult> GetAll([FromQuery] string? status = null)
        {
            try
            {
                var requests = await _supportService.GetAllAsync(status);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult> GetById(int id)
        {
            try
            {
                var request = await _supportService.GetByIdAsync(id);
                return Ok(request);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-requests")]
        [Authorize]
        public async Task<ActionResult> GetMyRequests()
        {
            try
            {
                var requests = await _supportService.GetByUserIdAsync(int.Parse(User.FindFirst("UserId")?.Value ?? "0"));
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult> Create([FromBody] CreateSupportRequestDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (dto == null)
                {
                    return BadRequest(new { message = "Dữ liệu yêu cầu hỗ trợ không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(dto.Content))
                {
                    return BadRequest(new { message = "Nội dung yêu cầu hỗ trợ không được để trống." });
                }

                var created = await _supportService.CreateAsync(dto);
                return Ok(created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult> Update(int id, [FromBody] CreateSupportRequestDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (dto == null)
                {
                    return BadRequest(new { message = "Dữ liệu yêu cầu hỗ trợ không được để trống." });
                }

                var updated = await _supportService.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _supportService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu hỗ trợ" });
                }
                return Ok(new { message = "Đã xóa yêu cầu hỗ trợ thành công" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Approve([FromBody] ApproveSupportDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (dto == null || string.IsNullOrWhiteSpace(dto.SupportId))
                {
                    return BadRequest(new { message = "ID yêu cầu hỗ trợ không được để trống." });
                }

                await _supportService.ApproveAsync(dto);
                return Ok(new { message = "Đã duyệt yêu cầu hỗ trợ" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Reject([FromBody] RejectSupportDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (dto == null || string.IsNullOrWhiteSpace(dto.SupportId))
                {
                    return BadRequest(new { message = "ID yêu cầu hỗ trợ không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(dto.Comment))
                {
                    return BadRequest(new { message = "Lý do từ chối không được để trống." });
                }

                await _supportService.RejectAsync(dto);
                return Ok(new { message = "Đã từ chối yêu cầu hỗ trợ" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("responses")]
        [Authorize]
        public async Task<ActionResult> CreateResponse([FromBody] CreateSupportResponseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => e.ErrorMessage))
                        .ToList();
                    
                    return BadRequest(new { message = "Dữ liệu đầu vào không hợp lệ.", errors = errors });
                }

                if (dto == null || string.IsNullOrWhiteSpace(dto.SupportId))
                {
                    return BadRequest(new { message = "ID yêu cầu hỗ trợ không được để trống." });
                }

                if (string.IsNullOrWhiteSpace(dto.Content))
                {
                    return BadRequest(new { message = "Nội dung phản hồi không được để trống." });
                }

                var created = await _supportService.CreateResponseAsync(dto);
                return Ok(created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/responses")]
        [Authorize]
        public async Task<ActionResult> GetResponses(int id)
        {
            try
            {
                var responses = await _supportService.GetResponsesAsync(id);
                return Ok(responses);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("responses/{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteResponse(int id)
        {
            try
            {
                var deleted = await _supportService.DeleteResponseAsync(id);
                if (!deleted)
                {
                    return NotFound(new { message = "Không tìm thấy phản hồi" });
                }
                return Ok(new { message = "Đã xóa phản hồi thành công" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}


