using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface ICommentService
    {
        Task Create(PostCommentDto comment);
        Task<List<Comment>> GetByPostId(int postId);
        Task<Comment> GetById(int id);
        Task Update(int id, UpdatePostCommentDto comment);
        Task Delete(int id);
        Task LockComment(LockCommentDto lockCommentDto);
        Task UnlockComment(UnlockCommentDto unlockCommentDto);
    }
}