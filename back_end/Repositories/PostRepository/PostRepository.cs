using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class PostRepository : IPostRepository
    {
        private readonly ESCEContext _context;

        public PostRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<Post> GetByIdAsync(int id)
        {
            return await _context.Posts
                .Include(p => p.Author)
                .ThenInclude(a => a.Role)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.ReactionType)
                .Include(p => p.Postsaves)
                .ThenInclude(ps => ps.Account)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<IEnumerable<Post>> GetAllAsync()
        {
            return await _context.Posts
                .Where(p => !p.IsDeleted)
                .Include(p => p.Author)
                .ThenInclude(a => a.Role)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.ReactionType)
                .Include(p => p.Postsaves)
                .ThenInclude(ps => ps.Account)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Post>> GetApprovedPostsAsync()
        {
            return await _context.Posts
                .Where(p => p.Status == "Approved" && !p.IsDeleted)
                .Include(p => p.Author)
                .ThenInclude(a => a.Role)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Postsaves)
                .ThenInclude(ps => ps.Account)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Post>> GetPendingPostsAsync()
        {
            return await _context.Posts
                .Where(p => p.Status == "Pending" && !p.IsDeleted)
                .Include(p => p.Author)
                .ThenInclude(a => a.Role)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Postsaves)
                .ThenInclude(ps => ps.Account)
.OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Post>> GetByAuthorIdAsync(int authorId)
        {
            return await _context.Posts
                .Where(p => p.AuthorId == authorId && !p.IsDeleted)
                .Include(p => p.Author)
                .ThenInclude(a => a.Role)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.Postreactions)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Postsaves)
                .ThenInclude(ps => ps.Account)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Post> AddAsync(Post post)
        {
            post.CreatedAt = DateTime.Now;
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task<Post> UpdateAsync(Post post)
        {
            post.UpdatedAt = DateTime.Now;
            _context.Posts.Update(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return false;

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return false;

            post.IsDeleted = true;
            post.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetCommentsCountAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId && !c.IsDeleted)
                .CountAsync();
        }

        public async Task<int> GetReactionsCountAsync(int postId)
        {
            return await _context.Postreactions
                .Where(pr => pr.PostId == postId)
                .CountAsync();
        }

        public async Task<int> GetSavesCountAsync(int postId)
        {
            return await _context.Postsaves
                .Where(ps => ps.PostId == postId)
                .CountAsync();
        }
    }
}