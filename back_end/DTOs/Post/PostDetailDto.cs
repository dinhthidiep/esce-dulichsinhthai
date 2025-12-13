using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs
{
    public class PostDetailDto
    {
        public string PostId { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime CreatedDate { get; set; }
        public List<string> Images { get; set; } = new List<string>();
        public string RejectComment { get; set; } = null!;
        public string PosterName { get; set; } = null!;
        public string PostContent { get; set; } = null!;
        public string PublicDate { get; set; } = null!;
        public string PosterId { get; set; } = null!;
        public string PosterRole { get; set; } = null!;
        public string PosterApproverId { get; set; } = null!;
        public string PosterApproverName { get; set; } = null!;
        public List<string> Hashtags { get; set; } = new List<string>();

        public IEnumerable<PostLikeDetailDto> Likes { get; set; } = new List<PostLikeDetailDto>();
        public IEnumerable<PostCommentDetailDto> Comments { get; set; } = new List<PostCommentDetailDto>();
    }

    public class PostLikeDetailDto
    {
        public string AccountId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string CreatedDate { get; set; } = null!;
        public byte ReactionTypeId { get; set; }
        public string? ReactionTypeName { get; set; }
    }

    public class PostCommentDetailDto
    {
        public string FullName { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string CreatedDate { get; set; } = null!;
        public List<string>? Images { get; set; }
    }
}