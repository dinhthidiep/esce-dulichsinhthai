using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESCE_SYSTEM.Migrations
{
    public partial class AddParentReviewIdToReviews : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Thêm cột PARENT_REVIEW_ID nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('REVIEWS') AND name = 'PARENT_REVIEW_ID')
                BEGIN
                    ALTER TABLE [REVIEWS] ADD [PARENT_REVIEW_ID] int NULL;
                END
            ");

            // Tạo index nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_REVIEWS_PARENT_REVIEW_ID' AND object_id = OBJECT_ID('REVIEWS'))
                BEGIN
                    CREATE INDEX [IX_REVIEWS_PARENT_REVIEW_ID] ON [REVIEWS] ([PARENT_REVIEW_ID]);
                END
            ");

            // Thêm foreign key nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_REVIEWS_PARENT_REVIEW')
                BEGIN
                    ALTER TABLE [REVIEWS] 
                    ADD CONSTRAINT [FK_REVIEWS_PARENT_REVIEW] 
                    FOREIGN KEY ([PARENT_REVIEW_ID]) REFERENCES [REVIEWS] ([ID]);
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa foreign key nếu tồn tại
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_REVIEWS_PARENT_REVIEW')
                BEGIN
                    ALTER TABLE [REVIEWS] DROP CONSTRAINT [FK_REVIEWS_PARENT_REVIEW];
                END
            ");

            // Xóa index nếu tồn tại
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_REVIEWS_PARENT_REVIEW_ID' AND object_id = OBJECT_ID('REVIEWS'))
                BEGIN
                    DROP INDEX [IX_REVIEWS_PARENT_REVIEW_ID] ON [REVIEWS];
                END
            ");

            // Xóa cột nếu tồn tại
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('REVIEWS') AND name = 'PARENT_REVIEW_ID')
                BEGIN
                    ALTER TABLE [REVIEWS] DROP COLUMN [PARENT_REVIEW_ID];
                END
            ");
        }
    }
}
