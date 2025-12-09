using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Services.UserService;
using Microsoft.AspNetCore.SignalR;
using ESCE_SYSTEM.SignalR;
using System;
using System.Threading.Tasks;
using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Services.UserContextService;

namespace ESCE_SYSTEM.Services
{
    public class PostSaveService : IPostSaveService
    {
        private readonly IPostSaveRepository _postSaveRepository;
        private readonly IPostRepository _postRepository;
        private readonly IUserContextService _userContextService;
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;

        public PostSaveService(
            IPostSaveRepository postSaveRepository,
            IPostRepository postRepository,
            IUserContextService userContextService,
            IUserService userService,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubNotificationContext)
        {
            _postSaveRepository = postSaveRepository;
            _postRepository = postRepository;
            _userContextService = userContextService;
            _userService = userService;
            _notificationService = notificationService;
            _hubNotificationContext = hubNotificationContext;
        }

        public async Task SavePost(int postId)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var existingSave = await _postSaveRepository.GetByUserAndPostAsync(currentUserId, postId);

            if (existingSave != null)
            {
                throw new Exception("Bạn đã lưu bài viết này rồi");
            }

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
            {
                throw new Exception("Không tìm thấy bài viết");
            }

            var postSave = new Postsave
            {
                AccountId = currentUserId,
                PostId = postId,
                SavedAt = DateTime.Now
            };

            await _postSaveRepository.AddAsync(postSave);

            // Update save count in post
            post.SavesCount++;
            await _postRepository.UpdateAsync(post);

            // Gửi thông báo cho tác giả của bài viết (trừ khi tác giả là người lưu)
            if (post.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                await GuiThongBaoSave(post.AuthorId, "Bài viết của bạn được lưu",
                    $"{currentUser.Name} đã lưu bài viết: {post.Title}");
            }
        }

        public async Task UnsavePost(int postId)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var existingSave = await _postSaveRepository.GetByUserAndPostAsync(currentUserId, postId);

            if (existingSave == null)
            {
                throw new Exception("Bài viết chưa được lưu");
            }

            await _postSaveRepository.DeleteAsync(existingSave.Id);

            // Update save count in post
            var post = await _postRepository.GetByIdAsync(postId);
            if (post != null && post.SavesCount > 0)
            {
                post.SavesCount--;
                await _postRepository.UpdateAsync(post);
            }
        }

        private async Task GuiThongBaoSave(int userId, string tieuDe, string noiDung)
        {
            var notificationDto = new NotificationDto
            {
                UserId = userId,
                Title = tieuDe,
                Message = noiDung,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            await _notificationService.AddNotificationAsync(notificationDto);

            await _hubNotificationContext.Clients.User(userId.ToString())
                .SendAsync("ReceiveNotification", notificationDto);
        }
    }
}