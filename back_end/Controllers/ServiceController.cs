// File: ServiceController.cs (Hoàn chỉnh)
using ESCE_SYSTEM.DTOs.Service;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;


// Đảm bảo có using này để tìm thấy các DTOs
using ESCE_SYSTEM.DTOs.Service;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/service")] // Thay đổi để nhất quán với convention /user
    public class ServiceController : ControllerBase
    {
        private readonly IServiceService _service;

        public ServiceController(IServiceService service)
        {
            _service = service;
        }

        // Endpoint cho tất cả user (Host, Customer, Admin)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string status = null)
        {
            try
            {
                // CS1501 Fix: Truyền tham số status (đã có tham số mặc định trong Interface)
                var result = await _service.GetAllAsync(status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            try
            {
                var result = await _service.GetByIdAsync(id);
                if (result == null) return NotFound("Service not found.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Host")]
        // Thay đổi kiểu trả về Action sang ServiceResponseDto
        public async Task<IActionResult> Create([FromBody] CreateServiceDto serviceDto)
        {
            try
            {
                // Nhận ServiceResponseDto từ Service
                var result = await _service.CreateAsync(serviceDto);

                // Cần đảm bảo route có thể nhận ID từ result.Id
                return CreatedAtAction(nameof(GetById), new { id = result.Id },
                    new { message = "Service created successfully and is awaiting admin approval.", service = result });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceDto serviceDto)
        {
            try
            {
                var result = await _service.UpdateAsync(id, serviceDto);
                if (result == null) return NotFound("Service not found.");
                return Ok(new { message = "Service updated successfully.", service = result });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Host,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _service.DeleteAsync(id);
                if (!deleted) return NotFound("Service not found.");
                return Ok("Deleted successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // --- ENDPOINTS QUẢN LÝ TRẠNG THÁI (CHO ADMIN) ---

        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveService(int id)
        {
            try
            {
                await _service.ApproveServiceAsync(id);
                return Ok("Service has been approved successfully.");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("reject/{id}")]
        [Authorize(Roles = "Admin")]
        // CS0246 Fix: Đảm bảo RejectServiceDto đã được định nghĩa và using
        public async Task<IActionResult> RejectService(int id, [FromBody] RejectServiceDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Comment))
                {
                    return BadRequest("Reject reason (Comment) is required.");
                }
                await _service.RejectServiceAsync(id, dto.Comment);
                return Ok("Service has been rejected.");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("review/{id}")]
        [Authorize(Roles = "Admin")]
        // CS0246 Fix: Đảm bảo ReviewServiceDto đã được định nghĩa và using
        public async Task<IActionResult> ReviewService(int id, [FromBody] ReviewServiceDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Comment))
                {
                    return BadRequest("Review comment is required.");
                }
                await _service.ReviewServiceAsync(id, dto.Comment);
                return Ok("Additional information request has been sent to Host.");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}