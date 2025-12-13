using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BonusServiceController : ControllerBase
    {
        private readonly ESCEContext _context;
        private readonly IWebHostEnvironment _environment;

        public BonusServiceController(ESCEContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        /// <summary>
        /// Lấy tất cả dịch vụ tặng kèm của một Host
        /// </summary>
        [HttpGet("host/{hostId}")]
        public async Task<ActionResult<IEnumerable<BonusService>>> GetByHostId(int hostId)
        {
            var bonusServices = await _context.BonusServices
                .Where(b => b.HostId == hostId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return Ok(bonusServices);
        }

        /// <summary>
        /// Lấy chi tiết một dịch vụ tặng kèm
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BonusService>> GetById(int id)
        {
            var bonusService = await _context.BonusServices
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bonusService == null)
            {
                return NotFound("Không tìm thấy dịch vụ tặng kèm");
            }

            return Ok(bonusService);
        }


        /// <summary>
        /// Tạo dịch vụ tặng kèm mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<BonusService>> Create([FromForm] CreateBonusServiceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Tên dịch vụ không được để trống");
            }

            var bonusService = new BonusService
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                HostId = dto.HostId,
                ServiceId = dto.ServiceId,
                Status = "active",
                TargetAudience = dto.TargetAudience,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Handle image upload
            if (dto.Image != null && dto.Image.Length > 0)
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "bonus-services");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{dto.Image.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Image.CopyToAsync(stream);
                }

                bonusService.Image = $"/uploads/bonus-services/{uniqueFileName}";
            }

            _context.BonusServices.Add(bonusService);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = bonusService.Id }, bonusService);
        }

        /// <summary>
        /// Cập nhật dịch vụ tặng kèm
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<BonusService>> Update(int id, [FromForm] UpdateBonusServiceDto dto)
        {
            var bonusService = await _context.BonusServices.FindAsync(id);
            if (bonusService == null)
            {
                return NotFound("Không tìm thấy dịch vụ tặng kèm");
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                bonusService.Name = dto.Name.Trim();
            }

            if (dto.Description != null)
            {
                bonusService.Description = dto.Description.Trim();
            }

            if (dto.Price.HasValue)
            {
                bonusService.Price = dto.Price.Value;
            }

            if (dto.ServiceId.HasValue)
            {
                bonusService.ServiceId = dto.ServiceId.Value == 0 ? null : dto.ServiceId.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                bonusService.Status = dto.Status;
            }

            if (dto.TargetAudience != null)
            {
                bonusService.TargetAudience = dto.TargetAudience;
            }

            // Handle image upload
            if (dto.Image != null && dto.Image.Length > 0)
            {
                // Delete old image if exists
                if (!string.IsNullOrEmpty(bonusService.Image))
                {
                    var oldImagePath = Path.Combine(_environment.WebRootPath, bonusService.Image.TrimStart('/'));
                    if (System.IO.File.Exists(oldImagePath))
                    {
                        System.IO.File.Delete(oldImagePath);
                    }
                }

                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "bonus-services");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{dto.Image.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Image.CopyToAsync(stream);
                }

                bonusService.Image = $"/uploads/bonus-services/{uniqueFileName}";
            }

            bonusService.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(bonusService);
        }

        /// <summary>
        /// Xóa dịch vụ tặng kèm
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var bonusService = await _context.BonusServices.FindAsync(id);
            if (bonusService == null)
            {
                return NotFound("Không tìm thấy dịch vụ tặng kèm");
            }

            // Delete image if exists
            if (!string.IsNullOrEmpty(bonusService.Image))
            {
                var imagePath = Path.Combine(_environment.WebRootPath, bonusService.Image.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _context.BonusServices.Remove(bonusService);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa dịch vụ tặng kèm thành công" });
        }
    }

    // DTOs
    public class CreateBonusServiceDto
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int HostId { get; set; }
        public int? ServiceId { get; set; }
        public IFormFile? Image { get; set; }
        public string? TargetAudience { get; set; } // JSON string
    }

    public class UpdateBonusServiceDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? ServiceId { get; set; }
        public string? Status { get; set; }
        public IFormFile? Image { get; set; }
        public string? TargetAudience { get; set; } // JSON string
    }
}
