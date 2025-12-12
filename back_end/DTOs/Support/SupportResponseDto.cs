namespace ESCE_SYSTEM.DTOs.Support
{
    public class SupportRequestResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public int? ComboId { get; set; }
        public string? ComboName { get; set; }
        public string? SupportType { get; set; }
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SupportResponseDetailDto>? Responses { get; set; }
    }

    public class SupportResponseDetailDto
    {
        public int Id { get; set; }
        public int SupportId { get; set; }
        public int ResponderId { get; set; }
        public string? ResponderName { get; set; }
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}


