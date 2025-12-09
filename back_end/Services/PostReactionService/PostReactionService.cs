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
    public class PostReactionService : IPostReactionService
    {
        private readonly IPostReactionRepository _postReactionRepository;
        private readonly IPostRepository _postRepository;
        private readonly IUserContextService _userContextService;
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;

        public PostReactionService(
            IPostReactionRepository postReactionRepository,
            IPostRepository postRepository,
            IUserContextService userContextService,
            IUserService userService,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubNotificationContext)
        {
            _postReactionRepository = postReactionRepository;
            _postRepository = postRepository;
            _userContextService = userContextService;
            _userService = userService;
            _notificationService = notificationService;
            _hubNotificationContext = hubNotificationContext;
        }

        public async Task LikePost(int postId)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var existingReaction = await _postReactionRepository.GetByUserAndPostAsync(currentUserId, postId);

            if (existingReaction != null)
            {
                throw new Exception("Bạn đã thích bài viết này rồi");
            }

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
            {
                throw new Exception("Không tìm thấy bài viết");
            }

            var postReaction = new Postreaction
            {
                UserId = currentUserId,
                PostId = postId,
                ReactionTypeId = 1, // Like
                CreatedAt = DateTime.Now
            };

            await _postReactionRepository.AddAsync(postReaction);

            // Update reaction count in post
            post.ReactionsCount++;
            await _postRepository.UpdateAsync(post);

            // Gửi thông báo cho tác giả của bài viết (trừ khi tác giả là người like)
            if (post.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                await GuiThongBaoReaction(post.AuthorId, "Có người thích bài viết của bạn",
                    $"{currentUser.Name} đã thích bài viết: {post.Title}");
            }
        }

        public async Task UnlikePost(int postReactionId)
        {
            var postReaction = await _postReactionRepository.GetByIdAsync(postReactionId);
            if (postReaction == null)
            {
                throw new Exception("Không tìm thấy lượt thích");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (postReaction.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền bỏ lượt thích này");
            }

            await _postReactionRepository.DeleteAsync(postReactionId);

            // Update reaction count in post
            var post = await _postRepository.GetByIdAsync(postReaction.PostId);
            if (post != null && post.ReactionsCount > 0)
            {
                post.ReactionsCount--;
                await _postRepository.UpdateAsync(post);
            }
        }

        public async Task<int> GetLikeCount(int postId)
        {
            return await _postReactionRepository.GetCountByPostIdAsync(postId);
        }

        private async Task GuiThongBaoReaction(int userId, string tieuDe, string noiDung)
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