using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace ESCE_SYSTEM.Models
{
    public partial class ESCEContext : DbContext
    {
        public ESCEContext()
        {
        }

        public ESCEContext(DbContextOptions<ESCEContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Account> Accounts { get; set; } = null!;
        public virtual DbSet<AgencieCertificate> AgencieCertificates { get; set; } = null!;
        public virtual DbSet<Booking> Bookings { get; set; } = null!;
        public virtual DbSet<BookingCoupon> BookingCoupons { get; set; } = null!;
        public virtual DbSet<BonusService> BonusServices { get; set; } = null!;
        public virtual DbSet<Comment> Comments { get; set; } = null!;
        public virtual DbSet<Commentreaction> Commentreactions { get; set; } = null!;
        public virtual DbSet<Coupon> Coupons { get; set; } = null!;
        public virtual DbSet<HostCertificate> HostCertificates { get; set; } = null!;
        public virtual DbSet<Message> Messages { get; set; } = null!;
        public virtual DbSet<News> News { get; set; } = null!;
        public virtual DbSet<Notification> Notifications { get; set; } = null!;
        public virtual DbSet<Otp> Otps { get; set; } = null!;
        public virtual DbSet<Payment> Payments { get; set; } = null!;
        public virtual DbSet<Post> Posts { get; set; } = null!;
        public virtual DbSet<Postreaction> Postreactions { get; set; } = null!;
        public virtual DbSet<Postsave> Postsaves { get; set; } = null!;
        public virtual DbSet<Reaction> Reactions { get; set; } = null!;
        public virtual DbSet<ReactionType> ReactionTypes { get; set; } = null!;
        public virtual DbSet<RequestSupport> RequestSupports { get; set; } = null!;
        public virtual DbSet<Review> Reviews { get; set; } = null!;
        public virtual DbSet<Role> Roles { get; set; } = null!;
        public virtual DbSet<Service> Services { get; set; } = null!;
        public virtual DbSet<ServiceCombo> Servicecombos { get; set; } = null!;
        public virtual DbSet<ServiceComboDetail> ServicecomboDetails { get; set; } = null!;
        public virtual DbSet<SupportResponse> SupportResponses { get; set; } = null!;
        public virtual DbSet<SystemLog> SystemLogs { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server = ADMIN-PC; Database = ESCE1; Trusted_Connection = True; TrustServerCertificate = True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>(entity =>
            {
                entity.ToTable("ACCOUNTS");
                entity.HasIndex(e => e.Email, "UQ__ACCOUNTS__161CF724757E8893").IsUnique();
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Address).HasMaxLength(255).HasColumnName("ADDRESS");
                entity.Property(e => e.Avatar).HasColumnName("AVATAR");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Dob).HasColumnType("date").HasColumnName("DOB");
                entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("EMAIL");
                entity.Property(e => e.Gender).HasMaxLength(10).HasColumnName("GENDER");
                entity.Property(e => e.IsActive).IsRequired().HasColumnName("IS_ACTIVE").HasDefaultValueSql("((1))");
                entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("NAME");
                entity.Property(e => e.Password).HasMaxLength(32).IsUnicode(false).HasColumnName("PASSWORD");
                entity.Property(e => e.PasswordHash).HasMaxLength(500).IsUnicode(false).HasColumnName("PASSWORD_HASH");
                entity.Property(e => e.IS_BANNED).HasColumnName("IS_BANNED").HasDefaultValueSql("((0))");
                entity.Property(e => e.Phone).HasMaxLength(10).IsUnicode(false).HasColumnName("PHONE");
                entity.Property(e => e.RoleId).HasColumnName("ROLE_ID");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Level).HasColumnName("LEVEL").HasDefaultValueSql("((0))");
                entity.Property(e => e.TotalSpent).HasColumnType("decimal(18, 2)").HasColumnName("TOTAL_SPENT").HasPrecision(18, 2).HasDefaultValueSql("((0.00))");

                entity.HasOne(d => d.Role)
                    .WithMany(p => p.Accounts)
                    .HasForeignKey(d => d.RoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ACCOUNTS_ROLES");
            });

            modelBuilder.Entity<AgencieCertificate>(entity =>
            {
                entity.HasKey(e => e.AgencyId).HasName("PK__AGENCIE___95C546DB5FDFFD15");
                entity.ToTable("AGENCIE_CERTIFICATES");
                entity.Property(e => e.AgencyId).HasColumnName("AGENCY_ID");
                entity.Property(e => e.AccountId).HasColumnName("ACCOUNT_ID");
                entity.Property(e => e.Companyname).HasMaxLength(255).HasColumnName("COMPANYNAME");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("EMAIL");
                entity.Property(e => e.LicenseFile).HasMaxLength(500).HasColumnName("LICENSE_FILE");
                entity.Property(e => e.RejectComment).HasMaxLength(1000).HasColumnName("REJECT_COMMENT");
                entity.Property(e => e.ReviewComments).HasMaxLength(1000).HasColumnName("REVIEW_COMMENTS");
                entity.Property(e => e.Phone).HasMaxLength(20).HasColumnName("PHONE");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('pending')");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Website).HasMaxLength(255).HasColumnName("WEBSITE");

                entity.HasOne(d => d.Account)
                    .WithMany(p => p.AgencieCertificates)
                    .HasForeignKey(d => d.AccountId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__AGENCIE_C__Accou__3B75D760");
            });

            modelBuilder.Entity<Booking>(entity =>
            {
                entity.ToTable("BOOKINGS");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                entity.Property(e => e.ServiceComboId).HasColumnName("COMBO_ID");
                entity.Property(e => e.ServiceId).HasColumnName("SERVICE_ID");
                entity.Property(e => e.BonusServiceId).HasColumnName("BONUS_SERVICE_ID");

                entity.Property(e => e.BookingNumber).HasMaxLength(50).IsUnicode(false).HasColumnName("BOOKING_NUMBER");
                entity.Property(e => e.Quantity).HasColumnName("QUANTITY");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)").HasColumnName("UNIT_PRICE");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)").HasColumnName("TOTAL_AMOUNT");
                entity.Property(e => e.ItemType).HasMaxLength(50).HasColumnName("ITEM_TYPE");
                entity.Property(e => e.Notes).HasMaxLength(1000).HasColumnName("NOTES");

                entity.Property(e => e.BookingDate).HasColumnType("datetime").HasColumnName("BOOKING_DATE").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.ConfirmedDate).HasColumnType("datetime").HasColumnName("CONFIRMED_DATE");
                entity.Property(e => e.CompletedDate).HasColumnType("datetime").HasColumnName("COMPLETED_DATE");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('pending')");

                // �� kh?c ph?c l?i CS1061: Servicecombo.Bookings
                entity.HasOne(d => d.ServiceCombo)
                    .WithMany(p => p.Bookings)
                    .HasForeignKey(d => d.ServiceComboId)
                    .HasConstraintName("FK__BOOKINGS__COMBO___59FA5E80");

                entity.HasOne(d => d.Service)
                    .WithMany() // Gi? d?nh Service kh�ng c� navigation property Bookings
                    .HasForeignKey(d => d.ServiceId)
                    .HasConstraintName("FK__BOOKINGS__SERVIC__59FA5E81");

                entity.HasOne(d => d.BonusService)
                    .WithMany()
                    .HasForeignKey(d => d.BonusServiceId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_BOOKINGS_BONUS_SERVICE");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Bookings)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__BOOKINGS__USER_I__59063A47");
            });

            modelBuilder.Entity<BookingCoupon>(entity =>
            {
                entity.ToTable("BOOKING_COUPONS");
                entity.HasIndex(e => new { e.BookingId, e.CouponId }, "UQ_BookingPromotion").IsUnique();
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.AppliedAt).HasColumnType("datetime").HasColumnName("APPLIED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
                entity.Property(e => e.CouponId).HasColumnName("COUPON_ID");

                entity.HasOne(d => d.Booking)
                    .WithMany(p => p.BookingCoupons)
                    .HasForeignKey(d => d.BookingId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__BOOKING_C__BOOKI__5EBF139D");

                entity.HasOne(d => d.Coupon)
                    .WithMany(p => p.BookingCoupons)
                    .HasForeignKey(d => d.CouponId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__BOOKING_C__COUPO__5FB337D6");
            });

            modelBuilder.Entity<Comment>(entity =>
            {
                entity.ToTable("COMMENTS");
                entity.HasIndex(e => e.AuthorId, "IX_Comments_AuthorID");
                entity.HasIndex(e => e.PostId, "IX_Comments_PostID");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.AuthorId).HasColumnName("AUTHOR_ID");
                entity.Property(e => e.Content).HasColumnName("CONTENT");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasColumnName("IMAGE");
                entity.Property(e => e.IsDeleted).HasColumnName("IS_DELETED").HasDefaultValueSql("((0))");
                entity.Property(e => e.ReactionsCount).HasColumnName("REACTIONS_COUNT").HasDefaultValueSql("((0))");
                entity.Property(e => e.ParentCommentId).HasColumnName("PARENT_COMMENT_ID");
                entity.Property(e => e.PostId).HasColumnName("POST_ID");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Comments)
                    .HasForeignKey(d => d.AuthorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__COMMENTS__AUTHOR__787EE5A0");

                entity.HasOne(d => d.Post)
                    .WithMany(p => p.Comments)
                    .HasForeignKey(d => d.PostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__COMMENTS__POST_I__778AC167");
            });

            modelBuilder.Entity<Commentreaction>(entity =>
            {
                entity.ToTable("COMMENTREACTIONS");
                entity.HasIndex(e => e.CommentId, "IX_CommentReactions_CommentID");
                entity.HasIndex(e => new { e.UserId, e.CommentId }, "UQ__COMMENTR__ABB381B18C8E7178").IsUnique();
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Comment)
                    .WithMany(p => p.Commentreactions)
                    .HasForeignKey(d => d.CommentId)
                    .HasConstraintName("FK__COMMENTRE__Comme__74794A92");

                entity.HasOne(d => d.ReactionType)
                    .WithMany(p => p.Commentreactions)
                    .HasForeignKey(d => d.ReactionTypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__COMMENTRE__React__756D6ECB");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Commentreactions)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__COMMENTRE__UserI__73852659");
            });

            modelBuilder.Entity<Coupon>(entity =>
            {
                entity.ToTable("COUPONS");
                entity.HasIndex(e => e.Code, "UQ__COUPONS__AA1D4379B4900E43").IsUnique();
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("CODE");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Description).HasMaxLength(255).HasColumnName("DESCRIPTION");
                entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)").HasColumnName("DISCOUNT_AMOUNT");
                entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)").HasColumnName("DISCOUNT_PERCENT");
                entity.Property(e => e.HostId).HasColumnName("HOST_ID");
                entity.Property(e => e.IsActive).HasColumnName("IS_ACTIVE").HasDefaultValueSql("((1))");
                entity.Property(e => e.ServiceComboId).HasColumnName("SERVICECOMBO_ID");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.UsageCount).HasColumnName("USAGE_COUNT").HasDefaultValueSql("((0))");
                entity.Property(e => e.UsageLimit).HasColumnName("USAGE_LIMIT");
                entity.Property(e => e.ExpiryDate).HasColumnType("datetime").HasColumnName("EXPIRY_DATE");
                entity.Property(e => e.RequiredLevel).HasColumnName("REQUIRED_LEVEL").HasDefaultValueSql("((0))");

                entity.HasOne(d => d.Host)
                    .WithMany(p => p.Coupons)
                    .HasForeignKey(d => d.HostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__COUPONS__HOST_ID__52593CB8");

                // �� kh?c ph?c l?i CS1061: Servicecombo.Coupons
                entity.HasOne(d => d.ServiceCombo)
                    .WithMany(p => p.Coupons)
                    .HasForeignKey(d => d.ServiceComboId)
                    .HasConstraintName("FK__COUPONS__SERVICE__534D60F1");
            });

            modelBuilder.Entity<BonusService>(entity =>
            {
                entity.ToTable("BONUS_SERVICES");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("NAME");
                entity.Property(e => e.Description).HasMaxLength(1000).HasColumnName("DESCRIPTION");
                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)").HasColumnName("PRICE");
                entity.Property(e => e.HostId).HasColumnName("HOST_ID");
                entity.Property(e => e.ServiceId).HasColumnName("SERVICE_ID");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasColumnName("IMAGE");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('active')");

                entity.HasOne(d => d.Host)
                    .WithMany()
                    .HasForeignKey(d => d.HostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_BONUS_SERVICES_HOST");

                entity.HasOne(d => d.Service)
                    .WithMany()
                    .HasForeignKey(d => d.ServiceId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_BONUS_SERVICES_SERVICE");
            });

            modelBuilder.Entity<HostCertificate>(entity =>
            {
                entity.HasKey(e => e.CertificateId).HasName("PK__HOST_CER__BBF8A7C1722F012C");
                entity.ToTable("HOST_CERTIFICATES");
                entity.Property(e => e.HostId).HasColumnName("HOST_ID");
                entity.Property(e => e.BusinessLicenseFile).HasMaxLength(500).HasColumnName("BUSINESS_LICENSE_FILE");
                entity.Property(e => e.BusinessName).HasMaxLength(255).HasColumnName("BUSINESS_NAME");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("EMAIL");
                entity.Property(e => e.Phone).HasMaxLength(20).HasColumnName("PHONE");
                entity.Property(e => e.RejectComment).HasMaxLength(1000).HasColumnName("REJECT_COMMENT");
                entity.Property(e => e.ReviewComments).HasMaxLength(1000).HasColumnName("REVIEW_COMMENTS");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('pending')");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Host)
                    .WithMany(p => p.HostCertificates)
                    .HasForeignKey(d => d.HostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__HOST_CERT__HostI__35BCFE0A");
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.ToTable("MESSAGES");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Content).HasMaxLength(2000).HasColumnName("CONTENT");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.IsRead).HasColumnName("IS_READ").HasDefaultValueSql("((0))");
                entity.Property(e => e.ReceiverId).HasColumnName("RECEIVER_ID");
                entity.Property(e => e.SenderId).HasColumnName("SENDER_ID");

                entity.HasOne(d => d.Sender)
                    .WithMany(p => p.Messages)
                    .HasForeignKey(d => d.SenderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__MESSAGES__SENDER__02084FDA");

                // �� kh?c ph?c l?i CS1061: Account.Receiver (Th�m MessagesReceived v�o Account Model)
                entity.HasOne(d => d.Receiver)
                    .WithMany(p => p.MessagesReceived) // Gi? d?nh t�n property l� MessagesReceived trong Account Model
                    .HasForeignKey(d => d.ReceiverId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__MESSAGES__RECEIV__02084FDB");
            });

            modelBuilder.Entity<News>(entity =>
            {
                entity.ToTable("NEWS");
                entity.HasKey(e => e.NewsId);
                entity.Property(e => e.NewsId).HasColumnName("NEWS_ID");
                entity.Property(e => e.AccountId).HasColumnName("ACCOUNT_ID");
                entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasColumnName("CREATED_DATE").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasColumnName("IMAGE");
                entity.Property(e => e.NewsTitle).HasMaxLength(255).HasColumnName("NEWS_TITLE");
                entity.Property(e => e.SocialMediaLink).HasMaxLength(500).HasColumnName("SOCIAL_MEDIA_LINK");

                entity.HasOne(d => d.Account)
                    .WithMany(p => p.News)
                    .HasForeignKey(d => d.AccountId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__NEWS__AccountId__123EB7A3");
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("NOTIFICATIONS");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.IsRead).HasColumnName("IS_READ").HasDefaultValueSql("((0))");
                entity.Property(e => e.Message).HasMaxLength(500).HasColumnName("MESSAGE");
                entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("TITLE");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__NOTIFICAT__USER___6EF57B66");
            });

            modelBuilder.Entity<Otp>(entity =>
            {
                entity.ToTable("OTP");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Code).HasMaxLength(10).HasColumnName("CODE");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Email).HasMaxLength(50).HasColumnName("EMAIL");
                entity.Property(e => e.ExpirationTime).HasColumnType("datetime").HasColumnName("EXPIRATION_TIME");
                entity.Property(e => e.IsVerified).HasColumnName("IS_VERIFIED").HasDefaultValueSql("((0))");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Otps)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK__OTP__USER_ID__300424B4");
            });

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("PAYMENTS");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)").HasColumnName("AMOUNT");
                entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");
                entity.Property(e => e.Method).HasMaxLength(50).HasColumnName("METHOD");
                entity.Property(e => e.PaymentDate).HasColumnType("datetime").HasColumnName("PAYMENT_DATE").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('pending')");
                entity.Property(e => e.TransactionId).HasMaxLength(255).HasColumnName("TRANSACTION_ID");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT");
                entity.Property(e => e.PaymentType).HasMaxLength(50).HasColumnName("PAYMENT_TYPE").HasDefaultValueSql("('Booking')");
                entity.Property(e => e.UpgradeType).HasMaxLength(50).HasColumnName("UPGRADE_TYPE");

                entity.HasOne(d => d.Booking)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(d => d.BookingId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_PAYMENTS_BOOKING");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_PAYMENTS_USER");
            });

            modelBuilder.Entity<Post>(entity =>
            {
                entity.ToTable("POSTS");
                entity.HasIndex(e => e.AuthorId, "IX_Posts_AuthorID");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.AuthorId).HasColumnName("AUTHOR_ID");
                entity.Property(e => e.CommentsCount).HasColumnName("COMMENTS_COUNT").HasDefaultValueSql("((0))");
                entity.Property(e => e.ReactionsCount).HasColumnName("REACTIONS_COUNT").HasDefaultValueSql("((0))");
                entity.Property(e => e.SavesCount).HasColumnName("SAVES_COUNT").HasDefaultValueSql("((0))");
                entity.Property(e => e.Content).HasColumnName("CONTENT");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasColumnName("IMAGE");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('Pending')");
                entity.Property(e => e.RejectComment).HasMaxLength(1000).HasColumnName("REJECT_COMMENT");
                entity.Property(e => e.ReviewComments).HasMaxLength(1000).HasColumnName("REVIEW_COMMENTS");
                entity.Property(e => e.IsDeleted).HasColumnName("IS_DELETED").HasDefaultValueSql("((0))");
                entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("TITLE");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Posts)
                    .HasForeignKey(d => d.AuthorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__POSTS__AUTHOR_ID__73BA3083");
            });

            modelBuilder.Entity<Postreaction>(entity =>
            {
                entity.ToTable("POSTREACTIONS");
                entity.HasIndex(e => e.PostId, "IX_PostReactions_PostID");
                entity.HasIndex(e => new { e.UserId, e.PostId }, "UQ__POSTREAC__8D29EA4C21AF919E").IsUnique();
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Post)
                    .WithMany(p => p.Postreactions)
                    .HasForeignKey(d => d.PostId)
                    .HasConstraintName("FK__POSTREACT__PostI__6DCC4D03");

                entity.HasOne(d => d.ReactionType)
                    .WithMany(p => p.Postreactions)
                    .HasForeignKey(d => d.ReactionTypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__POSTREACT__React__6EC0713C");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Postreactions)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__POSTREACT__UserI__6CD828CA");
            });

            modelBuilder.Entity<Postsave>(entity =>
            {
                entity.ToTable("POSTSAVES");
                entity.HasIndex(e => new { e.AccountId, e.PostId }, "UQ_PostSave_UserPost").IsUnique();
                entity.Property(e => e.SavedAt).HasColumnType("datetime").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Account)
                    .WithMany(p => p.Postsaves)
                    .HasForeignKey(d => d.AccountId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__POSTSAVES__Accou__671F4F74");

                entity.HasOne(d => d.Post)
                    .WithMany(p => p.Postsaves)
                    .HasForeignKey(d => d.PostId)
                    .HasConstraintName("FK__POSTSAVES__PostI__681373AD");
            });

            modelBuilder.Entity<Reaction>(entity =>
            {
                entity.ToTable("REACTIONS");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.ReactionType).HasMaxLength(20).HasColumnName("REACTION_TYPE");
                entity.Property(e => e.TargetId).HasColumnName("TARGET_ID");
                entity.Property(e => e.TargetType).HasMaxLength(20).HasColumnName("TARGET_TYPE");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Reactions)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__REACTIONS__USER___7D439ABD");
            });

            modelBuilder.Entity<ReactionType>(entity =>
            {
                entity.ToTable("REACTION_TYPES");
                entity.HasIndex(e => e.Name, "UQ__REACTION__737584F61492C36B").IsUnique();
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Name).HasMaxLength(20);
            });

            modelBuilder.Entity<RequestSupport>(entity =>
            {
                entity.ToTable("REQUEST_SUPPORTS");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.ComboId).HasColumnName("COMBO_ID");
                entity.Property(e => e.Content).HasMaxLength(1000).HasColumnName("CONTENT");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasMaxLength(255).IsUnicode(false).HasColumnName("IMAGE");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('Pending')");
                entity.Property(e => e.SupportType).HasMaxLength(255).HasColumnName("SUPPORT_TYPE");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                // �� kh?c ph?c l?i CS1061: Servicecombo.RequestSupports
                entity.HasOne(d => d.ServiceCombo)
                    .WithMany(p => p.RequestSupports)
                    .HasForeignKey(d => d.ComboId)
                    .HasConstraintName("FK__REQUEST_S__COMBO__09A971A2");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.RequestSupports)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__REQUEST_S__USER___08B54D69");
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("REVIEWS");
                entity.Property(e => e.Id).HasColumnName("ID");

                entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");

                entity.Property(e => e.Comment).HasColumnName("COMMENT");
                entity.Property(e => e.CreatedDate).HasColumnType("datetime").HasColumnName("CREATED_DATE").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Rating).HasColumnName("RATING");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('pending')");
                entity.Property(e => e.ParentReviewId).HasColumnName("PARENT_REVIEW_ID");

                entity.HasOne(d => d.Booking)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(d => d.BookingId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__REVIEWS__BOOKING_I__68487DD7");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__REVIEWS__USER_ID__693CA210");

                entity.HasOne(d => d.ParentReview)
                    .WithMany(p => p.Replies)
                    .HasForeignKey(d => d.ParentReviewId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_REVIEWS_PARENT_REVIEW");
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("ROLES");
                entity.HasIndex(e => e.Name, "UQ__ROLES__D9C1FA000635C206").IsUnique();
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Description).HasMaxLength(255).HasColumnName("DESCRIPTION");
                entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("NAME");
            });

            modelBuilder.Entity<Service>(entity =>
            {
                entity.ToTable("SERVICE");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Description).HasMaxLength(255).HasColumnName("DESCRIPTION");
                entity.Property(e => e.HostId).HasColumnName("HOST_ID");
                entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("NAME");
                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)").HasColumnName("PRICE");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Images).HasColumnName("Images");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("Status");
                entity.Property(e => e.RejectComment).HasColumnName("RejectComment");
                entity.Property(e => e.ReviewComments).HasColumnName("ReviewComments");

                entity.HasOne(d => d.Host)
                    .WithMany(p => p.Services)
                    .HasForeignKey(d => d.HostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SERVICE__HOST_ID__403A8C7D");
            });

            modelBuilder.Entity<ServiceCombo>(entity =>
            {
                entity.ToTable("SERVICECOMBO");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Address).HasMaxLength(255).HasColumnName("ADDRESS");
                entity.Property(e => e.AvailableSlots).HasColumnName("AVAILABLE_SLOTS");
                entity.Property(e => e.CancellationPolicy).HasMaxLength(1000).HasColumnName("CANCELLATION_POLICY");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Description).HasMaxLength(1000).HasColumnName("DESCRIPTION");
                entity.Property(e => e.HostId).HasColumnName("HOST_ID");
                entity.Property(e => e.Image).HasColumnName("IMAGE");
                entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("NAME");
                entity.Property(e => e.Price).HasColumnType("decimal(18, 2)").HasColumnName("PRICE");
                entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("STATUS").HasDefaultValueSql("('open')");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime").HasColumnName("UPDATED_AT").HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Host)
                    .WithMany(p => p.ServiceCombos)
                    .HasForeignKey(d => d.HostId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SERVICECO__HOST___45F365D3");
            });

            modelBuilder.Entity<ServiceComboDetail>(entity =>
            {
                entity.ToTable("SERVICECOMBO_DETAIL");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Quantity).HasColumnName("QUANTITY").HasDefaultValueSql("((1))");
                entity.Property(e => e.ServiceId).HasColumnName("SERVICE_ID");
                entity.Property(e => e.ServicecomboId).HasColumnName("SERVICECOMBO_ID");

                entity.HasOne(d => d.Service)
                    .WithMany(p => p.ServiceComboDetails)
                    .HasForeignKey(d => d.ServiceId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SERVICECO__SERVI__4AB81AF0");

                entity.HasOne(d => d.ServiceCombo)
                    .WithMany(p => p.ServiceComboDetails)
                    .HasForeignKey(d => d.ServicecomboId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SERVICECO__SERVI__49C3F6B7");
            });

            modelBuilder.Entity<SupportResponse>(entity =>
            {
                entity.ToTable("SUPPORT_RESPONSES");
                entity.Property(e => e.Id).HasColumnName("ID");
                entity.Property(e => e.Content).HasMaxLength(1000).HasColumnName("CONTENT");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.Image).HasMaxLength(255).HasColumnName("IMAGE");
                entity.Property(e => e.ResponderId).HasColumnName("RESPONDER_ID");
                entity.Property(e => e.SupportId).HasColumnName("SUPPORT_ID");

                entity.HasOne(d => d.Responder)
                    .WithMany(p => p.SupportResponses)
                    .HasForeignKey(d => d.ResponderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SUPPORT_R__RESPO__0E6E26BF");

                entity.HasOne(d => d.Support)
                    .WithMany(p => p.SupportResponses)
                    .HasForeignKey(d => d.SupportId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SUPPORT_R__SUPPO__0D7A0286");
            });

            // �� bao g?m Mapping cho SystemLog
            modelBuilder.Entity<SystemLog>(entity =>
            {
                entity.HasKey(e => e.LogId);
                entity.ToTable("SYSTEM_LOGS");

                entity.Property(e => e.LogId).HasColumnName("LOG_ID");
                entity.Property(e => e.LogLevel).HasMaxLength(50).HasColumnName("LOG_LEVEL");
                entity.Property(e => e.Message).HasColumnName("MESSAGE");
                entity.Property(e => e.StackTrace).HasColumnName("STACK_TRACE");
                entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("CREATED_AT").HasDefaultValueSql("(getdate())");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");
                entity.Property(e => e.Module).HasMaxLength(50).HasColumnName("MODULE");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK_SYSTEM_LOGS_ACCOUNTS");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
