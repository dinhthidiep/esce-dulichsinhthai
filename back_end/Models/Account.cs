// File: Models/Account.cs

using System;
using System.Collections.Generic;

namespace ESCE_SYSTEM.Models
{
    public partial class Account
    {
        public Account()
        {
            AgencieCertificates = new HashSet<AgencieCertificate>();
            Bookings = new HashSet<Booking>();
            Commentreactions = new HashSet<Commentreaction>();
            Comments = new HashSet<Comment>();
            Coupons = new HashSet<Coupon>();
            HostCertificates = new HashSet<HostCertificate>();
            Messages = new HashSet<Message>(); // Tin nhắn gửi
            MessagesReceived = new HashSet<Message>(); // BỔ SUNG: Tin nhắn nhận (Receiver)
            News = new HashSet<News>();
            Notifications = new HashSet<Notification>();
            Otps = new HashSet<Otp>();
            Postreactions = new HashSet<Postreaction>();
            Posts = new HashSet<Post>();
            Postsaves = new HashSet<Postsave>();
            Reactions = new HashSet<Reaction>();
            RequestSupports = new HashSet<RequestSupport>();
            Reviews = new HashSet<Review>();
            ServiceCombos = new HashSet<ServiceCombo>();
            Services = new HashSet<Service>();
            SupportResponses = new HashSet<SupportResponse>();
            Payments = new HashSet<Payment>();
        }

        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? Password { get; set; }
        public string? Avatar { get; set; }
        public string? Phone { get; set; }
        public DateTime? Dob { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int RoleId { get; set; }
        public bool IS_BANNED { get; set; }

        // --- Cột mới theo yêu cầu ---
        public int Level { get; set; } = 0; // Cấp độ thành viên (0, 1, 2, 3)
        public decimal TotalSpent { get; set; } = 0.00M; // Tổng chi tiêu (Decimal cho tiền tệ)

        public virtual Role Role { get; set; } = null!;
        public virtual ICollection<AgencieCertificate> AgencieCertificates { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; }
        public virtual ICollection<Commentreaction> Commentreactions { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }
        public virtual ICollection<Coupon> Coupons { get; set; }
        public virtual ICollection<HostCertificate> HostCertificates { get; set; }
        public virtual ICollection<Message> Messages { get; set; } // Tin nhắn đã gửi (Sender)
        public virtual ICollection<Message> MessagesReceived { get; set; } // Tin nhắn đã nhận (Receiver)
        public virtual ICollection<News> News { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }
        public virtual ICollection<Otp> Otps { get; set; }
        public virtual ICollection<Postreaction> Postreactions { get; set; }
        public virtual ICollection<Post> Posts { get; set; }
        public virtual ICollection<Postsave> Postsaves { get; set; }
        public virtual ICollection<Reaction> Reactions { get; set; }
        public virtual ICollection<RequestSupport> RequestSupports { get; set; }
        public virtual ICollection<Review> Reviews { get; set; }
        public virtual ICollection<ServiceCombo> ServiceCombos { get; set; }
        public virtual ICollection<Service> Services { get; set; }
        public virtual ICollection<SupportResponse> SupportResponses { get; set; }
        public virtual ICollection<Payment> Payments { get; set; }
    }
}