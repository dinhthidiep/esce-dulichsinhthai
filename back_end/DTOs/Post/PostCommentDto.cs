using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs
{
    public class PostCommentDto
    {
        public required string PostId { get; set; }
        public string? PostCommentId { get; set; }
        public string? Content { get; set; }
        public List<string>? Images { get; set; }
    }

    public class UpdatePostCommentDto
    {
        public string? ReplyPostCommentId { get; set; }
        public string? Content { get; set; }
        public List<string>? Images { get; set; }
    }

    public class PostCommentLikeDto
    {
        public string PostCommentId { get; set; } = null!;
        public string? ReplyPostCommentId { get; set; }
    }

    public class LockCommentDto
    {
        public string CommentId { get; set; } = null!;
        public string Reason { get; set; } = null!;
    }

    public class UnlockCommentDto
    {
        public string CommentId { get; set; } = null!;
        public string Reason { get; set; } = null!;
    }
}