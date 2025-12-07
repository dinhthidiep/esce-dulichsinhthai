using Microsoft.AspNetCore.Mvc;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Models;

namespace ESCE_SYSTEM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemLogController : ControllerBase
    {
        private readonly ISystemLogService _service;

        public SystemLogController(ISystemLogService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("level/{logLevel}")]
        public async Task<IActionResult> GetByLogLevel(string logLevel)
        {
            var result = await _service.GetByLogLevelAsync(logLevel);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int? userId)
        {
            var result = await _service.GetByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpGet("module/{module}")]
        public async Task<IActionResult> GetByModule(string? module)
        {
            var result = await _service.GetByModuleAsync(module);
            return Ok(result);
        }

        [HttpPost("log")]
        public async Task<IActionResult> CreateLog([FromBody] CreateLogRequest request)
        {
            await _service.LogAsync(
                request.LogLevel,
                request.Message,
                request.StackTrace,
                request.UserId,
                request.Module
            );
            return Ok("Log created successfully");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok("Deleted successfully");
        }

        [HttpPost("clean")]
        public async Task<IActionResult> CleanOldLogs([FromBody] CleanLogsRequest request)
        {
            await _service.CleanOldLogsAsync(request.DaysToKeep);
            return Ok($"Old logs older than {request.DaysToKeep} days have been deleted");
        }
    }

    public class CreateLogRequest
    {
        public string LogLevel { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? StackTrace { get; set; }
        public int? UserId { get; set; }
        public string? Module { get; set; }
    }

    public class CleanLogsRequest
    {
        public int DaysToKeep { get; set; } = 30;
    }
}