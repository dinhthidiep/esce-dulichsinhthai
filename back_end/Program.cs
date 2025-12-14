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
using ESCE_SYSTEM.Services.NewsService;
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
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

// ===============================
//      STARTUP (PROGRAM.CS) FIXED
// ===============================

var builder = WebApplication.CreateBuilder(args);

// === CORS CHO NGROK + PAYOS + SIGNALR ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:3000",  // React dev server
                "http://localhost:5002",  // Backend HTTP
                "https://localhost:7267"  // Backend HTTPS
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Cần cho SignalR với JWT token
    });
});

// === Controllers + JSON FIX CYCLE + UTF-8 ===
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.ReferenceHandler =
        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    // Hỗ trợ tiếng Việt UTF-8
    options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
});

builder.Services.AddSignalR();

// ===== Database =====
builder.Services.AddDbContext<ESCEContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ESCE")));

// ===== PayOS & external services =====
builder.Services.Configure<PayOSOptions>(builder.Configuration.GetSection("PayOS"));

builder.Services.AddHttpClient<IPaymentService, PayOSPaymentService>((sp, client) =>
{
    var payos = sp.GetRequiredService<IOptions<PayOSOptions>>().Value;

    // ADD BASEADDRESS ĐỂ FIX LỖI
    client.BaseAddress = new Uri("https://api-merchant.payos.vn");

    client.DefaultRequestHeaders.Add("x-client-id", payos.ClientId);
    client.DefaultRequestHeaders.Add("x-api-key", payos.ApiKey);
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
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<INewsRepository, NewsRepository>();
builder.Services.AddScoped<ChatbotService>();

// --- Helpers và Options ---
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddSingleton<EmailHelper>();
builder.Services.AddSingleton<OTPGenerator>();
builder.Services.Configure<JwtSetting>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpSetting>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<EmailConfig>(builder.Configuration.GetSection("EmailConfig"));

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
            ValidAudience = jwtSettings.Audience,

            // [QUAN TRỌNG] Dòng này để sửa lỗi 403:
            // Nó báo cho .NET biết Role nằm ở key "role" trong Token
            RoleClaimType = "role"
        };

        // Logic xử lý token từ query string cho SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/notificationhub")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// === Swagger ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "ESCE API",
        Version = "v1"
    });
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập JWT token theo dạng: Bearer {your token}"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// ===============================
//      BUILD APP
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

app.UseRouting();

// CORS phải đứng trước Authentication
app.UseCors("AllowAll");

// Fix Cross-Origin-Opener-Policy cho Google OAuth
app.Use(async (context, next) =>
{
    // Cho phép Google OAuth popup hoạt động
    context.Response.Headers.Remove("Cross-Origin-Opener-Policy");
    context.Response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    context.Response.Headers.Remove("Cross-Origin-Embedder-Policy");
    await next();
});

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
app.MapHub<NotificationHub>("/notificationhub"); // Notification Hub
app.MapHub<ChatHub>("/chathub"); // Chat Hub cho tin nhắn giữa users

app.Run();