using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class PostReactionRepository : IPostReactionRepository
    {
        private readonly ESCEContext _context;

        public PostReactionRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<Postreaction> GetByIdAsync(int id)
        {
            return await _context.Postreactions
                .Include(pr => pr.User)
                .Include(pr => pr.Post)
                .Include(pr => pr.ReactionType)
                .FirstOrDefaultAsync(pr => pr.Id == id);
        }

        public async Task<IEnumerable<Postreaction>> GetByPostIdAsync(int postId)
        {
            return await _context.Postreactions
                .Where(pr => pr.PostId == postId)
                .Include(pr => pr.User)
                .Include(pr => pr.ReactionType)
                .ToListAsync();
        }

        public async Task<IEnumerable<Postreaction>> GetByUserIdAsync(int userId)
        {
            return await _context.Postreactions
                .Where(pr => pr.UserId == userId)
                .Include(pr => pr.Post)
                .Include(pr => pr.ReactionType)
                .ToListAsync();
        }

        public async Task<Postreaction> GetByUserAndPostAsync(int userId, int postId)
        {
            return await _context.Postreactions
                .FirstOrDefaultAsync(pr => pr.UserId == userId && pr.PostId == postId);
        }

        public async Task<Postreaction> AddAsync(Postreaction postReaction)
        {
            postReaction.CreatedAt = DateTime.Now;
            _context.Postreactions.Add(postReaction);
            await _context.SaveChangesAsync();
            return postReaction;
        }

        public async Task<Postreaction> UpdateAsync(Postreaction postReaction)
        {
            _context.Postreactions.Update(postReaction);
            await _context.SaveChangesAsync();
            return postReaction;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var postReaction = await _context.Postreactions.FindAsync(id);
            if (postReaction == null) return false;

            _context.Postreactions.Remove(postReaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetCountByPostIdAsync(int postId)
        {
            return await _context.Postreactions
                .Where(pr => pr.PostId == postId)
                .CountAsync();
        }
    }
}