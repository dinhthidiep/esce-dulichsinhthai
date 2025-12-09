using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceComboController : ControllerBase
    {
        private readonly IServiceComboService _service;
        private readonly IUserContextService _userContextService;

        public ServiceComboController(IServiceComboService service, IUserContextService userContextService)
        {
            _service = service;
            _userContextService = userContextService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            // Lấy currentUserId nếu có (có thể null nếu chưa đăng nhập)
            int? currentUserId = null;
            try
            {
                var userId = _userContextService.GetCurrentUserId();
                if (userId > 0)
                {
                    currentUserId = userId;
                }
            }
            catch
            {
                // Không có user đăng nhập, currentUserId = null
            }

            var result = await _service.GetAllAsync(currentUserId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetById(int id)
        {
            // Lấy currentUserId nếu có
            int? currentUserId = null;
            try
            {
                var userId = _userContextService.GetCurrentUserId();
                if (userId > 0)
                {
                    currentUserId = userId;
                }
            }
            catch
            {
                // Không có user đăng nhập
            }

            var result = await _service.GetByIdAsync(id, currentUserId);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("name/{name}")]
        public async Task<ActionResult> GetByName(string name)
        {
            var result = await _service.GetByNameAsync(name);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ServiceCombo ServiceCombo)
        {
            var result = await _service.CreateAsync(ServiceCombo);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ServiceCombo ServiceCombo)
        {
            var result = await _service.UpdateAsync(id, ServiceCombo);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (result == null) return NotFound();
            return Ok("Deleted");
        }

        // Lấy ServiceCombo theo HostId (chỉ approved) - dùng cho trang profile host
        [HttpGet("host/{hostId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByHostId(int hostId)
        {
            var result = await _service.GetApprovedByHostIdAsync(hostId);
            return Ok(result);
        }

        // Host xem tất cả ServiceCombo của mình (kể cả chưa được duyệt)
        [HttpGet("my-combos")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> GetMyServiceCombos()
        {
            var hostId = _userContextService.GetCurrentUserId();
            if (hostId <= 0)
            {
                return Unauthorized("User not authenticated");
            }

            var result = await _service.GetMyServiceCombosAsync(hostId);
            return Ok(result);
        }

        // Admin xem tất cả ServiceCombo (kể cả chưa duyệt) - để duyệt
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var result = await _service.GetAllForAdminAsync();
            return Ok(result);
        }

        // Admin duyệt ServiceCombo (thay đổi status: pending, approved, rejected)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateServiceComboStatusDto statusDto)
        {
            if (string.IsNullOrWhiteSpace(statusDto.Status))
            {
                return BadRequest(new { message = "Status không được để trống" });
            }

            var updated = await _service.UpdateStatusAsync(id, statusDto.Status);
            if (!updated)
            {
                return NotFound(new { message = "Không tìm thấy ServiceCombo hoặc status không hợp lệ" });
            }

            return Ok(new { message = $"ServiceCombo đã được cập nhật status thành: {statusDto.Status}" });
        }
    }
}
