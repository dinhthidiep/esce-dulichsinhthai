using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESCE_SYSTEM.Migrations
{
    public partial class ESCE : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign keys trước khi drop primary keys
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__SERVICECO__SERVI__49C3F6B7')
                    ALTER TABLE [Servicecombo_DETAIL] DROP CONSTRAINT [FK__SERVICECO__SERVI__49C3F6B7];
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__BOOKINGS__COMBO___59FA5E80')
                    ALTER TABLE [BOOKINGS] DROP CONSTRAINT [FK__BOOKINGS__COMBO___59FA5E80];
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__COUPONS__SERVICE__534D60F1')
                    ALTER TABLE [COUPONS] DROP CONSTRAINT [FK__COUPONS__SERVICE__534D60F1];
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__REQUEST_S__COMBO__09A971A2')
                    ALTER TABLE [REQUEST_SUPPORTS] DROP CONSTRAINT [FK__REQUEST_S__COMBO__09A971A2];
            ");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Servicecombo_DETAIL",
                table: "Servicecombo_DETAIL");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Servicecombo",
                table: "Servicecombo");

            migrationBuilder.RenameTable(
                name: "Servicecombo_DETAIL",
                newName: "SERVICECOMBO_DETAIL");

            migrationBuilder.RenameTable(
                name: "Servicecombo",
                newName: "SERVICECOMBO");

            migrationBuilder.RenameColumn(
                name: "Servicecombo_ID",
                table: "SERVICECOMBO_DETAIL",
                newName: "SERVICECOMBO_ID");

            migrationBuilder.RenameIndex(
                name: "IX_Servicecombo_DETAIL_Servicecombo_ID",
                table: "SERVICECOMBO_DETAIL",
                newName: "IX_SERVICECOMBO_DETAIL_SERVICECOMBO_ID");

            migrationBuilder.RenameIndex(
                name: "IX_Servicecombo_DETAIL_SERVICE_ID",
                table: "SERVICECOMBO_DETAIL",
                newName: "IX_SERVICECOMBO_DETAIL_SERVICE_ID");

            migrationBuilder.RenameIndex(
                name: "IX_Servicecombo_HOST_ID",
                table: "SERVICECOMBO",
                newName: "IX_SERVICECOMBO_HOST_ID");

            migrationBuilder.RenameColumn(
                name: "Servicecombo_ID",
                table: "COUPONS",
                newName: "SERVICECOMBO_ID");

            migrationBuilder.RenameIndex(
                name: "IX_COUPONS_Servicecombo_ID",
                table: "COUPONS",
                newName: "IX_COUPONS_SERVICECOMBO_ID");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UPDATED_AT",
                table: "SERVICECOMBO",
                type: "datetime",
                nullable: true,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AlterColumn<string>(
                name: "STATUS",
                table: "SERVICECOMBO",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValueSql: "('open')",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValueSql: "('open')");

            migrationBuilder.AlterColumn<string>(
                name: "IMAGE",
                table: "SERVICECOMBO",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CREATED_AT",
                table: "SERVICECOMBO",
                type: "datetime",
                nullable: true,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "(getdate())");

            // Chỉ thêm cột nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SERVICE]') AND name = 'Images')
                    ALTER TABLE [SERVICE] ADD [Images] nvarchar(max) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SERVICE]') AND name = 'RejectComment')
                    ALTER TABLE [SERVICE] ADD [RejectComment] nvarchar(max) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SERVICE]') AND name = 'ReviewComments')
                    ALTER TABLE [SERVICE] ADD [ReviewComments] nvarchar(max) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[SERVICE]') AND name = 'Status')
                    ALTER TABLE [SERVICE] ADD [Status] nvarchar(max) NULL;
            ");

            // Chỉ thêm cột nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[REVIEWS]') AND name = 'ServiceComboId')
                    ALTER TABLE [REVIEWS] ADD [ServiceComboId] int NULL;
            ");

            // Chỉ thêm cột nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[PAYMENTS]') AND name = 'TRANSACTION_ID')
                    ALTER TABLE [PAYMENTS] ADD [TRANSACTION_ID] nvarchar(255) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[PAYMENTS]') AND name = 'UPDATED_AT')
                    ALTER TABLE [PAYMENTS] ADD [UPDATED_AT] datetime NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[PAYMENTS]') AND name = 'PAYMENT_TYPE')
                    ALTER TABLE [PAYMENTS] ADD [PAYMENT_TYPE] nvarchar(50) NULL DEFAULT 'Booking';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[PAYMENTS]') AND name = 'USER_ID')
                    ALTER TABLE [PAYMENTS] ADD [USER_ID] int NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[PAYMENTS]') AND name = 'UPGRADE_TYPE')
                    ALTER TABLE [PAYMENTS] ADD [UPGRADE_TYPE] nvarchar(50) NULL;
            ");

            // Chỉ thêm cột nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[COUPONS]') AND name = 'REQUIRED_LEVEL')
                    ALTER TABLE [COUPONS] ADD [REQUIRED_LEVEL] int NOT NULL DEFAULT 0;
            ");

            migrationBuilder.AlterColumn<bool>(
                name: "IS_DELETED",
                table: "COMMENTS",
                type: "bit",
                nullable: true,
                defaultValueSql: "((0))",
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValueSql: "((0))");

            // Chỉ thêm cột nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[ACCOUNTS]') AND name = 'LEVEL')
                    ALTER TABLE [ACCOUNTS] ADD [LEVEL] int NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[ACCOUNTS]') AND name = 'TOTAL_SPENT')
                    ALTER TABLE [ACCOUNTS] ADD [TOTAL_SPENT] decimal(18,2) NOT NULL DEFAULT 0.00;
            ");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SERVICECOMBO_DETAIL",
                table: "SERVICECOMBO_DETAIL",
                column: "ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SERVICECOMBO",
                table: "SERVICECOMBO",
                column: "ID");

            migrationBuilder.CreateIndex(
                name: "IX_REVIEWS_ServiceComboId",
                table: "REVIEWS",
                column: "ServiceComboId");

            migrationBuilder.AddForeignKey(
                name: "FK_REVIEWS_SERVICECOMBO_ServiceComboId",
                table: "REVIEWS",
                column: "ServiceComboId",
                principalTable: "SERVICECOMBO",
                principalColumn: "ID");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_REVIEWS_SERVICECOMBO_ServiceComboId",
                table: "REVIEWS");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SERVICECOMBO_DETAIL",
                table: "SERVICECOMBO_DETAIL");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SERVICECOMBO",
                table: "SERVICECOMBO");

            migrationBuilder.DropIndex(
                name: "IX_REVIEWS_ServiceComboId",
                table: "REVIEWS");

            migrationBuilder.DropColumn(
                name: "Images",
                table: "SERVICE");

            migrationBuilder.DropColumn(
                name: "RejectComment",
                table: "SERVICE");

            migrationBuilder.DropColumn(
                name: "ReviewComments",
                table: "SERVICE");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "SERVICE");

            migrationBuilder.DropColumn(
                name: "ServiceComboId",
                table: "REVIEWS");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "PAYMENTS");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PAYMENTS");

            migrationBuilder.DropColumn(
                name: "REQUIRED_LEVEL",
                table: "COUPONS");

            migrationBuilder.DropColumn(
                name: "LEVEL",
                table: "ACCOUNTS");

            migrationBuilder.DropColumn(
                name: "TOTAL_SPENT",
                table: "ACCOUNTS");

            migrationBuilder.RenameTable(
                name: "SERVICECOMBO_DETAIL",
                newName: "Servicecombo_DETAIL");

            migrationBuilder.RenameTable(
                name: "SERVICECOMBO",
                newName: "Servicecombo");

            migrationBuilder.RenameColumn(
                name: "SERVICECOMBO_ID",
                table: "Servicecombo_DETAIL",
                newName: "Servicecombo_ID");

            migrationBuilder.RenameIndex(
                name: "IX_SERVICECOMBO_DETAIL_SERVICECOMBO_ID",
                table: "Servicecombo_DETAIL",
                newName: "IX_Servicecombo_DETAIL_Servicecombo_ID");

            migrationBuilder.RenameIndex(
                name: "IX_SERVICECOMBO_DETAIL_SERVICE_ID",
                table: "Servicecombo_DETAIL",
                newName: "IX_Servicecombo_DETAIL_SERVICE_ID");

            migrationBuilder.RenameIndex(
                name: "IX_SERVICECOMBO_HOST_ID",
                table: "Servicecombo",
                newName: "IX_Servicecombo_HOST_ID");

            migrationBuilder.RenameColumn(
                name: "SERVICECOMBO_ID",
                table: "COUPONS",
                newName: "Servicecombo_ID");

            migrationBuilder.RenameIndex(
                name: "IX_COUPONS_SERVICECOMBO_ID",
                table: "COUPONS",
                newName: "IX_COUPONS_Servicecombo_ID");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UPDATED_AT",
                table: "Servicecombo",
                type: "datetime",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true,
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AlterColumn<string>(
                name: "STATUS",
                table: "Servicecombo",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValueSql: "('open')",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true,
                oldDefaultValueSql: "('open')");

            migrationBuilder.AlterColumn<string>(
                name: "IMAGE",
                table: "Servicecombo",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CREATED_AT",
                table: "Servicecombo",
                type: "datetime",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true,
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AlterColumn<bool>(
                name: "IS_DELETED",
                table: "COMMENTS",
                type: "bit",
                nullable: false,
                defaultValueSql: "((0))",
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true,
                oldDefaultValueSql: "((0))");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Servicecombo_DETAIL",
                table: "Servicecombo_DETAIL",
                column: "ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Servicecombo",
                table: "Servicecombo",
                column: "ID");
        }
    }
}
