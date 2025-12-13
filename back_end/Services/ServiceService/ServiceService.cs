using Microsoft.EntityFrameworkCore;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;


namespace ESCE_SYSTEM.Services
{
    public class ServiceService : IServiceService
    {
        private readonly IServiceRepository _repository;
        public ServiceService(IServiceRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Service>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<Service?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }
        public async Task<Service> CreateAsync(Service service)
        {
            // Set default values for new service
            service.Status = "Pending"; // Dịch vụ mới cần được Admin duyệt
            service.CreatedAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;
            
            await _repository.CreateAsync(service);
            return service;
        }
        public async Task<Service?> UpdateAsync(int id, Service service)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = service.Name;
            existing.Description = service.Description;
            existing.Price = service.Price;
            existing.UpdatedAt = DateTime.UtcNow;
            
            // Cập nhật ảnh nếu có
            if (!string.IsNullOrEmpty(service.Images))
            {
                existing.Images = service.Images;
            }

            await _repository.UpdateAsync(existing);
            return existing;
        }
        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;
            await _repository.DeleteAsync(id);
            return true;
        }




    }
}
//        private readonly ApplicationDbContext _context;

//        public ServiceService(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        public async Task<IEnumerable<Service>> GetAllAsync()
//        {
//            return await _context.Services.ToListAsync();
//        }

//        public async Task<Service?> GetByIdAsync(int id)
//        {
//            return await _context.Services.FindAsync(id); 
//         }

//        public async Task<Service> CreateAsync(Service service)
//        {
//             _context.Services.Add(service);
//            await _context.SaveChangesAsync();

//            return service;

//        }


//        public async Task<Service?> UpdateAsync(int id, Service service)
//        {
//            var exitsting = await _context.Services.FindAsync(id);
//            if (exitsting == null) return null;
//            exitsting.Name = service.Name;
//            exitsting.Description = service.Description;
//            exitsting.Price = service.Price;
//            exitsting.Updated_At= DateTime.Now;
//            await _context.SaveChangesAsync();
//               return exitsting;     

//        }

//        public async Task<bool> DeleteAsync(int id)
//        {
//            var exitsting = await _context.Services.FindAsync(id);
//            if (exitsting == null) return false;    
//            _context.Services.Remove(exitsting);
//            await _context.SaveChangesAsync();
//            return true;
//        }
//    }
//}