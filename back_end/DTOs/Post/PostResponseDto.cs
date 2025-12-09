using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs
{
    public class PostResponseDto
    {
        public string PostId { get; set; } = null!;
        public string PostContent { get; set; } = null!;
        public List<string> Images { get; set; } = new List<string>();
        public string PosterId { get; set; } = null!;
        public string PosterRole { get; set; } = null!;
        public string PosterName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string RejectComment { get; set; } = null!;
        public string PosterApproverId { get; set; } = null!;
        public string PosterApproverName { get; set; } = null!;
        public string PublicDate { get; set; } = null!;
        public string ArticleTitle { get; set; } = null!;

        public List<PostLikeResponseDto> Likes { get; set; } = new List<PostLikeResponseDto>();
        public List<PostCommentResponseDto> Comments { get; set; } = new List<PostCommentResponseDto>();
        public List<string> Hashtags { get; set; } = new List<string>();
    }

    public class PostLikeResponseDto
    {
        public string PostLikeId { get; set; } = null!;
        public string AccountId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime CreatedDate { get; set; }
    }

    public class PostCommentResponseDto
    {
        public string PostCommentId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Content { get; set; } = null!;
        public List<string>? Images { get; set; }
        public DateTime? CreatedDate { get; set; }

        public List<PostCommentLikeResponseDto> Likes { get; set; } = new List<PostCommentLikeResponseDto>();
        public List<ReplyPostCommentResponseDto> Replies { get; set; } = new List<ReplyPostCommentResponseDto>();
    }

    public class ReplyPostCommentResponseDto
    {
        public string ReplyPostCommentId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Content { get; set; } = null!;
        public List<string>? Images { get; set; }
        public DateTime? CreatedDate { get; set; }
        public List<PostCommentLikeResponseDto> Likes { get; set; } = new List<PostCommentLikeResponseDto>();
    }

    public class PostCommentLikeResponseDto
    {
        public string PostCommentLikeId { get; set; } = null!;
        public string AccountId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime CreatedDate { get; set; }
    }
}