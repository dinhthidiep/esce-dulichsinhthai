using System.ComponentModel.DataAnnotations;

namespace ESCE_SYSTEM.DTOs.Message
{
    public class CreateChatMessageDto
    {
        [Required(ErrorMessage = "ReceiverId là bắt buộc.")]
        public string ReceiverId { get; set; } = null!;

        [Required(ErrorMessage = "Nội dung tin nhắn là bắt buộc.")]
        [MinLength(1, ErrorMessage = "Tin nhắn không được để trống.")]
        public string Content { get; set; } = null!;
    }
}