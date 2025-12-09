using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;
using Microsoft.VisualBasic;
using System.Data.Common;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class ServiceController : ControllerBase
    {
        private readonly IServiceService _service;
        public ServiceController(IServiceService service)
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

        [HttpPost]
        public async Task<IActionResult> Create(Service service)
        {
            var result = await _service.CreateAsync(service);
            return Ok(result);

        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Service service)
        {
            var result = await _service.UpdateAsync(id, service);
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