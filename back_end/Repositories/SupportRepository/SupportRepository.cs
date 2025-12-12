using ESCE_SYSTEM.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public class SupportRepository : ISupportRepository
    {
        private readonly ESCEContext _context;

        public SupportRepository(ESCEContext context)
        {
            _context = context;
        }

        public async Task<RequestSupport?> GetByIdAsync(int id)
        {
            return await _context.RequestSupports
                .Include(rs => rs.User)
                .ThenInclude(u => u.Role)
                .Include(rs => rs.ServiceCombo)
                .Include(rs => rs.SupportResponses)
                .ThenInclude(sr => sr.Responder)
                .FirstOrDefaultAsync(rs => rs.Id == id);
        }

        public async Task<IEnumerable<RequestSupport>> GetAllAsync(string? status = null)
        {
            var query = _context.RequestSupports
                .Include(rs => rs.User)
                .ThenInclude(u => u.Role)
                .Include(rs => rs.ServiceCombo)
                .Include(rs => rs.SupportResponses)
                .ThenInclude(sr => sr.Responder)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                query = query.Where(rs => rs.Status != null && rs.Status.ToLower() == status.ToLower());
            }

            return await query
                .OrderByDescending(rs => rs.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<RequestSupport>> GetByUserIdAsync(int userId)
        {
            return await _context.RequestSupports
                .Include(rs => rs.User)
                .ThenInclude(u => u.Role)
                .Include(rs => rs.ServiceCombo)
                .Include(rs => rs.SupportResponses)
                .ThenInclude(sr => sr.Responder)
                .Where(rs => rs.UserId == userId)
                .OrderByDescending(rs => rs.CreatedAt)
                .ToListAsync();
        }

        public async Task<RequestSupport> CreateAsync(RequestSupport requestSupport)
        {
            requestSupport.CreatedAt = DateTime.UtcNow;
            requestSupport.UpdatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(requestSupport.Status))
            {
                requestSupport.Status = "Pending";
            }

            _context.RequestSupports.Add(requestSupport);
            await _context.SaveChangesAsync();
            return requestSupport;
        }

        public async Task<RequestSupport> UpdateAsync(RequestSupport requestSupport)
        {
            requestSupport.UpdatedAt = DateTime.UtcNow;
            _context.RequestSupports.Update(requestSupport);
            await _context.SaveChangesAsync();
            return requestSupport;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var requestSupport = await _context.RequestSupports.FindAsync(id);
            if (requestSupport == null)
            {
                return false;
            }

            // Xóa các responses liên quan
            var responses = await _context.SupportResponses
                .Where(sr => sr.SupportId == id)
                .ToListAsync();
            _context.SupportResponses.RemoveRange(responses);

            _context.RequestSupports.Remove(requestSupport);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SupportResponse> CreateResponseAsync(SupportResponse response)
        {
            response.CreatedAt = DateTime.UtcNow;
            _context.SupportResponses.Add(response);
            await _context.SaveChangesAsync();
            return response;
        }

        public async Task<IEnumerable<SupportResponse>> GetResponsesBySupportIdAsync(int supportId)
        {
            return await _context.SupportResponses
                .Include(sr => sr.Responder)
                .ThenInclude(r => r.Role)
                .Where(sr => sr.SupportId == supportId)
                .OrderBy(sr => sr.CreatedAt)
                .ToListAsync();
        }

        public async Task<SupportResponse?> GetResponseByIdAsync(int id)
        {
            return await _context.SupportResponses
                .Include(sr => sr.Responder)
                .ThenInclude(r => r.Role)
                .FirstOrDefaultAsync(sr => sr.Id == id);
        }

        public async Task<bool> DeleteResponseAsync(int id)
        {
            var response = await _context.SupportResponses.FindAsync(id);
            if (response == null)
            {
                return false;
            }

            _context.SupportResponses.Remove(response);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

