using ESCE_SYSTEM.Options;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MimeKit;
using ESCE_SYSTEM.Options;
using Microsoft.Extensions.Logging;

namespace ESCE_SYSTEM.Helper;

public class EmailHelper
{
    private readonly SmtpSetting _smtpSetting;
    private readonly ILogger<EmailHelper> _logger;

    public EmailHelper(IOptions<SmtpSetting> smtpSetting, ILogger<EmailHelper> logger)
    {
        _smtpSetting = smtpSetting.Value;
        // Loại bỏ khoảng trắng trong password (Gmail App Password không có khoảng trắng)
        if (!string.IsNullOrEmpty(_smtpSetting.Password))
        {
            _smtpSetting.Password = _smtpSetting.Password.Replace(" ", "");
        }
        _logger = logger;
    }

    public async Task SendEmailAsync(string subject, string content, List<string> toEmails, bool isHtmlContent = false, List<string> ccEmails = null)
    {
        try
        {
            _logger.LogInformation($"Attempting to send email to: {string.Join(", ", toEmails)}");
            _logger.LogInformation($"SMTP Server: {_smtpSetting.SmtpServer}, Port: {_smtpSetting.Port}, From: {_smtpSetting.FromEmail}");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtpSetting.AppName, _smtpSetting.FromEmail));
            foreach (var email in toEmails)
            {
                message.To.Add(new MailboxAddress("", email));
            }
            if (ccEmails != null && ccEmails.Count > 0)
            {
                foreach (var cc in ccEmails)
                {
                    message.Cc.Add(new MailboxAddress("", cc));
                }
            }
            message.Subject = subject;

            if (isHtmlContent)
            {
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = content
                };
                message.Body = bodyBuilder.ToMessageBody();
            }
            else
            {
                message.Body = new TextPart("plain")
                {
                    Text = content
                };
            }

            using var client = new SmtpClient();
            _logger.LogInformation("Connecting to SMTP server...");
            await client.ConnectAsync(_smtpSetting.SmtpServer, _smtpSetting.Port, MailKit.Security.SecureSocketOptions.StartTls);
            _logger.LogInformation("SMTP connection successful. Authenticating...");
            await client.AuthenticateAsync(_smtpSetting.FromEmail, _smtpSetting.Password);
            _logger.LogInformation("Authentication successful. Sending email...");
            await client.SendAsync(message);
            _logger.LogInformation($"Email sent successfully to: {string.Join(", ", toEmails)}");
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {string.Join(", ", toEmails)}. Error: {ex.Message}");
            _logger.LogError($"Stack trace: {ex.StackTrace}");
            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }
}