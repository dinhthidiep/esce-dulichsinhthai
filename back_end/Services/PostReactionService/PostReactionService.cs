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

        public async Task ReactToPost(int postId, byte reactionTypeId)
        {
            var currentUserId = _userContextService.GetCurrentUserId();

            // Kiểm tra reactionTypeId có hợp lệ (từ 1 đến 6)
            if (reactionTypeId <= 0 || reactionTypeId > 6)
            {
                throw new Exception("Loại cảm xúc không hợp lệ. Vui lòng chọn ID từ 1 đến 6.");
            }

            var existingReaction = await _postReactionRepository.GetByUserAndPostAsync(currentUserId, postId);

            if (existingReaction != null)
            {
                // Nếu người dùng đã phản ứng với bài viết
                if (existingReaction.ReactionTypeId == reactionTypeId)
                {
                    // Nếu reaction CÙNG loại, coi như đã thực hiện rồi
                    throw new Exception($"Bạn đã bày tỏ cảm xúc '{GetReactionName(reactionTypeId)}' cho bài viết này rồi.");
                }

                // Nếu reaction KHÁC loại, thực hiện UPDATE (thay thế) reaction cũ
                await _postReactionRepository.DeleteAsync(existingReaction.Id);

                // Cập nhật lại ReactionsCount của bài viết
                var postToUpdateCount = await _postRepository.GetByIdAsync(postId);
                if (postToUpdateCount != null && postToUpdateCount.ReactionsCount > 0)
                {
                    // Giảm 1 cho reaction cũ
                    postToUpdateCount.ReactionsCount--;
                    await _postRepository.UpdateAsync(postToUpdateCount);
                }
            }

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
            {
                throw new Exception("Không tìm thấy bài viết");
            }

            // Thêm Reaction mới
            var postReaction = new Postreaction
            {
                UserId = currentUserId,
                PostId = postId,
                ReactionTypeId = (byte)reactionTypeId, // Ép kiểu rõ ràng sang byte
                CreatedAt = DateTime.Now
            };

            await _postReactionRepository.AddAsync(postReaction);

            // Cập nhật reaction count trong post
            post.ReactionsCount++;
            await _postRepository.UpdateAsync(post);

            string reactionName = GetReactionName(reactionTypeId);

            // Gửi thông báo cho tác giả của bài viết (trừ khi tác giả là người reaction)
            if (post.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                await GuiThongBaoReaction(post.AuthorId, $"Bài viết có cảm xúc mới: {reactionName}",
                    $"{currentUser.Name} đã bày tỏ cảm xúc '{reactionName}' cho bài viết: {post.Title}");
            }
        }

        public async Task UnlikePost(int postReactionId)
        {
            var postReaction = await _postReactionRepository.GetByIdAsync(postReactionId);
            if (postReaction == null)
            {
                throw new Exception("Không tìm thấy lượt cảm xúc");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (postReaction.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền bỏ lượt cảm xúc này");
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
            // Chức năng này sẽ đếm TỔNG số lượng reaction, không chỉ Like (ID=1)
            // Nếu muốn chỉ đếm Like (ID=1) bạn cần sửa Repository
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

        // Phương thức hỗ trợ để ánh xạ ReactionTypeId sang tên
        private string GetReactionName(int typeId)
        {
            switch (typeId)
            {
                case 1: return "Like";
                case 2: return "Love";
                case 3: return "Haha";
                case 4: return "Wow";
                case 5: return "Sad";
                case 6: return "Angry";
                default: return "Cảm xúc";
            }
        }
    }
}