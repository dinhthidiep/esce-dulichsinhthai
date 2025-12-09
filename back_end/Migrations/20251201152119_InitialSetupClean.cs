using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESCE_SYSTEM.Migrations
{
    public partial class InitialSetupClean : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "REACTION_TYPES",
                columns: table => new
                {
                    ID = table.Column<byte>(type: "tinyint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REACTION_TYPES", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "ROLES",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NAME = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ROLES", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "ACCOUNTS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NAME = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EMAIL = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PASSWORD_HASH = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: false),
                    PASSWORD = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    AVATAR = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PHONE = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    DOB = table.Column<DateTime>(type: "date", nullable: true),
                    GENDER = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    ADDRESS = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IS_ACTIVE = table.Column<bool>(type: "bit", nullable: false, defaultValueSql: "((1))"),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    ROLE_ID = table.Column<int>(type: "int", nullable: false),
                    IS_BANNED = table.Column<bool>(type: "bit", nullable: false, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ACCOUNTS", x => x.ID);
                    table.ForeignKey(
                        name: "FK_ACCOUNTS_ROLES",
                        column: x => x.ROLE_ID,
                        principalTable: "ROLES",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "AGENCIE_CERTIFICATES",
                columns: table => new
                {
                    AGENCY_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ACCOUNT_ID = table.Column<int>(type: "int", nullable: false),
                    COMPANYNAME = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    LICENSE_FILE = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PHONE = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EMAIL = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    WEBSITE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValueSql: "('pending')"),
                    REJECT_COMMENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    REVIEW_COMMENTS = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AGENCIE___95C546DB5FDFFD15", x => x.AGENCY_ID);
                    table.ForeignKey(
                        name: "FK__AGENCIE_C__Accou__3B75D760",
                        column: x => x.ACCOUNT_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "HOST_CERTIFICATES",
                columns: table => new
                {
                    CertificateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOST_ID = table.Column<int>(type: "int", nullable: false),
                    BUSINESS_LICENSE_FILE = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BUSINESS_NAME = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PHONE = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EMAIL = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValueSql: "('pending')"),
                    REJECT_COMMENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    REVIEW_COMMENTS = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__HOST_CER__BBF8A7C1722F012C", x => x.CertificateId);
                    table.ForeignKey(
                        name: "FK__HOST_CERT__HostI__35BCFE0A",
                        column: x => x.HOST_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "MESSAGES",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SENDER_ID = table.Column<int>(type: "int", nullable: false),
                    RECEIVER_ID = table.Column<int>(type: "int", nullable: false),
                    CONTENT = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    IS_READ = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MESSAGES", x => x.ID);
                    table.ForeignKey(
                        name: "FK__MESSAGES__RECEIV__02084FDB",
                        column: x => x.RECEIVER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__MESSAGES__SENDER__02084FDA",
                        column: x => x.SENDER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "NEWS",
                columns: table => new
                {
                    NEWS_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ACCOUNT_ID = table.Column<int>(type: "int", nullable: false),
                    NEWS_TITLE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CREATED_DATE = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    IMAGE = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SOCIAL_MEDIA_LINK = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NEWS", x => x.NEWS_ID);
                    table.ForeignKey(
                        name: "FK__NEWS__AccountId__123EB7A3",
                        column: x => x.ACCOUNT_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "NOTIFICATIONS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    MESSAGE = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IS_READ = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))"),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    TITLE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATIONS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__NOTIFICAT__USER___6EF57B66",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "OTP",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: true),
                    CODE = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    EMAIL = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EXPIRATION_TIME = table.Column<DateTime>(type: "datetime", nullable: false),
                    IS_VERIFIED = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))"),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OTP", x => x.ID);
                    table.ForeignKey(
                        name: "FK__OTP__USER_ID__300424B4",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "POSTS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TITLE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CONTENT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AUTHOR_ID = table.Column<int>(type: "int", nullable: false),
                    IMAGE = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValueSql: "('Pending')"),
                    REJECT_COMMENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    REVIEW_COMMENTS = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IS_DELETED = table.Column<bool>(type: "bit", nullable: false, defaultValueSql: "((0))"),
                    COMMENTS_COUNT = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((0))"),
                    REACTIONS_COUNT = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((0))"),
                    SAVES_COUNT = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POSTS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__POSTS__AUTHOR_ID__73BA3083",
                        column: x => x.AUTHOR_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "REACTIONS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    TARGET_TYPE = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TARGET_ID = table.Column<int>(type: "int", nullable: false),
                    REACTION_TYPE = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REACTIONS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__REACTIONS__USER___7D439ABD",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "SERVICE",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NAME = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PRICE = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HOST_ID = table.Column<int>(type: "int", nullable: false),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SERVICE", x => x.ID);
                    table.ForeignKey(
                        name: "FK__SERVICE__HOST_ID__403A8C7D",
                        column: x => x.HOST_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "SERVICECOMBO",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NAME = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ADDRESS = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PRICE = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AVAILABLE_SLOTS = table.Column<int>(type: "int", nullable: false),
                    IMAGE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValueSql: "('open')"),
                    CANCELLATION_POLICY = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    HOST_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SERVICECOMBO", x => x.ID);
                    table.ForeignKey(
                        name: "FK__SERVICECO__HOST___45F365D3",
                        column: x => x.HOST_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "SYSTEM_LOGS",
                columns: table => new
                {
                    LOG_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LOG_LEVEL = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    MESSAGE = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    STACK_TRACE = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    USER_ID = table.Column<int>(type: "int", nullable: true),
                    MODULE = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SYSTEM_LOGS", x => x.LOG_ID);
                    table.ForeignKey(
                        name: "FK_SYSTEM_LOGS_ACCOUNTS",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "COMMENTS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POST_ID = table.Column<int>(type: "int", nullable: false),
                    AUTHOR_ID = table.Column<int>(type: "int", nullable: false),
                    PARENT_COMMENT_ID = table.Column<int>(type: "int", nullable: true),
                    CONTENT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    IMAGE = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    REACTIONS_COUNT = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((0))"),
                    IS_DELETED = table.Column<bool>(type: "bit", nullable: false, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMMENTS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__COMMENTS__AUTHOR__787EE5A0",
                        column: x => x.AUTHOR_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__COMMENTS__POST_I__778AC167",
                        column: x => x.POST_ID,
                        principalTable: "POSTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "POSTREACTIONS",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PostId = table.Column<int>(type: "int", nullable: false),
                    ReactionTypeId = table.Column<byte>(type: "tinyint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POSTREACTIONS", x => x.Id);
                    table.ForeignKey(
                        name: "FK__POSTREACT__PostI__6DCC4D03",
                        column: x => x.PostId,
                        principalTable: "POSTS",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__POSTREACT__React__6EC0713C",
                        column: x => x.ReactionTypeId,
                        principalTable: "REACTION_TYPES",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__POSTREACT__UserI__6CD828CA",
                        column: x => x.UserId,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "POSTSAVES",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PostId = table.Column<int>(type: "int", nullable: false),
                    AccountId = table.Column<int>(type: "int", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POSTSAVES", x => x.Id);
                    table.ForeignKey(
                        name: "FK__POSTSAVES__Accou__671F4F74",
                        column: x => x.AccountId,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__POSTSAVES__PostI__681373AD",
                        column: x => x.PostId,
                        principalTable: "POSTS",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BOOKINGS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    BOOKING_NUMBER = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    COMBO_ID = table.Column<int>(type: "int", nullable: true),
                    SERVICE_ID = table.Column<int>(type: "int", nullable: true),
                    QUANTITY = table.Column<int>(type: "int", nullable: false),
                    UNIT_PRICE = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TOTAL_AMOUNT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ITEM_TYPE = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValueSql: "('pending')"),
                    NOTES = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    BOOKING_DATE = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    CONFIRMED_DATE = table.Column<DateTime>(type: "datetime", nullable: true),
                    COMPLETED_DATE = table.Column<DateTime>(type: "datetime", nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BOOKINGS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__BOOKINGS__COMBO___59FA5E80",
                        column: x => x.COMBO_ID,
                        principalTable: "SERVICECOMBO",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__BOOKINGS__SERVIC__59FA5E81",
                        column: x => x.SERVICE_ID,
                        principalTable: "SERVICE",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__BOOKINGS__USER_I__59063A47",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "COUPONS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CODE = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    DISCOUNT_PERCENT = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    DISCOUNT_AMOUNT = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    USAGE_LIMIT = table.Column<int>(type: "int", nullable: false),
                    USAGE_COUNT = table.Column<int>(type: "int", nullable: true, defaultValueSql: "((0))"),
                    HOST_ID = table.Column<int>(type: "int", nullable: false),
                    SERVICECOMBO_ID = table.Column<int>(type: "int", nullable: true),
                    IS_ACTIVE = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((1))"),
                    EXPIRY_DATE = table.Column<DateTime>(type: "datetime", nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COUPONS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__COUPONS__HOST_ID__52593CB8",
                        column: x => x.HOST_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__COUPONS__SERVICE__534D60F1",
                        column: x => x.SERVICECOMBO_ID,
                        principalTable: "SERVICECOMBO",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "REQUEST_SUPPORTS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    COMBO_ID = table.Column<int>(type: "int", nullable: true),
                    SUPPORT_TYPE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CONTENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IMAGE = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValueSql: "('Pending')"),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REQUEST_SUPPORTS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__REQUEST_S__COMBO__09A971A2",
                        column: x => x.COMBO_ID,
                        principalTable: "SERVICECOMBO",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__REQUEST_S__USER___08B54D69",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "SERVICECOMBO_DETAIL",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SERVICECOMBO_ID = table.Column<int>(type: "int", nullable: false),
                    SERVICE_ID = table.Column<int>(type: "int", nullable: false),
                    QUANTITY = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((1))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SERVICECOMBO_DETAIL", x => x.ID);
                    table.ForeignKey(
                        name: "FK__SERVICECO__SERVI__49C3F6B7",
                        column: x => x.SERVICECOMBO_ID,
                        principalTable: "SERVICECOMBO",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__SERVICECO__SERVI__4AB81AF0",
                        column: x => x.SERVICE_ID,
                        principalTable: "SERVICE",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "COMMENTREACTIONS",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CommentId = table.Column<int>(type: "int", nullable: false),
                    ReactionTypeId = table.Column<byte>(type: "tinyint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMMENTREACTIONS", x => x.Id);
                    table.ForeignKey(
                        name: "FK__COMMENTRE__Comme__74794A92",
                        column: x => x.CommentId,
                        principalTable: "COMMENTS",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__COMMENTRE__React__756D6ECB",
                        column: x => x.ReactionTypeId,
                        principalTable: "REACTION_TYPES",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__COMMENTRE__UserI__73852659",
                        column: x => x.UserId,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "PAYMENTS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BOOKING_ID = table.Column<int>(type: "int", nullable: false),
                    AMOUNT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PAYMENT_DATE = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    METHOD = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValueSql: "('pending')")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAYMENTS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__PAYMENTS__BOOKIN__6477ECF3",
                        column: x => x.BOOKING_ID,
                        principalTable: "BOOKINGS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "REVIEWS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BOOKING_ID = table.Column<int>(type: "int", nullable: false),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    RATING = table.Column<int>(type: "int", nullable: false),
                    COMMENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CREATED_DATE = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    STATUS = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValueSql: "('pending')")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REVIEWS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__REVIEWS__BOOKING_I__68487DD7",
                        column: x => x.BOOKING_ID,
                        principalTable: "BOOKINGS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__REVIEWS__USER_ID__693CA210",
                        column: x => x.USER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "BOOKING_COUPONS",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BOOKING_ID = table.Column<int>(type: "int", nullable: false),
                    COUPON_ID = table.Column<int>(type: "int", nullable: false),
                    APPLIED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BOOKING_COUPONS", x => x.ID);
                    table.ForeignKey(
                        name: "FK__BOOKING_C__BOOKI__5EBF139D",
                        column: x => x.BOOKING_ID,
                        principalTable: "BOOKINGS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__BOOKING_C__COUPO__5FB337D6",
                        column: x => x.COUPON_ID,
                        principalTable: "COUPONS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "SUPPORT_RESPONSES",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SUPPORT_ID = table.Column<int>(type: "int", nullable: false),
                    RESPONDER_ID = table.Column<int>(type: "int", nullable: false),
                    CONTENT = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IMAGE = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUPPORT_RESPONSES", x => x.ID);
                    table.ForeignKey(
                        name: "FK__SUPPORT_R__RESPO__0E6E26BF",
                        column: x => x.RESPONDER_ID,
                        principalTable: "ACCOUNTS",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK__SUPPORT_R__SUPPO__0D7A0286",
                        column: x => x.SUPPORT_ID,
                        principalTable: "REQUEST_SUPPORTS",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ACCOUNTS_ROLE_ID",
                table: "ACCOUNTS",
                column: "ROLE_ID");

            migrationBuilder.CreateIndex(
                name: "UQ__ACCOUNTS__161CF724757E8893",
                table: "ACCOUNTS",
                column: "EMAIL",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AGENCIE_CERTIFICATES_ACCOUNT_ID",
                table: "AGENCIE_CERTIFICATES",
                column: "ACCOUNT_ID");

            migrationBuilder.CreateIndex(
                name: "IX_BOOKING_COUPONS_COUPON_ID",
                table: "BOOKING_COUPONS",
                column: "COUPON_ID");

            migrationBuilder.CreateIndex(
                name: "UQ_BookingPromotion",
                table: "BOOKING_COUPONS",
                columns: new[] { "BOOKING_ID", "COUPON_ID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BOOKINGS_COMBO_ID",
                table: "BOOKINGS",
                column: "COMBO_ID");

            migrationBuilder.CreateIndex(
                name: "IX_BOOKINGS_SERVICE_ID",
                table: "BOOKINGS",
                column: "SERVICE_ID");

            migrationBuilder.CreateIndex(
                name: "IX_BOOKINGS_USER_ID",
                table: "BOOKINGS",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReactions_CommentID",
                table: "COMMENTREACTIONS",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_COMMENTREACTIONS_ReactionTypeId",
                table: "COMMENTREACTIONS",
                column: "ReactionTypeId");

            migrationBuilder.CreateIndex(
                name: "UQ__COMMENTR__ABB381B18C8E7178",
                table: "COMMENTREACTIONS",
                columns: new[] { "UserId", "CommentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_AuthorID",
                table: "COMMENTS",
                column: "AUTHOR_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PostID",
                table: "COMMENTS",
                column: "POST_ID");

            migrationBuilder.CreateIndex(
                name: "IX_COUPONS_HOST_ID",
                table: "COUPONS",
                column: "HOST_ID");

            migrationBuilder.CreateIndex(
                name: "IX_COUPONS_SERVICECOMBO_ID",
                table: "COUPONS",
                column: "SERVICECOMBO_ID");

            migrationBuilder.CreateIndex(
                name: "UQ__COUPONS__AA1D4379B4900E43",
                table: "COUPONS",
                column: "CODE",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HOST_CERTIFICATES_HOST_ID",
                table: "HOST_CERTIFICATES",
                column: "HOST_ID");

            migrationBuilder.CreateIndex(
                name: "IX_MESSAGES_RECEIVER_ID",
                table: "MESSAGES",
                column: "RECEIVER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_MESSAGES_SENDER_ID",
                table: "MESSAGES",
                column: "SENDER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NEWS_ACCOUNT_ID",
                table: "NEWS",
                column: "ACCOUNT_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATIONS_USER_ID",
                table: "NOTIFICATIONS",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_OTP_USER_ID",
                table: "OTP",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_PAYMENTS_BOOKING_ID",
                table: "PAYMENTS",
                column: "BOOKING_ID");

            migrationBuilder.CreateIndex(
                name: "IX_PostReactions_PostID",
                table: "POSTREACTIONS",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_POSTREACTIONS_ReactionTypeId",
                table: "POSTREACTIONS",
                column: "ReactionTypeId");

            migrationBuilder.CreateIndex(
                name: "UQ__POSTREAC__8D29EA4C21AF919E",
                table: "POSTREACTIONS",
                columns: new[] { "UserId", "PostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Posts_AuthorID",
                table: "POSTS",
                column: "AUTHOR_ID");

            migrationBuilder.CreateIndex(
                name: "IX_POSTSAVES_PostId",
                table: "POSTSAVES",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "UQ_PostSave_UserPost",
                table: "POSTSAVES",
                columns: new[] { "AccountId", "PostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__REACTION__737584F61492C36B",
                table: "REACTION_TYPES",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_REACTIONS_USER_ID",
                table: "REACTIONS",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_REQUEST_SUPPORTS_COMBO_ID",
                table: "REQUEST_SUPPORTS",
                column: "COMBO_ID");

            migrationBuilder.CreateIndex(
                name: "IX_REQUEST_SUPPORTS_USER_ID",
                table: "REQUEST_SUPPORTS",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_REVIEWS_BOOKING_ID",
                table: "REVIEWS",
                column: "BOOKING_ID");

            migrationBuilder.CreateIndex(
                name: "IX_REVIEWS_USER_ID",
                table: "REVIEWS",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "UQ__ROLES__D9C1FA000635C206",
                table: "ROLES",
                column: "NAME",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SERVICE_HOST_ID",
                table: "SERVICE",
                column: "HOST_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SERVICECOMBO_HOST_ID",
                table: "SERVICECOMBO",
                column: "HOST_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SERVICECOMBO_DETAIL_SERVICE_ID",
                table: "SERVICECOMBO_DETAIL",
                column: "SERVICE_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SERVICECOMBO_DETAIL_SERVICECOMBO_ID",
                table: "SERVICECOMBO_DETAIL",
                column: "SERVICECOMBO_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SUPPORT_RESPONSES_RESPONDER_ID",
                table: "SUPPORT_RESPONSES",
                column: "RESPONDER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SUPPORT_RESPONSES_SUPPORT_ID",
                table: "SUPPORT_RESPONSES",
                column: "SUPPORT_ID");

            migrationBuilder.CreateIndex(
                name: "IX_SYSTEM_LOGS_USER_ID",
                table: "SYSTEM_LOGS",
                column: "USER_ID");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AGENCIE_CERTIFICATES");

            migrationBuilder.DropTable(
                name: "BOOKING_COUPONS");

            migrationBuilder.DropTable(
                name: "COMMENTREACTIONS");

            migrationBuilder.DropTable(
                name: "HOST_CERTIFICATES");

            migrationBuilder.DropTable(
                name: "MESSAGES");

            migrationBuilder.DropTable(
                name: "NEWS");

            migrationBuilder.DropTable(
                name: "NOTIFICATIONS");

            migrationBuilder.DropTable(
                name: "OTP");

            migrationBuilder.DropTable(
                name: "PAYMENTS");

            migrationBuilder.DropTable(
                name: "POSTREACTIONS");

            migrationBuilder.DropTable(
                name: "POSTSAVES");

            migrationBuilder.DropTable(
                name: "REACTIONS");

            migrationBuilder.DropTable(
                name: "REVIEWS");

            migrationBuilder.DropTable(
                name: "SERVICECOMBO_DETAIL");

            migrationBuilder.DropTable(
                name: "SUPPORT_RESPONSES");

            migrationBuilder.DropTable(
                name: "SYSTEM_LOGS");

            migrationBuilder.DropTable(
                name: "COUPONS");

            migrationBuilder.DropTable(
                name: "COMMENTS");

            migrationBuilder.DropTable(
                name: "REACTION_TYPES");

            migrationBuilder.DropTable(
                name: "BOOKINGS");

            migrationBuilder.DropTable(
                name: "REQUEST_SUPPORTS");

            migrationBuilder.DropTable(
                name: "POSTS");

            migrationBuilder.DropTable(
                name: "SERVICE");

            migrationBuilder.DropTable(
                name: "SERVICECOMBO");

            migrationBuilder.DropTable(
                name: "ACCOUNTS");

            migrationBuilder.DropTable(
                name: "ROLES");
        }
    }
}
