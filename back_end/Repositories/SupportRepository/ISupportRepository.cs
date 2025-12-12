using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Repositories
{
    public interface ISupportRepository
    {
        Task<RequestSupport?> GetByIdAsync(int id);
        Task<IEnumerable<RequestSupport>> GetAllAsync(string? status = null);
        Task<IEnumerable<RequestSupport>> GetByUserIdAsync(int userId);
        Task<RequestSupport> CreateAsync(RequestSupport requestSupport);
        Task<RequestSupport> UpdateAsync(RequestSupport requestSupport);
        Task<bool> DeleteAsync(int id);
        Task<SupportResponse> CreateResponseAsync(SupportResponse response);
        Task<IEnumerable<SupportResponse>> GetResponsesBySupportIdAsync(int supportId);
        Task<SupportResponse?> GetResponseByIdAsync(int id);
        Task<bool> DeleteResponseAsync(int id);
    }
}

