using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.DTOs.Notifications;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Services.UserService;
using Microsoft.AspNetCore.SignalR;
using ESCE_SYSTEM.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Services.UserContextService;

namespace ESCE_SYSTEM.Services
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IPostRepository _postRepository;
        private readonly IUserContextService _userContextService;
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubNotificationContext;

        public CommentService(
            ICommentRepository commentRepository,
            IPostRepository postRepository,
            IUserContextService userContextService,
            IUserService userService,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubNotificationContext)
        {
            _commentRepository = commentRepository;
            _postRepository = postRepository;
            _userContextService = userContextService;
            _userService = userService;
            _notificationService = notificationService;
            _hubNotificationContext = hubNotificationContext;
        }

        public async Task Create(PostCommentDto commentDto)
        {
            var post = await _postRepository.GetByIdAsync(int.Parse(commentDto.PostId));
            if (post == null)
            {
                throw new Exception("Không tìm thấy bài viết");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var currentUser = await _userService.GetAccountByIdAsync(currentUserId);

            var comment = new Comment
            {
                PostId = int.Parse(commentDto.PostId),
                AuthorId = currentUserId,
                Content = commentDto.Content ?? string.Empty,
                Image = commentDto.Images != null && commentDto.Images.Any() ? string.Join(",", commentDto.Images) : null,
                CreatedAt = DateTime.Now,
                IsDeleted = false,
                ReactionsCount = 0
            };

            if (!string.IsNullOrEmpty(commentDto.PostCommentId))
            {
                comment.ParentCommentId = int.Parse(commentDto.PostCommentId);

                // Gửi thông báo cho tác giả của comment gốc (reply)
                var parentComment = await _commentRepository.GetByIdAsync(int.Parse(commentDto.PostCommentId));
                if (parentComment != null && parentComment.AuthorId != currentUserId)
                {
                    await GuiThongBaoBinhLuan(parentComment.AuthorId, "Có phản hồi mới cho bình luận của bạn",
                        $"{currentUser.Name} đã phản hồi bình luận của bạn: {commentDto.Content?.Substring(0, Math.Min(50, commentDto.Content.Length))}...");
                }
            }
            else
            {
                // Gửi thông báo cho tác giả của bài viết (bình luận mới)
                if (post.AuthorId != currentUserId)
                {
                    await GuiThongBaoBinhLuan(post.AuthorId, "Có bình luận mới trên bài viết của bạn",
                        $"{currentUser.Name} đã bình luận trên bài viết của bạn: {commentDto.Content?.Substring(0, Math.Min(50, commentDto.Content.Length))}...");
                }
            }

            await _commentRepository.AddAsync(comment);

            // Cập nhật CommentsCount trong Post
            post.CommentsCount++;
            await _postRepository.UpdateAsync(post);
        }

        public async Task Delete(int id)
        {
            var comment = await _commentRepository.GetByIdAsync(id);
            if (comment == null)
            {
                throw new Exception("Không tìm thấy bình luận");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (comment.AuthorId != currentUserId && !_userContextService.IsAdmin())
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa bình luận này");
            }

            await _commentRepository.SoftDeleteAsync(id);

            // Cập nhật CommentsCount trong Post
            var post = await _postRepository.GetByIdAsync(comment.PostId);
            if (post != null)
            {
                post.CommentsCount--;
                await _postRepository.UpdateAsync(post);
            }

            // Gửi thông báo cho tác giả của bình luận
            await GuiThongBaoBinhLuan(comment.AuthorId, "Bình luận đã bị xóa",
                "Bình luận của bạn đã bị xóa");
        }

        public async Task<Comment> GetById(int id)
        {
            return await _commentRepository.GetByIdAsync(id);
        }

        public async Task<List<Comment>> GetByPostId(int postId)
        {
            return (await _commentRepository.GetByPostIdAsync(postId)).ToList();
        }

        public async Task Update(int id, UpdatePostCommentDto commentDto)
        {
            var comment = await _commentRepository.GetByIdAsync(id);
            if (comment == null)
            {
                throw new Exception("Không tìm thấy bình luận");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (comment.AuthorId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật bình luận này");
            }

            var oldContent = comment.Content;
            comment.Content = commentDto.Content ?? comment.Content;
            comment.Image = commentDto.Images != null && commentDto.Images.Any() ? string.Join(",", commentDto.Images) : comment.Image;
            comment.UpdatedAt = DateTime.Now;

            await _commentRepository.UpdateAsync(comment);

            // Gửi thông báo cho tác giả của bài viết khi bình luận được cập nhật
            var post = await _postRepository.GetByIdAsync(comment.PostId);
            if (post != null && post.AuthorId != currentUserId)
            {
                var currentUser = await _userService.GetAccountByIdAsync(currentUserId);
                await GuiThongBaoBinhLuan(post.AuthorId, "Bình luận đã được cập nhật",
                    $"{currentUser.Name} đã cập nhật bình luận trên bài viết của bạn");
            }
        }

        private async Task GuiThongBaoBinhLuan(int userId, string tieuDe, string noiDung)
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