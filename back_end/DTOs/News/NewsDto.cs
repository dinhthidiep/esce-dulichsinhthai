namespace ESCE_SYSTEM.DTOs.News
{
    public class NewsDto
    {
        public int NewsId { get; set; }
        public string Content { get; set; } = null!;
        public IEnumerable<string> Images { get; set; } = Array.Empty<string>();
        public string? SocialMediaLink { get; set; }
        public DateTime? CreatedDate { get; set; }

        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string AuthorRole { get; set; } = null!;

        public int LikesCount { get; set; }
        public bool IsLiked { get; set; }
    }
}