using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly ESCEContext _context;

        public CommentRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<Comment> GetByIdAsync(int id)
        {
            return await _context.Comments
                .Include(c => c.Author)
                .ThenInclude(a => a.Role)
                .Include(c => c.Commentreactions)
                .ThenInclude(cr => cr.User)
                .Include(c => c.Post)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<IEnumerable<Comment>> GetByPostIdAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId && !c.IsDeleted)
                .Include(c => c.Author)
                .ThenInclude(a => a.Role)
                .Include(c => c.Commentreactions)
                .ThenInclude(cr => cr.User)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetByAuthorIdAsync(int authorId)
        {
            return await _context.Comments
                .Where(c => c.AuthorId == authorId && !c.IsDeleted)
                .Include(c => c.Post)
                .Include(c => c.Commentreactions)
                .ThenInclude(cr => cr.User)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Comment> AddAsync(Comment comment)
        {
            comment.CreatedAt = DateTime.Now;
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment> UpdateAsync(Comment comment)
        {
            comment.UpdatedAt = DateTime.Now;
            _context.Comments.Update(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return false;

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return false;

            comment.IsDeleted = true;
            comment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetReactionsCountAsync(int commentId)
        {
            return await _context.Commentreactions
                .Where(cr => cr.CommentId == commentId)
                .CountAsync();
        }
    }
}