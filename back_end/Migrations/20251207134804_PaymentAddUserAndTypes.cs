using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESCE_SYSTEM.Migrations
{
    public partial class PaymentAddUserAndTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CÁC LỆNH RENAMECOLUMN ĐÃ ĐƯỢC XÓA HOÀN TOÀN TẠI ĐÂY (để tránh lỗi 15248)

            // LỆNH CẦN THIẾT: CHUYỂN BOOKING_ID SANG NULLABLE (Dù DB là NOT NULL, nhưng model C# là nullable)
            // LƯU Ý: Lệnh này sẽ lỗi nếu DB có dữ liệu, nhưng cần thiết để khớp với Model C# (int?).
            migrationBuilder.AlterColumn<int>(
        name: "BOOKING_ID",
        table: "PAYMENTS",
        type: "int",
        nullable: true,
        oldClrType: typeof(int),
        oldType: "int");

            // LỆNH CẦN THIẾT: CHỈNH SỬA CỘT TransactionId (Dựa trên tên cột thực tế trong DB)
            migrationBuilder.AlterColumn<string>(
        name: "TransactionId", // SỬ DỤNG TÊN CỘT ĐÚNG TRONG DB
                table: "PAYMENTS",
        type: "varchar(50)",
        unicode: false,
        maxLength: 50,
        nullable: true,
        oldClrType: typeof(string),
        oldType: "nvarchar(50)", // Giả định kiểu dữ liệu cũ trong DB là nvarchar(50)
                oldNullable: true);

            // THÊM cột PAYMENT_TYPE
            migrationBuilder.AddColumn<string>(
        name: "PAYMENT_TYPE",
        table: "PAYMENTS",
        type: "nvarchar(max)",
        nullable: true);

            // THÊM cột UPGRADE_TYPE
            migrationBuilder.AddColumn<string>(
        name: "UPGRADE_TYPE",
        table: "PAYMENTS",
        type: "nvarchar(max)",
        nullable: true);

            // THÊM cột USER_ID
            migrationBuilder.AddColumn<int>(
        name: "USER_ID",
        table: "PAYMENTS",
        type: "int",
        nullable: true);

            // TẠO INDEX VÀ FOREIGN KEY cho USER_ID
            migrationBuilder.CreateIndex(
        name: "IX_PAYMENTS_USER_ID",
        table: "PAYMENTS",
        column: "USER_ID");

            migrationBuilder.AddForeignKey(
              name: "FK_PAYMENTS_ACCOUNTS_UserId",
              table: "PAYMENTS",
              column: "USER_ID",
              principalTable: "ACCOUNTS",
              principalColumn: "ID");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
              name: "FK_PAYMENTS_ACCOUNTS_UserId",
              table: "PAYMENTS");

            migrationBuilder.DropIndex(
              name: "IX_PAYMENTS_USER_ID",
              table: "PAYMENTS");

            migrationBuilder.DropColumn(
              name: "PAYMENT_TYPE",
              table: "PAYMENTS");

            migrationBuilder.DropColumn(
              name: "UPGRADE_TYPE",
              table: "PAYMENTS");

            migrationBuilder.DropColumn(
              name: "USER_ID",
              table: "PAYMENTS");

            // CÁC LỆNH RENAMECOLUMN ĐÃ ĐƯỢC XÓA HOÀN TOÀN

            // HÀNH ĐỘNG NGƯỢC LẠI: BOOKING_ID (QUAY LẠI NOT NULL)
            migrationBuilder.AlterColumn<int>(
        name: "BOOKING_ID",
        table: "PAYMENTS",
        type: "int",
        nullable: false,
        defaultValue: 0,
        oldClrType: typeof(int),
        oldType: "int",
        oldNullable: true);

            // HÀNH ĐỘNG NGƯỢC LẠI: TransactionId (QUAY LẠI KIỂU DỮ LIỆU BAN ĐẦU)
            migrationBuilder.AlterColumn<string>(
        name: "TransactionId",
        table: "PAYMENTS",
        type: "nvarchar(max)",
        nullable: true,
        oldClrType: typeof(string),
        oldType: "varchar(50)",
        oldUnicode: false,
        oldMaxLength: 50,
        oldNullable: true);
        }
    }
}