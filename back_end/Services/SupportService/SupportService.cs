using ESCE_SYSTEM.DTOs.Support;
using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Helper;
using ESCE_SYSTEM.Options;
using Microsoft.AspNetCore.SignalR;
using ESCE_SYSTEM.SignalR;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace ESCE_SYSTEM.Services
{
    public class SupportService : ISupportService
    {
        private readonly ISupportRepository _supportRepository;
        private readonly IUserService _userService;
        private readonly IUserContextService _userContextService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;
        private readonly INotificationService _notificationService;
        private readonly EmailHelper _emailHelper;
        private readonly EmailConfig _emailConfig;
        private readonly IWebHostEnvironment _env;

        public SupportService(
            ISupportRepository supportRepository,
            IUserService userService,
            IUserContextService userContextService,
            IHubContext<NotificationHub> hubNotificationContext,
            INotificationService notificationService,
            EmailHelper emailHelper,
            IOptions<EmailConfig> emailConfig,
            IWebHostEnvironment env)
        {
            _supportRepository = supportRepository;
            _userService = userService;
            _userContextService = userContextService;
            _hubNotificationContext = hubNotificationContext;
            _notificationService = notificationService;
            _emailHelper = emailHelper;
            _emailConfig = emailConfig.Value;
            _env = env;
        }

        public async Task<List<SupportRequestResponseDto>> GetAllAsync(string? status = null)
        {
            var requests = await _supportRepository.GetAllAsync(status);
            return requests.Select(MapToResponseDto).ToList();
        }

        public async Task<SupportRequestResponseDto> GetByIdAsync(int id)
        {
            var request = await _supportRepository.GetByIdAsync(id);
            if (request == null)
            {
                throw new Exception("Không tìm thấy yêu cầu hỗ trợ");
            }
            return MapToResponseDto(request);
        }

        public async Task<List<SupportRequestResponseDto>> GetByUserIdAsync(int userId)
        {
            var requests = await _supportRepository.GetByUserIdAsync(userId);
            return requests.Select(MapToResponseDto).ToList();
        }

        public async Task<SupportRequestResponseDto> CreateAsync(CreateSupportRequestDto dto)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            
            var request = new RequestSupport
            {
                UserId = currentUserId,
                ComboId = dto.ComboId,
                SupportType = dto.SupportType,
                Content = dto.Content,
                Image = dto.Image,
                Status = "Pending"
            };

            var created = await _supportRepository.CreateAsync(request);
            return MapToResponseDto(created);
        }

        public async Task<SupportRequestResponseDto> UpdateAsync(int id, CreateSupportRequestDto dto)
        {
            var request = await _supportRepository.GetByIdAsync(id);
            if (request == null)
            {
                throw new Exception("Không tìm thấy yêu cầu hỗ trợ");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (request.UserId != currentUserId && !_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật yêu cầu hỗ trợ này");
            }

            request.ComboId = dto.ComboId;
            request.SupportType = dto.SupportType;
            request.Content = dto.Content;
            request.Image = dto.Image;

            var updated = await _supportRepository.UpdateAsync(request);
            return MapToResponseDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var request = await _supportRepository.GetByIdAsync(id);
            if (request == null)
            {
                return false;
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (request.UserId != currentUserId && !_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa yêu cầu hỗ trợ này");
            }

            return await _supportRepository.DeleteAsync(id);
        }

        public async Task ApproveAsync(ApproveSupportDto dto)
        {
            var supportId = int.Parse(dto.SupportId);
            var request = await _supportRepository.GetByIdAsync(supportId);
            if (request == null)
            {
                throw new Exception("Không tìm thấy yêu cầu hỗ trợ");
            }

            if (!_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Chỉ Admin mới có thể duyệt yêu cầu hỗ trợ");
            }

            request.Status = "Approved";
            await _supportRepository.UpdateAsync(request);

            // Gửi email và thông báo cho người dùng
            await GuiThongBaoPheDuyetYeuCau(request);
        }

        public async Task RejectAsync(RejectSupportDto dto)
        {
            var supportId = int.Parse(dto.SupportId);
            var request = await _supportRepository.GetByIdAsync(supportId);
            if (request == null)
            {
                throw new Exception("Không tìm thấy yêu cầu hỗ trợ");
            }

            if (!_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Chỉ Admin mới có thể từ chối yêu cầu hỗ trợ");
            }

            request.Status = "Rejected";
            await _supportRepository.UpdateAsync(request);

            // Gửi email và thông báo cho người dùng với lý do
            await GuiThongBaoTuChoiYeuCau(request, dto.Comment);
        }

        public async Task<SupportResponseDetailDto> CreateResponseAsync(CreateSupportResponseDto dto)
        {
            var supportId = int.Parse(dto.SupportId);
            var request = await _supportRepository.GetByIdAsync(supportId);
            if (request == null)
            {
                throw new Exception("Không tìm thấy yêu cầu hỗ trợ");
            }

            var currentUserId = _userContextService.GetCurrentUserId();

            var response = new SupportResponse
            {
                SupportId = supportId,
                ResponderId = currentUserId,
                Content = dto.Content,
                Image = dto.Image
            };

            var created = await _supportRepository.CreateResponseAsync(response);
            
            // Load lại với navigation properties
            var responses = await _supportRepository.GetResponsesBySupportIdAsync(supportId);
            var createdResponse = responses.FirstOrDefault(r => r.Id == created.Id);
            
            if (createdResponse == null)
            {
                throw new Exception("Không thể tạo phản hồi");
            }

            return MapToResponseDetailDto(createdResponse);
        }

        public async Task<List<SupportResponseDetailDto>> GetResponsesAsync(int supportId)
        {
            var responses = await _supportRepository.GetResponsesBySupportIdAsync(supportId);
            return responses.Select(MapToResponseDetailDto).ToList();
        }

        public async Task<bool> DeleteResponseAsync(int id)
        {
            var response = await _supportRepository.GetResponseByIdAsync(id);
            if (response == null)
            {
                return false;
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (response.ResponderId != currentUserId && !_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa phản hồi này");
            }

            return await _supportRepository.DeleteResponseAsync(id);
        }

        private SupportRequestResponseDto MapToResponseDto(RequestSupport request)
        {
            var responses = request.SupportResponses?.Select(MapToResponseDetailDto).ToList();
            
            return new SupportRequestResponseDto
            {
                Id = request.Id,
                UserId = request.UserId,
                UserName = request.User?.Name,
                UserEmail = request.User?.Email,
                ComboId = request.ComboId,
                ComboName = request.ServiceCombo?.Name,
                SupportType = request.SupportType,
                Content = request.Content,
                Image = request.Image,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                Responses = responses
            };
        }

        private SupportResponseDetailDto MapToResponseDetailDto(SupportResponse response)
        {
            return new SupportResponseDetailDto
            {
                Id = response.Id,
                SupportId = response.SupportId,
                ResponderId = response.ResponderId,
                ResponderName = response.Responder?.Name,
                Content = response.Content,
                Image = response.Image,
                CreatedAt = response.CreatedAt
            };
        }

        private async Task GuiThongBaoPheDuyetYeuCau(RequestSupport request)
        {
            var user = await _userService.GetAccountByIdAsync(request.UserId);
            if (user != null)
            {
                var notificationDto = new NotificationDto
                {
                    UserId = user.Id,
                    Title = "Yêu cầu hỗ trợ đã được phê duyệt",
                    Message = $"Yêu cầu hỗ trợ của bạn đã được phê duyệt và đang được xử lý",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.AddNotificationAsync(notificationDto);

                await _hubNotificationContext.Clients.User(user.Id.ToString())
                    .SendAsync("ReceiveNotification", notificationDto);

                await GuiEmailYeuCau(user, "SupportApproved.html",
                    "Yêu cầu hỗ trợ đã được phê duyệt",
                    request.Content);
            }
        }

        private async Task GuiThongBaoTuChoiYeuCau(RequestSupport request, string lyDoTuChoi)
        {
            var user = await _userService.GetAccountByIdAsync(request.UserId);
            if (user != null)
            {
                var notificationDto = new NotificationDto
                {
                    UserId = user.Id,
                    Title = "Yêu cầu hỗ trợ bị từ chối",
                    Message = $"Yêu cầu hỗ trợ của bạn đã bị từ chối. Lý do: {lyDoTuChoi}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.AddNotificationAsync(notificationDto);

                await _hubNotificationContext.Clients.User(user.Id.ToString())
                    .SendAsync("ReceiveNotification", notificationDto);

                await GuiEmailYeuCau(user, "SupportRejected.html",
                    "Yêu cầu hỗ trợ đã bị từ chối",
                    request.Content, lyDoTuChoi);
            }
        }

        private async Task GuiEmailYeuCau(Account user, string templateName, string subject, string content, string comment = null)
        {
            try
            {
                string filePath = Path.Combine(_env.ContentRootPath, "EmailTemplates", templateName);
                string emailBody;
                
                if (!File.Exists(filePath))
                {
                    // Fallback template nếu không có file
                    emailBody = comment != null
                        ? $"<p>Yêu cầu hỗ trợ của bạn: {content}</p><p>Lý do từ chối: {comment}</p>"
                        : $"<p>Yêu cầu hỗ trợ của bạn: {content}</p><p>Yêu cầu đã được phê duyệt.</p>";

                    await _emailHelper.SendEmailAsync(
                        subject,
                        emailBody,
                        new List<string> { user.Email },
                        true);
                    return;
                }

                emailBody = await File.ReadAllTextAsync(filePath);
                emailBody = emailBody.Replace("{{UserName}}", user.Name ?? user.Email);
                emailBody = emailBody.Replace("{{Content}}", content);
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
    }
}

