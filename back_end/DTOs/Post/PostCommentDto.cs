using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs
{
    public class PostCommentDto
    {
        
        public required int PostId { get; set; }

        
        public int? ParentCommentId { get; set; }

        public string? Content { get; set; }
        public List<string>? Images { get; set; }
    }

    public class UpdatePostCommentDto
    {
        
        public string? Content { get; set; }
        public List<string>? Images { get; set; }
    }

    public class PostCommentLikeDto
    {
        public required int PostCommentId { get; set; } // ĐÃ SỬA THÀNH INT
        public int? ReplyPostCommentId { get; set; } // ĐÃ SỬA THÀNH INT?
    }
}