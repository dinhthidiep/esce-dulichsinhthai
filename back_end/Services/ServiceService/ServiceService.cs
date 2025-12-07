// File: ServiceService.cs (HOÀN CHỈNH - FIX CS1004, Logic Images)

using ESCE_SYSTEM.DTOs.Service;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using Microsoft.EntityFrameworkCore;
using ESCE_SYSTEM.Services.UserService; // Cần dùng để gọi các helper notification
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    // Helper class: FIX LỖI CÚ PHÁP CS1004
    public class ReviewComment
    {
        public DateTime CreatedDate { get; set; }
        public string Content { get; set; } = string.Empty; // 
    }

    public class ServiceService : IServiceService // FIX CS0535/CS1061 do loại bỏ phương thức Helper thừa
    {
        private readonly ESCEContext _dbContext;
        private readonly IServiceRepository _repository;
        private readonly IUserService _userService;

        public ServiceService(IServiceRepository repository, ESCEContext dbContext, IUserService userService)
        {
            _repository = repository;
            _dbContext = dbContext;
            _userService = userService;
        }

        // =========================================================
        // PHƯƠNG THỨC HIỂN THỊ VÀ CRUD CƠ BẢN
        // =========================================================

        public async Task<IEnumerable<ServiceResponseDto>> GetAllAsync(string status = null)
        {
            var query = _dbContext.Services.Include(s => s.Host).AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                query = query.Where(s => s.Status == status);
            }

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new ServiceResponseDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    Price = s.Price,
                    HostId = s.HostId,
                    Status = s.Status,
                    RejectComment = s.RejectComment,
                    ReviewComments = s.ReviewComments,
                    Images = s.Images, // Ánh xạ Images
                    HostName = s.Host.Name,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<ServiceResponseDto?> GetByIdAsync(int id)
        {
            var service = await _dbContext.Services.Include(s => s.Host).FirstOrDefaultAsync(s => s.Id == id);
            if (service == null) return null;

            return new ServiceResponseDto
            {
                Id = service.Id,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                HostId = service.HostId,
                Status = service.Status,
                RejectComment = service.RejectComment,
                ReviewComments = service.ReviewComments,
                Images = service.Images, // Ánh xạ Images
                HostName = service.Host?.Name ?? "Unknown",
                CreatedAt = service.CreatedAt,
                UpdatedAt = service.UpdatedAt
            };
        }

        public async Task<ServiceResponseDto> CreateAsync(CreateServiceDto serviceDto)
        {
            var hostAccount = await _dbContext.Accounts.FindAsync(serviceDto.HostId);
            if (hostAccount == null) throw new InvalidOperationException("Host account not found.");
            if (hostAccount.RoleId != 2) throw new UnauthorizedAccessException("Only Hosts can create services.");

            var service = new Service
            {
                Name = serviceDto.Name,
                Description = serviceDto.Description,
                Price = serviceDto.Price,
                HostId = serviceDto.HostId,
                Images = serviceDto.Images,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            try
            {
                _dbContext.Services.Add(service);
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                var innerEx = ex.InnerException?.Message ?? ex.Message;
                throw new InvalidOperationException($"An error occurred while saving the entity changes. DB Error: {innerEx}", ex);
            }

            // --- KHẮC PHỤC LỖI VÒNG LẶP: Trả về DTO sau khi tạo thành công ---
            var serviceDtoResult = new ServiceResponseDto
            {
                Id = service.Id,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                HostId = service.HostId,
                Status = service.Status,
                Images = service.Images,
                HostName = hostAccount.Name, // Lấy từ hostAccount đã tải
                CreatedAt = service.CreatedAt,
                UpdatedAt = service.UpdatedAt
                // Lưu ý: RejectComment và ReviewComments sẽ null ở đây (Pending)
            };

            // --- Gửi thông báo đến Admin ---
            try
            {
                var adminAccounts = await _dbContext.Accounts.Where(a => a.RoleId == 1).ToListAsync();
                foreach (var admin in adminAccounts)
                {
                    await _userService.SendWebNotificationAsync(admin, "Pending", "Service", service.Id.ToString(),
                       $"Host {hostAccount.Name ?? "Unknown Host"} đã tạo Service mới: {service.Name} cần phê duyệt.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending notifications during Service creation: {ex.Message}");
            }

            return serviceDtoResult; // Trả về DTO
        }

        public async Task<Service?> UpdateAsync(int id, UpdateServiceDto serviceDto)
        {
            var existing = await _dbContext.Services.FindAsync(id);
            if (existing == null) return null;

            existing.Name = serviceDto.Name ?? existing.Name;
            existing.Description = serviceDto.Description ?? existing.Description;
            existing.Price = serviceDto.Price ?? existing.Price;
            existing.Images = serviceDto.Images ?? existing.Images; // Update Images
            existing.UpdatedAt = DateTime.UtcNow;

            if (existing.Status == "Review")
            {
                existing.Status = "Pending";
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

        // =========================================================
        // PHƯƠNG THỨC QUẢN LÝ TRẠNG THÁI (CHO ADMIN)
        // =========================================================

        private async Task<(Service Service, Account Host)> GetServiceAndHostForProcessing(int serviceId)
        {
            var service = await _dbContext.Services
                .Include(s => s.Host)
                .FirstOrDefaultAsync(s => s.Id == serviceId);

            if (service == null) throw new InvalidOperationException($"Service not found with ID: {serviceId}");
            if (service.Host == null) throw new InvalidOperationException("Host account linked to this service not found.");

            return (service, service.Host);
        }

        public async Task ApproveServiceAsync(int serviceId)
        {
            var (service, host) = await GetServiceAndHostForProcessing(serviceId);
            if (service.Status == "Approved") throw new InvalidOperationException("Service is already Approved.");

            service.Status = "Approved";
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            await _userService.SendUserEmailAsync(host, "ApproveService.html", "NOTIFICATION: Service has been APPROVED");
            await _userService.SendWebNotificationAsync(host, "Approved", "Service", service.Id.ToString(),
                $"Dịch vụ '{service.Name}' của bạn đã được Admin phê duyệt thành công.");
        }

        public async Task RejectServiceAsync(int serviceId, string comment)
        {
            var (service, host) = await GetServiceAndHostForProcessing(serviceId);
            if (service.Status == "Rejected") throw new InvalidOperationException("Service is already Rejected.");

            service.Status = "Rejected";
            service.RejectComment = comment;
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            await _userService.SendUserEmailAsync(host, "RejectService.html", "NOTIFICATION: Service has been REJECTED", comment);
            await _userService.SendWebNotificationAsync(host, "Rejected", "Service", service.Id.ToString(),
                $"Dịch vụ '{service.Name}' của bạn đã bị từ chối. Lý do: {comment}");
        }

        public async Task ReviewServiceAsync(int serviceId, string comment)
        {
            var (service, host) = await GetServiceAndHostForProcessing(serviceId);
            service.Status = "Review";

            var reviewComments = new List<ReviewComment>();
            if (!string.IsNullOrEmpty(service.ReviewComments))
            {
                reviewComments = JsonSerializer.Deserialize<List<ReviewComment>>(service.ReviewComments) ?? new List<ReviewComment>();
            }

            reviewComments.Add(new ReviewComment
            {
                CreatedDate = DateTime.UtcNow,
                Content = comment
            });

            service.ReviewComments = JsonSerializer.Serialize(reviewComments);
            service.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            await _userService.SendUserEmailAsync(host, "AddServiceReviewComment.html", "NOTIFICATION: Additional information required for Service", comment);
            await _userService.SendWebNotificationAsync(host, "Review", "Service", service.Id.ToString(),
                $"Dịch vụ '{service.Name}' cần thêm thông tin. Nội dung yêu cầu: {comment}");
        }
    }
}