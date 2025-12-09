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
using System.Threading.Tasks;
using Microsoft.Extensions.Logging; // Đảm bảo sử dụng ILogger

var builder = WebApplication.CreateBuilder(args);

// Khai báo biến useInMemoryDb 
bool useInMemoryDb = builder.Configuration.GetValue<bool>("Demo:UseInMemoryDb");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Configure DbContext with SQL Server
builder.Services.AddDbContext<ESCEContext>(options =>
    // SỬA LỖI: Dùng tên Connection String chính xác là "ESCE"
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- ĐĂNG KÝ SERVICES VÀ REPOSITORIES ---
// Khối này đảm bảo tất cả các dependencies được Service Provider tìm thấy.
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
// Cấu hình Authentication với JWT (giữ nguyên)
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
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience
        };
    });
builder.Services.AddControllers().AddJsonOptions(options => { options.JsonSerializerOptions.PropertyNamingPolicy = null; });
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
builder.Services.AddAuthorization();
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // === KHỐI THỰC THI DATABASE MIGRATION VÀ SEED DATA (Phương pháp Khởi động) ===
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var config = services.GetRequiredService<IConfiguration>();

        // Cần ILogger để ghi lại thông báo lỗi
        var logger = services.GetRequiredService<ILogger<Program>>();

        // Lấy DbContext và kiểm tra null (để bắt lỗi kết nối sớm)
        var dbContext = services.GetService<ESCEContext>();
        if (dbContext == null)
        {
            // Nếu không tìm thấy DbContext, dừng ứng dụng ngay.
            logger.LogCritical("FATAL ERROR: DbContext (ESCEContext) could not be resolved. Check connection string 'ESCE' in appsettings.json and service registration.");
            throw new InvalidOperationException("DbContext (ESCEContext) resolution failed.");
        }

        var seedDemo = config.GetValue<bool>("Demo:SeedDemoAccounts");

        try
        {
            logger.LogInformation("Starting database migration...");
            // BƯỚC BẮT BUỘC: Đảm bảo các bảng sẵn sàng (bao gồm fix PASSWORD_HASH)
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migration completed.");

            if (seedDemo)
            {
                logger.LogInformation("Starting application data seeding...");

                // 2. Lấy các services/repositories cần thiết
                var userService = services.GetRequiredService<IUserService>();
                var roleService = services.GetRequiredService<IRoleService>();
                var roleRepository = services.GetRequiredService<IRoleRepository>();
                var userRepository = services.GetRequiredService<IUserRepository>();

                // 3. GỌI HÀM SEED DATA CỦA BẠN
                await ESCE_SYSTEM.SeedData.SeedData.Initialize(userService, roleService, roleRepository, userRepository);
                logger.LogInformation("Application data seeding completed successfully: Roles and Admin Account created/verified.");
            }
        }
        catch (Exception ex)
        {
            // Ghi lại lỗi chi tiết và ném lại lỗi để dừng ứng dụng
            logger.LogCritical(ex, "FATAL ERROR during database seeding. Admin account creation failed.");
            // Ném lỗi để dừng ứng dụng và hiển thị lỗi trên console/Swagger.
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

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Redirect root to swagger/index.html
app.MapGet("/", context =>
{
    context.Response.Redirect("/swagger/index.html");
    return Task.CompletedTask;
});

app.Run();