using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;

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

        [HttpGet("combo/{ServiceComboId}")]
        public async Task<IActionResult> GetByServiceComboId(int ServiceComboId)
        {
            var result = await _service.GetByServiceComboIdAsync(ServiceComboId);
            return Ok(result);
        }

        [HttpGet("service/{serviceId}")]
        public async Task<IActionResult> GetByServiceId(int serviceId)
        {
            var result = await _service.GetByServiceIdAsync(serviceId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ServiceComboDetail ServiceComboDetail)
        {
            var result = await _service.CreateAsync(ServiceComboDetail);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ServiceComboDetail ServiceComboDetail)
        {
            var result = await _service.UpdateAsync(id, ServiceComboDetail);
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

        [HttpDelete("combo/{ServiceComboId}")]
        public async Task<IActionResult> DeleteByServiceComboId(int ServiceComboId)
        {
            var deleted = await _service.DeleteByServiceComboIdAsync(ServiceComboId);
            if (!deleted) return NotFound();
            return Ok("All details for this combo have been deleted");
        }
    }
}
