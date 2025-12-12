using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IPostService
    {
        Task<List<PostResponseDto>> GetAllPosts();
        Task<List<Post>> GetAllPostsApproved();
        Task<List<Post>> GetAllPostsPending();
        Task<Post> GetById(int id);
        Task<PostDetailDto> Create(PostDto post);
        Task Update(int id, PostDto post);
        Task Delete(DeletePostDto deletePostDto);
        Task Approve(ApprovePostDto approvePostDto);
        Task Reject(RejectPostDto rejectPostDto);
        Task Review(ReviewPostDto reviewPostDto);
        Task<PostDetailDto> GetPostDetail(int postId);
        Task LockPost(LockPostDto lockPostDto);
        Task UnlockPost(UnlockPostDto unlockPostDto);
    }
}