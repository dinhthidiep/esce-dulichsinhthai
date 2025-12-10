using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly ChatbotService _chatbotService;

    public ChatbotController(ChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    public class ChatRequest { public string Question { get; set; } }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        if (string.IsNullOrEmpty(request.Question))
        {
            return BadRequest(new { Answer = "Câu hỏi không được để trống." });
        }

        var answer = await _chatbotService.GetChatResponse(request.Question);

        return Ok(new { Answer = answer });
    }
}
