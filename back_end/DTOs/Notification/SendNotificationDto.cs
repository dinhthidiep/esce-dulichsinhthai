namespace ESCE_SYSTEM.DTOs.Notifications
{
    public class SendNotificationDto
    {
        public string UserId { get; set; }
        public string Message { get; set; }
        public string? Title { get; set; }
    }
}