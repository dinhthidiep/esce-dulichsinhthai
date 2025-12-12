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
            // Gọi ReactToPost với reactionTypeId = 1 (Like) để tương thích ngược
            await ReactToPost(postId, 1);
        }

        public async Task ReactToPost(int postId, byte reactionTypeId)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            
            // Kiểm tra xem user đã có reaction nào cho post này chưa
            var existingReaction = await _postReactionRepository.GetByUserAndPostAsync(currentUserId, postId);

            // Nếu đã có reaction, xóa reaction cũ trước khi thêm reaction mới
            if (existingReaction != null)
            {
                // Nếu cùng loại reaction -> unlike (xóa)
                if (existingReaction.ReactionTypeId == reactionTypeId)
                {
                    await UnlikePost(existingReaction.Id);
                    return;
                }
                else
                {
                    // Nếu khác loại reaction -> cập nhật reaction type
                    existingReaction.ReactionTypeId = reactionTypeId;
                    existingReaction.CreatedAt = DateTime.Now;
                    await _postReactionRepository.UpdateAsync(existingReaction);
                    return;
                }
            }

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
            {
                throw new Exception("Không tìm thấy bài viết");
            }

            // Validate reactionTypeId (1-6)
            if (reactionTypeId < 1 || reactionTypeId > 6)
            {
                throw new Exception("Loại cảm xúc không hợp lệ. Vui lòng chọn từ 1-6.");
            }

            var postReaction = new Postreaction
            {
                UserId = currentUserId,
                PostId = postId,
                ReactionTypeId = reactionTypeId,
                CreatedAt = DateTime.Now
            };

            await _postReactionRepository.AddAsync(postReaction);

            // Update reaction count in post
            post.ReactionsCount++;
            await _postRepository.UpdateAsync(post);

            // Gửi thông báo cho tác giả của bài viết (trừ khi tác giả là người react)
            if (post.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                var reactionNames = new[] { "", "thích", "yêu thích", "haha", "wow", "buồn", "phẫn nộ" };
                var reactionName = reactionTypeId < reactionNames.Length ? reactionNames[reactionTypeId] : "phản ứng";
                await GuiThongBaoReaction(post.AuthorId, "Có người phản ứng với bài viết của bạn",
                    $"{currentUser.Name} đã {reactionName} bài viết: {post.Title}");
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