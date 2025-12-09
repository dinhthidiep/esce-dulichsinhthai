namespace ESCE_SYSTEM.Services.UserContextService
{
    public interface IUserContextService
    {
        string? UserId { get; }
        string? UserEmail { get; }
        string? Role { get; }
        // BỔ SUNG: Phương thức lấy ID người dùng hiện tại dưới dạng int
        int GetCurrentUserId();

        // BỔ SUNG: Phương thức kiểm tra quyền Admin
        bool IsAdmin();
    }
}
