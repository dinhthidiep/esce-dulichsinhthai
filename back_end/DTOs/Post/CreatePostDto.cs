using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreatePostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Image { get; set; }
        public int AuthorId { get; set; }
    }
}