using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;
using Microsoft.VisualBasic;
using System.Data.Common;
using Microsoft.AspNetCore.Hosting;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class ServiceController : ControllerBase
    {
        private readonly IServiceService _service;
        private readonly IWebHostEnvironment _env;
        
        public ServiceController(IServiceService service, IWebHostEnvironment env)
        {
            _service = service;
            _env = env;
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

        /// <summary>
        /// Lấy tất cả dịch vụ của một Host
        /// </summary>
        [HttpGet("host/{hostId}")]
        public async Task<ActionResult> GetByHostId(int hostId)
        {
            var allServices = await _service.GetAllAsync();
            var hostServices = allServices.Where(s => s.HostId == hostId).ToList();
            return Ok(hostServices);
        }

        /// <summary>
        /// Tạo dịch vụ mới - hỗ trợ cả JSON và multipart/form-data
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateServiceDto dto)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { message = "Tên dịch vụ không được để trống" });
                }
                
                if (dto.Price < 0)
                {
                    return BadRequest(new { message = "Giá dịch vụ không được âm" });
                }
                
                if (dto.HostId <= 0)
                {
                    return BadRequest(new { message = "HostId không hợp lệ" });
                }

                // Xử lý upload ảnh nếu có
                string imagePath = null;
                if (dto.Image != null && dto.Image.Length > 0)
                {
                    imagePath = await SaveImageAsync(dto.Image, "services");
                }

                var service = new Service
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    HostId = dto.HostId,
                    Images = imagePath
                };

                var result = await _service.CreateAsync(service);
                
                return Ok(new { 
                    message = "Dịch vụ đã được tạo thành công và đang chờ duyệt",
                    service = result 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ServiceController.Create] Error: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật dịch vụ - hỗ trợ cả JSON và multipart/form-data
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateServiceDto dto)
        {
            try
            {
                var existing = await _service.GetByIdAsync(id);
                if (existing == null) return NotFound(new { message = "Không tìm thấy dịch vụ" });

                // Xử lý upload ảnh mới nếu có
                string imagePath = existing.Images; // Giữ ảnh cũ nếu không upload mới
                if (dto.Image != null && dto.Image.Length > 0)
                {
                    imagePath = await SaveImageAsync(dto.Image, "services");
                }

                var service = new Service
                {
                    Name = dto.Name ?? existing.Name,
                    Description = dto.Description ?? existing.Description,
                    Price = dto.Price ?? existing.Price,
                    Images = imagePath
                };

                var result = await _service.UpdateAsync(id, service);
                if (result == null) return NotFound(new { message = "Không tìm thấy dịch vụ" });
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ServiceController.Update] Error: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted");
        }

        /// <summary>
        /// Lưu file ảnh vào wwwroot/uploads
        /// </summary>
        private async Task<string> SaveImageAsync(IFormFile file, string subFolder)
        {
            try
            {
                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    throw new ArgumentException("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)");
                }

                // Validate file size (5MB max)
                if (file.Length > 5 * 1024 * 1024)
                {
                    throw new ArgumentException("Kích thước file không được vượt quá 5MB");
                }

                // Xác định extension
                var extension = Path.GetExtension(file.FileName).ToLower();
                if (string.IsNullOrEmpty(extension))
                {
                    extension = file.ContentType switch
                    {
                        "image/jpeg" or "image/jpg" => ".jpg",
                        "image/png" => ".png",
                        "image/gif" => ".gif",
                        "image/webp" => ".webp",
                        _ => ".jpg"
                    };
                }

                // Tạo tên file unique
                var fileName = $"{Guid.NewGuid()}{extension}";

                // Tạo đường dẫn thư mục
                var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", subFolder);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Lưu file
                var filePath = Path.Combine(uploadsFolder, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Trả về đường dẫn relative
                return $"/uploads/{subFolder}/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SaveImageAsync] Error: {ex.Message}");
                throw;
            }
        }
    }

    /// <summary>
    /// DTO cho việc tạo dịch vụ mới
    /// </summary>
    public class CreateServiceDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int HostId { get; set; }
        public IFormFile? Image { get; set; }
    }

    /// <summary>
    /// DTO cho việc cập nhật dịch vụ
    /// </summary>
    public class UpdateServiceDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public IFormFile? Image { get; set; }
    }
}



//    [ApiController]
//    [Route("api/[controller]")]
//    public class ServiceController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;
//        public ServiceController(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        [HttpGet]
//        public IEnumerable<Service> GetAll()
//        {
//            return _context.Services;

//        }

//        [HttpGet("{id}")]
//        public IActionResult GetById(int id)
//        {
//            var service = _context.Services.Find(id);
//            if (service == null)
//                return NotFound();
//            return Ok(service);

//        }

//        [HttpPost]
//        public IActionResult Create(Service service)
//        {
//            _context.Services.Add(service);
//            _context.SaveChanges();
//            return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);

//        }

//        [HttpPut("{id}")]
//        public IActionResult Update(int id, Service updatedService)
//        {
//            var service = _context.Services.Find(id);
//            if (service == null)
//                return NotFound();
//            service.Name = updatedService.Name;
//            service.Description = updatedService.Description;
//            service.Price = updatedService.Price;
//            service.Updated_At = updatedService.Updated_At;
//            _context.SaveChanges();
//            return Ok(service);
//        }

//        [HttpDelete("{id}")]

//        public IActionResult Delete(int id)
//        {
//            var service = _context.Services.Find(id);
//            if (service == null)
//                return NotFound();
//            _context.Remove(service);
//            _context.SaveChanges();
//            return NoContent();
//        }

//    }
//}


































































/*
namespace Learnasp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private static List<Service> services = new List<Service>()
        {
            new Service { Id = 1, Name="Cà phê sáng", Description ="Bạn có thể oder bất kỳ loại cà phê nào có trong menu của chúng tôi",
                Price = 25000 },
            new Service {Id = 2, Name ="Lẩu gà cho 2 người", Description ="Lẩu gà bạn có thể chọn vị và báo trước cho mình nhé (Lá é, lá giang, tây bắc", Price =300000}

        };

        [HttpGet]
        public IEnumerable<Service> GetAll()
        {
            return services;
        }

        [HttpGet("{id}")]
        public ActionResult<Service> GetById(int id)
        {
            var service = services.FirstOrDefault(s => s.Id == id);
            if (service == null)
                return NotFound();
            return service;
        }

        [HttpPost]
        public ActionResult<Service> Create(Service service)

        {
            service.Id = services.Count + 1;
            services.Add(service);
            return CreatedAtAction(nameof(GetAll), new { id = service.Id }, service);
        }


        [HttpPut("{id}")]
        public IActionResult Update(int id, Service updatedService)
        {
            var service = services.FirstOrDefault(s => s.Id == id);
            if (service == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm " });
            service.Name = updatedService.Name;
            service.Description = updatedService.Description;
            service.Price = updatedService.Price;
            service.Updated_At = updatedService.Updated_At;
            return Ok(service);


        }

        [HttpDelete("{id}") ]
        public IActionResult Delete(int id)
        {
            var service = services.FirstOrDefault(s => s.Id == id);
            if (service == null)
                return NotFound(new { message = "Không tìm thấy dịch vụ" });
           services.Remove(service);
            //return Ok(new {message ="Bạn đã xóa dịch vụ thành công "});
            return NoContent();

        }

    }



}
*/