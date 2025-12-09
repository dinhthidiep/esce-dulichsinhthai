using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateCommentDto
    {
        public int PostId { get; set; }
        public int AuthorId { get; set; }
        public int? ParentCommentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? Image { get; set; }
    }
}