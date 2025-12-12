using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Helper;
using ESCE_SYSTEM.Options;
using Microsoft.AspNetCore.SignalR;
using ESCE_SYSTEM.SignalR;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.IO;

namespace ESCE_SYSTEM.Services
{
    public class ServiceComboService : IServiceComboService
    {
        private readonly IServiceComboRepository _repository;
        private readonly ESCEContext _context;
        private readonly IUserService _userService;
        private readonly IUserContextService _userContextService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;
        private readonly INotificationService _notificationService;
        private readonly EmailHelper _emailHelper;
        private readonly EmailConfig _emailConfig;
        private readonly IWebHostEnvironment _env;
        
        public ServiceComboService(
            IServiceComboRepository repository,
            ESCEContext context,
            IUserService userService,
            IUserContextService userContextService,
            IHubContext<NotificationHub> hubNotificationContext,
            INotificationService notificationService,
            EmailHelper emailHelper,
            IOptions<EmailConfig> emailConfig,
            IWebHostEnvironment env)
        {
            _repository = repository;
            _context = context;
            _userService = userService;
            _userContextService = userContextService;
            _hubNotificationContext = hubNotificationContext;
            _notificationService = notificationService;
            _emailHelper = emailHelper;
            _emailConfig = emailConfig.Value;
            _env = env;
        }

        public async Task<IEnumerable<ServiceCombo>> GetAllAsync(int? currentUserId = null)
        {
            // Nếu có currentUserId, hiển thị tất cả combo của host đó + các combo đã approved
            if (currentUserId.HasValue && currentUserId.Value > 0)
            {
                return await _context.Servicecombos
                    .Where(sc => sc.Status == "approved" || sc.HostId == currentUserId.Value)
                    .ToListAsync();
            }
            
            // Nếu không có currentUserId, chỉ hiển thị các combo đã approved
            return await _context.Servicecombos
                .Where(sc => sc.Status == "approved")
                .ToListAsync();
        }
        public async Task<ServiceCombo?> GetByIdAsync(int id, int? currentUserId = null)
        {
            var combo = await _repository.GetByIdAsync(id);
            if (combo == null) return null;

            // Nếu là host của combo này, cho phép xem (kể cả chưa approved)
            if (currentUserId.HasValue && combo.HostId == currentUserId.Value)
            {
                return combo;
            }

            // Nếu không phải host, chỉ cho xem nếu đã approved
            if (combo.Status == "approved")
            {
                return combo;
            }

            // Không cho xem nếu chưa approved và không phải host
            return null;
        }

        public async Task<ServiceCombo?> GetByNameAsync(string name)
        {
            return await _repository.GetByNameAsync(name);
        }

        public async Task<IEnumerable<ServiceCombo>> GetByHostIdAsync(int hostId)
        {
            return await _repository.GetByHostIdAsync(hostId);
        }

        public async Task<IEnumerable<ServiceCombo>> GetApprovedByHostIdAsync(int hostId)
        {
            return await _repository.GetApprovedByHostIdAsync(hostId);
        }

        public async Task<IEnumerable<ServiceCombo>> GetMyServiceCombosAsync(int hostId)
        {
            // Host có thể xem tất cả combo của mình (kể cả chưa được duyệt)
            return await _repository.GetByHostIdAsync(hostId);
        }

        public async Task<ServiceCombo> CreateAsync(ServiceCombo Servicecombo)
        {
            await _repository.CreateAsync(Servicecombo);
            return Servicecombo;
        }
        public async Task<ServiceCombo?> UpdateAsync(int id, ServiceCombo Servicecombo)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = Servicecombo.Name;
            existing.Address = Servicecombo.Address;
            existing.Description = Servicecombo.Description;
            existing.Price = Servicecombo.Price;
            existing.AvailableSlots = Servicecombo.AvailableSlots;
            existing.Image = Servicecombo.Image;
            existing.Status = Servicecombo.Status;
            existing.CancellationPolicy = Servicecombo.CancellationPolicy;
            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);
            return existing;
        }

        public async Task<ServiceCombo?> DeleteAsync(int id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            await _repository.DeleteAsync(id);
            return existing;
        }

        // Admin duyệt ServiceCombo (thay đổi status)
        public async Task<bool> UpdateStatusAsync(int id, string status, string? comment = null)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            // Validate status: chỉ cho phép các giá trị hợp lệ
            var validStatuses = new[] { "pending", "approved", "rejected" };
            if (!validStatuses.Contains(status.ToLower()))
            {
                return false;
            }

            var oldStatus = existing.Status;
            existing.Status = status.ToLower();
            existing.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(existing);

            // Gửi email và notification cho host
            if (oldStatus?.ToLower() == "pending" && status.ToLower() == "approved")
            {
                await GuiThongBaoPheDuyetServiceCombo(existing);
            }
            else if (oldStatus?.ToLower() == "pending" && status.ToLower() == "rejected")
            {
                await GuiThongBaoTuChoiServiceCombo(existing, comment ?? "Không đáp ứng yêu cầu");
            }

            return true;
        }

        private async Task GuiThongBaoPheDuyetServiceCombo(ServiceCombo serviceCombo)
        {
            var host = await _userService.GetAccountByIdAsync(serviceCombo.HostId);
            if (host != null)
            {
                var notificationDto = new NotificationDto
                {
                    UserId = host.Id,
                    Title = "ServiceCombo đã được phê duyệt",
                    Message = $"ServiceCombo '{serviceCombo.Name}' của bạn đã được phê duyệt và đã được hiển thị",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.AddNotificationAsync(notificationDto);

                await _hubNotificationContext.Clients.User(host.Id.ToString())
                    .SendAsync("ReceiveNotification", notificationDto);

                await GuiEmailServiceCombo(host, "ServiceComboApproved.html",
                    $"ServiceCombo '{serviceCombo.Name}' đã được phê duyệt",
                    serviceCombo.Name);
            }
        }

        private async Task GuiThongBaoTuChoiServiceCombo(ServiceCombo serviceCombo, string lyDoTuChoi)
        {
            var host = await _userService.GetAccountByIdAsync(serviceCombo.HostId);
            if (host != null)
            {
                var notificationDto = new NotificationDto
                {
                    UserId = host.Id,
                    Title = "ServiceCombo bị từ chối",
                    Message = $"ServiceCombo '{serviceCombo.Name}' của bạn đã bị từ chối. Lý do: {lyDoTuChoi}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.AddNotificationAsync(notificationDto);

                await _hubNotificationContext.Clients.User(host.Id.ToString())
                    .SendAsync("ReceiveNotification", notificationDto);

                await GuiEmailServiceCombo(host, "ServiceComboRejected.html",
                    $"ServiceCombo '{serviceCombo.Name}' đã bị từ chối",
                    serviceCombo.Name, lyDoTuChoi);
            }
        }

        private async Task GuiEmailServiceCombo(Account user, string templateName, string subject, string comboName, string comment = null)
        {
            try
            {
                string filePath = Path.Combine(_env.ContentRootPath, "EmailTemplates", templateName);
                string emailBody;
                
                if (!File.Exists(filePath))
                {
                    // Fallback template nếu không có file
                    emailBody = comment != null
                        ? $"<p>ServiceCombo của bạn: {comboName}</p><p>Lý do từ chối: {comment}</p>"
                        : $"<p>ServiceCombo của bạn: {comboName}</p><p>ServiceCombo đã được phê duyệt.</p>";

                    await _emailHelper.SendEmailAsync(
                        subject,
                        emailBody,
                        new List<string> { user.Email },
                        true);
                    return;
                }

                emailBody = await File.ReadAllTextAsync(filePath);
                emailBody = emailBody.Replace("{{UserName}}", user.Name ?? user.Email);
                emailBody = emailBody.Replace("{{ComboName}}", comboName);
                if (comment != null)
                {
                    emailBody = emailBody.Replace("{{Comment}}", comment);
                }

                await _emailHelper.SendEmailAsync(
                    subject,
                    emailBody,
                    new List<string> { user.Email },
                    true);
            }
            catch (Exception ex)
            {
                // Log error nhưng không throw để không ảnh hưởng đến flow chính
                Console.WriteLine($"Error sending email: {ex.Message}");
            }
        }

        // Admin xem tất cả ServiceCombo (kể cả chưa duyệt)
        public async Task<IEnumerable<ServiceCombo>> GetAllForAdminAsync()
        {
            return await _context.Servicecombos.ToListAsync();
        }

        // Admin xem tất cả ServiceCombo đang pending
        public async Task<IEnumerable<ServiceCombo>> GetAllPendingAsync()
        {
            return await _context.Servicecombos
                .Where(sc => sc.Status != null && sc.Status.ToLower() == "pending")
                .Include(sc => sc.Host)
                .OrderByDescending(sc => sc.CreatedAt)
                .ToListAsync();
        }
    }
}
