using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESCE_SYSTEM.Migrations
{
    public partial class AddBonusServiceFeature : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tạo bảng BONUS_SERVICES nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BONUS_SERVICES]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [BONUS_SERVICES] (
                        [ID] int NOT NULL IDENTITY,
                        [NAME] nvarchar(255) NOT NULL,
                        [DESCRIPTION] nvarchar(1000) NULL,
                        [PRICE] decimal(18,2) NOT NULL,
                        [HOST_ID] int NOT NULL,
                        [SERVICE_ID] int NULL,
                        [CREATED_AT] datetime NULL DEFAULT ((getdate())),
                        [UPDATED_AT] datetime NULL DEFAULT ((getdate())),
                        [IMAGE] nvarchar(max) NULL,
                        [STATUS] nvarchar(50) NULL DEFAULT (('active')),
                        CONSTRAINT [PK_BONUS_SERVICES] PRIMARY KEY ([ID])
                    );
                END
            ");

            // Tạo foreign key FK_BONUS_SERVICES_HOST nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BONUS_SERVICES_HOST')
                BEGIN
                    ALTER TABLE [BONUS_SERVICES] 
                    ADD CONSTRAINT [FK_BONUS_SERVICES_HOST] 
                    FOREIGN KEY ([HOST_ID]) REFERENCES [ACCOUNTS] ([ID]);
                END
            ");

            // Tạo foreign key FK_BONUS_SERVICES_SERVICE nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BONUS_SERVICES_SERVICE')
                BEGIN
                    ALTER TABLE [BONUS_SERVICES] 
                    ADD CONSTRAINT [FK_BONUS_SERVICES_SERVICE] 
                    FOREIGN KEY ([SERVICE_ID]) REFERENCES [SERVICE] ([ID]) ON DELETE SET NULL;
                END
            ");

            // Tạo index IX_BONUS_SERVICES_HOST_ID nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BONUS_SERVICES_HOST_ID' AND object_id = OBJECT_ID('BONUS_SERVICES'))
                BEGIN
                    CREATE INDEX [IX_BONUS_SERVICES_HOST_ID] ON [BONUS_SERVICES] ([HOST_ID]);
                END
            ");

            // Tạo index IX_BONUS_SERVICES_SERVICE_ID nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BONUS_SERVICES_SERVICE_ID' AND object_id = OBJECT_ID('BONUS_SERVICES'))
                BEGIN
                    CREATE INDEX [IX_BONUS_SERVICES_SERVICE_ID] ON [BONUS_SERVICES] ([SERVICE_ID]);
                END
            ");

            // Thêm cột BONUS_SERVICE_ID vào BOOKINGS nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BOOKINGS') AND name = 'BONUS_SERVICE_ID')
                BEGIN
                    ALTER TABLE [BOOKINGS] ADD [BONUS_SERVICE_ID] int NULL;
                END
            ");

            // Tạo foreign key FK_BOOKINGS_BONUS_SERVICE nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BOOKINGS_BONUS_SERVICE')
                BEGIN
                    ALTER TABLE [BOOKINGS] 
                    ADD CONSTRAINT [FK_BOOKINGS_BONUS_SERVICE] 
                    FOREIGN KEY ([BONUS_SERVICE_ID]) REFERENCES [BONUS_SERVICES] ([ID]) ON DELETE SET NULL;
                END
            ");

            // Tạo index IX_BOOKINGS_BONUS_SERVICE_ID nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BOOKINGS_BONUS_SERVICE_ID' AND object_id = OBJECT_ID('BOOKINGS'))
                BEGIN
                    CREATE INDEX [IX_BOOKINGS_BONUS_SERVICE_ID] ON [BOOKINGS] ([BONUS_SERVICE_ID]);
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa index và foreign key của BOOKINGS
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BOOKINGS_BONUS_SERVICE_ID' AND object_id = OBJECT_ID('BOOKINGS'))
                BEGIN
                    DROP INDEX [IX_BOOKINGS_BONUS_SERVICE_ID] ON [BOOKINGS];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BOOKINGS_BONUS_SERVICE')
                BEGIN
                    ALTER TABLE [BOOKINGS] DROP CONSTRAINT [FK_BOOKINGS_BONUS_SERVICE];
                END
            ");

            // Xóa cột BONUS_SERVICE_ID từ BOOKINGS
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BOOKINGS') AND name = 'BONUS_SERVICE_ID')
                BEGIN
                    ALTER TABLE [BOOKINGS] DROP COLUMN [BONUS_SERVICE_ID];
                END
            ");

            // Xóa index và foreign key của BONUS_SERVICES
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BONUS_SERVICES_SERVICE_ID' AND object_id = OBJECT_ID('BONUS_SERVICES'))
                BEGIN
                    DROP INDEX [IX_BONUS_SERVICES_SERVICE_ID] ON [BONUS_SERVICES];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BONUS_SERVICES_HOST_ID' AND object_id = OBJECT_ID('BONUS_SERVICES'))
                BEGIN
                    DROP INDEX [IX_BONUS_SERVICES_HOST_ID] ON [BONUS_SERVICES];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BONUS_SERVICES_SERVICE')
                BEGIN
                    ALTER TABLE [BONUS_SERVICES] DROP CONSTRAINT [FK_BONUS_SERVICES_SERVICE];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_BONUS_SERVICES_HOST')
                BEGIN
                    ALTER TABLE [BONUS_SERVICES] DROP CONSTRAINT [FK_BONUS_SERVICES_HOST];
                END
            ");

            // Xóa bảng BONUS_SERVICES
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BONUS_SERVICES]') AND type in (N'U'))
                BEGIN
                    DROP TABLE [BONUS_SERVICES];
                END
            ");
        }
    }
}
