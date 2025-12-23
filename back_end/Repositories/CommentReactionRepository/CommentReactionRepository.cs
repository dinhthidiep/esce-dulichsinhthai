using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class CommentReactionRepository : ICommentReactionRepository
    {
        private readonly ESCEContext _context;

        public CommentReactionRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<Commentreaction> GetByIdAsync(int id)
        {
            return await _context.Commentreactions
                .Include(cr => cr.User)
                .Include(cr => cr.Comment)
                .Include(cr => cr.ReactionType)
                .FirstOrDefaultAsync(cr => cr.Id == id);
        }

        public async Task<IEnumerable<Commentreaction>> GetByCommentIdAsync(int commentId)
        {
            return await _context.Commentreactions
                .Where(cr => cr.CommentId == commentId)
                .Include(cr => cr.User)
                .Include(cr => cr.ReactionType)
                .ToListAsync();
        }

        public async Task<IEnumerable<Commentreaction>> GetByUserIdAsync(int userId)
        {
            return await _context.Commentreactions
                .Where(cr => cr.UserId == userId)
                .Include(cr => cr.Comment)
                .Include(cr => cr.ReactionType)
                .ToListAsync();
        }

        public async Task<Commentreaction> GetByUserAndCommentAsync(int userId, int commentId)
        {
            return await _context.Commentreactions
                .FirstOrDefaultAsync(cr => cr.UserId == userId && cr.CommentId == commentId);
        }

        public async Task<Commentreaction> AddAsync(Commentreaction commentReaction)
        {
            commentReaction.CreatedAt = DateTime.Now;
            _context.Commentreactions.Add(commentReaction);
            await _context.SaveChangesAsync();
            return commentReaction;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var commentReaction = await _context.Commentreactions.FindAsync(id);
            if (commentReaction == null) return false;

            _context.Commentreactions.Remove(commentReaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetCountByCommentIdAsync(int commentId)
        {
            return await _context.Commentreactions
                .Where(cr => cr.CommentId == commentId)
                .CountAsync();
        }

        public async Task<List<Commentreaction>> GetByCommentIdsAsync(List<int> commentIds)
        {
            if (commentIds == null || !commentIds.Any())
                return new List<Commentreaction>();

            return await _context.Commentreactions
                .Where(cr => commentIds.Contains(cr.CommentId))
                .Include(cr => cr.User)
                .Include(cr => cr.ReactionType)
                .ToListAsync();
        }
    }
}