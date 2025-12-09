using ESCE_SYSTEM.Services.UserContextService;
using System.Security.Claims;

namespace ESCE_SYSTEM.Services.UserContextService
{
    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
        public string? UserEmail => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;
        // **TRIỂN KHAI PHƯƠNG THỨC BỔ SUNG: GetCurrentUserId**
        public int GetCurrentUserId()
        {
            // Cố gắng parse UserId (string) sang int
            if (UserId != null && int.TryParse(UserId, out int userId))
            {
                return userId;
            }
            // Trả về 0 hoặc throw Unauthorized nếu không tìm thấy ID hợp lệ
            return 0;
        }

        // **TRIỂN KHAI PHƯƠNG THỨC BỔ SUNG: IsAdmin**
        public bool IsAdmin()
        {
            // Giả định Role "Admin" là vai trò có quyền phê duyệt
            // Tên Role có thể là "Admin" (Role ID = 1) hoặc "Host" (Role ID = 2), tùy theo logic của bạn.
            // Dựa trên code PostService, có vẻ bạn chỉ cần Admin.
            return Role == "Admin";
        }

    }
}
