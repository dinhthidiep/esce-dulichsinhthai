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
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// Khai báo biến useInMemoryDb (Giữ nguyên)
// bool useInMemoryDb = builder.Configuration.GetValue<bool>("Demo:UseInMemoryDb");

// Add services to the container.
builder.Services.AddSignalR();

// --- Cấu hình Controllers và Json Options ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // KHẮC PHỤC LỖI CHU KỲ THAM CHIẾU
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

// Configure DbContext with SQL Server
builder.Services.AddDbContext<ESCEContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ESCE")));

// --- ĐĂNG KÝ SERVICES VÀ REPOSITORIES ---
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
// Sử dụng Interface cho Message và Notification Repositories nếu có, nếu không thì để nguyên.
builder.Services.AddScoped<NotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<MessageRepository, MessageRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<INewsRepository, NewsRepository>();

// Đã THÊM: Đăng ký Payment Service (dùng HttpClient)
builder.Services.AddHttpClient<IPaymentService, PayOSPaymentService>();

builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddSingleton<EmailHelper>();
builder.Services.AddSingleton<OTPGenerator>();


// --- Cấu hình Options ---
builder.Services.Configure<JwtSetting>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpSetting>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<PayOSOptions>(builder.Configuration.GetSection("PayOS"));
builder.Services.Configure<EmailConfig>(builder.Configuration.GetSection("EmailConfig")); // ĐÃ THÊM EmailConfig nếu thiếu


// Cấu hình Authentication với JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSetting>();
        if (string.IsNullOrEmpty(jwtSettings?.Key))
        {
            throw new InvalidOperationException("Jwt:Key is not configured properly in appsettings.json");
        }
        var key = Encoding.UTF8.GetBytes(jwtSettings.Key);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false, // Cấu hình của bạn
            ValidateAudience = false, // Cấu hình của bạn
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience
        };
        // Cần thiết để gửi token qua query string cho SignalR
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

// --- Cấu hình CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin(); // Thay thế bằng .WithOrigins(...) nếu muốn bảo mật hơn
    });
});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();

// --- Cấu hình Swagger ---
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // === KHỐI THỰC THI DATABASE MIGRATION VÀ SEED DATA (Phương pháp Khởi động) ===
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var config = services.GetRequiredService<IConfiguration>();

        var logger = services.GetRequiredService<ILogger<Program>>();

        var dbContext = services.GetService<ESCEContext>();
        if (dbContext == null)
        {
            logger.LogCritical("FATAL ERROR: DbContext (ESCEContext) could not be resolved. Check connection string 'ESCE' in appsettings.json and service registration.");
            throw new InvalidOperationException("DbContext (ESCEContext) resolution failed.");
        }

        var seedDemo = config.GetValue<bool>("Demo:SeedDemoAccounts");

        try
        {
            logger.LogInformation("Starting database migration...");
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migration completed.");

            if (seedDemo)
            {
                logger.LogInformation("Starting application data seeding...");

                var userService = services.GetRequiredService<IUserService>();
                var roleService = services.GetRequiredService<IRoleService>();
                var roleRepository = services.GetRequiredService<IRoleRepository>();
                var userRepository = services.GetRequiredService<IUserRepository>();

                await ESCE_SYSTEM.SeedData.SeedData.Initialize(userService, roleService, roleRepository, userRepository);
                logger.LogInformation("Application data seeding completed successfully: Roles and Admin Account created/verified.");
            }
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "FATAL ERROR during database seeding. Admin account creation failed.");
            // CHỈ THROW LỖI TRONG MÔI TRƯỜNG PHÁT TRIỂN NẾU VIỆC KHỞI TẠO BỊ LỖI
            throw;
        }
    }
    // === KẾT THÚC KHỐI SEED DATA ===

    // Enable Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable static files serving (Dùng cho cả Development và Production)
app.UseStaticFiles();

app.UseHttpsRedirection();

// Dùng CORS trước Authentication/Authorization
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Ánh xạ SignalR Hub
app.MapHub<NotificationHub>("/notificationhub");

app.MapControllers();

// Redirect root to swagger/index.html
app.MapGet("/", context =>
{
    context.Response.Redirect("/swagger/index.html");
    return Task.CompletedTask;
});

app.Run();