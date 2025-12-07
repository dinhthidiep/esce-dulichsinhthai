using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs.News
{
    public class CreateNewsDto
    {
        [Required(ErrorMessage = "Nội dung tin tức là bắt buộc.")]
        [MaxLength(4000, ErrorMessage = "Nội dung tin tức tối đa 4000 ký tự.")]
        public string Content { get; set; } = null!;

        [MaxLength(500, ErrorMessage = "Link mạng xã hội tối đa 500 ký tự.")]
        public string? SocialMediaLink { get; set; }

        public IEnumerable<string>? Images { get; set; }
    }
}