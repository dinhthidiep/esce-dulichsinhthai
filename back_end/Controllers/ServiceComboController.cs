using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.DTOs.ServiceCombo;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceComboController : ControllerBase
    {
        private readonly IServiceComboService _service;

        public ServiceComboController(IServiceComboService service)
        {
            _service = service;
        }

        // --- 1. GET ALL (Trả về Model List) ---
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Thường trả về Model list cho GetAll (hoặc cần ánh xạ nếu muốn trả về DTO)
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // --- 2. GET BY ID (Trả về Model) ---
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();

            return Ok(result);
        }

        // --- 3. GET BY NAME (Trả về Model) ---
        [HttpGet("name/{name}")]
        public async Task<ActionResult> GetByName(string name)
        {
            var result = await _service.GetByNameAsync(name);
            if (result == null) return NotFound();

            return Ok(result);
        }

        // --- 4. POST (Tạo Combo - Trả về DTO) ---
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServiceComboDto comboDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                // Service trả về ServiceComboResponseDto
                var result = await _service.CreateAsync(comboDto);

                // Trả về 201 Created hoặc 200 OK
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log lỗi (nếu có)
                return StatusCode(500, new { message = "Lỗi tạo Service Combo", details = ex.Message });
            }
        }

        // --- 5. PUT (Cập nhật Combo - Trả về DTO) ---
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceComboDto comboDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                // Service trả về ServiceComboResponseDto?
                var result = await _service.UpdateAsync(id, comboDto);

                if (result == null) return NotFound($"Không tìm thấy Service Combo với ID: {id}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật Service Combo", details = ex.Message });
            }
        }

        // --- 6. DELETE (Xóa Combo) ---
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);

            // Nếu Service trả về Model và Model là null
            if (result == null) return NotFound();

            return Ok("Deleted successfully");
        }
    }
}