using ESCE_SYSTEM.DTOs;
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
    public class CommentReactionService : ICommentReactionService
    {
        private readonly ICommentReactionRepository _commentReactionRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly IUserContextService _userContextService;
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;

        public CommentReactionService(
            ICommentReactionRepository commentReactionRepository,
            ICommentRepository commentRepository,
            IUserContextService userContextService,
            IUserService userService,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubNotificationContext)
        {
            _commentReactionRepository = commentReactionRepository;
            _commentRepository = commentRepository;
            _userContextService = userContextService;
            _userService = userService;
            _notificationService = notificationService;
            _hubNotificationContext = hubNotificationContext;
        }

        public async Task LikeComment(PostCommentLikeDto postCommentLikeDto)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            // ĐÃ SỬA: Loại bỏ int.Parse() vì PostCommentId đã là int
            var commentId = postCommentLikeDto.PostCommentId;

            var existingReaction = await _commentReactionRepository.GetByUserAndCommentAsync(currentUserId, commentId);

            if (existingReaction != null)
            {
                throw new Exception("Bạn đã thích bình luận này rồi");
            }

            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
            {
                throw new Exception("Không tìm thấy bình luận");
            }

            var commentReaction = new Commentreaction
            {
                UserId = currentUserId,
                CommentId = commentId,
                ReactionTypeId = 1, // Like
                CreatedAt = DateTime.Now
            };

            await _commentReactionRepository.AddAsync(commentReaction);

            // Update reaction count in comment
            comment.ReactionsCount++;
            await _commentRepository.UpdateAsync(comment);

            // Gửi thông báo cho tác giả của bình luận (trừ khi tác giả là người like)
            if (comment.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                await GuiThongBaoReactionBinhLuan(comment.AuthorId, "Có người thích bình luận của bạn",
                    $"{currentUser.Name} đã thích bình luận của bạn");
            }
        }

        public async Task UnlikeComment(int commentReactionId)
        {
            var commentReaction = await _commentReactionRepository.GetByIdAsync(commentReactionId);
            if (commentReaction == null)
            {
                throw new Exception("Không tìm thấy lượt thích");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (commentReaction.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền bỏ lượt thích này");
            }

            await _commentReactionRepository.DeleteAsync(commentReactionId);

            // Update reaction count in comment
            var comment = await _commentRepository.GetByIdAsync(commentReaction.CommentId);
            if (comment != null && comment.ReactionsCount > 0)
            {
                comment.ReactionsCount--;
                await _commentRepository.UpdateAsync(comment);
            }
        }

        public async Task<int> GetLikeCount(int commentId)
        {
            return await _commentReactionRepository.GetCountByCommentIdAsync(commentId);
        }

        private async Task GuiThongBaoReactionBinhLuan(int userId, string tieuDe, string noiDung)
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