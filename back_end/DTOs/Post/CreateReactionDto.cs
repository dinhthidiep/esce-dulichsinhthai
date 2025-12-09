using System;

namespace ESCE_SYSTEM.DTOs.Post
{
    public class CreateReactionDto
    {
        public int UserId { get; set; }
        public string TargetType { get; set; } = string.Empty; // 'POST' or 'COMMENT'
        public int TargetId { get; set; }
        public string ReactionType { get; set; } = string.Empty; // 'like', 'dislike', 'love', etc.
    }
}