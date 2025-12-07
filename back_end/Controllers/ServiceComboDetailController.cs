// File: ESCE_SYSTEM.Controllers/ServiceComboDetailController.cs

using ESCE_SYSTEM.DTOs.ServiceComboDetail;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceComboDetailController : ControllerBase
    {
        private readonly IServiceComboDetailService _service;

        public ServiceComboDetailController(IServiceComboDetailService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpGet("combo/{serviceComboId}")]
        public async Task<IActionResult> GetByServiceComboId(int serviceComboId)
        {
            var result = await _service.GetByServiceComboIdAsync(serviceComboId);
            return Ok(result);
        }

        [HttpGet("service/{serviceId}")]
        public async Task<IActionResult> GetByServiceId(int serviceId)
        {
            var result = await _service.GetByServiceIdAsync(serviceId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateServiceComboDetailDto detailDto)
        {
            // Sửa lỗi: Controller truyền DTO vào Service
            var result = await _service.CreateAsync(detailDto);
            // Có thể dùng CreatedAtAction nếu bạn muốn trả về mã 201 Created
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateServiceComboDetailDto detailDto)
        {
            // Sửa lỗi: Controller truyền ID và DTO vào Service
            var result = await _service.UpdateAsync(id, detailDto);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted");
        }

        [HttpDelete("combo/{serviceComboId}")]
        public async Task<IActionResult> DeleteByServiceComboId(int serviceComboId)
        {
            var deleted = await _service.DeleteByServiceComboIdAsync(serviceComboId);
            if (!deleted) return NotFound();
            return Ok("All details for this combo have been deleted");
        }
    }
}