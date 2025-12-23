using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs
{
    public class UpdateReviewDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}

