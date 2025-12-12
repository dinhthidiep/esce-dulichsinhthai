namespace ESCE_SYSTEM.DTOs.Support
{
    public class ApproveSupportDto
    {
        public string SupportId { get; set; } = null!;
    }

    public class RejectSupportDto
    {
        public string SupportId { get; set; } = null!;
        public string Comment { get; set; } = null!;
    }

    public class UpdateSupportStatusDto
    {
        public string SupportId { get; set; } = null!;
        public string Status { get; set; } = null!;
    }

    public class CreateSupportRequestDto
    {
        public int? ComboId { get; set; }
        public string? SupportType { get; set; }
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
    }

    public class CreateSupportResponseDto
    {
        public string SupportId { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? Image { get; set; }
    }
}


