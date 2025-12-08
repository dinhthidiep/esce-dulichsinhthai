using ESCE_SYSTEM.Helper;
using ESCE_SYSTEM.Helpers;
using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Options;
using ESCE_SYSTEM.Repositories;
using ESCE_SYSTEM.Repositories.MessageRepository;
using ESCE_SYSTEM.Repositories.NotificationRepository;
using ESCE_SYSTEM.Repositories.OtpRepository;
using ESCE_SYSTEM.Repositories.RoleRepository;
using ESCE_SYSTEM.Repositories.UserRepository;
using ESCE_SYSTEM.SeedData;
using ESCE_SYSTEM.Services;
using ESCE_SYSTEM.Services.MessageService;
using ESCE_SYSTEM.Services.NotificationService;
using ESCE_SYSTEM.Services.PaymentService;
using ESCE_SYSTEM.Services.RoleService;
using ESCE_SYSTEM.Services.StatisticsService;
using ESCE_SYSTEM.Services.UserContextService;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Logging;

// ===============================
//   STARTUP (PROGRAM.CS) CLEAN
// ===============================

var builder = WebApplication.CreateBuilder(args);

// === CORS CHO NGROK + PAYOS ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// === Controllers + JSON FIX CYCLE ===
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.ReferenceHandler =
        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddSignalR();

// ===== Database =====
builder.Services.AddDbContext<ESCEContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== PayOS & external services =====
builder.Services.Configure<PayOSOption>(builder.Configuration.GetSection("PayOS"));

// Force IPv4 và DNS resolution cho PayOS
System.Net.ServicePointManager.DnsRefreshTimeout = 0; // Disable DNS cache
System.Net.ServicePointManager.Expect100Continue = false;

builder.Services.AddHttpClient<IPaymentService, PayOSPaymentService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30); // Timeout 30 giây
    client.BaseAddress = new Uri("https://api-merchant.payos.vn/");
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    // Sử dụng proxy system nếu có
    UseProxy = true,
    // Cho phép redirect
    AllowAutoRedirect = true
});

// ===== Repositories & Services =====
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<ICommentReactionRepository, CommentReactionRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();
builder.Services.AddScoped<IPostReactionRepository, PostReactionRepository>();
builder.Services.AddScoped<IPostSaveRepository, PostSaveRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IServiceComboDetailRepository, ServiceComboDetailRepository>();
builder.Services.AddScoped<IServiceComboRepository, ServiceComboRepository>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<ISystemLogRepository, SystemLogRepository>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICommentReactionService, CommentReactionService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IPostReactionService, PostReactionService>();
builder.Services.AddScoped<IPostSaveService, PostSaveService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IServiceComboDetailService, ServiceComboDetailService>();
builder.Services.AddScoped<IServiceComboService, ServiceComboService>();
builder.Services.AddScoped<IServiceService, ServiceService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<ISystemLogService, SystemLogService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<NotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<MessageRepository, MessageRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddSingleton<EmailHelper>();
builder.Services.AddSingleton<OTPGenerator>();
builder.Services.Configure<JwtSetting>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpSetting>(builder.Configuration.GetSection("Email"));

// === Authentication (JWT) ===
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSetting>();
        if (string.IsNullOrEmpty(jwtSettings?.Key))
            throw new InvalidOperationException("Missing Jwt:Key in appsettings.json");

        var key = Encoding.UTF8.GetBytes(jwtSettings.Key);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience
        };
    });

builder.Services.AddAuthorization();

// === Swagger ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ===============================
//   BUILD APP
// ===============================

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // ===== Migration + Seeding =====
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var db = services.GetRequiredService<ESCEContext>();
        await db.Database.MigrateAsync();

        var logger = services.GetRequiredService<ILogger<Program>>();
        var config = services.GetRequiredService<IConfiguration>();

        var seedDemo = config.GetValue<bool>("Demo:SeedDemoAccounts");

        if (seedDemo)
        {
            var userService = services.GetRequiredService<IUserService>();
            var roleService = services.GetRequiredService<IRoleService>();
            var roleRepository = services.GetRequiredService<IRoleRepository>();
            var userRepository = services.GetRequiredService<IUserRepository>();

            await ESCE_SYSTEM.SeedData.SeedData.Initialize(
                userService, roleService, roleRepository, userRepository
            );
        }

        logger.LogInformation("Database + Seed completed.");
    }

    // Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}

// static files
app.UseStaticFiles();

// VERY IMPORTANT: DO NOT enable HTTPS redirection for NGROK
// app.UseHttpsRedirection();

app.UseRouting();

// CORS phải đứng trước Authentication
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// Redirect root → Swagger
app.MapGet("/", context =>
{
    context.Response.Redirect("/swagger/index.html");
    return Task.CompletedTask;
});

// SignalR
// app.MapHub<NotificationHub>("/notificationHub");  // bật nếu bạn dùng

app.Run();
