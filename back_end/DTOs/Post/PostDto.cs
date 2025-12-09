using System.Collections.Generic;

namespace ESCE_SYSTEM.DTOs
{
    public class PostDto
    {
        public string PostContent { get; set; } = null!;
        public List<string>? Images { get; set; }
        public string PosterName { get; set; } = null!;
        public List<string> Hashtags { get; set; } = new List<string>();
        public string? ArticleTitle { get; set; }
    }

    public class ApprovePostDto
    {
        public string PostId { get; set; } = null!;
    }

    public class RejectPostDto
    {
        public string PostId { get; set; } = null!;
        public string Comment { get; set; } = null!;
    }
}